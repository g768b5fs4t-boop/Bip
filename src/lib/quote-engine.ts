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

export function nextQuoteNumber(existing: Quote[], year = new Date().getFullYear()): string {
  const prefix = `D-${year}-`;
  const seq = existing
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function createId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
