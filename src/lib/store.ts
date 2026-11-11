"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initialState,
      setHydrated: (v) => set({ hydrated: v }),
      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            user?: { email?: string; name?: string };
          };
          if (!res.ok) {
            return {
              ok: false,
              error: data.error ?? "Identifiants incorrects.",
            };
          }
          set({
            isAuthenticated: true,
            userEmail: data.user?.email ?? demoUser.email,
            userName: data.user?.name ?? demoUser.name,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Impossible de joindre le serveur." };
        }
      },
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        set({ isAuthenticated: false });
      },
      updateCompany: (patch) =>
        set((s) => ({ company: { ...s.company, ...patch } })),
      addSupplier: (data) =>
        set((s) => ({
          suppliers: [
            ...s.suppliers,
            {
              ...data,
              id: createId("sup"),
              companyId: s.company.id,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      addClient: (data) =>
        set((s) => ({
          clients: [
            ...s.clients,
            {
              ...data,
              id: createId("cli"),
              companyId: s.company.id,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      addProduct: (data) =>
        set((s) => ({
          products: [
            ...s.products,
            {
              ...data,
              id: createId("prod"),
              companyId: s.company.id,
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p,
          ),
        })),
      importProducts: (rows) => {
        const companyId = get().company.id;
        const now = new Date().toISOString();
        const mapped = rows.map((r) => ({
          ...r,
          id: createId("prod"),
          companyId,
          updatedAt: now,
        }));
        set((s) => ({ products: [...s.products, ...mapped] }));
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
      setDraftQuote: (quote, conversationId) =>
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
        }),
      saveQuote: (quote) =>
        set((s) => ({
          quotes: s.quotes.some((q) => q.id === quote.id)
            ? s.quotes.map((q) => (q.id === quote.id ? quote : q))
            : [...s.quotes, quote],
        })),
      validateQuote: (quoteId) =>
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, status: "valide" } : q,
          ),
        })),
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
        }),
    }),
    {
      name: "devisrapide-demo-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
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
