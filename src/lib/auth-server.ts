import { getIdentity } from "../../cursor/identity";

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
  source: "cursor" | "local-sim" | "vercel-open";
};

/**
 * Autorise l’accès API :
 * - Identité Cursor vérifiée (app privée/équipe publiée)
 * - Visiteur simulé en local (dev, hors Vercel / hors CURSOR_APP_ID)
 * - Démo ouverte uniquement sur Vercel sans gate Cursor (prévisualisation)
 */
export async function resolveViewer(request: Request): Promise<AppViewer | null> {
  const identity = await getIdentity(request);
  if (identity.verified) {
    return {
      email: identity.email || "viewer@cursor",
      name: identity.name || "Utilisateur",
      source: identity.simulated ? "local-sim" : "cursor",
    };
  }

  // Hébergement Vercel hors Cursor Apps : démo ouverte (pas de secret embarqué)
  if (process.env.VERCEL && !process.env.CURSOR_APP_ID) {
    return {
      email: "demo@devisrapide.app",
      name: "Visiteur démo",
      source: "vercel-open",
    };
  }

  return null;
}
