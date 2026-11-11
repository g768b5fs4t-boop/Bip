"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export default function ConnexionPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const syncSession = useAppStore((s) => s.syncSession);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

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

  async function enter() {
    setBusy(true);
    setError(null);
    const res = await login();
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
      <h1 className="mt-6 text-xl font-semibold">Accéder à la démo</h1>
      <p className="mt-2 text-sm text-muted">
        Aucun mot de passe à saisir : la session est ouverte via Cursor (app
        privée) ou en mode démo sur le lien de test.
      </p>

      <div className="panel mt-6 space-y-4 p-5">
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="button"
          className="btn-primary w-full"
          disabled={busy}
          onClick={() => void enter()}
        >
          {busy ? "Ouverture…" : "Entrer dans l’espace"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-line bg-white/60 p-4 text-xs text-muted">
        <p className="font-semibold text-ink">Comment tester</p>
        <p className="mt-1">
          1) Ouvrez le lien de démo fourni dans le chat, ou 2) l’app Cursor
          publiée après mise à jour. Puis cliquez sur le bouton ci-dessus.
        </p>
      </div>
    </main>
  );
}
