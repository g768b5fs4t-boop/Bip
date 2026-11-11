import { getOpenAiModel } from "@/lib/config";
import type { Client, Product } from "@/lib/types";
import { AiQuoteDraftSchema, AI_QUOTE_JSON_SCHEMA, type AiQuoteDraft } from "./schema";

export async function callOpenAiQuoteDraft(params: {
  message: string;
  products: Product[];
  clients: Client[];
  hourlyRateHt: number;
  travelFeeHt: number;
}): Promise<AiQuoteDraft> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY manquante");
  }

  const catalog = params.products
    .slice(0, 200)
    .map(
      (p) =>
        `${p.reference} | ${p.designation} | unit=${p.unit}`,
    )
    .join("\n");
  const clients = params.clients
    .slice(0, 100)
    .map((c) => c.name)
    .join("\n");

  const system = `Tu es l'assistant devis d'un artisan français.
Tu DOIS uniquement proposer des références présentes dans le catalogue fourni.
Tu ne DOIS JAMAIS inventer de prix, de références, ni de clients.
Si une info manque, ajoute une question dans missingQuestions.
Pour la main-d'œuvre, kind=main_doeuvre et quantity = heures.
Pour le déplacement, kind=deplacement ; si un montant € est dit, mets-le dans unitPriceHtHint, sinon null.
Les prix catalogue seront recalculés côté serveur : laisse unitPriceHtHint à null pour les produits.
Tarif horaire connu de l'entreprise: ${params.hourlyRateHt} € HT.
Frais déplacement par défaut: ${params.travelFeeHt} € HT.`;

  const user = `Catalogue:\n${catalog || "(vide)"}\n\nClients:\n${clients || "(aucun)"}\n\nDemande artisan:\n${params.message}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: AI_QUOTE_JSON_SCHEMA,
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse OpenAI vide");

  const parsed = AiQuoteDraftSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Sortie IA invalide après validation Zod");
  }
  return parsed.data;
}
