"use client";

import { useAppStore } from "@/lib/store";

export default function EntreprisePage() {
  const { company, updateCompany, resetDemo } = useAppStore();

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="font-display text-3xl text-brand-deep">Fiche entreprise</h1>
      <p className="mt-1 text-sm text-muted">
        Règles commerciales appliquées automatiquement aux devis.
      </p>

      <form
        className="panel mt-6 grid gap-4 p-5 md:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        {(
          [
            ["name", "Nom"],
            ["address", "Adresse"],
            ["postalCode", "Code postal"],
            ["city", "Ville"],
            ["phone", "Téléphone"],
            ["email", "E-mail"],
            ["siret", "SIRET"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="input mt-1"
              value={company[key]}
              onChange={(e) => updateCompany({ [key]: e.target.value })}
            />
          </label>
        ))}

        <label className="text-sm">
          Tarif horaire HT (€)
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            value={company.hourlyRateHt}
            onChange={(e) =>
              updateCompany({ hourlyRateHt: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-sm">
          Frais déplacement HT par défaut (€)
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            value={company.travelFeeHt}
            onChange={(e) =>
              updateCompany({ travelFeeHt: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-sm">
          Marge commerciale par défaut (%)
          <input
            className="input mt-1"
            type="number"
            step="0.1"
            value={company.defaultMarginPercent}
            onChange={(e) =>
              updateCompany({ defaultMarginPercent: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-sm">
          TVA par défaut (%)
          <input
            className="input mt-1"
            type="number"
            step="0.1"
            value={company.defaultVatRate}
            onChange={(e) =>
              updateCompany({ defaultVatRate: Number(e.target.value) })
            }
          />
        </label>
        <label className="text-sm md:col-span-2">
          Conditions de règlement
          <textarea
            className="input mt-1 min-h-[80px]"
            value={company.paymentTerms}
            onChange={(e) => updateCompany({ paymentTerms: e.target.value })}
          />
        </label>
        <label className="text-sm md:col-span-2">
          Mentions légales
          <textarea
            className="input mt-1 min-h-[80px]"
            value={company.legalMentions}
            onChange={(e) => updateCompany({ legalMentions: e.target.value })}
          />
        </label>
      </form>

      <button type="button" className="btn-secondary mt-6" onClick={resetDemo}>
        Réinitialiser les données de démo
      </button>
    </div>
  );
}
