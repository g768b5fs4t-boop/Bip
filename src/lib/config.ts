/** Configuration runtime — jamais de secrets dans le bundle client. */

export type FeatureFlags = {
  supabaseConfigured: boolean;
  openaiConfigured: boolean;
  whisperConfigured: boolean;
  resendConfigured: boolean;
  mode: "local-demo" | "hybrid" | "saas";
};

export function getServerFeatureFlags(): FeatureFlags {
  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_ANON_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  );
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const whisperConfigured = openaiConfigured; // même clé, endpoint audio
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  let mode: FeatureFlags["mode"] = "local-demo";
  if (supabaseConfigured && openaiConfigured) mode = "saas";
  else if (supabaseConfigured || openaiConfigured) mode = "hybrid";

  return {
    supabaseConfigured,
    openaiConfigured,
    whisperConfigured,
    resendConfigured,
    mode,
  };
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
