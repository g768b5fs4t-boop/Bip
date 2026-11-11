import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookies } from "@/lib/auth-cookies";
import {
  getServerFeatureFlags,
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) {
    return NextResponse.json(
      { error: "Inscription cloud indisponible." },
      { status: 503 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`signup:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  let body: {
    email?: string;
    password?: string;
    name?: string;
    companyName?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const name = body.name?.trim() || "Artisan";
  const companyName = body.companyName?.trim() || `${name} Entreprise`;

  if (!email || !email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { error: "E-mail valide et mot de passe (8 caractères min.) requis." },
      { status: 400 },
    );
  }

  const url = getSupabaseUrl()!;
  const publishable = getSupabasePublishableKey();
  const admin = getSupabaseAdmin();

  let userId: string;
  let accessToken: string;
  let refreshToken: string;
  let expiresIn: number | undefined;

  if (admin) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (created.error || !created.data.user) {
      const msg = created.error?.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet e-mail." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Impossible de créer le compte." },
        { status: 400 },
      );
    }
    userId = created.data.user.id;
    if (!publishable) {
      return NextResponse.json(
        { error: "Clé publishable Supabase manquante." },
        { status: 503 },
      );
    }
    const authClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signed = await authClient.auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session) {
      return NextResponse.json(
        { error: "Compte créé mais connexion impossible." },
        { status: 500 },
      );
    }
    accessToken = signed.data.session.access_token;
    refreshToken = signed.data.session.refresh_token;
    expiresIn = signed.data.session.expires_in;
  } else {
    if (!publishable) {
      return NextResponse.json(
        { error: "Clés Supabase incomplètes." },
        { status: 503 },
      );
    }
    const authClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signed = await authClient.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (signed.error || !signed.data.user) {
      return NextResponse.json(
        { error: "Impossible de créer le compte." },
        { status: 400 },
      );
    }
    if (!signed.data.session) {
      return NextResponse.json(
        {
          error:
            "Compte créé. Confirmez votre e-mail puis connectez-vous.",
          needsEmailConfirmation: true,
        },
        { status: 201 },
      );
    }
    userId = signed.data.user.id;
    accessToken = signed.data.session.access_token;
    refreshToken = signed.data.session.refresh_token;
    expiresIn = signed.data.session.expires_in;
  }

  const db = getSupabaseForUser(accessToken) || admin;
  if (!db) {
    return NextResponse.json(
      { error: "Base indisponible après inscription." },
      { status: 503 },
    );
  }

  const { data: company, error: companyError } = await db
    .from("companies")
    .insert({
      owner_user_id: userId,
      name: companyName,
      email,
      hourly_rate_ht: 55,
      travel_fee_ht: 45,
      default_margin_percent: 35,
      default_vat_rate: 20,
      vat_rates: [5.5, 10, 20],
      quote_validity_days: 30,
    })
    .select("id,name")
    .maybeSingle();

  if (companyError || !company) {
    return NextResponse.json(
      { error: "Compte créé mais entreprise non initialisée." },
      { status: 500 },
    );
  }

  await setSessionCookies({
    accessToken,
    refreshToken,
    expiresIn,
  });

  return NextResponse.json({
    ok: true,
    user: { id: userId, email, name },
    companyId: company.id,
    companyName: company.name,
  });
}
