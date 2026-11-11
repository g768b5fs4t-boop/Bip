"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Accueil", match: (p: string) => p === "/app" },
  {
    href: "/app/creer",
    label: "Créer",
    match: (p: string) => p.startsWith("/app/creer"),
    primary: true,
  },
  {
    href: "/app/devis",
    label: "Devis",
    match: (p: string) => p.startsWith("/app/devis"),
  },
  {
    href: "/app/clients",
    label: "Clients",
    match: (p: string) => p.startsWith("/app/clients"),
  },
  {
    href: "/app/produits",
    label: "Catalogue",
    match: (p: string) => p.startsWith("/app/produits"),
  },
];

export function MobileNav() {
  const pathname = usePathname() || "";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color:var(--bg-elevated)]/95 backdrop-blur lg:hidden"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
                  item.primary
                    ? "text-accent"
                    : active
                      ? "text-brand"
                      : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.primary ? (
                  <span className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg text-white shadow-soft">
                    +
                  </span>
                ) : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
