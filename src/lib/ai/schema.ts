import { z } from "zod";

export const AiQuoteDraftSchema = z.object({
  clientNameHint: z.string().nullable(),
  lines: z.array(
    z.object({
      kind: z.enum([
        "produit",
        "main_doeuvre",
        "deplacement",
        "remise",
        "divers",
      ]),
      reference: z.string().nullable().optional(),
      designationHint: z.string().nullable().optional(),
      quantity: z.number().positive(),
      unitPriceHtHint: z.number().nullable().optional(),
      discountPercent: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
  ),
  missingQuestions: z.array(z.string()),
  assistantSummary: z.string(),
});

export type AiQuoteDraft = z.infer<typeof AiQuoteDraftSchema>;

export const AI_QUOTE_JSON_SCHEMA = {
  name: "devis_draft",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      clientNameHint: { type: ["string", "null"] },
      lines: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: {
              type: "string",
              enum: [
                "produit",
                "main_doeuvre",
                "deplacement",
                "remise",
                "divers",
              ],
            },
            reference: { type: ["string", "null"] },
            designationHint: { type: ["string", "null"] },
            quantity: { type: "number" },
            unitPriceHtHint: { type: ["number", "null"] },
            discountPercent: { type: ["number", "null"] },
            notes: { type: ["string", "null"] },
          },
          required: [
            "kind",
            "reference",
            "designationHint",
            "quantity",
            "unitPriceHtHint",
            "discountPercent",
            "notes",
          ],
        },
      },
      missingQuestions: { type: "array", items: { type: "string" } },
      assistantSummary: { type: "string" },
    },
    required: [
      "clientNameHint",
      "lines",
      "missingQuestions",
      "assistantSummary",
    ],
  },
} as const;
