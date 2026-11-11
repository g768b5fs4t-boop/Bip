/** Arrondi monétaire déterministe à 2 décimales ( Banquier / half-up ). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(roundMoney(value));
}

export function formatPercent(value: number): string {
  return `${roundMoney(value).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })} %`;
}
