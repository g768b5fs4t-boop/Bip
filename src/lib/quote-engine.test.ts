import { buildQuoteFromRequest } from "./ai-parser";
import {
  demoClients,
  demoCompany,
  demoProducts,
} from "./demo-data";
import { computeQuoteTotals, resolveSalePriceHt } from "./quote-engine";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const mot = demoProducts.find((p) => p.reference === "MOT123")!;
const saleMot = resolveSalePriceHt(mot, demoCompany)!;
assert(saleMot === 125.3, `MOT123 sale expected 125.3 got ${saleMot}`);

const result = buildQuoteFromRequest({
  message:
    "Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.",
  company: demoCompany,
  products: demoProducts,
  clients: demoClients,
  existingQuotes: [],
});

assert(result.ok, result.assistantMessage);
assert(result.quote?.lines.length === 4, "expected 4 lines");
const totals = computeQuoteTotals(result.quote!.lines);
// 2*125.3 + 4*39 + 5*55 + 150 = 250.6 + 156 + 275 + 150 = 831.6 HT
assert(totals.totalHt === 831.6, `HT expected 831.6 got ${totals.totalHt}`);
assert(totals.totalVat === 166.32, `TVA expected 166.32 got ${totals.totalVat}`);
assert(totals.totalTtc === 997.92, `TTC expected 997.92 got ${totals.totalTtc}`);

const missing = buildQuoteFromRequest({
  message: "Devis pour Monsieur Martin avec 1 référence XYZ999",
  company: demoCompany,
  products: demoProducts,
  clients: demoClients,
  existingQuotes: [],
});
assert(!missing.ok, "unknown ref should fail");
assert(
  missing.assistantMessage.includes("XYZ999"),
  "should mention unknown ref",
);

console.log("OK — quote-engine & ai-parser");
