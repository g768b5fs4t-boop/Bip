"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { QuotePreview } from "@/components/QuotePreview";
import { StatChip } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function AssistantPage() {
  const draftQuoteId = useAppStore((s) => s.draftQuoteId);
  const quotes = useAppStore((s) => s.quotes);
  const clients = useAppStore((s) => s.clients);
  const products = useAppStore((s) => s.products);
  const quote = quotes.find((q) => q.id === draftQuoteId) ?? null;

  return (
    <div
      id="contenu-principal"
      className="flex h-[calc(100dvh-57px)] flex-col gap-3 p-3 lg:h-screen lg:p-4"
    >
      <div className="grid grid-cols-3 gap-2 lg:max-w-xl">
        <StatChip label="Clients" value={clients.length} />
        <StatChip label="Produits" value={products.length} />
        <StatChip label="Devis" value={quotes.length} />
      </div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <ChatPanel />
        <div className="min-h-[320px] lg:min-h-0">
          <QuotePreview quote={quote} />
        </div>
      </div>
    </div>
  );
}
