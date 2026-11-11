import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerFeatureFlags } from "@/lib/config";

let cached: SupabaseClient | null = null;

/** Client serveur uniquement (service role si dispo, sinon anon). */
export function getSupabaseAdmin(): SupabaseClient | null {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) return null;
  if (cached) return cached;

  const url = process.env.SUPABASE_URL!.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
