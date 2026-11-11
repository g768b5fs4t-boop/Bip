"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function FournisseursPage() {
  const { suppliers, products, addSupplier } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="font-display text-3xl text-brand-deep">Fournisseurs</h1>
      <p className="mt-1 text-sm text-muted">
        Chaque artisan a sa propre base — aucun mélange entre entreprises.
      </p>

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addSupplier({ name: name.trim(), email, phone });
          setName("");
          setEmail("");
          setPhone("");
        }}
      >
        <input
          className="input sm:col-span-3"
          placeholder="Nom du fournisseur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Créer
        </button>
      </form>

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
            <p className="mt-1 font-mono text-[10px] text-muted">id: {s.id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
