# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-07-11 WAT

## Current Branch Workflow

- Main production history lives on `main`.
- Redesign work should happen on `dev`, which tracks `origin/dev`.
- Use `npm run build` and `npm run typecheck` as regression checks (no formal test or lint scripts yet).
- Vercel should keep `main` as the production branch and use `dev` as the review/preview branch until Carole validates the redesign.
- Vercel build settings: framework `Vite`, build command `npm run build`, output directory `dist`.
- `vercel.json` rewrites all routes to `/index.html` so React Router deep links can load correctly on Vercel.
- Vercel project `carole-portfolio` exists under `stevens-projects-db687a83`; the canonical public domain is `https://www.carolebj.com`, with `https://carolebj.com` redirected to it. The `carole-portfolio.vercel.app` alias remains technical only.
- Vercel GitHub integration is connected to `mrstev3n/Carole-Portfolio-version-1.0`.
- Git author email is now `stevenkejjad@gmail.com`; this fixed Vercel's commit-author validation.
- Current production alias points to the `main` deployment; current `dev` branch preview is `https://carole-portfolio-git-dev-stevens-projects-db687a83.vercel.app`.
- Vercel Authentication is disabled for the project; both production and `dev` preview URLs are publicly reachable without login.
- The Supabase Free project was restored from an inactivity pause on 2026-07-11. Production runs a secured daily Vercel Cron keepalive (`/api/supabase-keepalive`, 06:17 UTC) that performs three minimal public CMS reads; `CRON_SECRET` must remain configured only on Vercel Production.
- Vercel must define `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` for both Preview and Production; otherwise
  `/dashboard` intentionally runs in local demo mode and public pages use i18n
  fallbacks. Redeploy after changing these build-time variables.
- The legacy `/admin` URL redirects to `/dashboard`.

## CMS Direction — Custom Dashboard + Supabase

Sanity Studio has been **replaced** by a fully custom admin dashboard backed by Supabase.

### Dashboard
- Lives at route `/dashboard` (lazy-loaded, outside the main `Layout`).
- All dashboard source code is in `src/admin/`.
- Schema-driven: content types and fields are defined in `src/admin/schema.ts`; forms are generated from that definition.
- Authentication: email + password via Supabase Auth. Only authenticated users can write.
- When `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are absent, the dashboard falls back to a `localStorage` demo store (useful for local UI work without a real backend).

### Supabase Backend
- Project URL: `https://ztrcnlirfbmjnzcovpgj.supabase.co`
- `cms_documents` contient la copie de travail authentifiée (brouillon, ordre,
  métadonnées, corbeille).
- `cms_public_documents` contient uniquement le dernier snapshot publié et est
  la seule table de contenu lisible publiquement.
- `cms_revisions` conserve les 10 dernières sauvegardes par document.
- Migration additive : `supabase/migrations/20260610194517_editorial_workflow.sql`.
- RLS : lecture publique uniquement sur les snapshots publiés ; gestion des
  brouillons et révisions réservée aux comptes authentifiés.
- Media assets in a `media` Storage bucket (public read, authenticated write).
- Database schema and RLS policies: `supabase/schema.sql`.
- Seed: `npm run cms:seed` ajoute seulement les documents absents. La remise à
  zéro exige `npm run cms:reset -- --confirm=RESET_CMS` et crée d'abord un export.
