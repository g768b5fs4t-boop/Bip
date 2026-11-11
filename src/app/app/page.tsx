"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatChip, StatusBadge } from "@/components/ui";
import type { FeatureFlags } from "@/lib/config";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { quotes, clients, products, company } = useAppStore();
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    void fetch("/api/features")
      .then((r) => r.json())
      .then((f: FeatureFlags) => setFeatures(f))
      .catch(() => setFeatures(null));
  }, []);

  const stats = useMemo(() => {
    const drafts = quotes.filter((q) => q.status === "brouillon").length;
    const sent = quotes.filter((q) => q.status === "envoye").length;
    const accepted = quotes.filter((q) => q.status === "accepte").length;
    const pending = quotes.filter((q) =>
      ["valide", "envoye"].includes(q.status),
    );
    const total = quotes.reduce(
      (s, q) => s + computeQuoteTotals(q.lines).totalTtc,
      0,
    );
    return { drafts, sent, accepted, pending, total };
  }, [quotes]);

  const recentClients = clients.slice(0, 4);
  const recentQuotes = [...quotes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div id="contenu-principal" className="space-y-5 p-4 pb-28 lg:p-6">
      <PageHeader
        title={company.name}
        subtitle="Tableau de bord — créez un devis en moins de deux minutes."
        actions={
          <Link href="/app/creer" className="btn-primary px-5 py-3 text-base">
            Créer un devis
          </Link>
        }
      />

      {features && (
        <p className="rounded-xl border border-line bg-[color:var(--bg-elevated)] px-3 py-2 text-xs text-muted">
          Mode {features.mode}
          {" · "}
          IA {features.openaiConfigured ? "OpenAI prête" : "parser local"}
          {" · "}
          Supabase {features.supabaseConfigured ? "configuré" : "non branché (données locales)"}
          {" · "}
          E-mail {features.resendConfigured ? "Resend prêt" : "non configuré"}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip label="Brouillons" value={stats.drafts} />
        <StatChip label="Envoyés" value={stats.sent} />
        <StatChip label="Acceptés" value={stats.accepted} />
        <StatChip label="Volume TTC" value={formatEuro(stats.total)} />
      </div>

      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-brand-deep">Devis récents</h2>
          <Link href="/app/devis" className="text-xs font-semibold text-brand">
            Tout voir
          </Link>
        </div>
        {recentQuotes.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun devis.{" "}
            <Link href="/app/creer" className="font-semibold text-brand">
              Créer le premier
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {recentQuotes.map((q) => {
              const client = clients.find((c) => c.id === q.clientId);
              const t = computeQuoteTotals(q.lines);
              return (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{q.number}</p>
                    <p className="text-xs text-muted">{client?.name}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={q.status} />
                    <p className="mt-1 text-xs font-semibold">
                      {formatEuro(t.totalTtc)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="panel p-4">
          <h2 className="font-display text-lg text-brand-deep">Clients récents</h2>
          <p className="mt-1 text-xs text-muted">{clients.length} au total</p>
          <ul className="mt-3 space-y-1 text-sm">
            {recentClients.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
          <Link href="/app/clients" className="mt-3 inline-block text-xs font-semibold text-brand">
            Gérer les clients
          </Link>
        </div>
        <div className="panel p-4">
          <h2 className="font-display text-lg text-brand-deep">Catalogue</h2>
          <p className="mt-1 text-sm text-muted">
            {products.length} références · prêts pour l’IA
          </p>
          <Link href="/app/produits" className="mt-3 inline-block text-xs font-semibold text-brand">
            Ouvrir le catalogue
          </Link>
          <Link href="/app" className="mt-2 block text-xs font-semibold text-brand">
            Assistant conversationnel
          </Link>
        </div>
      </section>
    </div>
  );
}
