# Rapport cycle 1 — DevisRapide IA

## Avant / après

| Zone | Avant | Après |
|------|-------|-------|
| Tests | Script tsx unique | Vitest (7) + Playwright (4) |
| UX listes | Formulaires bruts | PageHeader, EmptyState, Toast, validation |
| Chat | Markdown brut | Gras rendu + totaux dans la réponse |
| Devis | Statut texte | Badges, états vides, CTA guidés |
| Remises | Types seulement | Parser + moteur + tests |
| A11y | Partielle | Skip link, labels, aria-current, focus |
| Anti-invention | Réfs inconnues | + client inconnu, désignations ambiguës refusées |

## Tests exécutés
- `npm run test` → 7/7 OK
- `npm run test:e2e` → 4/4 OK (desktop + mobile Chromium)
- `npm run typecheck` / build → OK
- ESLint Next 16 : CLI cassé (`next lint`) — remplacé par `tsc --noEmit`

## Limitations restantes
- Pas encore de vraie IA / Supabase
- `next lint` incompatible Next 16 dans cet environnement
- Données toujours en localStorage (démo)
- Déploiement Vercel production `bip.vercel.app` peut pointer vers une ancienne app (domaine à rattacher manuellement)
