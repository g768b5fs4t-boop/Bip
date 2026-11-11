import { NextRequest, NextResponse } from "next/server";
import { callOpenAiQuoteDraft } from "@/lib/ai/openai-quote";
import { resolveAiDraftToQuote } from "@/lib/ai/resolve-draft";
import { buildQuoteFromRequest } from "@/lib/ai-parser";
import { resolveViewer } from "@/lib/auth-server";
import { getServerFeatureFlags } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { computeQuoteTotals } from "@/lib/quote-engine";
import type { Client, Company, Product, Quote } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 32_000;

export async function POST(req: NextRequest) {
  const viewer = await resolveViewer(req);
  if (!viewer) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`ai-quote:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: "Message trop long" }, { status: 413 });
  }

  let body: {
    message?: string;
    company?: Company;
    products?: Product[];
    clients?: Client[];
    quotes?: Quote[];
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || !body.company || !body.products || !body.clients) {
    return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
  }

  const flags = getServerFeatureFlags();
  const existingQuotes = body.quotes ?? [];

  try {
    if (flags.openaiConfigured) {
      const draft = await callOpenAiQuoteDraft({
        message,
        products: body.products.filter((p) => p.companyId === body.company!.id),
        clients: body.clients.filter((c) => c.companyId === body.company!.id),
        hourlyRateHt: body.company.hourlyRateHt,
        travelFeeHt: body.company.travelFeeHt,
      });
      const resolved = resolveAiDraftToQuote({
        draft,
        company: body.company,
        products: body.products,
        clients: body.clients,
        existingQuotes,
      });
      const totals = resolved.quote
        ? computeQuoteTotals(resolved.quote.lines)
        : null;
      return NextResponse.json({
        ...resolved,
        provider: "openai",
        totals,
      });
    }

    // Repli déterministe documenté — pas une fausse IA
    const fallback = buildQuoteFromRequest({
      message,
      company: body.company,
      products: body.products,
      clients: body.clients,
      existingQuotes,
    });
    const totals = fallback.quote
      ? computeQuoteTotals(fallback.quote.lines)
      : null;
    return NextResponse.json({
      ...fallback,
      provider: "deterministic-parser",
      totals,
      notice:
        "OPENAI_API_KEY absente : analyse déterministe locale (pas un modèle IA).",
    });
  } catch (error) {
    console.error("ai_quote_failed");
    return NextResponse.json(
      {
        error: "Échec assistant",
        detail: error instanceof Error ? error.message : "inconnu",
      },
      { status: 502 },
    );
  }
}
