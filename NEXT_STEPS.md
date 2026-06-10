# NEXT STEPS — document de passation (temporaire)

> Brouillon de travail pour reprendre la prochaine session. À supprimer une
> fois les items repris dans `MEMORY.md` / traités. Dernière mise à jour :
> 2026-06-10.

## Où on en est (fait ✅)

- **CMS custom Supabase** opérationnel sur `/dashboard` (auth + données + Storage).
- **Sanity entièrement retiré** (Studio, client, GROQ, paquets, env, configs).
- **Toutes les pages publiques** lisent Supabase (`useCmsCollection` / `useCmsSingleton`) avec i18n en fallback.
- **UX dashboard** : accordéons Carnet exclusifs, types non ambigus (resource/community, book/reference), états save (dirty/saving/saved), toasts, garde « modifications non enregistrées », skeletons de chargement.
- **Tags = filtres** côté carnet (`type: "tags"` dans `schema.ts`).
- **Visuels carnet seedés** depuis les assets existants (`public/cms/resources/` + upload Storage).
- **Aperçu blog** dans le dashboard : `src/admin/BlogPreview.tsx`.
- **Workflow agent autonome** : `npm run cms:seed`, `cms:verify`, `cms:preview` (navigateur interne par défaut).
- 4 commits poussés sur `dev` + vérif end-to-end OK.

## À faire (prochaine session) 🔜

### Priorité 1 — Blog
- [ ] **Versionnage des articles** (non implémenté). Décider : historique simple (snapshots) vs brouillon/publié vs autosave. → impacte `supabase/schema.sql` (table `*_revisions` ou champ `status`/`published_at`) et l'éditeur.
- [ ] Finaliser l'**aperçu article** : garantir un rendu strictement identique à la page de lecture publique (`BlogArticle.tsx`) depuis `BlogPreview.tsx`.
- [ ] Vérifier le flux complet création → aperçu → publication d'un article.

### Priorité 2 — Polissage dashboard
- [ ] Repasser sur les **soucis d'alignement** signalés dans les listes/formulaires.
- [ ] Confirmer que **tout ce qui est sur le site est éditable** depuis le dashboard (parité contenu site ↔ dashboard, plus de dépendance i18n hors fallback).
- [ ] Suppression depuis le dashboard → vérifier la répercussion propre côté site public.

### Priorité 3 — Hygiène / finition
- [ ] Décider du sort de `NEXT_STEPS.md` (reporter dans `MEMORY.md` puis supprimer).
- [ ] Envisager un script de typecheck dédié (`tsc --noEmit`) — erreurs préexistantes connues : `App.tsx` (`fallbackElement`), `Home.tsx` (`Testimonial.portrait`) ; non bloquantes pour le build Vite.
- [ ] Nettoyer `cloudflare/translate-worker/README.md` (mentionne encore Sanity, cosmétique).

## Pour reprendre vite (commandes)

```bash
npm run dev:site     # serveur + /dashboard
npm run cms:seed     # (re)peupler Supabase
npm run cms:verify   # seed + checks navigateur
```

Identifiants seed/verify : `.env.local` (`CMS_SEED_EMAIL` / `CMS_SEED_PASSWORD`).

## Points de repère code

- Dashboard : `src/admin/` (schéma piloté par `schema.ts`, vues `views.tsx`, app `AdminApp.tsx`).
- Reader public : `src/cms/cmsContent.ts` (`useCmsCollection`, `useCmsSingleton`, `cmsImageUrl`).
- Types contenu : `src/cms/types.ts` (`CmsImage`, `CmsBlogPost`, etc.).
- Seed/outillage : `scripts/seed-supabase.mjs`, `scripts/verify-dashboard.mjs`, `scripts/dev-utils.mjs`.
- Schéma DB : `supabase/schema.sql`.
- Guides : `GUIDELINE.md`, `MEMORY.md`, `AGENT_DEV.md`.
