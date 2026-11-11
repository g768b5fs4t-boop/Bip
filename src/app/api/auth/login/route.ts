import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyDemoCredentials,
} from "@/lib/auth-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`login:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  if (!verifyDemoCredentials(email, password)) {
    return NextResponse.json(
      { error: "Identifiants incorrects. Utilisez demo@devisrapide.fr / demo1234" },
      { status: 401 },
    );
  }

  const token = createSessionToken("demo@devisrapide.fr");
  const res = NextResponse.json({
    ok: true,
    user: { email: "demo@devisrapide.fr", name: "Jean Martin" },
  });
  const opts = sessionCookieOptions(token);
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}
