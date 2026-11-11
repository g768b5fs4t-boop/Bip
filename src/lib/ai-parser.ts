import {
  buildPercentDiscountLine,
  createId,
  nextQuoteNumber,
  resolveSalePriceHt,
} from "./quote-engine";
import type { Client, Company, Product, Quote, QuoteLine } from "./types";

export interface ParseResult {
  ok: boolean;
  assistantMessage: string;
  quote?: Quote;
  missing: string[];
}

interface ParsedRequest {
  clientHint?: string;
  productRequests: {
    reference?: string;
    designationHint?: string;
    quantity: number;
  }[];
  laborHours?: number;
  travelAmount?: number;
  travelMentioned: boolean;
  discountPercent?: number;
  discountAmount?: number;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseQuantityNear(text: string, index: number): number {
  const before = text.slice(Math.max(0, index - 40), index);
  const match =
    before.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*$/i) ||
    before.match(/(\d+(?:[.,]\d+)?)\s+[A-Za-zÀ-ÿ'’-]+\s*$/i) ||
    before.match(/(\d+(?:[.,]\d+)?)\s*$/);
  if (!match) return 1;
  return Number(match[1].replace(",", "."));
}

function findCatalogProduct(
  products: Product[],
  companyId: string,
  req: ParsedRequest["productRequests"][number],
): Product | undefined {
  const scoped = products.filter((p) => p.companyId === companyId);
  if (req.reference) {
    return scoped.find(
      (p) => p.reference.toUpperCase() === req.reference!.toUpperCase(),
    );
  }
  if (req.designationHint) {
    const hint = normalize(req.designationHint);
    const exact = scoped.filter((p) => normalize(p.designation) === hint);
    if (exact.length === 1) return exact[0];
    const partial = scoped.filter((p) => normalize(p.designation).includes(hint));
    if (partial.length === 1) return partial[0];
  }
  return undefined;
}

/** Analyse déterministe (MVP) — remplacable plus tard par un LLM + ce moteur. */
export function parseQuoteRequest(raw: string): ParsedRequest {
  const text = raw.trim();
  const norm = normalize(text);

  let clientHint: string | undefined;
  const clientMatch = text.match(
    /(?:pour|client)\s+(monsieur|madame|m\.|mme\.?)?\s*([A-Za-zÀ-ÿ'’-]+(?:\s+[A-Za-zÀ-ÿ'’-]+)?)/i,
  );
  if (clientMatch) {
    const civ = clientMatch[1] ? `${clientMatch[1]} ` : "";
    clientHint = `${civ}${clientMatch[2]}`.replace(/\s+/g, " ").trim();
  }

  const productRequests: ParsedRequest["productRequests"] = [];
  const refRegex =
    /(?:reference|référence|ref\.?)\s*[:#]?\s*([A-Z0-9][-A-Z0-9]{2,})/gi;
  let m: RegExpExecArray | null;
  while ((m = refRegex.exec(text)) !== null) {
    productRequests.push({
      reference: m[1].toUpperCase(),
      quantity: parseQuantityNear(text, m.index),
    });
  }

  const compactRef =
    /(\d+(?:[.,]\d+)?)\s+(?:moteurs?|telecommandes?|télécommandes?|rails?|pieces?|produits?)?\s*([A-Z]{2,}\d{2,})/gi;
  while ((m = compactRef.exec(text)) !== null) {
    const reference = m[2].toUpperCase();
    if (!productRequests.some((p) => p.reference === reference)) {
      productRequests.push({
        reference,
        quantity: Number(m[1].replace(",", ".")),
      });
    }
  }

  // Désignation catalogue explicite, sans code référence collé (évite « télécommandes TEL456 »)
  const named =
    /(\d+(?:[.,]\d+)?)\s*[x×]\s+(moteur tubulaire[\w\s]{0,30}|télécommande[\w\s]{0,30}|telecommande[\w\s]{0,30}|rail de guidage[\w\s]{0,30})(?![A-Z0-9])/gi;
  while ((m = named.exec(text)) !== null) {
    const designationHint = m[2].trim();
    if (/[A-Z]{2,}\d{2,}/.test(designationHint)) continue;
    productRequests.push({
      designationHint,
      quantity: Number(m[1].replace(",", ".")),
    });
  }

  let laborHours: number | undefined;
  const laborMatch = norm.match(
    /(\d+(?:[.,]\d+)?)\s*(?:h|heures?)\s*(?:de\s*)?(?:pose|main[\s-]?d'?oeuvre|mo\b)/,
  );
  if (laborMatch) {
    laborHours = Number(laborMatch[1].replace(",", "."));
  } else {
    const alt = norm.match(
      /(?:pose|main[\s-]?d'?oeuvre)\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*(?:h|heures?)?/,
    );
    if (alt) laborHours = Number(alt[1].replace(",", "."));
  }

  let travelAmount: number | undefined;
  const travelMentioned = /deplacement|déplacement|frais de route/.test(norm);
  const travelMatch = text.match(
    /(\d+(?:[.,]\d+)?)\s*€?\s*(?:euros?)?\s*(?:de\s*)?(?:deplacement|déplacement)/i,
  );
  const travelMatch2 = text.match(
    /(?:deplacement|déplacement)\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*€?/i,
  );
  if (travelMatch) {
    travelAmount = Number(travelMatch[1].replace(",", "."));
  } else if (travelMatch2) {
    travelAmount = Number(travelMatch2[1].replace(",", "."));
  }

  let discountPercent: number | undefined;
  let discountAmount: number | undefined;
  const pct = norm.match(/remise\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%/);
  const amt = text.match(
    /remise\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*€/i,
  );
  if (pct) discountPercent = Number(pct[1].replace(",", "."));
  if (amt) discountAmount = Number(amt[1].replace(",", "."));

  return {
    clientHint,
    productRequests,
    laborHours,
    travelAmount,
    travelMentioned,
    discountPercent,
    discountAmount,
  };
}

export function buildQuoteFromRequest(params: {
  message: string;
  company: Company;
  products: Product[];
  clients: Client[];
  existingQuotes: Quote[];
}): ParseResult {
  const { message, company, products, clients, existingQuotes } = params;
  const parsed = parseQuoteRequest(message);
  const missing: string[] = [];
  const lines: QuoteLine[] = [];
  const vat = company.defaultVatRate;

  let client: Client | undefined;
  if (parsed.clientHint) {
    const hint = normalize(parsed.clientHint);
    client = clients.find(
      (c) =>
        normalize(c.name).includes(hint) || hint.includes(normalize(c.name)),
    );
    if (!client) {
      const last = hint.split(/\s+/).pop()!;
      client = clients.find((c) => normalize(c.name).includes(last));
    }
    if (!client) {
      missing.push(
        `Client « ${parsed.clientHint} » introuvable. Créez-le dans Clients ou précisez un client existant.`,
      );
    }
  } else {
    missing.push("Indiquez le client (ex. « pour Monsieur Martin »).");
  }

  if (
    parsed.productRequests.length === 0 &&
    parsed.laborHours == null &&
    !parsed.travelMentioned
  ) {
    return {
      ok: false,
      missing: [
        "Je n'ai pas détecté de produits, main-d'œuvre ou déplacement. Reformulez avec des références (ex. MOT123).",
      ],
      assistantMessage:
        "Je n'ai pas pu identifier d'éléments de devis. Essayez une formulation comme :\n« Devis pour Monsieur Martin : 2× MOT123, 4× TEL456, 5 h de pose et 150 € de déplacement. »",
    };
  }

  for (const req of parsed.productRequests) {
    const product = findCatalogProduct(products, company.id, req);
    if (!product) {
      const label = req.reference
        ? `Référence « ${req.reference} »`
        : `Produit « ${req.designationHint} »`;
      missing.push(
        `${label} introuvable dans votre catalogue. Je n'invente jamais une référence ni un prix.`,
      );
      continue;
    }
    const price = resolveSalePriceHt(product, company);
    if (price == null) {
      missing.push(
        `Le produit ${product.reference} n'a pas de prix de vente ni de marge calculable.`,
      );
      continue;
    }
    lines.push({
      id: createId("line"),
      type: "produit",
      reference: product.reference,
      designation: product.designation,
      quantity: req.quantity,
      unit: product.unit,
      unitPriceHt: price,
      vatRate: vat,
      productId: product.id,
    });
  }

  if (parsed.laborHours != null) {
    if (company.hourlyRateHt <= 0) {
      missing.push("Tarif horaire non configuré dans la fiche entreprise.");
    } else {
      lines.push({
        id: createId("line"),
        type: "main_doeuvre",
        designation: "Main-d'œuvre / pose",
        quantity: parsed.laborHours,
        unit: "h",
        unitPriceHt: company.hourlyRateHt,
        vatRate: vat,
      });
    }
  }

  if (parsed.travelMentioned || parsed.travelAmount != null) {
    const amount =
      parsed.travelAmount != null ? parsed.travelAmount : company.travelFeeHt;
    if (amount <= 0) {
      missing.push(
        "Montant de déplacement non précisé et frais par défaut à 0 €. Indiquez un montant.",
      );
    } else {
      lines.push({
        id: createId("line"),
        type: "deplacement",
        designation: "Frais de déplacement",
        quantity: 1,
        unit: "forfait",
        unitPriceHt: amount,
        vatRate: vat,
      });
    }
  }

  if (parsed.discountPercent != null) {
    const discount = buildPercentDiscountLine(
      lines,
      parsed.discountPercent,
      vat,
    );
    if (!discount) {
      missing.push("Remise en % invalide ou base HT nulle.");
    } else {
      lines.push(discount);
    }
  } else if (parsed.discountAmount != null) {
    if (parsed.discountAmount <= 0) {
      missing.push("Montant de remise invalide.");
    } else {
      lines.push({
        id: createId("line"),
        type: "remise",
        designation: "Remise commerciale",
        quantity: 1,
        unit: "forfait",
        unitPriceHt: parsed.discountAmount,
        vatRate: vat,
      });
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      assistantMessage:
        "Avant de préparer le devis, j'ai besoin de précisions :\n\n" +
        missing.map((item) => `• ${item}`).join("\n") +
        "\n\nJe n'invente jamais un tarif, une référence ou un client manquant.",
    };
  }

  if (!client) {
    return {
      ok: false,
      missing: ["Client manquant"],
      assistantMessage: "Client introuvable.",
    };
  }

  const createdAt = new Date();
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + company.quoteValidityDays);

  const quote: Quote = {
    id: createId("quote"),
    number: nextQuoteNumber(existingQuotes),
    companyId: company.id,
    clientId: client.id,
    status: "brouillon",
    createdAt: createdAt.toISOString(),
    validUntil: validUntil.toISOString().slice(0, 10),
    lines,
  };

  const summaryLines = lines
    .map(
      (l) =>
        `• ${l.quantity} ${l.unit} — ${l.reference ? `[${l.reference}] ` : ""}${l.designation} @ ${l.unitPriceHt.toFixed(2)} € HT`,
    )
    .join("\n");

  return {
    ok: true,
    missing: [],
    quote,
    assistantMessage:
      `Voici un **brouillon de devis ${quote.number}** pour ${client.name}.\n\n` +
      `${summaryLines}\n\n` +
      `Les totaux HT / TVA / TTC sont calculés automatiquement (code déterministe).\n` +
      `Consultez l'aperçu, validez le devis, puis exportez en PDF.\n` +
      `Je n'enverrai **jamais** ce devis par e-mail sans votre accord explicite.`,
  };
}
