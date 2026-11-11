import { NextRequest, NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/auth-cookies";
import { getServerFeatureFlags } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/admin";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/config";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) {
    return NextResponse.json(
      { error: "Authentification cloud indisponible." },
      { status: 503 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: "E-mail ou mot de passe invalide." },
      { status: 400 },
    );
  }

  const url = getSupabaseUrl()!;
  const key = getSupabasePublishableKey();
  if (!key) {
    return NextResponse.json(
      { error: "Clé publishable Supabase manquante." },
      { status: 503 },
    );
  }

  const authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { error: "Identifiants incorrects." },
      { status: 401 },
    );
  }

  await setSessionCookies({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  });

  const userClient = getSupabaseForUser(data.session.access_token);
  const admin = getSupabaseAdmin();
  const db = userClient || admin;
  let companyId: string | null = null;
  if (db) {
    const { data: company } = await db
      .from("companies")
      .select("id,name")
      .eq("owner_user_id", data.user.id)
      .maybeSingle();
    companyId = company?.id ?? null;
  }

  return NextResponse.json({
    ok: true,
    user: {
      email: data.user.email,
      name: (data.user.user_metadata?.name as string | undefined) || null,
      id: data.user.id,
    },
    companyId,
  });
}
