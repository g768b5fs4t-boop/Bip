import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getServerFeatureFlags,
  getSupabaseSecretKey,
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/config";

let cachedAdmin: SupabaseClient | null = null;

/** Client serveur privilégié (secret/service_role). Jamais exposé au navigateur. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const flags = getServerFeatureFlags();
  if (!flags.supabaseConfigured) return null;
  if (cachedAdmin) return cachedAdmin;

  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) return null;

  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

/** Client lié au JWT utilisateur — RLS appliquée. */
export function getSupabaseForUser(accessToken: string): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey() || getSupabaseSecretKey();
  if (!url || !key || !accessToken) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
