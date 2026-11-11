import { NextRequest, NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth-server";
import { getServerFeatureFlags } from "@/lib/config";
import { getOpenAiModel } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const viewer = await resolveViewer(req);
  if (!viewer) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const flags = getServerFeatureFlags();
  if (!flags.whisperConfigured) {
    return NextResponse.json(
      {
        error:
          "Transcription serveur indisponible : configurez OPENAI_API_KEY (Whisper).",
        code: "whisper_unconfigured",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`transcribe:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier audio manquant" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Audio trop volumineux (max 8 Mo)" }, { status: 413 });
  }

  const key = process.env.OPENAI_API_KEY!.trim();
  const upstream = new FormData();
  upstream.append("file", file, file.name || "audio.webm");
  upstream.append("model", "whisper-1");
  upstream.append("language", "fr");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: upstream,
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Échec Whisper", detail: text.slice(0, 200) },
      { status: 502 },
    );
  }

  const json = (await res.json()) as { text?: string };
  const text = json.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Transcription vide" }, { status: 502 });
  }

  return NextResponse.json({
    text,
    provider: "openai-whisper",
    modelHint: getOpenAiModel(),
  });
}
