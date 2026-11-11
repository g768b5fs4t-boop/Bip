"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeatureFlags } from "@/lib/config";
import { Toast } from "@/components/ui";

export default function InscriptionPage() {
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    void fetch("/api/features")
      .then((r) => r.json())
      .then((f: FeatureFlags) => setFeatures(f));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-3xl text-brand-deep">
        DevisRapide IA
      </Link>
      <h1 className="mt-6 text-xl font-semibold">Créer un compte artisan</h1>
      <p className="mt-2 text-sm text-muted">
        L’inscription multi-entreprises nécessite Supabase (Auth + Postgres + RLS).
      </p>

      <div className="panel mt-6 space-y-3 p-5 text-sm">
        {!features ? (
          <p className="text-muted">Vérification de la configuration…</p>
        ) : features.supabaseConfigured ? (
          <>
            <Toast tone="ok">
              Supabase est détecté côté serveur. Branchez le flux Auth (e-mail /
              magic link) dans le tableau de bord Supabase, puis utilisez la page
              connexion.
            </Toast>
            <p>
              SQL à appliquer : <code>supabase/migrations/001_init.sql</code>
            </p>
            <Link href="/connexion" className="btn-primary inline-flex">
              Aller à la connexion
            </Link>
          </>
        ) : (
          <>
            <Toast tone="warn">
              Supabase n’est pas encore configuré. La démo locale reste
              utilisable sans compte cloud.
            </Toast>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>Créer un projet gratuit sur supabase.com</li>
              <li>Exécuter le SQL de `supabase/migrations/001_init.sql`</li>
              <li>
                Renseigner `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
                `SUPABASE_SECRET_KEY` (Vercel / secrets Cursor)
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
