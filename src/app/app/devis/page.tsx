"use client";

import { formatEuro } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function DevisPage() {
  const { quotes, clients, setDraftQuote, setActiveConversation, conversations } =
    useAppStore();

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="font-display text-3xl text-brand-deep">Devis</h1>
      <p className="mt-1 text-sm text-muted">
        Historique des brouillons et devis validés. L’envoi e-mail nécessite
        toujours votre accord.
      </p>

      {quotes.length === 0 ? (
        <div className="panel mt-6 p-6 text-sm text-muted">
          Aucun devis pour l’instant.{" "}
          <Link href="/app" className="font-semibold text-brand">
            Ouvrir l’assistant
          </Link>{" "}
          pour en créer un par conversation.
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
                <li key={q.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-brand-deep">{q.number}</p>
                    <p className="text-sm text-muted">
                      {client?.name ?? "Client"} ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                      {q.status}
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
