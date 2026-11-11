"use client";

import { useMemo, useState } from "react";
import { VoiceDictation } from "@/components/VoiceDictation";
import { EmptyState, PageHeader, StatusBadge, Toast } from "@/components/ui";
import { formatEuro } from "@/lib/money";
import { computeQuoteTotals, lineTotalHt } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import type { Quote } from "@/lib/types";

type Step = 1 | 2 | 3;

export default function CreerDevisPage() {
  const {
    company,
    products,
    clients,
    quotes,
    setDraftQuote,
    validateQuote,
    saveQuote,
  } = useAppStore();
  const [step, setStep] = useState<Step>(1);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const totals = useMemo(
    () => (quote ? computeQuoteTotals(quote.lines) : null),
    [quote],
  );

  async function analyze() {
    if (!text.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          company,
          products,
          clients,
          quotes,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        quote?: Quote;
        assistantMessage?: string;
        provider?: string;
        notice?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Échec analyse");
      setProvider(data.provider ?? null);
      if (data.notice) setNotice(data.notice);
      if (data.quote) {
        setQuote(data.quote);
        setDraftQuote(data.quote);
        const client = clients.find((c) => c.id === data.quote!.clientId);
        if (client?.email) setEmailTo(client.email);
        setStep(2);
      } else {
        setNotice(data.assistantMessage || "Informations manquantes.");
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  function updateLineQty(lineId: string, quantity: number) {
    if (!quote || !(quantity > 0)) return;
    const next = {
      ...quote,
      lines: quote.lines.map((l) =>
        l.id === lineId ? { ...l, quantity } : l,
      ),
    };
    setQuote(next);
    setDraftQuote(next);
  }

  async function shareOrDownloadPdf() {
    if (!quote) return;
    const client = clients.find((c) => c.id === quote.clientId);
    if (!client) return;
    const t = computeQuoteTotals(quote.lines);
    const res = await fetch("/api/devis/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, client, quote, totals: t }),
    });
    if (!res.ok) {
      setEmailMsg("PDF impossible.");
      return;
    }
    const blob = await res.blob();
    const file = new File([blob], `${quote.number}.pdf`, {
      type: "application/pdf",
    });
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        files: [file],
        title: quote.number,
        text: `Devis ${quote.number}`,
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendEmail() {
    if (!quote || !emailTo) return;
    setEmailMsg(null);
    const client = clients.find((c) => c.id === quote.clientId);
    const t = totals!;
    const res = await fetch("/api/devis/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmed: true,
        to: emailTo,
        quoteNumber: quote.number,
        subject: `Devis ${quote.number} — ${company.name}`,
        html: `<p>Bonjour ${client?.name ?? ""},</p><p>Veuillez trouver le devis <strong>${quote.number}</strong> d'un montant de <strong>${formatEuro(t.totalTtc)}</strong> TTC.</p><p>Cordialement,<br/>${company.name}</p>`,
      }),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      setEmailMsg(data.error || "Envoi impossible");
      return;
    }
    const sent = { ...quote, status: "envoye" as const };
    setQuote(sent);
    saveQuote(sent);
    setEmailMsg("E-mail accepté par le serveur d’envoi.");
  }

  return (
    <div id="contenu-principal" className="mx-auto max-w-3xl space-y-4 p-4 pb-28 lg:p-6">
      <PageHeader
        title="Créer un devis"
        subtitle="Objectif : décrire → vérifier → envoyer en moins de 2 minutes."
      />

      <ol className="flex gap-2 text-xs font-semibold">
        {[1, 2, 3].map((s) => (
          <li
            key={s}
            className={`flex-1 rounded-xl px-3 py-2 text-center ${
              step === s
                ? "bg-brand text-white"
                : "bg-[color:var(--bg-elevated)] text-muted border border-line"
            }`}
          >
            {s === 1 ? "1. Décrire" : s === 2 ? "2. Vérifier" : "3. Envoyer"}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="panel space-y-4 p-4">
          <label className="block text-sm font-medium" htmlFor="need">
            Décrivez ou dictez le devis
          </label>
          <textarea
            id="need"
            className="input min-h-[140px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex. Devis pour Monsieur Martin, remplacement moteur MOT123, 2 télécommandes TEL456, 3 h de pose et déplacement 150 €"
          />
          <VoiceDictation
            onTranscript={(t) =>
              setText((prev) => (prev ? `${prev.trim()} ${t}` : t))
            }
          />
          {notice && <Toast tone="warn">{notice}</Toast>}
          {provider && (
            <p className="text-xs text-muted">
              Moteur : {provider === "openai" ? "IA OpenAI (serveur)" : "parser déterministe (sans clé API)"}
            </p>
          )}
          <button
            type="button"
            className="btn-primary w-full py-3 text-base"
            disabled={busy || !text.trim()}
            onClick={() => void analyze()}
          >
            {busy ? "Analyse…" : "Préparer le devis"}
          </button>
        </section>
      )}

      {step === 2 && quote && totals && (
        <section className="panel space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-display text-xl text-brand-deep">{quote.number}</p>
              <p className="text-sm text-muted">
                {clients.find((c) => c.id === quote.clientId)?.name}
              </p>
            </div>
            <StatusBadge status={quote.status} />
          </div>
          <ul className="space-y-3">
            {quote.lines.map((line) => (
              <li
                key={line.id}
                className="rounded-xl border border-line p-3 text-sm"
              >
                <p className="font-medium">
                  {line.reference ? `[${line.reference}] ` : ""}
                  {line.designation}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="text-xs text-muted">
                    Qté
                    <input
                      className="input ml-2 w-20 py-1"
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLineQty(line.id, Number(e.target.value))
                      }
                    />
                  </label>
                  <span>{formatEuro(line.unitPriceHt)} HT</span>
                  <span className="ml-auto font-semibold">
                    {formatEuro(lineTotalHt(line))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-[color:var(--chip)] p-3 text-sm">
            <div className="flex justify-between">
              <span>Total HT</span>
              <span>{formatEuro(totals.totalHt)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>TVA</span>
              <span>{formatEuro(totals.totalVat)}</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-semibold text-brand-deep">
              <span>Total TTC</span>
              <span>{formatEuro(totals.totalTtc)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>
              Retour
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => {
                validateQuote(quote.id);
                setQuote({ ...quote, status: "valide" });
                setStep(3);
              }}
            >
              Valider
            </button>
          </div>
        </section>
      )}

      {step === 2 && !quote && (
        <EmptyState
          title="Rien à vérifier"
          description="Revenez à l’étape 1 et précisez client + références catalogue."
        />
      )}

      {step === 3 && quote && totals && (
        <section className="panel space-y-4 p-4">
          <p className="text-sm">
            Devis <strong>{quote.number}</strong> —{" "}
            {formatEuro(totals.totalTtc)} TTC
          </p>
          <button
            type="button"
            className="btn-primary w-full py-3"
            onClick={() => void shareOrDownloadPdf()}
          >
            PDF / partage mobile
          </button>
          <div className="space-y-2 border-t border-line pt-4">
            <label className="block text-sm" htmlFor="mail-to">
              Envoyer par e-mail (validation explicite)
              <input
                id="mail-to"
                className="input mt-1"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => void sendEmail()}
            >
              Confirmer l’envoi e-mail
            </button>
            {emailMsg && <Toast tone="info">{emailMsg}</Toast>}
          </div>
          <button type="button" className="btn-secondary w-full" onClick={() => setStep(1)}>
            Nouveau devis
          </button>
        </section>
      )}
    </div>
  );
}
