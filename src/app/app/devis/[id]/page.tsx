"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QuoteActions } from "@/components/QuoteActions";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals, lineTotalHt } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";

export default function DevisDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { quotes, clients, company } = useAppStore();
  const quote = quotes.find((q) => q.id === params.id);

  if (!quote) {
    return (
      <div className="p-6">
        <EmptyState
          title="Devis introuvable"
          description="Il a peut‑être été supprimé."
          action={
            <Link href="/app/devis" className="btn-primary">
              Retour à la liste
            </Link>
          }
        />
      </div>
    );
  }

  const client = clients.find((c) => c.id === quote.clientId);
  const totals = computeQuoteTotals(quote.lines);

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title={quote.number}
        subtitle={`${client?.name ?? "Client"} · créé le ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}`}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/app/devis")}
          >
            Liste
          </button>
        }
      />

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={quote.status} />
        <span className="text-xs text-muted">
          Valide jusqu’au{" "}
          {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
        </span>
      </div>

      <section className="panel mt-6 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Client
        </h2>
        <p className="mt-1 font-medium">{client?.name ?? "—"}</p>
        <p className="text-sm text-muted">
          {[client?.address, client?.postalCode, client?.city]
            .filter(Boolean)
            .join(", ") || "Adresse non renseignée"}
        </p>
        <p className="text-sm text-muted">
          {[client?.phone, client?.email].filter(Boolean).join(" · ") || "—"}
        </p>
      </section>

      <section className="panel mt-4 overflow-x-auto p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Lignes
        </h2>
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3">Désignation</th>
              <th className="py-2 pr-3">Qté</th>
              <th className="py-2 pr-3">P.U. HT</th>
              <th className="py-2 pr-3">TVA</th>
              <th className="py-2">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.id} className="border-t border-line">
                <td className="py-2 pr-3">
                  <p>{line.designation}</p>
                  {line.reference && (
                    <p className="font-mono text-[11px] text-brand">
                      {line.reference}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-3">
                  {line.quantity} {line.unit}
                </td>
                <td className="py-2 pr-3">{formatEuro(line.unitPriceHt)}</td>
                <td className="py-2 pr-3">{line.vatRate} %</td>
                <td className="py-2 font-medium">
                  {formatEuro(lineTotalHt(line))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel mt-4 space-y-1 p-4 text-sm">
        <div className="flex justify-between">
          <span>Total HT</span>
          <span>{formatEuro(totals.totalHt)}</span>
        </div>
        <div className="flex justify-between">
          <span>TVA</span>
          <span>{formatEuro(totals.totalVat)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-brand-deep">
          <span>Total TTC</span>
          <span>{formatEuro(totals.totalTtc)}</span>
        </div>
        <p className="pt-2 text-xs text-muted">
          Émetteur : {company.name} · {company.siret || "SIRET à compléter"}
        </p>
        {quote.notes && (
          <p className="pt-2 text-xs text-muted">Notes : {quote.notes}</p>
        )}
      </section>

      <section className="mt-6">
        <QuoteActions quote={quote} />
      </section>
    </div>
  );
}
