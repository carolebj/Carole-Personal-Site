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
- **Base sécurité** : `../SECURITY.md`, scan de secrets (`npm run security:scan` + hook pre-commit), `.gitignore` durci, audit Git propre.
- **`/api/translate` authentifié** (session Supabase requise) + **bouton « Traduire » câblé** (`src/admin/translate.ts`).
- **Docs de guidage réorganisés** sous `docs/` (`AGENTS.md` à la racine sert de routeur).

## À faire (prochaine session) 🔜

### Priorité 1 — Blog ✅ (faite 2026-06-10)
- [x] **Versionnage = brouillon/publié** (décision retenue). Pas de migration SQL :
  le `status` (`"draft" | "published"`) vit dans le JSONB `data` de
  `cms_documents`. Nouveaux articles créés en **brouillon** ; bouton
  **Publier / Repasser en brouillon** + badge de statut dans l'éditeur, badge
  « Brouillon » dans la liste. Les pages publiques (`Blog`, `BlogArticle`)
  filtrent via `isPublishedPost` (un doc sans `status` reste public — rétrocompat).
  Limite connue : la RLS publique laisse lire toutes les lignes ; les brouillons
  sont filtrés **côté client** (acceptable pour ce portfolio, pas de fuite UI).
- [x] **Aperçu = page publique** : rendu unifié via le composant partagé
  `src/app/pages/BlogArticleContent.tsx`, utilisé par `BlogArticle.tsx` (public)
  et `BlogPreview.tsx` (dashboard). Au passage, **bug corrigé** : le `body` est
  du texte simple (paragraphes séparés par lignes vides), il était rendu via
  `PortableText` (attendait des blocs) → cassé sur le site public **et** sur la
  home (`manifesto`/`about`). Types `body` rendus honnêtes (`LocalizedValue`).
- [x] **Flux création → aperçu → publication** vérifié et **automatisé** dans
  `scripts/verify-dashboard.mjs` (crée un brouillon, prévisualise, publie, puis
  nettoie). `npm run cms:verify` → `🎉 Vérification dashboard OK`.

### Priorité 2 — Polissage dashboard ✅ (faite 2026-06-10)
- [x] **Alignements** : lignes de liste `items-start`, toolbar éditeur en `flex-wrap`,
  aide des champs empilée sur mobile, bouton supprimer des listes localisées recentré.
- [x] **Parité contenu** (principaux écarts corrigés) :
  - Footer lit `siteSettings.instagram` / `linkedin` / `contactEmail` et les services
    depuis Supabase (plus seulement i18n).
  - Home utilise `hero.portrait` et `about.image` du CMS (fallback assets locaux).
  - Lectures & références utilise `book.image` du CMS pour les couvertures.
  - Collections Supabase vides ne retombent plus sur i18n (`usingCms` même si `[]`).
- [x] **Suppression** : confirmation, rollback + toast en cas d'erreur, invalidation
  du cache public (`clearCmsCache`) après save/delete.

### Priorité 2 — Reste optionnel 🔜
- [ ] Titres de section Home (services, témoignages, contact) éditables via CMS.
- [ ] Page `/about` et en-tête CV encore 100 % i18n.
- [ ] Collection `category` orpheline (Blog n'en dépend pas).
- [ ] SEO depuis `siteSettings`.

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
- Guides : `../GUIDELINE.md`, `MEMORY.md`, `../workflows/AGENT_DEV.md`, `../SECURITY.md`.
