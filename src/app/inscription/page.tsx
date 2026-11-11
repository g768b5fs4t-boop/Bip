"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeatureFlags } from "@/lib/config";
import { Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function InscriptionPage() {
  const router = useRouter();
  const syncSession = useAppStore((s) => s.syncSession);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    void fetch("/api/features")
      .then((r) => r.json())
      .then((f: FeatureFlags) => setFeatures(f));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, companyName }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsEmailConfirmation?: boolean;
      };
      if (!res.ok && res.status !== 201) {
        setError(data.error || "Inscription impossible.");
        setBusy(false);
        return;
      }
      if (data.needsEmailConfirmation) {
        setError(
          "Compte créé : confirmez votre e-mail puis connectez-vous.",
        );
        setBusy(false);
        return;
      }
      await syncSession();
      router.push("/app");
    } catch {
      setError("Inscription impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-3xl text-brand-deep">
        DevisRapide IA
      </Link>
      <h1 className="mt-6 text-xl font-semibold">Créer un compte artisan</h1>
      <p className="mt-2 text-sm text-muted">
        Chaque compte possède son entreprise isolée (clients, catalogue, devis).
      </p>

      <div className="panel mt-6 space-y-3 p-5 text-sm">
        {!features ? (
          <p className="text-muted">Vérification de la configuration…</p>
        ) : features.supabaseConfigured ? (
          <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
            {error && <p className="text-accent">{error}</p>}
            <label className="block">
              Votre nom
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              Nom de l’entreprise
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label className="block">
              E-mail
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              Mot de passe (8 caractères min.)
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Création…" : "Créer mon compte"}
            </button>
            <Link href="/connexion" className="block text-center text-brand-deep">
              Déjà un compte ? Se connecter
            </Link>
          </form>
        ) : (
          <>
            <Toast tone="warn">
              Supabase n’est pas encore configuré. La démo locale reste
              utilisable sans compte cloud.
            </Toast>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>Créer un projet gratuit sur supabase.com</li>
              <li>
                Exécuter `supabase/migrations/001_init.sql` puis `002_vat_rates_grants.sql`
              </li>
              <li>
                Renseigner `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
                `SUPABASE_SECRET_KEY` (Vercel)
              </li>
            </ol>
            <Link href="/connexion" className="btn-primary inline-flex">
              Continuer en mode démo locale
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
