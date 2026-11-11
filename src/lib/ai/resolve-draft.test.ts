import { describe, expect, it } from "vitest";
import { demoClients, demoCompany, demoProducts } from "@/lib/demo-data";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { resolveAiDraftToQuote } from "./resolve-draft";

describe("resolveAiDraftToQuote", () => {
  it("applique les prix catalogue et ignore un prix IA inventé", () => {
    const result = resolveAiDraftToQuote({
      draft: {
        clientNameHint: "Monsieur Martin",
        lines: [
          {
            kind: "produit",
            reference: "MOT123",
            designationHint: null,
            quantity: 2,
            unitPriceHtHint: 1,
            discountPercent: null,
            notes: null,
          },
        ],
        missingQuestions: [],
        assistantSummary: "ok",
      },
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(result.ok).toBe(true);
    expect(result.quote!.lines[0].unitPriceHt).toBe(125.3);
    expect(result.usedInventedPrice).toBe(false);
    expect(computeQuoteTotals(result.quote!.lines).totalHt).toBe(250.6);
  });

  it("refuse une référence absente", () => {
    const result = resolveAiDraftToQuote({
      draft: {
        clientNameHint: "Monsieur Martin",
        lines: [
          {
            kind: "produit",
            reference: "NOPE",
            designationHint: null,
            quantity: 1,
            unitPriceHtHint: null,
            discountPercent: null,
            notes: null,
          },
        ],
        missingQuestions: [],
        assistantSummary: "",
      },
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
    });
    expect(result.ok).toBe(false);
    expect(result.assistantMessage).toMatch(/introuvable|invent/i);
  });
});
