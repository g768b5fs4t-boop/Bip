import { describe, expect, it } from "vitest";
import { mapCompany, mapProduct, quoteToDb } from "./mappers";
import type { Quote } from "@/lib/types";

describe("supabase mappers", () => {
  it("mappe une entreprise snake_case → camelCase", () => {
    const company = mapCompany({
      id: "11111111-1111-4111-8111-111111111111",
      owner_user_id: "00000000-0000-4000-8000-000000000001",
      name: "Test SARL",
      address: "1 rue",
      city: "Lyon",
      postal_code: "69001",
      phone: null,
      email: "a@b.fr",
      siret: null,
      logo_url: null,
      payment_terms: null,
      hourly_rate_ht: "55.00",
      travel_fee_ht: 45,
      default_margin_percent: 35,
      default_vat_rate: 20,
      vat_rates: [5.5, 10, 20],
      legal_mentions: null,
      quote_validity_days: 30,
    });
    expect(company.postalCode).toBe("69001");
    expect(company.hourlyRateHt).toBe(55);
    expect(company.vatRates).toEqual([5.5, 10, 20]);
  });

  it("mappe un produit avec supplier nullable", () => {
    const product = mapProduct({
      id: "33333333-3333-4333-8333-333333333301",
      company_id: "11111111-1111-4111-8111-111111111111",
      supplier_id: null,
      reference: "MOT123",
      designation: "Moteur",
      unit: "u",
      purchase_price_ht: 10,
      margin_percent: null,
      sale_price_ht: null,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(product.supplierId).toBe("");
    expect(product.purchasePriceHt).toBe(10);
  });

  it("sérialise un devis pour upsert tenant", () => {
    const quote: Quote = {
      id: "66666666-6666-4666-8666-666666666601",
      number: "D-2026-0001",
      companyId: "11111111-1111-4111-8111-111111111111",
      clientId: "44444444-4444-4444-8444-444444444401",
      status: "brouillon",
      createdAt: "2026-01-01T00:00:00.000Z",
      validUntil: "2026-02-01",
      lines: [],
    };
    const row = quoteToDb(quote, quote.companyId);
    expect(row.company_id).toBe(quote.companyId);
    expect(row.client_id).toBe(quote.clientId);
    expect(row.number).toBe("D-2026-0001");
  });
});
