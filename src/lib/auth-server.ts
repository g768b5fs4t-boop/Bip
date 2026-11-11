import { getIdentity } from "../../cursor/identity";
import {
  allowLocalDemo,
  hasLocalDemoCookie,
  readAccessToken,
  readRefreshToken,
  setSessionCookies,
} from "@/lib/auth-cookies";
import { getServerFeatureFlags } from "@/lib/config";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/admin";

export function sanitizePdfFilename(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 64);
  return cleaned || "devis";
}

export type AppViewer = {
  email: string;
  name: string;
  source: "supabase" | "cursor" | "local-sim";
  userId?: string;
  companyId?: string;
  accessToken?: string;
};

async function resolveSupabaseViewer(): Promise<AppViewer | null> {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) return null;

  let access = await readAccessToken();
  const refresh = await readRefreshToken();
  if (!access && !refresh) return null;

  const userClient = access ? getSupabaseForUser(access) : null;
  if (userClient) {
    const { data, error } = await userClient.auth.getUser();
    if (!error && data.user) {
      const companyId = await lookupCompanyId(data.user.id, access!);
      return {
        email: data.user.email || "artisan@devisrapide.app",
        name:
          (data.user.user_metadata?.name as string | undefined) ||
          data.user.email?.split("@")[0] ||
          "Artisan",
        source: "supabase",
        userId: data.user.id,
        companyId: companyId ?? undefined,
        accessToken: access!,
      };
    }
  }

  if (refresh) {
    const url = process.env.SUPABASE_URL?.trim();
    const publishable =
      process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.SUPABASE_ANON_KEY?.trim();
    if (!url || !publishable) return null;
    const { createClient } = await import("@supabase/supabase-js");
    const authClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: refresh,
    });
    if (error || !data.session?.access_token || !data.user) return null;
    await setSessionCookies({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    });
    const companyId = await lookupCompanyId(
      data.user.id,
      data.session.access_token,
    );
    return {
      email: data.user.email || "artisan@devisrapide.app",
      name:
        (data.user.user_metadata?.name as string | undefined) ||
        data.user.email?.split("@")[0] ||
        "Artisan",
      source: "supabase",
      userId: data.user.id,
      companyId: companyId ?? undefined,
      accessToken: data.session.access_token,
    };
  }

  return null;
}

async function lookupCompanyId(
  userId: string,
  accessToken: string,
): Promise<string | null> {
  const client = getSupabaseForUser(accessToken) || getSupabaseAdmin();
  if (!client) return null;
  const { data } = await client
    .from("companies")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Autorise l’accès API :
 * - Session Supabase (JWT cookie, RLS)
 * - Identité Cursor vérifiée (app privée/équipe)
 * - Démo locale hors Vercel uniquement (dev / e2e)
 *
 * Le mode « démo ouverte Vercel » a été retiré pour les routes sensibles.
 */
export async function resolveViewer(request: Request): Promise<AppViewer | null> {
  const supabaseViewer = await resolveSupabaseViewer();
  if (supabaseViewer) return supabaseViewer;

  const identity = await getIdentity(request);
  if (identity.verified && !identity.simulated) {
    return {
      email: identity.email || "viewer@cursor",
      name: identity.name || "Utilisateur",
      source: "cursor",
      userId:
        identity.kind === "person" ? String(identity.userId) : identity.sub,
    };
  }

  if (allowLocalDemo() && (await hasLocalDemoCookie())) {
    return {
      email: "demo@devisrapide.fr",
      name: "Jean Martin",
      source: "local-sim",
      userId: "local-demo",
      companyId: "11111111-1111-4111-8111-111111111111",
    };
  }

  // Identité simulée Cursor uniquement hors Vercel
  if (allowLocalDemo() && identity.verified && identity.simulated) {
    return {
      email: identity.email || "demo@local",
      name: identity.name || "Démo locale",
      source: "local-sim",
    };
  }

  return null;
}

/** Exige une session ; refuse toute démo ouverte en production. */
export async function requireViewer(request: Request): Promise<AppViewer | null> {
  return resolveViewer(request);
}

export async function requireTenant(request: Request): Promise<{
  viewer: AppViewer;
  companyId: string;
  accessToken: string;
} | null> {
  const viewer = await resolveViewer(request);
  if (!viewer?.companyId || !viewer.accessToken || viewer.source !== "supabase") {
    return null;
  }
  return {
    viewer,
    companyId: viewer.companyId,
    accessToken: viewer.accessToken,
  };
}
