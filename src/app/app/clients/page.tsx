"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Field, PageHeader, Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import type { Client } from "@/lib/types";

type FormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  postalCode: "",
  notes: "",
};

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, quotes } =
    useAppStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
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
        (c.city ?? "").toLowerCase().includes(needle) ||
        (c.phone ?? "").toLowerCase().includes(needle),
    );
  }, [clients, q]);

  function loadEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      city: c.city ?? "",
      address: c.address ?? "",
      postalCode: c.postalCode ?? "",
      notes: c.notes ?? "",
    });
    setError(null);
    setFeedback(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (!form.name.trim()) {
      setError("Le nom du client est obligatoire.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateClient(editingId, payload);
      setFeedback("Client mis à jour.");
    } else {
      addClient(payload);
      setFeedback("Client ajouté.");
    }
    resetForm();
  }

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title="Clients"
        subtitle="Fiches complètes, recherche, édition et lien avec les devis."
      />

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={onSubmit}
      >
        <p className="sm:col-span-2 text-sm font-semibold text-brand-deep">
          {editingId ? "Modifier le client" : "Nouveau client"}
        </p>
        <Field label="Nom" htmlFor="cli-name">
          <input
            id="cli-name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoComplete="name"
          />
        </Field>
        <Field label="E-mail" htmlFor="cli-email">
          <input
            id="cli-email"
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </Field>
        <Field label="Téléphone" htmlFor="cli-phone">
          <input
            id="cli-phone"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="tel"
          />
        </Field>
        <Field label="Ville" htmlFor="cli-city">
          <input
            id="cli-city"
            className="input"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
        <Field label="Adresse" htmlFor="cli-address">
          <input
            id="cli-address"
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Code postal" htmlFor="cli-cp">
          <input
            id="cli-cp"
            className="input"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          />
        </Field>
        <Field label="Notes" htmlFor="cli-notes">
          <textarea
            id="cli-notes"
            className="input min-h-[72px] sm:col-span-2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            {editingId ? "Enregistrer" : "Ajouter le client"}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <label className="mt-6 block max-w-md text-sm" htmlFor="cli-search">
        Rechercher
        <input
          id="cli-search"
          className="input mt-1"
          placeholder="Nom, e-mail, téléphone ou ville…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun client"
            description="Ajoutez votre premier client pour l’associer aux devis."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((c) => {
            const count = quotes.filter((quote) => quote.clientId === c.id).length;
            return (
              <li key={c.id} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">
                      {[c.phone, c.email, c.city].filter(Boolean).join(" · ") ||
                        "Coordonnées à compléter"}
                    </p>
                    {(c.address || c.postalCode) && (
                      <p className="mt-1 text-xs text-muted">
                        {[c.address, c.postalCode, c.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {c.notes && (
                      <p className="mt-2 text-xs text-muted">{c.notes}</p>
                    )}
                    <p className="mt-2 text-xs text-brand">
                      {count} devis ·{" "}
                      <Link href={`/app/devis?client=${c.id}`} className="underline">
                        voir les devis
                      </Link>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={() => loadEdit(c)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs text-accent"
                      onClick={() => {
                        const res = deleteClient(c.id);
                        if (!res.ok) {
                          setError(res.error ?? "Suppression impossible.");
                          return;
                        }
                        setFeedback("Client supprimé.");
                        if (editingId === c.id) resetForm();
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
