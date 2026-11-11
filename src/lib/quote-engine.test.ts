import { describe, expect, it } from "vitest";
import { buildQuoteFromRequest } from "./ai-parser";
import {
  demoClients,
  demoCompany,
  demoProducts,
} from "./demo-data";
import {
  buildPercentDiscountLine,
  computeQuoteTotals,
  lineTotalHt,
  resolveSalePriceHt,
} from "./quote-engine";
import type { QuoteLine } from "./types";

describe("quote-engine", () => {
  it("calcule le prix de vente MOT123 via marge", () => {
    const mot = demoProducts.find((p) => p.reference === "MOT123")!;
    expect(resolveSalePriceHt(mot, demoCompany)).toBe(125.3);
  });

  it("applique une remise négative correctement", () => {
    const line: QuoteLine = {
      id: "r1",
      type: "remise",
      designation: "Remise",
      quantity: 1,
      unit: "forfait",
      unitPriceHt: 50,
      vatRate: 20,
    };
    expect(lineTotalHt(line)).toBe(-50);
  });

  it("calcule une remise % déterministe", () => {
    const lines: QuoteLine[] = [
      {
        id: "l1",
        type: "produit",
        designation: "A",
        quantity: 2,
        unit: "u",
        unitPriceHt: 100,
        vatRate: 20,
      },
    ];
    const discount = buildPercentDiscountLine(lines, 10, 20)!;
    expect(discount.unitPriceHt).toBe(20);
    const totals = computeQuoteTotals([...lines, discount]);
    expect(totals.totalHt).toBe(180);
    expect(totals.totalVat).toBe(36);
    expect(totals.totalTtc).toBe(216);
  });
});

describe("ai-parser", () => {
  it("produit le devis exemple du cahier des charges", () => {
    const result = buildQuoteFromRequest({
      message:
        "Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(result.ok).toBe(true);
    expect(result.quote?.lines).toHaveLength(4);
    const totals = computeQuoteTotals(result.quote!.lines);
    expect(totals.totalHt).toBe(831.6);
    expect(totals.totalVat).toBe(166.32);
    expect(totals.totalTtc).toBe(997.92);
  });

  it("refuse une référence inconnue sans inventer", () => {
    const missing = buildQuoteFromRequest({
      message: "Devis pour Monsieur Martin avec 1 référence XYZ999",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(missing.ok).toBe(false);
    expect(missing.assistantMessage).toContain("XYZ999");
    expect(missing.assistantMessage.toLowerCase()).toContain("invente");
  });

  it("refuse un client inconnu", () => {
    const missing = buildQuoteFromRequest({
      message: "Devis pour Madame Inconnue avec 1 référence MOT123",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(missing.ok).toBe(false);
    expect(missing.assistantMessage).toMatch(/introuvable|Client/i);
  });

  it("applique une remise 10 % si demandée", () => {
    const result = buildQuoteFromRequest({
      message:
        "Devis pour Monsieur Martin : 2 référence MOT123, remise de 10 %",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(result.ok).toBe(true);
    expect(result.quote?.lines.some((l) => l.type === "remise")).toBe(true);
    const totals = computeQuoteTotals(result.quote!.lines);
    // 2 * 125.3 = 250.6 ; remise 10% = 25.06 ; HT = 225.54
    expect(totals.totalHt).toBe(225.54);
  });
});
