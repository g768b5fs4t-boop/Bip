"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistEntity, newEntityId } from "./cloud-sync";
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
  addClient: (data: Omit<Client, "id" | "companyId" | "createdAt">) => void;
  addProduct: (
    data: Omit<Product, "id" | "companyId" | "updatedAt">,
  ) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  importProducts: (
    rows: Omit<Product, "id" | "companyId" | "updatedAt">[],
  ) => number;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setDraftQuote: (quote: Quote | null, conversationId?: string) => void;
  saveQuote: (quote: Quote) => void;
  validateQuote: (quoteId: string) => void;
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
      addProduct: (data) => {
        const product: Product = {
          ...data,
          id: get().cloudSync ? newEntityId() : createId("prod"),
          companyId: get().company.id,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ products: [...s.products, product] }));
        if (get().cloudSync) {
          void persistEntity({ entity: "product", data: product });
        }
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
      importProducts: (rows) => {
        const companyId = get().company.id;
        const now = new Date().toISOString();
        const cloud = get().cloudSync;
        const mapped = rows.map((r) => ({
          ...r,
          id: cloud ? newEntityId() : createId("prod"),
          companyId,
          updatedAt: now,
        }));
        set((s) => ({ products: [...s.products, ...mapped] }));
        if (cloud) {
          void persistEntity({ entity: "products", data: mapped });
        }
        return mapped.length;
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
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, status: "valide" } : q,
          ),
        }));
        if (get().cloudSync) {
          const quote = get().quotes.find((q) => q.id === quoteId);
          if (quote) {
            void persistEntity({
              entity: "quote",
              data: { ...quote, status: "valide" },
            });
          }
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
