"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import type { QuoteStatus } from "@/lib/types";

const STATUSES: Array<QuoteStatus | "tous"> = [
  "tous",
  "brouillon",
  "valide",
  "envoye",
  "accepte",
  "refuse",
  "archive",
];

export default function DevisPage() {
  const { quotes, clients } = useAppStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "tous">("tous");
  const [clientId, setClientId] = useState<string>("tous");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("client");
    if (c) setClientId(c);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...quotes]
      .filter((quote) => (status === "tous" ? true : quote.status === status))
      .filter((quote) =>
        clientId === "tous" ? true : quote.clientId === clientId,
      )
      .filter((quote) => {
        if (!needle) return true;
        const client = clients.find((c) => c.id === quote.clientId);
        return (
          quote.number.toLowerCase().includes(needle) ||
          (client?.name ?? "").toLowerCase().includes(needle) ||
          (quote.notes ?? "").toLowerCase().includes(needle)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [quotes, clients, q, status, clientId]);

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title="Devis"
        subtitle="Historique, filtres, PDF et suivi de statut — hors assistant conversationnel."
        actions={
          <Link href="/app/creer" className="btn-primary">
            Créer un devis
          </Link>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Recherche
          <input
            className="input mt-1"
            placeholder="N° devis, client, notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Statut
          <select
            className="input mt-1"
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteStatus | "tous")}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "tous" ? "Tous les statuts" : s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Client
          <select
            className="input mt-1"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="tous">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun devis"
            description="Créez un devis en 3 étapes ou via l’assistant, puis suivez-le ici."
            action={
              <Link href="/app/creer" className="btn-primary">
                Créer un devis
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((quote) => {
            const client = clients.find((c) => c.id === quote.clientId);
            const totals = computeQuoteTotals(quote.lines);
            return (
              <li
                key={quote.id}
                className="panel flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-brand-deep">{quote.number}</p>
                    <StatusBadge status={quote.status} />
                  </div>
                  <p className="text-sm text-muted">
                    {client?.name ?? "Client"} ·{" "}
                    {new Date(quote.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                    {quote.lines.length} ligne(s)
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatEuro(totals.totalTtc)} TTC
                  </p>
                </div>
                <Link href={`/app/devis/${quote.id}`} className="btn-secondary">
                  Ouvrir
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
