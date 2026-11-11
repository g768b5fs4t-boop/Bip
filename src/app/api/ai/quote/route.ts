import { NextRequest, NextResponse } from "next/server";
import { runQuoteAssistant } from "@/lib/ai/run-quote";
import { resolveViewer } from "@/lib/auth-server";
import { getServerFeatureFlags } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
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
  const result = await runQuoteAssistant({
    message,
    company: body.company,
    products: body.products,
    clients: body.clients,
    existingQuotes: body.quotes ?? [],
    preferOpenAi: flags.openaiConfigured,
  });

  return NextResponse.json(result);
}