- Agent verification: `npm run cms:verify` est non destructif et nettoie
  uniquement ses documents `__E2E__`. `--seed` initialise les contenus manquants.
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` (new Supabase recommended key); `VITE_SUPABASE_ANON_KEY` is accepted as fallback for older setups.

### Content Types
Singletons (one doc per type): `homePage`, `aboutPage`, `cvPage`, `siteSettings`.
`homePage` groups: `hero`, `manifesto`, `about`, plus home section headings `servicesSection`, `testimonialsSection`, `contactSection` (titles/subtitles editable in dashboard; i18n fallback when CMS off or field empty).
Collections (multiple docs): `service`, `blogPost`, `testimonial`, `cvEntry`.
Blog categories: champ localisé `blogPost.category` (pas de collection séparée — les filtres du blog dérivent des libellés présents sur les articles publiés).
Carnet — Ressources & communautés: `resource` (plateformes/outils), `community` (communautés africaines).
Carnet — Lectures & références: `book` (ouvrages recommandés), `reference` (articles & newsletters).

The `resource` and `community` types are **distinct** — no "type" selector field. Same principle for `book` vs `reference`. The menu context determines the content type; no ambiguity for the editor.

### Dashboard UX (editor ergonomics)
- Carnet sidebar uses **exclusive accordions**: `Ressources & communautés` and `Lectures & références`. Opening one collapses the other; first click lands on the default child (`Ressources` / `Ouvrages recommandés`).
- Save affordances follow Nielsen-style visibility: **Enregistrer** disabled when nothing changed, active when dirty, spinner while saving, toast on success/error, `Modifications non enregistrées` label, confirm before leaving with unsaved edits.
- Initial content load uses skeleton placeholders instead of a blank wait state.
- Carnet visuals are seeded from existing site assets (`public/cms/resources/` + Supabase Storage upload in `scripts/seed-supabase.mjs`). Book covers use Google Books image URLs.

### Workflow éditorial (2026-06-10)
- Migration appliquée au projet client `ztrcnlirfbmjnzcovpgj` : 30 documents
  préservés, 30 snapshots publics et 30 révisions initiales. Les migrations
  locales portent les mêmes versions que l'historique Supabase.
- `npm run cms:verify` passe sur le projet client : publication, mise à jour,
  restauration de révision, ordre public, dépublication, corbeille, fallback
  public et état d'erreur dashboard. Les documents `__E2E__` sont supprimés en
  `finally`.
- Tous les types, singletons compris, utilisent une copie de travail et une
  publication explicite. Enregistrer ne touche pas au snapshot public.
- Statuts visibles : publié, brouillon, modifications à publier, corbeille.
- Validation centralisée dans `src/admin/schema.ts` + `validation.ts` :
  Accueil/About/Services/Blog bilingues ; Témoignages/Carnet/CV français requis.
- Aperçu FR/EN pour chaque type, ordre manuel des collections, recherche,
  filtres statut/langue/date, historique restaurable et corbeille 30 jours.
- Les slugs sont uniques par type. Les médias orphelins sont nettoyés en différé
  avec `npm run cms:media:cleanup`.
- **Shared reader**: `src/app/pages/BlogArticleContent.tsx` renders the article identically for the public page (`BlogArticle`, `interactive`) and the dashboard preview (`BlogPreview`). It accepts a plain-text `body` (paragraphs split on blank lines via `bodyToParagraphs`), PortableText blocks (legacy), or `sections` (i18n fallback).
- **Bug fixed**: `body` is plain localized text, not PortableText. It was being passed to `<PortableText>` on the public blog page **and** the home `manifesto`/`about` sections (broken render). Types are now honest (`body?: LocalizedValue`); `Home.tsx` renders paragraphs via `bodyToParagraphs`.
- **Verification**: le script couvre brouillon invisible, aperçu FR/EN,
  publication et mise à jour, stabilité du snapshot public pendant l'édition,
  restauration de révision, ordre public, dépublication, corbeille/restauration
  et erreurs réseau avec fallback/réessai.
- **Bugs révélés par l'E2E** : l'égalité dirty est désormais indépendante de
  l'ordre des clés JSON ; l'horodatage technique utilise `publishedAtMeta` et
  n'écrase plus le champ éditorial `blogPost.publishedAt`.
- **Parité contenu et médias (2026-06-10)** : `npm run cms:backfill` simule une
  fusion récursive qui complète uniquement les valeurs vides ; `-- --apply`
  téléverse les médias, crée les révisions puis republie. La première passe a
  enrichi 14 documents sans écraser les ajustements existants. Les 30 documents
  actifs correspondent aux 30 snapshots publics, sans contenu requis incomplet.
- **Médias pilotés par le dashboard** : portraits accueil/À propos/témoignages,
  couvertures blog et image Open Graph sont dans Supabase Storage avec textes
  alternatifs FR/EN. Les 18 URL d'images publiées ont été vérifiées en HTTP.
- **CMS autoritaire** : dès qu'une lecture Supabase réussit, les pages utilisent
  ses champs et ses collections tels quels. Les dictionnaires i18n ne remplacent
  plus silencieusement un champ CMS vide ; ils restent le fallback global en cas
  d'erreur ou de configuration absente.

### Dashboard polish — delete flow & CMS parity (2026-06-10)
- **Delete safety**: les suppressions passent par une corbeille restaurable ;
  la suppression définitive efface aussi l'historique. Les écritures invalident
  le cache du lecteur public.
- **Empty collections**: `useCmsCollection` sets `usingCms: true` when Supabase fetch succeeds even if `[]` — prevents i18n resurrection after deleting all items.
- **Content parity fixes**: Footer reads `siteSettings` flat social fields + CMS services; Home uses CMS hero portrait and about image; Readings uses CMS book cover URLs. `CmsSiteSettings` typed with `instagram` / `linkedin`.
- **Admin UI**: collection rows `items-start`, editor toolbar wraps, localized list delete button alignment.

### Remaining optional work (2026-06-10)

Suivi détaillé dans **`docs/project/NEXT_STEPS.md`** (priorités 1–4) :

- ~~Home section headings via CMS~~ — `homePage.servicesSection`, `testimonialsSection`, `contactSection` (2026-06-10)
- ~~About page + CV header via CMS~~ — `aboutPage`, `cvPage` singletons (2026-06-10)
- ~~Orphan `category` collection~~ — supprimée (2026-06-10) ; taxonomie blog = `blogPost.category` localisé
- ~~SEO metadata from `siteSettings`~~ — `seoPages`, `siteUrl`, `ogImage` ; `src/app/components/Seo.tsx` + overrides articles/services (2026-06-10)

### Public Site Data Layer
- Hook file: `src/cms/cmsContent.ts` — exports `useCmsCollection(type, fallback)`, `useCmsSingleton(type, fallback)`, and `cmsImageUrl(image)`.
- Ces hooks lisent les snapshots publiés. Une collection vide réussie reste
  vide ; une erreur réseau ou de schéma déclenche le fallback i18n et expose
  également un champ `error`.
- **All** public pages now read from Supabase: `Home`, `About`, `Services`, `ServiceDetail`, `Blog`, `BlogArticle`, `Cv` (header + entries), `Navbar`, `Footer`, `ToolsInspirations`, `ReadingsReferences`.
- Images are flat public URLs (`CmsImage = { url, alt }`); resolve with `cmsImageUrl()`.
- `i18n` locales (`fr.tsx`, `en.tsx`) are now **fallback only**, not the primary source of truth.

### Sanity — REMOVED (2026-06-10)
- Sanity is fully removed: packages (`sanity`, `@sanity/client`, `@sanity/image-url`), `src/cms/client.ts`, `queries.ts`, `useSanityQuery.ts`, `studio/`, `sanity.config.ts`, `sanity.cli.ts`, `scripts/embed-studio.mjs`, `scripts/dev.mjs`, `scripts/migrate-categories.mjs`, and all `VITE_SANITY_*` / `SANITY_STUDIO_*` env vars.
- `vite.config.ts` no longer has the Sanity vendor chunk or the `/admin` → Studio redirect.
- Do not reintroduce Sanity. Content changes go through the dashboard + `scripts/seed-supabase.mjs`.

## Active Redesign Direction

- The portfolio is being refactored from a classic community-manager portfolio into a digital communications officer portfolio for Carole T., with social media as one part of a broader communication role.
- Design source: Figma file `bHEzxP453lgz2LGEqWnOZl`, node `1:3`.
- The visual direction is warm editorial minimalism: cream surface, plum/rose accents, peach/terracotta support colors, large Newsreader headlines, compact Inter navigation and labels.
- Current page structure:
  - editorial hero
  - manifesto
  - about/presentation
  - services bento grid
  - service detail routes at `/services/:slug`
  - design brief wizard at `/services/brief-design` for graphisme / logo / visual identity intake
  - testimonials
  - contact/get-in-touch form section
  - CV route at `/cv` with Carole's education, skills, achievements, languages, and communications experience
  - simplified footer with social/contact links and language switcher
  - blog placeholder route at `/blog`
  - Carnet routes at `/carnet/ressources` (ToolsInspirations) and `/carnet/lectures` (ReadingsReferences)
- Current design decisions:
  - keep the globally reduced scale validated on a 13-inch MacBook: lower nav height, smaller max content width, lower hero title/image caps, tighter buttons, and reduced section padding
  - use the Figma-derived hero/about portraits and exported decorative arc
  - use local Liberation Serif Italic for manifesto accent text
  - keep hero and manifesto backgrounds visually continuous, with the about section on white
  - show service card color corners on hover only
  - keep motion subtle: light section entry fades, service hover lifts, and hero visual levitation only
  - the desktop header collapses on downward scroll into a centered logo pill, returns on upward scroll or when the pill is clicked
  - testimonials use a three-card carousel with the centered card as the active state
  - blog article links use continuity/view transitions from list cards to article pages
  - Carnet pages use a minimal document-like layout with search and interactive resource cards
  - Carnet resource cards keep imagery dominant at rest, reveal the “À propos” copy through blur on hover/focus, and open the external resource from the entire card rather than a nested CTA
  - the footer reveal should behave like a temporary pull-beyond-footer moment with a gentle colorful wave shader
  - subtle audio haptics are enabled by default and can be toggled from the logo right-click menu
  - the design brief wizard is a direct meeting/intake tool: adaptive French questions, local browser persistence, review-before-submit, Supabase submission (`design_brief_submissions`), private `brief-assets` storage, and an authenticated dashboard view under "Briefs design"
  - CLOGIS was split into its own project on 2026-06-28: `/Users/mrsteven/Documents/GitHub/CLOGIS`. The brief originally came through Carole's design brief flow, but project follow-up, memory, sources, and deliverables should now live in the CLOGIS project.

## Implementation Notes

- Keep routing in `src/app/routes.tsx` → `Layout` for public pages; `/dashboard/*` is outside `Layout`.
- User-facing copy stays in `src/app/i18n/locales/fr.tsx` and `src/app/i18n/locales/en.tsx` as fallback. As dashboard content grows, i18n values become increasingly redundant — do not add new copy to i18n if it will be managed from the dashboard.
- Responsive breakpoints: mobile `<768px`, tablet `768px-1023px`, desktop `>=1024px`.
- SEO metadata: `src/app/components/Seo.tsx`.
- Public crawler files: `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`.
- Language selection: detected from browser, persisted in `localStorage` under `portfolio-lang`.
- Theme: `src/app/theme/ThemeContext.tsx`, follows `prefers-color-scheme`, persists under `portfolio-theme`.
- Haptics: `src/app/interactions/HapticContext.tsx`, persists under `portfolio-haptics`.
- Public pages are route-lazy-loaded in `src/app/routes.tsx`.
- The Cal.com booking widget is isolated in `src/app/components/CalMeetingEmbed.tsx` and lazy-loaded.
- Design tokens: `src/styles/tokens.css` (primitives, semantics, dark-mode); `src/styles/global.css` (base styles).
- **UI design system (2026-06-10)** — public pages use semantic Tailwind tokens (`bg-surface-page`, `text-text-accent`, etc.) from `tokens.css`. Shared layout: `src/app/components/layout/publicPage.ts` (`PAGE_MAIN` = `pt-28 md:pt-36`). Shared components: `SectionEyebrow`, `PageHero`, `ContactForm`. Border-radius rule: cards `rounded-lg`, primary CTAs `rounded-full`, inputs `rounded-md` (contact page panels may use `rounded-xl`). Carnet pages share tokens but keep muted eyebrows (`text-text-muted`).

## Repo Organization & Security (2026-06-10)

- **Guidance docs moved under `docs/`.** Entry point stays `AGENTS.md` at repo
  root (auto-discovered by Cursor/Codex/opencode/Claude Code) and acts as a
  router. Layout:
  - `docs/GUIDELINE.md`, `docs/SECURITY.md`
  - `docs/workflows/AGENT_DEV.md`
  - `docs/project/MEMORY.md`, `docs/project/NEXT_STEPS.md`
  - `README.md` and `ATTRIBUTIONS.md` stay at root.
- **Security model documented in `docs/SECURITY.md`** (secret locations, no
  secret behind a `VITE_` prefix, rotation, incident runbook). Git history is
  clean; `.env.local` is gitignored.
- **Secret-scan guardrail**: `npm run security:scan` + a versioned pre-commit
  hook (`scripts/git-hooks/`, scanner `scripts/check-secrets.mjs`). Install once
  per clone with `npm run security:install-hooks`. Blocks commits containing
  secrets or `.env*` files (except `.env.example`).
- **`/api/translate` is now authenticated**: it requires a valid Supabase
  session (`Authorization: Bearer <access_token>`) before calling the
  translation service; CORS allows the `Authorization` header
  (`TRANSLATE_ALLOWED_ORIGIN` optional). The OpenAI key never reaches the
  browser (flow: client → endpoint → Cloudflare Worker/AI Gateway → OpenAI).
- **Document-level translation control** (`src/admin/TranslateMenu.tsx` +
  `src/admin/translateDoc.ts`): split button in the editor toolbar. Main click =
  translate **all filled** FR localized fields; caret = **targeted** dropdown to
  translate one field. A **confirmation modal** (mentions ChatGPT cost + field
  count) gates every run — token economy guard against accidental clicks. Calls
  the authenticated `/api/translate` (so only works deployed; disabled in demo
  mode / when Supabase isn't configured). The per-field "Traduire" button was
  removed; per-field "Copier FR" stays. Results surfaced via the toast system.
- **Still required (manual, dashboards)**: OpenAI monthly budget/hard limit and
  Cloudflare AI Gateway rate limit (see `docs/SECURITY.md` §5).
- **AI translation verified end-to-end (2026-06-12)**: authenticated dashboard
  action → Vercel `/api/translate` → Cloudflare Worker/AI Gateway → OpenAI.
  A targeted field translation succeeded on the deployed `dev` dashboard; the
  test was closed without saving and the persisted Supabase content stayed
  unchanged.
- **Public performance baseline (2026-06-12)**: the home animation uses the MP4
  source only; the redundant 13.9 MB QuickTime asset was removed. The production
  build is about 4.3 MB total. The footer WebGL canvas resizes through a
  `ResizeObserver` instead of reading and rewriting layout every animation
  frame.
- **CMS verification reliability**: history checks must wait for the async
  loading state instead of using fixed delays. Revision lists use
  `created_at DESC, revision_id DESC` so rapid consecutive saves remain
  deterministic.

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
