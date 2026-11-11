import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromRequest,
  sanitizePdfFilename,
} from "@/lib/auth-server";
import { buildQuotePdf } from "@/lib/pdf-quote";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Client, Company, Quote, QuoteTotals } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024; // 64 Ko
const MAX_LINES = 80;
const MAX_STRING = 500;

function tooLong(value: unknown, max = MAX_STRING): boolean {
  return typeof value === "string" && value.length > max;
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "Connexion requise pour générer un PDF." },
      { status: 401 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`pdf:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop de générations PDF. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }

  let body: {
    company?: Company;
    client?: Client;
    quote?: Quote;
    totals?: QuoteTotals;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body?.company || !body?.client || !body?.quote || !body?.totals) {
    return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
  }

  const lines = body.quote.lines;
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) {
    return NextResponse.json(
      { error: `Le devis doit contenir entre 1 et ${MAX_LINES} lignes.` },
      { status: 400 },
    );
  }

  if (
    tooLong(body.company.name) ||
    tooLong(body.client.name) ||
    tooLong(body.quote.number, 40) ||
    lines.some(
      (l) => tooLong(l.designation) || tooLong(l.reference ?? "", 40),
    )
  ) {
    return NextResponse.json({ error: "Champs texte trop longs." }, { status: 400 });
  }

  try {
    const pdf = await buildQuotePdf({
      company: body.company,
      client: body.client,
      quote: body.quote,
      totals: body.totals,
    });
    const safeName = sanitizePdfFilename(body.quote.number);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("pdf_generation_failed");
    return NextResponse.json(
      { error: "Échec génération PDF" },
      { status: 500 },
    );
  }
}
