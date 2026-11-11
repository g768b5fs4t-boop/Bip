import {
  buildPercentDiscountLine,
  createId,
  nextQuoteNumber,
  resolveSalePriceHt,
} from "@/lib/quote-engine";
import type { Client, Company, Product, Quote, QuoteLine } from "@/lib/types";
import type { AiQuoteDraft } from "./schema";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolveAiDraftToQuote(params: {
  draft: AiQuoteDraft;
  company: Company;
  products: Product[];
  clients: Client[];
  existingQuotes: Quote[];
}): {
  ok: boolean;
  quote?: Quote;
  missing: string[];
  assistantMessage: string;
  usedInventedPrice: false;
} {
  const { draft, company, products, clients, existingQuotes } = params;
  const missing = [...draft.missingQuestions];
  const lines: QuoteLine[] = [];
  const vat = company.defaultVatRate;
  const scopedProducts = products.filter((p) => p.companyId === company.id);

  let client: Client | undefined;
  if (draft.clientNameHint) {
    const hint = normalize(draft.clientNameHint);
    client = clients.find(
      (c) =>
        c.companyId === company.id &&
        (normalize(c.name).includes(hint) || hint.includes(normalize(c.name))),
    );
    if (!client) {
      const last = hint.split(/\s+/).pop()!;
      client = clients.find(
        (c) => c.companyId === company.id && normalize(c.name).includes(last),
      );
    }
    if (!client) {
      missing.push(
        `Client « ${draft.clientNameHint} » introuvable dans votre base. Créez-le avant validation.`,
      );
    }
  } else {
    missing.push("Indiquez le client.");
  }

  for (const item of draft.lines) {
    if (item.kind === "produit") {
      let product: Product | undefined;
      if (item.reference) {
        product = scopedProducts.find(
          (p) => p.reference.toUpperCase() === item.reference!.toUpperCase(),
        );
      } else if (item.designationHint) {
        const hint = normalize(item.designationHint);
        const matches = scopedProducts.filter((p) =>
          normalize(p.designation).includes(hint),
        );
        if (matches.length === 1) product = matches[0];
        else if (matches.length > 1) {
          missing.push(
            `Plusieurs produits correspondent à « ${item.designationHint} ». Précisez la référence.`,
          );
          continue;
        }
      }
      if (!product) {
        missing.push(
          `Produit ${item.reference ? `« ${item.reference} »` : `« ${item.designationHint} »`} introuvable. Aucun prix inventé.`,
        );
        continue;
      }
      const price = resolveSalePriceHt(product, company);
      if (price == null) {
        missing.push(`Prix manquant pour ${product.reference}.`);
        continue;
      }
      // Ignore unitPriceHtHint from the model — never trust AI prices
      lines.push({
        id: createId("line"),
        type: "produit",
        reference: product.reference,
        designation: product.designation,
        quantity: item.quantity,
        unit: product.unit,
        unitPriceHt: price,
        vatRate: vat,
        productId: product.id,
      });
      continue;
    }

    if (item.kind === "main_doeuvre") {
      if (company.hourlyRateHt <= 0) {
        missing.push("Tarif horaire non configuré.");
        continue;
      }
      lines.push({
        id: createId("line"),
        type: "main_doeuvre",
        designation: item.designationHint || "Main-d'œuvre / pose",
        quantity: item.quantity,
        unit: "h",
        unitPriceHt: company.hourlyRateHt,
        vatRate: vat,
      });
      continue;
    }

    if (item.kind === "deplacement") {
      const amount =
        item.unitPriceHtHint != null && item.unitPriceHtHint > 0
          ? item.unitPriceHtHint
          : company.travelFeeHt;
      // Travel amount can come from user utterance (explicit euro amount), not "catalog invent"
      if (!(amount > 0)) {
        missing.push("Précisez le montant de déplacement.");
        continue;
      }
      lines.push({
        id: createId("line"),
        type: "deplacement",
        designation: "Frais de déplacement",
        quantity: 1,
        unit: "forfait",
        unitPriceHt: amount,
        vatRate: vat,
      });
      continue;
    }

    if (item.kind === "remise") {
      if (item.discountPercent != null && item.discountPercent > 0) {
        const d = buildPercentDiscountLine(lines, item.discountPercent, vat);
        if (d) lines.push(d);
        else missing.push("Remise % invalide.");
      } else if (item.unitPriceHtHint != null && item.unitPriceHtHint > 0) {
        lines.push({
          id: createId("line"),
          type: "remise",
          designation: "Remise commerciale",
          quantity: 1,
          unit: "forfait",
          unitPriceHt: item.unitPriceHtHint,
          vatRate: vat,
        });
      }
    }
  }

  if (missing.length > 0 || !client || lines.length === 0) {
    return {
      ok: false,
      missing,
      usedInventedPrice: false,
      assistantMessage:
        (draft.assistantSummary ? `${draft.assistantSummary}\n\n` : "") +
        "Informations manquantes :\n" +
        missing.map((m) => `• ${m}`).join("\n") +
        "\n\nJe n'invente jamais un prix, une référence ou un client.",
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

  return {
    ok: true,
    quote,
    missing: [],
    usedInventedPrice: false,
    assistantMessage:
      draft.assistantSummary ||
      `Brouillon ${quote.number} préparé pour ${client.name}. Vérifiez puis validez.`,
  };
}
