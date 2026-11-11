"use client";

import { useState } from "react";
import { EmptyState, Field, PageHeader, Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function FournisseursPage() {
  const { suppliers, products, addSupplier } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ok, setOk] = useState<string | null>(null);

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 lg:p-6">
      <PageHeader
        title="Fournisseurs"
        subtitle="Chaque artisan a sa propre base — aucun mélange entre entreprises."
      />

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addSupplier({ name: name.trim(), email, phone });
          setName("");
          setEmail("");
          setPhone("");
          setOk("Fournisseur créé.");
        }}
      >
        <Field label="Nom" htmlFor="sup-name">
          <input
            id="sup-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="E-mail" htmlFor="sup-email">
          <input
            id="sup-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Téléphone" htmlFor="sup-phone">
          <input
            id="sup-phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        {ok && (
          <div className="sm:col-span-3">
            <Toast tone="ok">{ok}</Toast>
          </div>
        )}
        <button type="submit" className="btn-primary sm:col-span-3 sm:w-fit">
          Créer
        </button>
      </form>

      {suppliers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun fournisseur"
            description="Créez un fournisseur avant d’importer un catalogue CSV."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {suppliers.map((s) => (
            <li key={s.id} className="panel p-4">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted">
                {[s.email, s.phone].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="mt-2 text-xs text-brand">
                {products.filter((p) => p.supplierId === s.id).length} produits
                liés
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
