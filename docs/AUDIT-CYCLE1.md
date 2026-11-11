# Audit DevisRapide IA — Cycle 1

## Architecture
- Next.js App Router + Zustand (localStorage) + PDF serveur + identité Cursor
- Pas de base distante (démo) — isolation via `companyId`

## Problèmes prioritaires
1. Pas de framework de tests (Vitest/Playwright) — uniquement un script tsx
2. UX : états vides/erreurs/toasts incomplets, chat affiche le markdown brut
3. Remises déclarées dans les types mais absentes du parcours
4. Parser IA : pas de matching désignation catalogue (uniquement références)
5. Accessibilité : labels/aria/focus partiels
6. Pages listes sans validation riche ni feedback clair
7. Parcours mobile : aperçu devis peu guidé

## Plan cycle 1
- Composants UI partagés + polish pages
- Remises + matching catalogue + tests déterministes
- Vitest + Playwright + lint/build
- Rendu local + captures
