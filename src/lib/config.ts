/** Configuration runtime — jamais de secrets dans le bundle client. */

export type FeatureFlags = {
  supabaseConfigured: boolean;
  openaiConfigured: boolean;
  whisperConfigured: boolean;
  resendConfigured: boolean;
  localDemoAllowed: boolean;
  mode: "local-demo" | "hybrid" | "saas";
};

/** Clés Supabase : legacy (anon/service_role) ou nouvelles (publishable/secret). */
export function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL?.trim() || undefined;
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

export function getSupabaseSecretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    undefined
  );
}

export function getServerFeatureFlags(): FeatureFlags {
  const supabaseConfigured = Boolean(
    getSupabaseUrl() &&
      (getSupabasePublishableKey() || getSupabaseSecretKey()),
  );
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const whisperConfigured = openaiConfigured; // même clé, endpoint audio
  const resendConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );

  let mode: FeatureFlags["mode"] = "local-demo";
  if (supabaseConfigured && openaiConfigured) mode = "saas";
  else if (supabaseConfigured || openaiConfigured) mode = "hybrid";

  return {
    supabaseConfigured,
    openaiConfigured,
    whisperConfigured,
    resendConfigured,
    localDemoAllowed: process.env.VERCEL !== "1",
    mode,
  };
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
