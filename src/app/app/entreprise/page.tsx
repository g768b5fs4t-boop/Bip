"use client";

import { useEffect, useState } from "react";
import { PageHeader, Toast } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function EntreprisePage() {
  const { company, updateCompany, resetDemo, cloudSync } = useAppStore();
  const [draft, setDraft] = useState(company);

  useEffect(() => {
    setDraft(company);
  }, [company]);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchDraft<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(null);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError("Le nom de l’entreprise est obligatoire.");
      return;
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setError("E-mail invalide.");
      return;
    }
    if (!(draft.hourlyRateHt >= 0) || !(draft.travelFeeHt >= 0)) {
      setError("Tarifs invalides.");
      return;
    }
    if (draft.defaultVatRate < 0 || draft.defaultVatRate > 100) {
      setError("Taux de TVA invalide.");
      return;
    }
    if (draft.quoteValidityDays < 1 || draft.quoteValidityDays > 365) {
      setError("Durée de validité entre 1 et 365 jours.");
      return;
    }
    updateCompany({
      name: draft.name.trim(),
      address: draft.address.trim(),
      postalCode: draft.postalCode.trim(),
      city: draft.city.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      siret: draft.siret.trim(),
      hourlyRateHt: draft.hourlyRateHt,
      travelFeeHt: draft.travelFeeHt,
      defaultMarginPercent: draft.defaultMarginPercent,
      defaultVatRate: draft.defaultVatRate,
      quoteValidityDays: draft.quoteValidityDays,
      paymentTerms: draft.paymentTerms,
      legalMentions: draft.legalMentions,
      logoUrl: draft.logoUrl?.trim() || undefined,
    });
    setSaved("Fiche entreprise enregistrée.");
  }

  return (
    <div id="contenu-principal" className="h-full overflow-auto p-4 pb-28 lg:p-6">
      <PageHeader
        title="Fiche entreprise"
        subtitle="Coordonnées, tarifs et mentions appliqués automatiquement aux devis."
      />

      <form className="panel mt-6 grid gap-4 p-5 md:grid-cols-2" onSubmit={onSave}>
        {(
          [
            ["name", "Nom"],
            ["address", "Adresse"],
            ["postalCode", "Code postal"],
            ["city", "Ville"],
            ["phone", "Téléphone"],
            ["email", "E-mail"],
            ["siret", "SIRET"],
            ["logoUrl", "URL logo (optionnel)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="input mt-1"
              value={draft[key] ?? ""}
              onChange={(e) => patchDraft(key, e.target.value)}
            />
          </label>
        ))}

        <label className="text-sm">
          Tarif horaire HT (€)
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            value={draft.hourlyRateHt}
            onChange={(e) => patchDraft("hourlyRateHt", Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Frais déplacement HT (€)
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            value={draft.travelFeeHt}
            onChange={(e) => patchDraft("travelFeeHt", Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Marge commerciale par défaut (%)
          <input
            className="input mt-1"
            type="number"
            step="0.1"
            value={draft.defaultMarginPercent}
            onChange={(e) =>
              patchDraft("defaultMarginPercent", Number(e.target.value))
            }
          />
        </label>
        <label className="text-sm">
          TVA par défaut (%)
          <input
            className="input mt-1"
            type="number"
            step="0.1"
            value={draft.defaultVatRate}
            onChange={(e) =>
              patchDraft("defaultVatRate", Number(e.target.value))
            }
          />
        </label>
        <label className="text-sm">
          Validité devis (jours)
          <input
            className="input mt-1"
            type="number"
            min={1}
            max={365}
            value={draft.quoteValidityDays}
            onChange={(e) =>
              patchDraft("quoteValidityDays", Number(e.target.value))
            }
          />
        </label>
        <label className="text-sm md:col-span-2">
          Conditions de règlement
          <textarea
            className="input mt-1 min-h-[80px]"
            value={draft.paymentTerms}
            onChange={(e) => patchDraft("paymentTerms", e.target.value)}
          />
        </label>
        <label className="text-sm md:col-span-2">
          Mentions légales
          <textarea
            className="input mt-1 min-h-[80px]"
            value={draft.legalMentions}
            onChange={(e) => patchDraft("legalMentions", e.target.value)}
          />
        </label>

        {error && (
          <div className="md:col-span-2">
            <Toast tone="error">{error}</Toast>
          </div>
        )}
        {saved && (
          <div className="md:col-span-2">
            <Toast tone="ok">{saved}</Toast>
          </div>
        )}

        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">
          Enregistrer
        </button>
      </form>

      {!cloudSync && (
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => {
            if (
              confirm(
                "Réinitialiser les données locales de démo ? Les devis locaux seront effacés.",
              )
            ) {
              resetDemo();
              setDraft(useAppStore.getState().company);
              setSaved("Données de démo réinitialisées.");
            }
          }}
        >
          Réinitialiser les données de démo
        </button>
      )}
    </div>
  );
}
