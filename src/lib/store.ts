"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteEntity, persistEntity, newEntityId } from "./cloud-sync";
import {
  demoClients,
  demoCompany,
  demoConversations,
  demoProducts,
  demoQuotes,
  demoSuppliers,
  demoUser,
} from "./demo-data";
import { createId } from "./quote-engine";
import type {
  ChatMessage,
  Client,
  Company,
  Conversation,
  Product,
  Quote,
  QuoteStatus,
  Supplier,
} from "./types";

interface AppState {
  hydrated: boolean;
  isAuthenticated: boolean;
  cloudSync: boolean;
  userName: string;
  userEmail: string;
  company: Company;
  suppliers: Supplier[];
  products: Product[];
  clients: Client[];
  quotes: Quote[];
  conversations: Conversation[];
  activeConversationId: string;
  draftQuoteId: string | null;
  setHydrated: (v: boolean) => void;
  login: (creds?: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  loginLocalDemo: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncSession: () => Promise<boolean>;
  updateCompany: (patch: Partial<Company>) => void;
  addSupplier: (data: Omit<Supplier, "id" | "companyId" | "createdAt">) => void;
  updateSupplier: (
    id: string,
    patch: Partial<Omit<Supplier, "id" | "companyId" | "createdAt">>,
  ) => { ok: boolean; error?: string };
  deleteSupplier: (id: string) => { ok: boolean; error?: string };
  addClient: (data: Omit<Client, "id" | "companyId" | "createdAt">) => void;
  updateClient: (
    id: string,
    patch: Partial<Omit<Client, "id" | "companyId" | "createdAt">>,
  ) => void;
  deleteClient: (id: string) => { ok: boolean; error?: string };
  addProduct: (
    data: Omit<Product, "id" | "companyId" | "updatedAt">,
  ) => { ok: boolean; error?: string };
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (
    rows: Omit<Product, "id" | "companyId" | "updatedAt">[],
  ) => { imported: number; updated: number };
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setDraftQuote: (quote: Quote | null, conversationId?: string) => void;
  saveQuote: (quote: Quote) => void;
  validateQuote: (quoteId: string) => void;
  setQuoteStatus: (quoteId: string, status: QuoteStatus) => void;
  deleteQuote: (quoteId: string) => void;
  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  resetDemo: () => void;
}

const initialState = {
  isAuthenticated: false,
  cloudSync: false,
  userName: demoUser.name,
  userEmail: demoUser.email,
  company: demoCompany,
  suppliers: demoSuppliers,
  products: demoProducts,
  clients: demoClients,
  quotes: demoQuotes,
  conversations: demoConversations,
  activeConversationId: demoConversations[0].id,
  draftQuoteId: null as string | null,
};

async function loadCloudBootstrap(
  set: (partial: Partial<AppState>) => void,
): Promise<boolean> {
  try {
    const res = await fetch("/api/tenant/bootstrap", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      cloud?: boolean;
      company?: Company;
      suppliers?: Supplier[];
      products?: Product[];
      clients?: Client[];
      quotes?: Quote[];
    };
    if (!data.cloud || !data.company) {
      set({ cloudSync: false });
      return true;
    }
    set({
      cloudSync: true,
      company: data.company,
      suppliers: data.suppliers ?? [],
      products: data.products ?? [],
      clients: data.clients ?? [],
      quotes: data.quotes ?? [],
    });
    return true;
  } catch {
    return false;
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initialState,
      setHydrated: (v) => set({ hydrated: v }),
      syncSession: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          if (!res.ok) {
            set({ isAuthenticated: false, cloudSync: false });
            return false;
          }
          const data = (await res.json()) as {
            authenticated?: boolean;
            cloud?: boolean;
            user?: { email?: string; name?: string };
          };
          if (!data.authenticated) {
            set({ isAuthenticated: false, cloudSync: false });
            return false;
          }
          set({
            isAuthenticated: true,
            userEmail: data.user?.email ?? demoUser.email,
            userName: data.user?.name ?? demoUser.name,
            cloudSync: Boolean(data.cloud),
          });
          if (data.cloud) {
            await loadCloudBootstrap(set);
          } else {
            set({ cloudSync: false });
          }
          return true;
        } catch {
          set({ isAuthenticated: false, cloudSync: false });
          return false;
        }
      },
      loginLocalDemo: async () => {
        try {
          const res = await fetch("/api/auth/local-demo", { method: "POST" });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) {
            return { ok: false, error: data.error || "Démo locale refusée." };
          }
          set({
            ...initialState,
            isAuthenticated: true,
            cloudSync: false,
            conversations: JSON.parse(JSON.stringify(demoConversations)),
            products: [...demoProducts],
            clients: [...demoClients],
            suppliers: [...demoSuppliers],
            quotes: [...demoQuotes],
            company: { ...demoCompany },
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Impossible d’ouvrir la démo locale." };
        }
      },
      login: async (creds) => {
        if (creds?.email && creds.password) {
          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(creds),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
              return { ok: false, error: data.error || "Connexion impossible." };
            }
            const ok = await get().syncSession();
            if (!ok) {
              return { ok: false, error: "Session non établie." };
            }
            return { ok: true };
          } catch {
            return { ok: false, error: "Connexion impossible." };
          }
        }
        const ok = await get().syncSession();
        if (ok) return { ok: true };
        return get().loginLocalDemo();
      },
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        set({ isAuthenticated: false, cloudSync: false });
      },
      updateCompany: (patch) => {
        set((s) => ({ company: { ...s.company, ...patch } }));
        if (get().cloudSync) {
          void persistEntity({ entity: "company", data: patch });
        }
      },
      addSupplier: (data) => {
        const supplier: Supplier = {
          ...data,
          id: get().cloudSync ? newEntityId() : createId("sup"),
          companyId: get().company.id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ suppliers: [...s.suppliers, supplier] }));
        if (get().cloudSync) {
          void persistEntity({ entity: "supplier", data: supplier });
        }
      },
      updateSupplier: (id, patch) => {
        const existing = get().suppliers.find((s) => s.id === id);
        if (!existing) return { ok: false, error: "Fournisseur introuvable." };
        const next = { ...existing, ...patch };
        set((s) => ({
          suppliers: s.suppliers.map((sUp) => (sUp.id === id ? next : sUp)),
        }));
        if (get().cloudSync) {
          void persistEntity({ entity: "supplier", data: next });
        }
        return { ok: true };
      },
      deleteSupplier: (id) => {
        const linked = get().products.some((p) => p.supplierId === id);
        if (linked) {
          return {
            ok: false,
            error: "Des produits sont liés à ce fournisseur. Réassignez-les d’abord.",
          };
        }
        set((s) => ({ suppliers: s.suppliers.filter((sUp) => sUp.id !== id) }));
        if (get().cloudSync) {
          void deleteEntity("supplier", id);
        }
        return { ok: true };
      },
      addClient: (data) => {
        const client: Client = {
          ...data,
          id: get().cloudSync ? newEntityId() : createId("cli"),
          companyId: get().company.id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [...s.clients, client] }));
        if (get().cloudSync) {
          void persistEntity({ entity: "client", data: client });
        }
      },
      updateClient: (id, patch) => {
        const existing = get().clients.find((c) => c.id === id);
        if (!existing) return;
        const next = { ...existing, ...patch };
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? next : c)),
        }));
        if (get().cloudSync) {
          void persistEntity({ entity: "client", data: next });
        }
      },
      deleteClient: (id) => {
        const linked = get().quotes.some((q) => q.clientId === id);
        if (linked) {
          return {
            ok: false,
            error: "Ce client a des devis. Archivez ou supprimez les devis d’abord.",
          };
        }
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        if (get().cloudSync) {
          void deleteEntity("client", id);
        }
        return { ok: true };
      },
      addProduct: (data) => {
        const ref = data.reference.trim().toUpperCase();
        if (get().products.some((p) => p.reference.toUpperCase() === ref)) {
          return { ok: false, error: `La référence ${ref} existe déjà.` };
        }
        if (!(data.purchasePriceHt >= 0) || Number.isNaN(data.purchasePriceHt)) {
          return { ok: false, error: "Prix d’achat invalide." };
        }
        const product: Product = {
          ...data,
          reference: ref,
          id: get().cloudSync ? newEntityId() : createId("prod"),
          companyId: get().company.id,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ products: [...s.products, product] }));
        if (get().cloudSync) {
          void persistEntity({ entity: "product", data: product });
        }
        return { ok: true };
      },
      updateProduct: (id, patch) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p,
          ),
        }));
        if (get().cloudSync) {
          const product = get().products.find((p) => p.id === id);
          if (product) {
            void persistEntity({ entity: "product", data: product });
          }
        }
      },
      deleteProduct: (id) => {
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        if (get().cloudSync) {
          void deleteEntity("product", id);
        }
      },
      importProducts: (rows) => {
        const companyId = get().company.id;
        const now = new Date().toISOString();
        const cloud = get().cloudSync;
        let imported = 0;
        let updated = 0;
        const nextProducts = [...get().products];
        const touched: Product[] = [];

        for (const row of rows) {
          const ref = row.reference.trim().toUpperCase();
          const idx = nextProducts.findIndex(
            (p) => p.reference.toUpperCase() === ref,
          );
          if (idx >= 0) {
            const merged: Product = {
              ...nextProducts[idx],
              ...row,
              reference: ref,
              companyId,
              updatedAt: now,
            };
            nextProducts[idx] = merged;
            touched.push(merged);
            updated += 1;
          } else {
            const created: Product = {
              ...row,
              reference: ref,
              id: cloud ? newEntityId() : createId("prod"),
              companyId,
              updatedAt: now,
            };
            nextProducts.push(created);
            touched.push(created);
            imported += 1;
          }
        }

        set({ products: nextProducts });
        if (cloud && touched.length) {
          void persistEntity({ entity: "products", data: touched });
        }
        return { imported, updated };
      },
      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: message.createdAt,
                  messages: [...c.messages, message],
                  title:
                    c.title === "Nouvelle conversation" && message.role === "user"
                      ? message.content.slice(0, 42) +
                        (message.content.length > 42 ? "…" : "")
                      : c.title,
                }
              : c,
          ),
        })),
      setDraftQuote: (quote, conversationId) => {
        set((s) => {
          if (!quote) {
            return { draftQuoteId: null };
          }
          const exists = s.quotes.some((q) => q.id === quote.id);
          return {
            draftQuoteId: quote.id,
            quotes: exists
              ? s.quotes.map((q) => (q.id === quote.id ? quote : q))
              : [...s.quotes, quote],
            conversations: conversationId
              ? s.conversations.map((c) =>
                  c.id === conversationId
                    ? { ...c, draftQuoteId: quote.id }
                    : c,
                )
              : s.conversations,
          };
        });
        if (quote && get().cloudSync) {
          void persistEntity({ entity: "quote", data: quote });
        }
      },
      saveQuote: (quote) => {
        set((s) => ({
          quotes: s.quotes.some((q) => q.id === quote.id)
            ? s.quotes.map((q) => (q.id === quote.id ? quote : q))
            : [...s.quotes, quote],
        }));
        if (get().cloudSync) {
          void persistEntity({ entity: "quote", data: quote });
        }
      },
      validateQuote: (quoteId) => {
        get().setQuoteStatus(quoteId, "valide");
      },
      setQuoteStatus: (quoteId, status) => {
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, status } : q,
          ),
        }));
        if (get().cloudSync) {
          const quote = get().quotes.find((q) => q.id === quoteId);
          if (quote) {
            void persistEntity({
              entity: "quote",
              data: { ...quote, status },
            });
          }
        }
      },
      deleteQuote: (quoteId) => {
        set((s) => ({
          quotes: s.quotes.filter((q) => q.id !== quoteId),
          draftQuoteId: s.draftQuoteId === quoteId ? null : s.draftQuoteId,
        }));
        if (get().cloudSync) {
          void deleteEntity("quote", quoteId);
        }
      },
      newConversation: () => {
        const id = createId("conv");
        const now = new Date().toISOString();
        const conv: Conversation = {
          id,
          companyId: get().company.id,
          title: "Nouvelle conversation",
          createdAt: now,
          updatedAt: now,
          messages: [
            {
              id: createId("msg"),
              role: "assistant",
              content:
                "Nouvelle conversation. Décrivez le devis à préparer — références, quantités, pose et déplacement.",
              createdAt: now,
            },
          ],
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
          draftQuoteId: null,
        }));
        return id;
      },
      setActiveConversation: (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        set({
          activeConversationId: id,
          draftQuoteId: conv?.draftQuoteId ?? null,
        });
      },
      resetDemo: () =>
        set({
          ...initialState,
          conversations: JSON.parse(JSON.stringify(demoConversations)),
          products: [...demoProducts],
          clients: [...demoClients],
          suppliers: [...demoSuppliers],
          quotes: [],
          company: { ...demoCompany },
          isAuthenticated: true,
          cloudSync: false,
        }),
    }),
    {
      name: "devisrapide-demo-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        cloudSync: s.cloudSync,
        userName: s.userName,
        userEmail: s.userEmail,
        company: s.company,
        suppliers: s.suppliers,
        products: s.products,
        clients: s.clients,
        quotes: s.quotes,
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        draftQuoteId: s.draftQuoteId,
      }),
    },
  ),
);
