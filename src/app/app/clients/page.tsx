"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function ClientsPage() {
  const { clients, addClient, quotes } = useAppStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="font-display text-3xl text-brand-deep">Clients</h1>
      <p className="mt-1 text-sm text-muted">
        Base privée de votre entreprise — historique des devis associé.
      </p>

      <form
        className="panel mt-6 grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addClient({ name: name.trim(), email, phone, city });
          setName("");
          setEmail("");
          setPhone("");
          setCity("");
        }}
      >
        <input
          className="input"
          placeholder="Nom du client"
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
        <input
          className="input"
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" className="btn-primary sm:col-span-2 sm:w-fit">
          Ajouter le client
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {clients.map((c) => {
          const count = quotes.filter((q) => q.clientId === c.id).length;
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
    </div>
  );
}
