"use client";

import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Toast } from "@/components/ui";
import { parseProductCsv } from "@/lib/csv-import";
import { formatEuro, formatPercent } from "@/lib/money";
import { resolveSalePriceHt } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import type { Product, Unit } from "@/lib/types";

const UNITS: Unit[] = ["u", "h", "m", "m²", "forfait", "kg"];

export default function ProduitsPage() {
  const {
    products,
    suppliers,
    company,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
  } = useAppStore();
  const [q, setQ] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    reference: "",
    designation: "",
    supplierId: suppliers[0]?.id ?? "",
    unit: "u" as Unit,
    purchasePriceHt: "",
    marginPercent: "",
    salePriceHt: "",
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.reference.toLowerCase().includes(needle) ||
        p.designation.toLowerCase().includes(needle),
    );
  }, [products, q]);

  function resetForm() {
    setEditingId(null);
    setForm({
      reference: "",
      designation: "",
      supplierId: suppliers[0]?.id ?? "",
      unit: "u",
      purchasePriceHt: "",
      marginPercent: "",
      salePriceHt: "",
    });
  }

  function loadEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      reference: p.reference,
      designation: p.designation,
      supplierId: p.supplierId || suppliers[0]?.id || "",
      unit: p.unit,
      purchasePriceHt: String(p.purchasePriceHt),
      marginPercent: p.marginPercent != null ? String(p.marginPercent) : "",
      salePriceHt: p.salePriceHt != null ? String(p.salePriceHt) : "",
    });
    setError(null);
  }

  async function onCsv(file: File) {
    const text = await file.text();
    const fallback = suppliers[0]?.id ?? "";
    const { products: rows, errors } = parseProductCsv(text, fallback);
    if (rows.length) {
      const { imported, updated } = importProducts(rows);
      setImportMsg(
        `${imported} ajouté(s), ${updated} mis à jour.${errors.length ? ` ${errors.length} ligne(s) ignorée(s).` : ""}`,
      );
    } else {
      setImportMsg(errors[0] ?? "Aucun produit importé.");
    }
  }

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title="Produits & tarifs"
        subtitle="Catalogue, import CSV (upsert par référence), édition complète — jamais de prix inventés."
        actions={
          <a className="btn-secondary text-xs" href="/sample-catalogue.csv" download>
            CSV d’exemple
          </a>
        }
      />

      <div className="panel mt-6 p-4">
        <p className="text-sm font-semibold">Importer un catalogue CSV</p>
        <p className="mt-1 text-xs text-muted">
          Colonnes : reference;designation;unit;purchase_price_ht;margin_percent;sale_price_ht;supplier_id
          — une référence existante est mise à jour.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-3 block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onCsv(f);
          }}
        />
        {importMsg && <p className="mt-2 text-xs text-brand">{importMsg}</p>}
      </div>

      <form
        className="panel mt-4 grid gap-3 p-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const purchase = Number(form.purchasePriceHt.replace(",", "."));
          const payload = {
            reference: form.reference.trim().toUpperCase(),
            designation: form.designation.trim(),
            supplierId: form.supplierId || suppliers[0]?.id || "",
            unit: form.unit,
            purchasePriceHt: purchase,
            marginPercent: form.marginPercent
              ? Number(form.marginPercent.replace(",", "."))
              : null,
            salePriceHt: form.salePriceHt
              ? Number(form.salePriceHt.replace(",", "."))
              : null,
          };
          if (editingId) {
            updateProduct(editingId, payload);
            resetForm();
            return;
          }
          const res = addProduct(payload);
          if (!res.ok) {
            setError(res.error ?? "Ajout impossible.");
            return;
          }
          resetForm();
        }}
      >
        <p className="md:col-span-3 text-sm font-semibold text-brand-deep">
          {editingId ? "Modifier le produit" : "Nouveau produit"}
        </p>
        <input
          className="input"
          placeholder="Référence"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          required
          disabled={Boolean(editingId)}
        />
        <input
          className="input md:col-span-2"
          placeholder="Désignation"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          required
        />
        <select
          className="input"
          value={form.supplierId}
          onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
        >
          {suppliers.length === 0 && (
            <option value="">Aucun fournisseur</option>
          )}
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              Unité : {u}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Prix achat HT"
          value={form.purchasePriceHt}
          onChange={(e) => setForm({ ...form, purchasePriceHt: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Marge % (optionnel)"
          value={form.marginPercent}
          onChange={(e) => setForm({ ...form, marginPercent: e.target.value })}
        />
        <input
          className="input"
          placeholder="Prix vente HT (optionnel)"
          value={form.salePriceHt}
          onChange={(e) => setForm({ ...form, salePriceHt: e.target.value })}
        />
        {error && (
          <div className="md:col-span-3">
            <Toast tone="error">{error}</Toast>
          </div>
        )}
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button type="submit" className="btn-primary">
            {editingId ? "Enregistrer" : "Ajouter le produit"}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <input
        className="input mt-6 max-w-md"
        placeholder="Rechercher par référence ou désignation…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Aucun produit"
            description="Ajoutez un article ou importez un CSV fournisseur."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white/90">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f4f8f8] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Réf.</th>
                <th className="px-3 py-3">Désignation</th>
                <th className="px-3 py-3">Achat HT</th>
                <th className="px-3 py-3">Marge</th>
                <th className="px-3 py-3">Vente HT</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const sale = resolveSalePriceHt(p, company);
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-3 py-2 font-mono text-xs text-brand">
                      {p.reference}
                    </td>
                    <td className="px-3 py-2">
                      <p>{p.designation}</p>
                      <p className="text-[11px] text-muted">
                        {p.unit} · {supplier?.name ?? "Sans fournisseur"}
                      </p>
                    </td>
                    <td className="px-3 py-2">{formatEuro(p.purchasePriceHt)}</td>
                    <td className="px-3 py-2">
                      {p.marginPercent != null
                        ? formatPercent(p.marginPercent)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {sale != null ? formatEuro(sale) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand"
                          onClick={() => loadEdit(p)}
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-accent"
                          onClick={() => {
                            if (
                              confirm(
                                `Supprimer ${p.reference} du catalogue ?`,
                              )
                            ) {
                              deleteProduct(p.id);
                              if (editingId === p.id) resetForm();
                            }
                          }}
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
