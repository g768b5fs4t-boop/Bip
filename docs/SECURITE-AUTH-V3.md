# DevisRapide IA — Auth, Supabase & sécurité (V3)

## Ce qui change
- Repli déterministe si OpenAI renvoie 429/5xx ; pas de détail technique au client.
- Sync réelle Supabase (entreprise, fournisseurs, produits, clients, devis) via JWT + RLS.
- Auth e-mail / mot de passe ; cookies httpOnly `dr_access` / `dr_refresh`.
- Mode démo ouverte Vercel **supprimé** pour les API sensibles.
- Démo locale uniquement hors Vercel (dev / Playwright).

## Variables Vercel
| Nom | Obligatoire SaaS |
|-----|------------------|
| `SUPABASE_URL` | oui |
| `SUPABASE_PUBLISHABLE_KEY` | oui |
| `SUPABASE_SECRET_KEY` | oui (inscription admin) |
| `OPENAI_API_KEY` | optionnel |
| `OPENAI_MODEL` | optionnel (`gpt-4o-mini`) |
| `RESEND_API_KEY` + `EMAIL_FROM` | optionnel e-mail |

## SQL à exécuter
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_vat_rates_grants.sql`

## Actions opérateur
1. Appliquer les migrations SQL.
2. Harmoniser les env Vercel (noms ci-dessus).
3. Recharger crédits OpenAI si IA cloud souhaitée.
4. Merger la PR puis laisser Vercel redéployer **bip** (pas de déploiement temporaire).
