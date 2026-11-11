"use client";

import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";

export default function DevisPage() {
  const {
    quotes,
    clients,
    setDraftQuote,
    setActiveConversation,
    conversations,
  } = useAppStore();

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 lg:p-6">
      <PageHeader
        title="Devis"
        subtitle="Historique des brouillons et devis validés. L’envoi e-mail nécessite toujours votre accord."
        actions={
          <Link href="/app" className="btn-primary">
            Nouvel assistant
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun devis pour l’instant"
            description="Ouvrez l’assistant et décrivez un chantier avec des références catalogue."
            action={
              <Link href="/app" className="btn-primary">
                Ouvrir l’assistant
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {[...quotes]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((q) => {
              const client = clients.find((c) => c.id === q.clientId);
              const totals = computeQuoteTotals(q.lines);
              return (
                <li
                  key={q.id}
                  className="panel flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-deep">{q.number}</p>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-sm text-muted">
                      {client?.name ?? "Client"} ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatEuro(totals.totalTtc)} TTC
                    </p>
                  </div>
                  <Link
                    href="/app"
                    className="btn-secondary"
                    onClick={() => {
                      setDraftQuote(q);
                      const conv = conversations.find(
                        (c) => c.draftQuoteId === q.id,
                      );
                      if (conv) setActiveConversation(conv.id);
                    }}
                  >
                    Voir l’aperçu
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
