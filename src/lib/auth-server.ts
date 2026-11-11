import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "dr_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 h

/** Identifiants démo — serveur uniquement (pas dans le bundle client). */
const DEMO_EMAIL = "demo@devisrapide.fr";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD?.trim() || "demo1234";

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    "devisrapide-demo-session-change-me-in-prod"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyDemoCredentials(email: string, password: string): boolean {
  const e = email.trim().toLowerCase();
  const emailOk = e === DEMO_EMAIL || e === "demo";
  const expected = Buffer.from(DEMO_PASSWORD);
  const got = Buffer.from(password);
  if (expected.length !== got.length) return false;
  return emailOk && timingSafeEqual(expected, got);
}

export function createSessionToken(email: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const body = `${email.trim().toLowerCase()}|${exp}`;
  return `${body}|${sign(body)}`;
}

export function readSessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [email, expStr, sig] = parts;
  const body = `${email}|${expStr}`;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return { email };
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export async function getSessionFromCookies(): Promise<{ email: string } | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function getSessionFromRequest(req: NextRequest): { email: string } | null {
  return readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function sanitizePdfFilename(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 64);
  return cleaned || "devis";
}
