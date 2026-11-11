# DevisRapide IA

Assistant conversationnel pour artisans : catalogues fournisseurs privés, devis HT/TVA/TTC calculés en code déterministe, aperçu et export PDF.

## Démo MVP (cette branche)

Fonctionne **sans carte bancaire** et sans compte cloud obligatoire :

- Connexion démo : `demo@devisrapide.fr` / `demo1234`
- Données fictives (entreprise, clients, fournisseurs, produits)
- Chat IA **simulé** (analyse locale du français) branché sur votre catalogue
- Calculs financiers dans `src/lib/quote-engine.ts` (pas inventés par l’IA)
- Import CSV, gestion clients / produits / entreprise
- Export PDF côté serveur (`pdfkit`)

Les données sont stockées dans le navigateur (`localStorage`) pour la démo.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Tester le parcours devis

1. Se connecter avec les identifiants démo
2. Aller dans **Produits** (références MOT123, TEL456 déjà présentes)
3. Ouvrir **Assistant IA** et coller :

   > Fais-moi un devis pour Monsieur Martin, avec 2 moteurs référence MOT123, 4 télécommandes TEL456, 5 heures de pose et 150 € de déplacement.

4. Vérifier l’aperçu (totaux HT / TVA / TTC)
5. **Valider** puis **Exporter en PDF**

## Services futurs (et pourquoi)

| Besoin | Service | Utilité | Coût typique |
|--------|---------|---------|--------------|
| Vrais comptes + isolation multi-entreprises | **Supabase** (Auth + Postgres + RLS) | Séparer les données artisans, règles de sécurité SQL | Gratuit au démarrage, puis selon usage |
| Compréhension plus riche du langage | **API IA** (OpenAI, Mistral, etc.) | Mieux comprendre les formulations libres | Payant à l’usage — la démo n’en a pas besoin |
| Envoi d’e-mails | Resend / Brevo | Partager un devis validé | Souvent gratuit en petit volume |
| Hébergement | Vercel / autre | Publier l’app en ligne | Gratuit pour un MVP, puis selon trafic |

**Aucun de ces services n’est requis pour tester la démo actuelle.**

## Architecture prévue (SaaS)

- Next.js + TypeScript + Tailwind
- Supabase : auth, Postgres, Row Level Security par `company_id`
- Clés API IA uniquement côté serveur
- Moteur de devis déterministe obligatoire (même avec un LLM)
- PDF généré serveur après validation humaine

## Scripts

- `npm run dev` — développement
- `npm run build` — build production
- `npm run start` — serveur production
- `npm run lint` — ESLint
