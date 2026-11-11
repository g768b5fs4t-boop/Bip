"use client";

import { useMemo, useState } from "react";
import { EmptyState, Field, PageHeader, Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function ClientsPage() {
  const { clients, addClient, quotes } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.email ?? "").toLowerCase().includes(needle) ||
        (c.city ?? "").toLowerCase().includes(needle),
    );
  }, [clients, q]);

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 lg:p-6">
      <PageHeader
        title="Clients"
        subtitle="Base privée de votre entreprise — historique des devis associé."
      />

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!name.trim()) {
            setError("Le nom du client est obligatoire.");
            return;
          }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Adresse e-mail invalide.");
            return;
          }
          addClient({ name: name.trim(), email, phone, city });
          setName("");
          setEmail("");
          setPhone("");
          setCity("");
          setFeedback("Client ajouté.");
        }}
      >
        <Field label="Nom" htmlFor="cli-name" error={error && !name.trim() ? error : undefined}>
          <input
            id="cli-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </Field>
        <Field label="E-mail" htmlFor="cli-email">
          <input
            id="cli-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Téléphone" htmlFor="cli-phone">
          <input
            id="cli-phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field label="Ville" htmlFor="cli-city">
          <input
            id="cli-city"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
          />
        </Field>
        {error && (
          <div className="sm:col-span-2">
            <Toast tone="error">{error}</Toast>
          </div>
        )}
        {feedback && (
          <div className="sm:col-span-2">
            <Toast tone="ok">{feedback}</Toast>
          </div>
        )}
        <button type="submit" className="btn-primary sm:col-span-2 sm:w-fit">
          Ajouter le client
        </button>
      </form>

      <label className="mt-6 block max-w-md text-sm" htmlFor="cli-search">
        Rechercher
        <input
          id="cli-search"
          className="input mt-1"
          placeholder="Nom, e-mail ou ville…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun client"
            description="Ajoutez un client pour pouvoir générer un devis conversationnel."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((c) => {
            const count = quotes.filter((quote) => quote.clientId === c.id).length;
            return (
              <li key={c.id} className="panel p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">
                  {[c.phone, c.email, c.city].filter(Boolean).join(" · ") ||
                    "Coordonnées à compléter"}
                </p>
                <p className="mt-2 text-xs text-brand">
                  {count} devis dans l’historique
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
