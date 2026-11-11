# Audit V2 — point de départ

## Existant opérationnel
- Next.js 16 + Tailwind + Zustand (localStorage)
- Parser devis déterministe + calculs HT/TVA/TTC
- PDF serveur, auth Cursor identity / démo ouverte Vercel
- Vitest + Playwright

## Lacunes V2
- Pas de Supabase / multi-device
- IA simulée (parser regex)
- Pas de dictée réelle
- UX desktop-first, pas de PWA / dark mode / bottom nav
- Pas d’envoi e-mail
- Pas de parcours 3 étapes « 2 minutes »

## Stratégie
Couches réelles + bascule claire si config absente (jamais de faux service).
