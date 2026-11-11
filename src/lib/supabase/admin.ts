import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getServerFeatureFlags,
  getSupabaseSecretKey,
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/config";

let cached: SupabaseClient | null = null;

/** Client serveur uniquement (secret/service_role si dispo, sinon publishable/anon). */
export function getSupabaseAdmin(): SupabaseClient | null {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) return null;
  if (cached) return cached;

  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey() || getSupabasePublishableKey() || "";
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
