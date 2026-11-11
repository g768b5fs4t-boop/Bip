# DevisRapide IA V2 — configuration externe

## Fonctionne sans configuration
- Démo locale (localStorage)
- Parser déterministe
- Parcours 3 étapes, PDF, PWA, dark mode
- Dictée Web Speech (Chrome/Android ; Safari variable)

## Pour activer les briques SaaS

| Variable | Utilité | Coût typique |
|----------|---------|--------------|
| `OPENAI_API_KEY` | IA devis structurée + Whisper | Payant à l’usage |
| `OPENAI_MODEL` | Modèle chat (défaut `gpt-4o-mini`) | Inclus usage |
| `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` + `SUPABASE_SECRET_KEY` (ou anon/service_role legacy) | Comptes + sync + RLS | Gratuit au démarrage |
| `RESEND_API_KEY` + `EMAIL_FROM` | Envoi devis e-mail | Gratuit petit volume |

1. Copier les variables vers Vercel (voir aussi `docs/SECURITE-AUTH-V3.md`).
2. Appliquer `001_init.sql` puis `002_vat_rates_grants.sql` dans Supabase.
3. Ne jamais exposer `OPENAI_API_KEY` / `SUPABASE_SECRET_KEY` au navigateur.
4. En production, la démo ouverte est désactivée : compte e-mail requis.

## Déploiement Vercel (projet bip)
1. Merger la PR V2.
2. Ajouter les variables dans Vercel → Project → Settings → Environment Variables.
3. Redeploy. Pas de nouveau projet temporaire.
