"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Toast } from "@/components/ui";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import type { Quote, QuoteStatus } from "@/lib/types";

const NEXT_STATUSES: { status: QuoteStatus; label: string }[] = [
  { status: "brouillon", label: "Brouillon" },
  { status: "valide", label: "Validé" },
  { status: "envoye", label: "Envoyé" },
  { status: "accepte", label: "Accepté" },
  { status: "refuse", label: "Refusé" },
  { status: "archive", label: "Archivé" },
];

export function QuoteActions({ quote }: { quote: Quote }) {
  const router = useRouter();
  const {
    company,
    clients,
    setQuoteStatus,
    deleteQuote,
  } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "warn" | "error" | "info">("info");
  const [emailTo, setEmailTo] = useState(
    () => clients.find((c) => c.id === quote.clientId)?.email ?? "",
  );
  const [showEmail, setShowEmail] = useState(false);

  const client = clients.find((c) => c.id === quote.clientId);
  const totals = computeQuoteTotals(quote.lines);

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
        body: JSON.stringify({ company, client, quote, totals }),
      });
      if (!res.ok) {
        setTone("error");
        setMessage("Impossible de générer le PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setTone("ok");
      setMessage("PDF téléchargé.");
    } catch {
      setTone("error");
      setMessage("Échec PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    if (!emailTo.trim()) {
      setTone("error");
      setMessage("Indiquez l’e-mail du destinataire.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/devis/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          to: emailTo.trim(),
          subject: `Devis ${quote.number} — ${company.name}`,
          quoteNumber: quote.number,
          html: `<p>Bonjour,</p><p>Veuillez trouver le devis <strong>${quote.number}</strong> pour un montant de <strong>${formatEuro(totals.totalTtc)} TTC</strong>.</p><p>${company.name}</p>`,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setTone("warn");
        setMessage(data.error || "Envoi e-mail indisponible.");
        return;
      }
      setQuoteStatus(quote.id, "envoye");
      setTone("ok");
      setMessage("E-mail envoyé (statut passé à Envoyé).");
      setShowEmail(false);
    } catch {
      setTone("error");
      setMessage("Échec d’envoi.");
    } finally {
      setBusy(false);
    }
  }

  async function shareNative() {
    if (!navigator.share) {
      setTone("warn");
      setMessage("Partage natif non disponible sur cet appareil.");
      return;
    }
    try {
      await navigator.share({
        title: `Devis ${quote.number}`,
        text: `${quote.number} — ${formatEuro(totals.totalTtc)} TTC`,
      });
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void exportPdf()}
        >
          Télécharger PDF
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => setShowEmail((v) => !v)}
        >
          Envoyer par e-mail
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void shareNative()}
        >
          Partager
        </button>
        <button
          type="button"
          className="btn-secondary text-accent"
          onClick={() => {
            if (confirm(`Supprimer le devis ${quote.number} ?`)) {
              deleteQuote(quote.id);
              router.push("/app/devis");
            }
          }}
        >
          Supprimer
        </button>
      </div>

      <label className="block text-sm">
        Statut
        <select
          className="input mt-1 max-w-xs"
          value={quote.status}
          onChange={(e) =>
            setQuoteStatus(quote.id, e.target.value as QuoteStatus)
          }
        >
          {NEXT_STATUSES.map((s) => (
            <option key={s.status} value={s.status}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {showEmail && (
        <div className="panel space-y-2 p-3">
          <p className="text-xs text-muted">
            Confirmation requise — aucun envoi automatique. Nécessite Resend
            configuré.
          </p>
          <input
            className="input"
            type="email"
            placeholder="destinataire@email.fr"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void sendEmail()}
          >
            Confirmer l’envoi
          </button>
        </div>
      )}

      {message && <Toast tone={tone}>{message}</Toast>}
    </div>
  );
}
