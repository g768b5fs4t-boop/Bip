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
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Comptes + sync + RLS | Gratuit au démarrage |
| `RESEND_API_KEY` + `EMAIL_FROM` | Envoi devis e-mail | Gratuit petit volume |

1. Copier `.env.example` vers les secrets Vercel / Cursor.
2. Appliquer `supabase/migrations/001_init.sql` dans Supabase.
3. Ne jamais exposer `OPENAI_API_KEY` / `SERVICE_ROLE` au navigateur.

## Déploiement Vercel (projet bip)
1. Merger la PR V2.
2. Ajouter les variables dans Vercel → Project → Settings → Environment Variables.
3. Redeploy. Pas de nouveau projet temporaire.
