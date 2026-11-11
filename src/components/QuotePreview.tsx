"use client";

import { formatEuro } from "@/lib/money";
import { computeQuoteTotals, lineTotalHt } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { useState } from "react";
import { EmptyState, StatusBadge, Toast } from "./ui";

export function QuotePreview({ quote }: { quote: Quote | null }) {
  const { company, clients, validateQuote } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "ok" | "warn" | "error">("info");

  if (!quote) {
    return (
      <div className="panel flex h-full flex-col p-5">
        <h2 className="font-display text-xl text-brand-deep">Aperçu du devis</h2>
        <div className="mt-4">
          <EmptyState
            title="Aucun brouillon"
            description="Demandez un devis dans le chat. Les totaux HT / TVA / TTC apparaîtront ici avant validation."
          />
        </div>
      </div>
    );
  }

  const client = clients.find((c) => c.id === quote.clientId);
  const totals = computeQuoteTotals(quote.lines);
  const current = quote;

  async function exportPdf() {
    if (!client) {
      setTone("error");
      setMessage("Client introuvable pour ce devis.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/devis/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          client,
          quote: current,
          totals,
        }),
      });
      if (res.status === 401) {
        setTone("warn");
        setMessage("Session expirée : reconnectez-vous pour exporter le PDF.");
        return;
      }
      if (res.status === 429) {
        setTone("warn");
        setMessage("Trop de demandes PDF : patientez une minute.");
        return;
      }
      if (!res.ok) throw new Error("PDF impossible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${current.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setTone("ok");
      setMessage("PDF téléchargé. L’envoi e-mail reste manuel.");
    } catch {
      setTone("error");
      setMessage("Échec de la génération PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden" aria-label="Aperçu du devis">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-brand-deep">
              {quote.number}
            </h2>
            <p className="text-xs text-muted">
              Valide jusqu’au{" "}
              {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <StatusBadge status={quote.status} />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-5 py-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Client
          </p>
          <p className="font-medium">{client?.name ?? "—"}</p>
          <p className="text-muted">
            {[client?.address, client?.postalCode, client?.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Lignes du devis {quote.number}</caption>
            <thead className="bg-[#f4f8f8] text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Désignation
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Qté
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  P.U. HT
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr key={line.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    {line.reference && (
                      <span className="mr-1 font-mono text-[10px] text-brand">
                        {line.reference}
                      </span>
                    )}
                    {line.designation}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {formatEuro(line.unitPriceHt)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatEuro(lineTotalHt(line))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 rounded-xl bg-[#f4f8f8] p-3">
          <div className="flex justify-between">
            <span>Total HT</span>
            <span className="font-medium">{formatEuro(totals.totalHt)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>TVA</span>
            <span>{formatEuro(totals.totalVat)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-brand-deep">
            <span>Total TTC</span>
            <span>{formatEuro(totals.totalTtc)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-line p-4">
        <button
          type="button"
          className="btn-primary w-full"
          disabled={quote.status === "valide"}
          onClick={() => {
            validateQuote(quote.id);
            setTone("ok");
            setMessage(
              "Devis validé. L’envoi e-mail reste manuel — l’IA n’envoie rien seule.",
            );
          }}
        >
          {quote.status === "valide" ? "Devis déjà validé" : "Valider le devis"}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={busy}
          onClick={() => void exportPdf()}
        >
          {busy ? "Génération…" : "Exporter en PDF"}
        </button>
        {message && <Toast tone={tone}>{message}</Toast>}
      </div>
    </div>
  );
}
