"use client";

import { parseProductCsv } from "@/lib/csv-import";
import { formatEuro, formatPercent } from "@/lib/money";
import { resolveSalePriceHt } from "@/lib/quote-engine";
import { useAppStore } from "@/lib/store";
import { useMemo, useState } from "react";

export default function ProduitsPage() {
  const {
    products,
    suppliers,
    company,
    addProduct,
    updateProduct,
    importProducts,
  } = useAppStore();
  const [q, setQ] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    reference: "",
    designation: "",
    supplierId: suppliers[0]?.id ?? "",
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

  async function onCsv(file: File) {
    const text = await file.text();
    const fallback = suppliers[0]?.id ?? "sup_unknown";
    const { products: rows, errors } = parseProductCsv(text, fallback);
    if (rows.length) {
      const n = importProducts(rows);
      setImportMsg(`${n} produit(s) importé(s).${errors.length ? ` ${errors.length} ligne(s) ignorée(s).` : ""}`);
    } else {
      setImportMsg(errors[0] ?? "Aucun produit importé.");
    }
  }

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-brand-deep">Produits & tarifs</h1>
          <p className="mt-1 text-sm text-muted">
            Recherche instantanée · marge ou prix de vente · date de mise à jour
          </p>
        </div>
        <a className="btn-secondary text-xs" href="/sample-catalogue.csv" download>
          Télécharger un CSV d’exemple
        </a>
      </div>

      <div className="panel mt-6 p-4">
        <p className="text-sm font-semibold">Importer un catalogue CSV</p>
        <p className="mt-1 text-xs text-muted">
          Colonnes : reference;designation;unit;purchase_price_ht;margin_percent;sale_price_ht;supplier_id
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
          addProduct({
            reference: form.reference.trim().toUpperCase(),
            designation: form.designation.trim(),
            supplierId: form.supplierId || suppliers[0]?.id || "sup_unknown",
            unit: "u",
            purchasePriceHt: Number(form.purchasePriceHt.replace(",", ".")),
            marginPercent: form.marginPercent
              ? Number(form.marginPercent.replace(",", "."))
              : null,
            salePriceHt: form.salePriceHt
              ? Number(form.salePriceHt.replace(",", "."))
              : null,
          });
          setForm({
            reference: "",
            designation: "",
            supplierId: suppliers[0]?.id ?? "",
            purchasePriceHt: "",
            marginPercent: "",
            salePriceHt: "",
          });
        }}
      >
        <input
          className="input"
          placeholder="Référence"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          required
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
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
        <button type="submit" className="btn-primary md:col-span-3 md:w-fit">
          Ajouter le produit
        </button>
      </form>

      <input
        className="input mt-6 max-w-md"
        placeholder="Rechercher par référence ou désignation…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white/90">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f4f8f8] text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-3">Réf.</th>
              <th className="px-3 py-3">Désignation</th>
              <th className="px-3 py-3">Achat HT</th>
              <th className="px-3 py-3">Marge</th>
              <th className="px-3 py-3">Vente HT</th>
              <th className="px-3 py-3">MAJ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const sale = resolveSalePriceHt(p, company);
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs text-brand">
                    {p.reference}
                  </td>
                  <td className="px-3 py-2">{p.designation}</td>
                  <td className="px-3 py-2">{formatEuro(p.purchasePriceHt)}</td>
                  <td className="px-3 py-2">
                    <input
                      className="input max-w-[88px] py-1"
                      defaultValue={p.marginPercent ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        updateProduct(p.id, {
                          marginPercent: v ? Number(v.replace(",", ".")) : null,
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {sale != null ? formatEuro(sale) : "—"}
                    {p.marginPercent != null && (
                      <span className="ml-1 text-[10px] text-muted">
                        ({formatPercent(p.marginPercent)})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                    {new Date(p.updatedAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
