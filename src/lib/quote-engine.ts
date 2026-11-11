import { roundMoney } from "./money";
import type { Company, Product, Quote, QuoteLine, QuoteTotals } from "./types";

/** Prix de vente HT : prix saisi ou achat + marge produit / entreprise. */
export function resolveSalePriceHt(
  product: Product,
  company: Company,
): number | null {
  if (product.salePriceHt != null && product.salePriceHt >= 0) {
    return roundMoney(product.salePriceHt);
  }
  if (product.purchasePriceHt == null || Number.isNaN(product.purchasePriceHt)) {
    return null;
  }
  const margin =
    product.marginPercent != null
      ? product.marginPercent
      : company.defaultMarginPercent;
  return roundMoney(product.purchasePriceHt * (1 + margin / 100));
}

export function lineTotalHt(line: QuoteLine): number {
  const raw = line.quantity * line.unitPriceHt;
  if (line.type === "remise") {
    return -Math.abs(roundMoney(raw));
  }
  return roundMoney(raw);
}

/** Remise en % du HT hors lignes de remise déjà présentes. */
export function buildPercentDiscountLine(
  lines: QuoteLine[],
  percent: number,
  vatRate: number,
): QuoteLine | null {
  if (!(percent > 0) || percent > 100) return null;
  const base = roundMoney(
    lines
      .filter((l) => l.type !== "remise")
      .reduce((s, l) => s + lineTotalHt(l), 0),
  );
  if (base <= 0) return null;
  const amount = roundMoney(base * (percent / 100));
  return {
    id: createId("line"),
    type: "remise",
    designation: `Remise commerciale ${percent} %`,
    quantity: 1,
    unit: "forfait",
    unitPriceHt: amount,
    vatRate,
  };
}

export function computeQuoteTotals(lines: QuoteLine[]): QuoteTotals {
  const byRate = new Map<number, { baseHt: number; vat: number }>();

  for (const line of lines) {
    const ht = lineTotalHt(line);
    const vat = roundMoney(ht * (line.vatRate / 100));
    const current = byRate.get(line.vatRate) ?? { baseHt: 0, vat: 0 };
    current.baseHt = roundMoney(current.baseHt + ht);
    current.vat = roundMoney(current.vat + vat);
    byRate.set(line.vatRate, current);
  }

  const byVatRate = Array.from(byRate.entries())
    .map(([rate, values]) => ({
      rate,
      baseHt: values.baseHt,
      vat: values.vat,
    }))
    .sort((a, b) => a.rate - b.rate);

  const totalHt = roundMoney(byVatRate.reduce((s, r) => s + r.baseHt, 0));
  const totalVat = roundMoney(byVatRate.reduce((s, r) => s + r.vat, 0));

  return {
    totalHt,
    totalVat,
    totalTtc: roundMoney(totalHt + totalVat),
    byVatRate,
  };
}

export function nextQuoteNumber(
  existing: Quote[],
  year = new Date().getFullYear(),
): string {
  const prefix = `D-${year}-`;
  const seq = existing
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Identifiants UUID (compatibles Postgres / Supabase). Le préfixe est ignoré. */
export function createId(_prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
