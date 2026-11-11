"use client";

import { buildQuoteFromRequest } from "@/lib/ai-parser";
import { formatAssistantText } from "@/lib/format-message";
import { computeQuoteTotals, createId } from "@/lib/quote-engine";
import { formatEuro } from "@/lib/money";
import { useAppStore } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "./ui";

const SUGGESTION =
  "Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.";

export function ChatPanel() {
  const {
    company,
    products,
    clients,
    quotes,
    conversations,
    activeConversationId,
    addMessage,
    setDraftQuote,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length, thinking]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || !conversation || thinking) return;
    setInput("");
    setError(null);
    setThinking(true);

    addMessage(conversation.id, {
      id: createId("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });

    await new Promise((r) => setTimeout(r, 350));

    try {
      const result = buildQuoteFromRequest({
        message: content,
        company,
        products: products.filter((p) => p.companyId === company.id),
        clients: clients.filter((c) => c.companyId === company.id),
        existingQuotes: quotes,
      });

      if (result.quote) {
        setDraftQuote(result.quote, conversation.id);
      }

      let contentOut = result.assistantMessage;
      if (result.quote) {
        const totals = computeQuoteTotals(result.quote.lines);
        contentOut += `\n\nTotaux calculés : HT ${formatEuro(totals.totalHt)} · TVA ${formatEuro(totals.totalVat)} · TTC ${formatEuro(totals.totalTtc)}`;
      }

      addMessage(conversation.id, {
        id: createId("msg"),
        role: "assistant",
        content: contentOut,
        createdAt: new Date().toISOString(),
        quoteDraftId: result.quote?.id,
      });
    } catch {
      setError("Une erreur est survenue lors de l’analyse. Réessayez.");
      addMessage(conversation.id, {
        id: createId("msg"),
        role: "assistant",
        content:
          "Je n’ai pas pu traiter la demande. Reformulez avec des références catalogue connues.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setThinking(false);
    }
  }

  if (!conversation) {
    return (
      <div className="panel p-6 text-muted" role="status">
        Aucune conversation. Créez-en une depuis le menu.
      </div>
    );
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h1 className="font-display text-2xl text-brand-deep">Assistant devis</h1>
        <p className="text-sm text-muted">
          Parlez naturellement. Les prix viennent uniquement de votre catalogue.
        </p>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-auto px-4 py-5 sm:px-6"
        aria-live="polite"
      >
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`slide-up max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-brand text-white"
                : "bg-[#f4f8f8] text-ink"
            }`}
          >
            {m.role === "assistant"
              ? formatAssistantText(m.content)
              : m.content}
          </div>
        ))}
        {thinking && (
          <div
            className="flex w-fit gap-1 rounded-2xl bg-[#f4f8f8] px-4 py-3"
            aria-label="L’assistant réfléchit"
          >
            <span className="typing-dot h-2 w-2 rounded-full bg-brand" />
            <span
              className="typing-dot h-2 w-2 rounded-full bg-brand"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="typing-dot h-2 w-2 rounded-full bg-brand"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-3 border-t border-line p-4">
        {error && <Toast tone="error">{error}</Toast>}
        <button
          type="button"
          className="text-left text-xs font-medium text-brand underline-offset-2 hover:underline"
          onClick={() => setInput(SUGGESTION)}
        >
          Essayer l’exemple du cahier des charges
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="chat-input">
            Message à l’assistant
          </label>
          <textarea
            id="chat-input"
            className="input min-h-[52px] flex-1 resize-none"
            rows={2}
            placeholder="Décrivez le devis à préparer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <button
            type="submit"
            className="btn-primary self-end px-5"
            disabled={thinking || !input.trim()}
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
