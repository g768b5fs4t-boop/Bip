"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeatureFlags } from "@/lib/config";
import { useAppStore } from "@/lib/store";

export default function ConnexionPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const loginLocalDemo = useAppStore((s) => s.loginLocalDemo);
  const syncSession = useAppStore((s) => s.syncSession);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    void fetch("/api/features")
      .then((r) => r.json())
      .then((f: FeatureFlags) => setFeatures(f))
      .catch(() => setFeatures(null));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const ok = await syncSession();
      if (ok) router.replace("/app");
    })();
  }, [hydrated, syncSession, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/app");
  }, [hydrated, isAuthenticated, router]);

  async function enterCloud(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login({ email, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Erreur de connexion");
      return;
    }
    router.push("/app");
  }

  async function enterLocal() {
    setBusy(true);
    setError(null);
    const res = await loginLocalDemo();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Démo locale indisponible");
      return;
    }
    router.push("/app");
  }

  const supabaseReady = Boolean(features?.supabaseConfigured);
  const localDemoAllowed = Boolean(features?.localDemoAllowed);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-3xl text-brand-deep">
        DevisRapide IA
      </Link>
      <h1 className="mt-6 text-xl font-semibold">Connexion</h1>
      <p className="mt-2 text-sm text-muted">
        {supabaseReady
          ? "Connectez-vous à votre espace entreprise (données isolées par compte)."
          : "Mode démo locale : vos données restent sur cet appareil."}
      </p>

      <div className="panel mt-6 space-y-4 p-5">
        {error && <p className="text-sm text-accent">{error}</p>}

        {supabaseReady && (
          <form className="space-y-3" onSubmit={(e) => void enterCloud(e)}>
            <label className="block text-sm">
              E-mail
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Mot de passe
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Connexion…" : "Se connecter"}
            </button>
            <Link href="/inscription" className="block text-center text-sm text-brand-deep">
              Créer un compte artisan
            </Link>
          </form>
        )}

        {localDemoAllowed && (
          <button
            type="button"
            className={
              supabaseReady ? "btn-secondary w-full" : "btn-primary w-full"
            }
            disabled={busy}
            onClick={() => void enterLocal()}
          >
            {busy ? "Ouverture…" : "Entrer dans l’espace"}
          </button>
        )}

        {!supabaseReady && !localDemoAllowed && (
          <p className="text-sm text-muted">
            Configurez Supabase ou ouvrez l’app en local pour continuer.
          </p>
        )}
      </div>

      {localDemoAllowed && (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-white/60 p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Démo locale</p>
          <p className="mt-1">
            Disponible hors production Vercel (dev / tests). En production, un
            compte e-mail est requis — la démo ouverte est désactivée.
          </p>
        </div>
      )}
    </main>
  );
}
