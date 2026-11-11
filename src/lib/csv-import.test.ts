import { describe, expect, it } from "vitest";
import { parseProductCsv } from "./csv-import";

describe("parseProductCsv", () => {
  it("parse un CSV standard et ignore une ligne invalide", () => {
    const csv = [
      "reference;designation;unit;purchase_price_ht;margin_percent;sale_price_ht;supplier_id",
      "MOT123;Moteur;u;89,5;40;;sup1",
      "BAD;;u;abc;;;",
      "TEL456;Telecommande;u;22;;39;sup2",
    ].join("\n");
    const { products, errors } = parseProductCsv(csv, "fallback");
    expect(products).toHaveLength(2);
    expect(products[0].reference).toBe("MOT123");
    expect(products[0].purchasePriceHt).toBe(89.5);
    expect(products[1].salePriceHt).toBe(39);
    expect(errors.length).toBeGreaterThan(0);
  });
});
