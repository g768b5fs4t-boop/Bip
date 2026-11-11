"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ThemeToggle } from "./ThemeProvider";

const nav = [
  { href: "/app", label: "Tableau de bord", exact: true },
  { href: "/app/creer", label: "Créer un devis" },
  { href: "/app/assistant", label: "Assistant IA" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/fournisseurs", label: "Fournisseurs" },
  { href: "/app/produits", label: "Catalogue" },
  { href: "/app/devis", label: "Devis" },
  { href: "/app/entreprise", label: "Entreprise" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const {
    company,
    conversations,
    activeConversationId,
    setActiveConversation,
    newConversation,
    logout,
    userName,
  } = useAppStore();

  const Nav = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-5">
        <p className="font-display text-xl text-brand-deep">DevisRapide IA</p>
        <p className="mt-1 truncate text-xs text-muted">{company.name}</p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink hover:bg-brand-soft"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex-1 overflow-auto px-3 pb-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Conversations
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              newConversation();
              setOpen(false);
            }}
          >
            + Nouveau
          </button>
        </div>
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveConversation(c.id);
                  setOpen(false);
                }}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs ${
                  c.id === activeConversationId
                    ? "bg-[color:var(--bg-elevated)] text-brand-deep shadow-sm"
                    : "text-muted hover:bg-[color:var(--bg-elevated)]/70"
                }`}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line p-4">
        <p className="text-sm font-medium">{userName}</p>
        <p className="text-xs text-muted">Espace artisan</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 text-xs font-semibold text-accent"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-[color:var(--bg-elevated)]/80 px-4 py-3 lg:hidden">
        <p className="font-display text-lg text-brand-deep">DevisRapide IA</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-72 bg-[color:var(--nav-bg)] shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            {Nav}
          </aside>
        </div>
      )}

      <aside className="hidden w-72 shrink-0 border-r border-line bg-[color:var(--nav-bg)] lg:block">
        {Nav}
      </aside>
    </>
  );
}
