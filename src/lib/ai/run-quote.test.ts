import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoClients, demoCompany, demoProducts } from "@/lib/demo-data";

vi.mock("@/lib/ai/openai-quote", () => ({
  callOpenAiQuoteDraft: vi.fn(),
}));

import { callOpenAiQuoteDraft } from "@/lib/ai/openai-quote";
import { runQuoteAssistant } from "@/lib/ai/run-quote";

describe("runQuoteAssistant", () => {
  beforeEach(() => {
    vi.mocked(callOpenAiQuoteDraft).mockReset();
  });

  it("utilise le parser déterministe si OpenAI non préféré", async () => {
    const result = await runQuoteAssistant({
      message:
        "Devis pour Monsieur Martin, 2 MOT123, 4 TEL456, 5 heures de pose et 150 € de déplacement",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
      preferOpenAi: false,
    });
    expect(callOpenAiQuoteDraft).not.toHaveBeenCalled();
    expect(result.provider).toBe("deterministic-parser");
    expect(result.quote).toBeTruthy();
    expect(result.notice).toMatch(/déterministe/i);
  });

  it("replie sur le parser si OpenAI échoue (429/5xx) sans fuite technique", async () => {
    vi.mocked(callOpenAiQuoteDraft).mockRejectedValue(
      new Error('OpenAI error 429: {"error":{"message":"no credits"}}'),
    );
    const result = await runQuoteAssistant({
      message:
        "Devis pour Monsieur Martin, 2 MOT123, 4 TEL456, 5 heures de pose et 150 € de déplacement",
      company: demoCompany,
      products: demoProducts,
      clients: demoClients,
      existingQuotes: [],
      preferOpenAi: true,
    });
    expect(result.provider).toBe("deterministic-parser");
    expect(result.fallbackFromOpenAi).toBe(true);
    expect(result.quote).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/no credits|429|OpenAI error/i);
    expect(result.notice).toMatch(/indisponible|repli/i);
  });
});
