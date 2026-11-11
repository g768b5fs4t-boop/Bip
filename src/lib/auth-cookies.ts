import { cookies } from "next/headers";

export const ACCESS_COOKIE = "dr_access";
export const REFRESH_COOKIE = "dr_refresh";
export const LOCAL_DEMO_COOKIE = "dr_local_demo";

const WEEK = 60 * 60 * 24 * 7;

/** Secure uniquement sur Vercel (HTTPS). En local / Playwright (http) le flag casse la session. */
function secureCookies(): boolean {
  return process.env.VERCEL === "1";
}

export function sessionCookieOptions(maxAge = WEEK) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookies(),
    path: "/",
    maxAge,
  };
}

export async function readAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function hasLocalDemoCookie(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(LOCAL_DEMO_COOKIE)?.value === "1";
}

export async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}) {
  const jar = await cookies();
  const maxAge = tokens.expiresIn && tokens.expiresIn > 0 ? tokens.expiresIn : WEEK;
  jar.set(ACCESS_COOKIE, tokens.accessToken, sessionCookieOptions(maxAge));
  jar.set(REFRESH_COOKIE, tokens.refreshToken, sessionCookieOptions(WEEK));
  jar.delete(LOCAL_DEMO_COOKIE);
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(LOCAL_DEMO_COOKIE);
}

export async function setLocalDemoCookie() {
  const jar = await cookies();
  jar.set(LOCAL_DEMO_COOKIE, "1", sessionCookieOptions(WEEK));
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Autorise la démo locale uniquement hors Vercel (dev / Playwright). */
export function allowLocalDemo(): boolean {
  return process.env.VERCEL !== "1";
}
