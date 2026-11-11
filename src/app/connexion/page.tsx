"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { DEMO_LOGIN_HINT } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

export default function ConnexionPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const [email, setEmail] = useState<string>(DEMO_LOGIN_HINT.email);
  const [password, setPassword] = useState<string>(DEMO_LOGIN_HINT.password);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/app");
  }, [hydrated, isAuthenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Erreur de connexion");
      return;
    }
    router.push("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-3xl text-brand-deep">
        DevisRapide IA
      </Link>
      <h1 className="mt-6 text-xl font-semibold">Connexion (démo)</h1>
      <p className="mt-2 text-sm text-muted">
        Compte fictif inclus — aucun service payant requis pour tester.
      </p>

      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 p-5">
        <label className="block text-sm">
          E-mail
          <input
            className="input mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          Mot de passe
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Connexion…" : "Entrer dans l’espace"}
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-dashed border-line bg-white/60 p-4 text-xs text-muted">
        <p className="font-semibold text-ink">Identifiants démo</p>
        <p className="mt-1">
          {DEMO_LOGIN_HINT.email} / {DEMO_LOGIN_HINT.password}
        </p>
        <p className="mt-2">
          La session est vérifiée côté serveur. Plus tard : Supabase Auth pour
          de vrais comptes artisans.
        </p>
      </div>
    </main>
  );
}
