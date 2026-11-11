import { NextRequest, NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth-server";
import { getServerFeatureFlags } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Envoi e-mail après validation humaine uniquement.
 * Nécessite RESEND_API_KEY + EMAIL_FROM.
 */
export async function POST(req: NextRequest) {
  const viewer = await resolveViewer(req);
  if (!viewer) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const flags = getServerFeatureFlags();
  if (!flags.resendConfigured) {
    return NextResponse.json(
      {
        error:
          "Envoi e-mail non configuré. Ajoutez RESEND_API_KEY et EMAIL_FROM.",
        code: "resend_unconfigured",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`email:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Trop d'envois" }, { status: 429 });
  }

  const body = (await req.json()) as {
    to?: string;
    subject?: string;
    html?: string;
    confirmed?: boolean;
    quoteNumber?: string;
  };

  if (!body.confirmed) {
    return NextResponse.json(
      { error: "Confirmation explicite requise (confirmed: true)." },
      { status: 400 },
    );
  }
  if (!body.to || !body.subject || !body.html) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [body.to],
      subject: body.subject,
      html: body.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Échec Resend", detail: text.slice(0, 200) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    quoteNumber: body.quoteNumber ?? null,
  });
}
