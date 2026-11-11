"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { QuotePreview } from "@/components/QuotePreview";
import { useAppStore } from "@/lib/store";

export default function AssistantPage() {
  const draftQuoteId = useAppStore((s) => s.draftQuoteId);
  const quotes = useAppStore((s) => s.quotes);
  const quote = quotes.find((q) => q.id === draftQuoteId) ?? null;

  return (
    <div className="grid h-[calc(100dvh-57px)] gap-4 p-3 lg:h-screen lg:grid-cols-[minmax(0,1fr)_360px] lg:p-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <ChatPanel />
      <div className="hidden min-h-0 lg:block">
        <QuotePreview quote={quote} />
      </div>
      <div className="lg:hidden">
        <QuotePreview quote={quote} />
      </div>
    </div>
  );
}
