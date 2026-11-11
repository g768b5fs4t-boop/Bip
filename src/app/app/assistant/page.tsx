"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { QuotePreview } from "@/components/QuotePreview";
import { useAppStore } from "@/lib/store";

export default function AssistantPage() {
  const draftQuoteId = useAppStore((s) => s.draftQuoteId);
  const quotes = useAppStore((s) => s.quotes);
  const quote = quotes.find((q) => q.id === draftQuoteId) ?? null;

  return (
    <div
      id="contenu-principal"
      className="grid h-[calc(100dvh-120px)] gap-4 p-3 pb-24 lg:h-[calc(100vh-1rem)] lg:grid-cols-[minmax(0,1fr)_380px] lg:p-4 lg:pb-4"
    >
      <ChatPanel />
      <div className="min-h-[280px] lg:min-h-0">
        <QuotePreview quote={quote} />
      </div>
    </div>
  );
}
