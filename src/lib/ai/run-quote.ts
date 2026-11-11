import { callOpenAiQuoteDraft } from "@/lib/ai/openai-quote";
import { resolveAiDraftToQuote } from "@/lib/ai/resolve-draft";
import { buildQuoteFromRequest } from "@/lib/ai-parser";
import { computeQuoteTotals } from "@/lib/quote-engine";
import type { Client, Company, Product, Quote, QuoteTotals } from "@/lib/types";

export type QuoteAssistantResult = {
  ok: boolean;
  quote?: Quote;
  missing: string[];
  assistantMessage: string;
  provider: "openai" | "deterministic-parser";
  totals: QuoteTotals | null;
  notice?: string;
  fallbackFromOpenAi?: boolean;
  usedInventedPrice?: boolean;
};

export async function runQuoteAssistant(params: {
  message: string;
  company: Company;
  products: Product[];
  clients: Client[];
  existingQuotes: Quote[];
  preferOpenAi: boolean;
}): Promise<QuoteAssistantResult> {
  const deterministic = (): QuoteAssistantResult => {
    const fallback = buildQuoteFromRequest({
      message: params.message,
      company: params.company,
      products: params.products,
      clients: params.clients,
      existingQuotes: params.existingQuotes,
    });
    const totals = fallback.quote
      ? computeQuoteTotals(fallback.quote.lines)
      : null;
    return {
      ok: fallback.ok,
      quote: fallback.quote,
      missing: fallback.missing,
      assistantMessage: fallback.assistantMessage,
      provider: "deterministic-parser",
      totals,
    };
  };

  if (!params.preferOpenAi) {
    return {
      ...deterministic(),
      notice:
        "Analyse déterministe locale (clé OpenAI absente) — pas un modèle IA.",
    };
  }

  try {
    const draft = await callOpenAiQuoteDraft({
      message: params.message,
      products: params.products.filter(
        (p) => p.companyId === params.company.id,
      ),
      clients: params.clients.filter((c) => c.companyId === params.company.id),
      hourlyRateHt: params.company.hourlyRateHt,
      travelFeeHt: params.company.travelFeeHt,
    });
    const resolved = resolveAiDraftToQuote({
      draft,
      company: params.company,
      products: params.products,
      clients: params.clients,
      existingQuotes: params.existingQuotes,
    });
    const totals = resolved.quote
      ? computeQuoteTotals(resolved.quote.lines)
      : null;
    return {
      ok: resolved.ok,
      quote: resolved.quote,
      missing: resolved.missing,
      assistantMessage: resolved.assistantMessage,
      usedInventedPrice: resolved.usedInventedPrice,
      provider: "openai",
      totals,
    };
  } catch {
    return {
      ...deterministic(),
      fallbackFromOpenAi: true,
      notice:
        "L’assistant IA est temporairement indisponible. Repli sur l’analyse déterministe locale.",
    };
  }
}
