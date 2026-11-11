import type { Product, Unit } from "./types";

const UNITS: Unit[] = ["u", "h", "m", "m²", "forfait", "kg"];

function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Attend des colonnes : reference, designation, unit, purchase_price_ht, margin_percent?, sale_price_ht?, supplier_id? */
export function parseProductCsv(
  text: string,
  fallbackSupplierId: string,
): { products: Omit<Product, "id" | "companyId" | "updatedAt">[]; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { products: [], errors: ["Le fichier CSV est vide ou sans données."] };
  }

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const required = ["reference", "designation", "purchase_price_ht"];
  for (const r of required) {
    if (idx(r) < 0) {
      return {
        products: [],
        errors: [
          `Colonne obligatoire manquante : ${r}. Colonnes attendues : reference, designation, unit, purchase_price_ht, margin_percent, sale_price_ht, supplier_id`,
        ],
      };
    }
  }

  const products: Omit<Product, "id" | "companyId" | "updatedAt">[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const reference = cols[idx("reference")]?.toUpperCase();
    const designation = cols[idx("designation")];
    const purchase = parseNumber(cols[idx("purchase_price_ht")] ?? "");
    const unitRaw = (idx("unit") >= 0 ? cols[idx("unit")] : "u") || "u";
    const unit = (UNITS.includes(unitRaw as Unit) ? unitRaw : "u") as Unit;
    const margin =
      idx("margin_percent") >= 0
        ? parseNumber(cols[idx("margin_percent")] ?? "")
        : null;
    const sale =
      idx("sale_price_ht") >= 0
        ? parseNumber(cols[idx("sale_price_ht")] ?? "")
        : null;
    const supplierId =
      (idx("supplier_id") >= 0 && cols[idx("supplier_id")]) ||
      fallbackSupplierId;

    if (!reference || !designation || purchase == null) {
      errors.push(`Ligne ${i + 1} : reference, designation ou prix invalide.`);
      continue;
    }

    products.push({
      supplierId,
      reference,
      designation,
      unit,
      purchasePriceHt: purchase,
      marginPercent: margin,
      salePriceHt: sale,
    });
  }

  return { products, errors };
}
