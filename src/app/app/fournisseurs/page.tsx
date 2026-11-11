"use client";

import { useMemo, useState } from "react";
import { EmptyState, Field, PageHeader, Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import type { Supplier } from "@/lib/types";

type FormState = { name: string; email: string; phone: string; notes: string };
const empty: FormState = { name: "", email: "", phone: "", notes: "" };

export default function FournisseursPage() {
  const {
    suppliers,
    products,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useAppStore();
  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.email ?? "").toLowerCase().includes(needle) ||
        (s.phone ?? "").includes(needle),
    );
  }, [suppliers, q]);

  function loadEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      email: s.email ?? "",
      phone: s.phone ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
    setOk(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title="Fournisseurs"
        subtitle="Base fournisseurs isolée par entreprise — édition, notes et suppression sécurisée."
      />

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setOk(null);
          if (!form.name.trim()) {
            setError("Le nom est obligatoire.");
            return;
          }
          if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError("E-mail invalide.");
            return;
          }
          const payload = {
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            notes: form.notes.trim() || undefined,
          };
          if (editingId) {
            const res = updateSupplier(editingId, payload);
            if (!res.ok) {
              setError(res.error ?? "Mise à jour impossible.");
              return;
            }
            setOk("Fournisseur mis à jour.");
          } else {
            addSupplier(payload);
            setOk("Fournisseur créé.");
          }
          resetForm();
        }}
      >
        <p className="sm:col-span-2 text-sm font-semibold text-brand-deep">
          {editingId ? "Modifier le fournisseur" : "Nouveau fournisseur"}
        </p>
        <Field label="Nom" htmlFor="sup-name">
          <input
            id="sup-name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="E-mail" htmlFor="sup-email">
          <input
            id="sup-email"
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Téléphone" htmlFor="sup-phone">
          <input
            id="sup-phone"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Notes" htmlFor="sup-notes">
          <input
            id="sup-notes"
            className="input"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        {error && (
          <div className="sm:col-span-2">
            <Toast tone="error">{error}</Toast>
          </div>
        )}
        {ok && (
          <div className="sm:col-span-2">
            <Toast tone="ok">{ok}</Toast>
          </div>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            {editingId ? "Enregistrer" : "Créer"}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <label className="mt-6 block max-w-md text-sm" htmlFor="sup-search">
        Rechercher
        <input
          id="sup-search"
          className="input mt-1"
          placeholder="Nom, e-mail ou téléphone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun fournisseur"
            description="Créez un fournisseur avant d’importer un catalogue CSV."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {filtered.map((s) => {
            const count = products.filter((p) => p.supplierId === s.id).length;
            return (
              <li key={s.id} className="panel p-4">
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted">
                  {[s.email, s.phone].filter(Boolean).join(" · ") || "—"}
                </p>
                {s.notes && (
                  <p className="mt-2 text-xs text-muted">{s.notes}</p>
                )}
                <p className="mt-2 text-xs text-brand">{count} produits liés</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    onClick={() => loadEdit(s)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs text-accent"
                    onClick={() => {
                      const res = deleteSupplier(s.id);
                      if (!res.ok) {
                        setError(res.error ?? "Suppression impossible.");
                        return;
                      }
                      setOk("Fournisseur supprimé.");
                      if (editingId === s.id) resetForm();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
