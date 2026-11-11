"use client";

import { buildQuoteFromRequest } from "@/lib/ai-parser";
import { createId } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import { useMemo, useRef, useState } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  async function send(text: string) {
    const content = text.trim();
    if (!content || !conversation || thinking) return;
    setInput("");
    setThinking(true);

    addMessage(conversation.id, {
      id: createId("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });

    // Simule une latence « assistant » sans appeler d’API payante
    await new Promise((r) => setTimeout(r, 550));

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

    addMessage(conversation.id, {
      id: createId("msg"),
      role: "assistant",
      content: result.assistantMessage,
      createdAt: new Date().toISOString(),
      quoteDraftId: result.quote?.id,
    });

    setThinking(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (!conversation) {
    return <div className="p-6 text-muted">Aucune conversation.</div>;
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h1 className="font-display text-2xl text-brand-deep">Assistant devis</h1>
        <p className="text-sm text-muted">
          Parlez naturellement. Les prix viennent de votre catalogue — jamais inventés.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-5 sm:px-6">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`slide-up max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-brand text-white"
                : "bg-[#f4f8f8] text-ink"
            }`}
          >
            {m.content}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-1 rounded-2xl bg-[#f4f8f8] px-4 py-3 w-fit">
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

      <div className="border-t border-line p-4">
        <button
          type="button"
          className="mb-3 text-left text-xs text-brand underline-offset-2 hover:underline"
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
          <textarea
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
          <button type="submit" className="btn-primary self-end px-5" disabled={thinking}>
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
