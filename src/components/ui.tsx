"use client";

import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl text-brand-deep">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="panel flex flex-col items-start gap-3 p-6"
      role="status"
      aria-live="polite"
    >
      <p className="font-medium text-brand-deep">{title}</p>
      <p className="text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "brouillon" | "valide" | "envoye" | "refuse" | string;
}) {
  const styles: Record<string, string> = {
    brouillon: "bg-[#eef3f6] text-muted",
    valide: "bg-[#e7f5ee] text-[var(--ok)]",
    envoye: "bg-brand-soft text-brand-deep",
    refuse: "bg-[#fdece7] text-accent",
  };
  const labels: Record<string, string> = {
    brouillon: "Brouillon",
    valide: "Validé",
    envoye: "Envoyé",
    refuse: "Refusé",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] ?? styles.brouillon}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function Toast({
  tone = "info",
  children,
}: {
  tone?: "info" | "ok" | "warn" | "error";
  children: ReactNode;
}) {
  const map = {
    info: "border-line bg-white text-ink",
    ok: "border-[#b7e0c7] bg-[#eefaf3] text-[var(--ok)]",
    warn: "border-[#f0d2a8] bg-[#fff7eb] text-[var(--warn)]",
    error: "border-[#f2c4b5] bg-[#fff1ec] text-accent",
  };
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${map[tone]}`}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <span className="font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-accent" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

export function SkipLink() {
  return (
    <a
      href="#contenu-principal"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
    >
      Aller au contenu
    </a>
  );
}

export function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-white/80 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-brand-deep">{value}</p>
    </div>
  );
}
