import { NextResponse } from "next/server";
import { allowLocalDemo, setLocalDemoCookie } from "@/lib/auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Démo locale uniquement hors Vercel (dev / Playwright). */
export async function POST() {
  if (!allowLocalDemo()) {
    return NextResponse.json(
      {
        error:
          "La démo ouverte est désactivée en production. Créez un compte ou connectez-vous.",
      },
      { status: 403 },
    );
  }
  await setLocalDemoCookie();
  return NextResponse.json({
    ok: true,
    mode: "local-demo",
    user: { email: "demo@devisrapide.fr", name: "Jean Martin" },
  });
}
