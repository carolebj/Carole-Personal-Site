# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Personal Site repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-07-14 WAT

## Current Branch Workflow

- Main production history lives on `main`.
- Redesign work should happen on `dev`, which tracks `origin/dev`.
- On 2026-06-21, `dev` was reconciled with the latest `main` brief-design/admin
  workflow changes while preserving the full services pages on `dev`.
- Use `npm run build` and `npm run typecheck` as regression checks (no formal test or lint scripts yet).
- Vercel should keep `main` as the production branch and use `dev` as the review/preview branch until Carole validates the redesign.
- Vercel build settings: framework `Vite`, build command `npm run build`, output directory `dist`.
- `vercel.json` rewrites all routes to `/index.html` so React Router deep links can load correctly on Vercel.
- Vercel project `carole-personal-site` belongs to **Carole’s Team**. The canonical public domain is `https://www.carolebj.com`, with `https://carolebj.com` redirected to it; public documentation and links must use the canonical domain rather than a technical `.vercel.app` alias.
- Vercel GitHub integration is connected to `carolebj/Carole-Personal-Site`.
- When the GitHub repository is private, the Vercel Hobby workflow requires
  production releases to end with a commit created by Carole's GitHub account,
  which owns the linked Vercel team. This rule is currently suspended because
  the repository was made public on 2026-07-14. While it remains public,
  contributor-authored branch pushes and pull requests may use Vercel's free
  public-repository collaboration path; confirm this with the first deployment
  created after the visibility change. If the repository becomes private
  again, contributors must return to a dedicated branch and Carole must merge
  into `main` with **Create a merge commit** so the release ends with her commit.
- Current production points to the `main` deployment. Use the branch deployment listed by Vercel for `dev` reviews instead of persisting a generated preview URL in documentation.
- Vercel Authentication is disabled for the project; both production and `dev` preview URLs are publicly reachable without login.
- The Supabase Free project was restored from an inactivity pause on 2026-07-11. Production runs a secured daily Vercel Cron keepalive (`/api/supabase-keepalive`, 06:17 UTC) that performs three minimal public CMS reads; `CRON_SECRET` must remain configured only on Vercel Production.
- Vercel must define `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` for both Preview and Production; otherwise
  `/dashboard` intentionally runs in local demo mode and public pages use i18n
  fallbacks. Redeploy after changing these build-time variables.
- The legacy `/admin` URL redirects to `/dashboard`.
- The Services page uses a CMS-controlled `featured` flag for the single “offre en vogue”. The featured service receives the large editorial spotlight but remains present in the complete offer list. Editors can switch the featured published service directly from the Services collection list in the dashboard.

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

### Completed CMS foundation work (2026-06-10)

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
  - a site-wide copywriting and UX-writing pass is planned across public pages
    and blog articles, starting with the About page. Challenge information
    hierarchy, repetition, paragraph length, CTA clarity, microcopy and FR/EN
    parity; preserve verified facts, review proposals before publication, and
    apply validated wording through the CMS-authoritative content workflow.
    Favor a fluid, pleasant reading rhythm over aggressive compression, use
    logical connectors when they genuinely advance the thought, and avoid
    disruptive colon-led turns in public-facing body copy. On the About page,
    describe the professional posture and quality of the collaboration without
    exposing a detailed methodology or turning the page into a service list.
    Before validation, reread the entire page as one continuous text so that
    adjacent sections do not recycle the same promises or vocabulary. The
    closing transition may welcome readers whose needs are still taking shape,
    while the final CTA separately explains what to share to begin the exchange
  - the About page copywriting pass was validated and published on 2026-07-14.
    Its CMS model now uses `support` for the single “Comment je vous accompagne”
    block. The former `work` and `approach` fields are removed from the active
    working document and public snapshot during targeted synchronization; CMS
    revisions may retain them as intentional editorial history. Track every
    remaining public-page copywriting pass as its own top-level TickTick task
    rather than as a subtask of About. Plan a separate site-wide cleanup to
    identify unused fields, orphaned content and CMS data no longer consumed by
    the public or dashboard applications
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
  - Carnet resource cards keep imagery dominant at rest, anchor their title block 24px from the bottom, and reveal the “À propos” panel with a controlled slide/blur on hover or focus; touch layouts keep the description visible, and the entire card opens the external resource
  - Known book covers are losslessly optimized local JPEG assets; the public reading page prefers them over Google Books URLs and the 3D book texture uses CSS rather than a remote asset
  - Reading references use editorial object metaphors by type: newsletters render as ring-bound ruled notebooks, while cited content renders as taped sticky notes with a folded corner
  - the footer reveal should behave like a temporary pull-beyond-footer moment with a gentle colorful wave shader
  - subtle audio haptics are enabled by default and can be toggled from the logo right-click menu
  - the design brief wizard is a direct meeting/intake tool: adaptive French questions, local browser persistence, review-before-submit, Supabase submission (`design_brief_submissions`), private `brief-assets` storage, and an authenticated dashboard view under "Briefs design"
  - CLOGIS was split into its own project on 2026-06-28: `/Users/mrsteven/Documents/GitHub/CLOGIS`. The brief originally came through Carole's design brief flow, but project follow-up, memory, sources, and deliverables should now live in the CLOGIS project.
  - services redesign first pass (2026-06-21): `/services` uses an editorial
    offer-map layout, prioritizes the visual identity offer when present, and
    each service detail page now reads like a working brief with frame,
    deliverables, audience, applications, and next-service navigation.
  - new service: `identite-visuelle` / Visual Identity covers logo, brand
    guidelines, art direction, and digital brand assets. It is the bridge to
    `/services/brief-design`. It was added to i18n fallback and seeded
    additively into Supabase without overwriting existing content.
  - blog/testimonials content pass (2026-06-21): public testimonials use real
    portrait photography instead of illustrated placeholders; blog articles use
    real photo covers, varied dates, and more concrete editorial topics. The
    featured post is the case study `/blog/cas-client-coworking-cotonou`, and
    the Services menu case-study card now links to this blog article instead of
    a service detail page. CMS blog/testimonial documents were synchronized
    directly because Supabase is authoritative when configured.

## Implementation Notes

- The About page keeps its image field CMS-authoritative and uses the bundled
  `src/assets/carole-about-portrait.avif` portrait as the local fallback.
- The published `siteSettings` document uses `https://www.carolebj.com` as
  its canonical `siteUrl`. The cross-platform link preview uses the optimized
  1200×630 `public/carole-tonoukouen-social-preview.png` asset as its default
  Open Graph image and X Card image (`twitter:*` remains the technical metadata
  namespace used by X).
- `npm run cms:sync-i18n -- --only=<type>/<docId>` previews one CMS document;
  adding `--apply` saves and publishes only that target. Use the targeted form
  for page-by-page copy changes so unrelated editorial documents are preserved.
- The published `siteSettings` document uses Carole's Behance profile
  (`https://www.behance.net/caroletonoukouen`) and no longer carries the legacy
  Instagram placeholder. Its LinkedIn URL is
  `https://www.linkedin.com/in/caroletonoukouen/`.
- Contact forms submit to the server-only Vercel function `/api/contact`, which
  targets Carole's Gmail through her dedicated Resend account. Resend's
  **Emails > Sending** view is the operational delivery log; do not duplicate
  it with a mailbox inside the site dashboard. `RESEND_API_KEY` and
  `CONTACT_FROM_EMAIL` are encrypted on Vercel Preview + Production and must
  remain server-only. `carolebj.com` is verified in Resend through DKIM, SPF and
  MX records hosted at Namecheap, and the configured sender is
  `Carole Tonoukouen <contact@carolebj.com>`. A preview test from that sender was
  marked `Delivered` on 2026-07-12. Contact-message subjects use the identifying
  prefix `[Carole Site]`; do not reintroduce the word “portfolio” in this email
  label. The production contact form and branded HTML notification were
  validated end to end in Gmail on 2026-07-12. Production hardening still
  requires a durable anti-abuse layer.
  Resend Receiving is enabled for `carolebj.com`; Namecheap routes the root MX
  to `inbound-smtp.eu-west-1.amazonaws.com`. The production endpoint
  `/api/resend-inbound` verifies signed `email.received` webhooks, accepts only
  `contact@carolebj.com`, retrieves content and attachments with a separate
  full-access key, then forwards to Carole's Gmail with the original sender in
  `reply_to`. `RESEND_INBOUND_API_KEY` and `RESEND_WEBHOOK_SECRET` are encrypted
  in Vercel Preview + Production. The enabled Resend webhook targets
  `https://www.carolebj.com/api/resend-inbound` and listens for
  `email.received` events. A Gmail-to-`contact@carolebj.com` test completed with
  HTTP 200 on the first webhook attempt and was forwarded back to Gmail.
  Gmail's send-as alias `Carole Tonoukouen <contact@carolebj.com>` was verified
  on 2026-07-12 through the production inbound flow. Gmail can now send from
  the professional address. The contact notification's `reply_to` and branded
  reply button both resolve to the visitor email supplied by the form.
  Contact-form notifications use a branded HTML email based on the validated
  warm editorial proposal: segmented color strip, CT monogram, serif subject,
  sender identity card, plum reply button and compact transactional footer.
- Gmail uses two signatures for both `caroletonoukouen@gmail.com` and
  `contact@carolebj.com`: `Carole 01`, the full branded signature for new
  messages, and `Carole — Réponses`, a two-line compact signature for replies
  and forwards. The compact variant lives at
  `public/email-signature/replies.html`; Carole's serif name links to
  `https://www.carolebj.com` without an underline, followed by her role and a
  slim salmon accent rule.
  `api/contact-email.js` owns this template, escapes every visitor-controlled
  value, and `api/contact.js` retains a plain-text fallback plus `reply_to`.

- Keep routing in `src/app/routes.tsx` → `Layout` for public pages; `/dashboard/*` is outside `Layout`.
- User-facing copy stays in `src/app/i18n/locales/fr.tsx` and `src/app/i18n/locales/en.tsx` as fallback. As dashboard content grows, i18n values become increasingly redundant — do not add new copy to i18n if it will be managed from the dashboard.
- Responsive breakpoints: mobile `<768px`, tablet `768px-1023px`, desktop `>=1024px`.
- SEO metadata: `src/app/components/Seo.tsx`.
- Public crawler files: `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`.
- Language selection: detected from browser, persisted in `localStorage` under `portfolio-lang`.
- Theme: `src/app/theme/ThemeContext.tsx`, follows `prefers-color-scheme`, persists under `portfolio-theme`.
- Haptics: `src/app/interactions/HapticContext.tsx`, persists under `portfolio-haptics`.
- Audio haptic peak gains are `0.024` for hover and `0.046` for click (raised from `0.014` / `0.028` on 2026-07-11, about +4.7 dB); keep them subtle and preserve the explicit toggle in the logo context menu.
- Public pages are route-lazy-loaded in `src/app/routes.tsx`.
- `dev` and `main` share the same Supabase CMS. Testimonials can be held back on production with the build-time flag `VITE_ENABLE_CMS_TESTIMONIALS=false`; previews and local development default to CMS testimonials when the flag is absent or `true`.
- Lightweight public route chunks are preloaded during the browser's first idle period, hashed `/assets/*` files use immutable one-year caching on Vercel, and public CMS reads enter a 30-second cooldown after a network failure instead of retrying on every page mount.
- Hover hit areas must remain geometrically stable: animate imagery or inner content, not the clickable card container itself, to prevent edge-triggered enter/leave vibration.
- The Cal.com booking widget is isolated in `src/app/components/CalMeetingEmbed.tsx` and lazy-loaded. It targets `meetcarole/rendez-vous`: 45-minute meetings, hourly starts, Monday-Friday 20:00-22:00, Saturday 10:00-12:00 and 15:00-22:00, Sunday unavailable, in `Africa/Porto-Novo`. The event always requires manual confirmation, explains the 24-hour review window, and requires cancellation reasons from both host and attendee.
- Design tokens: `src/styles/tokens.css` (primitives, semantics, dark-mode); `src/styles/global.css` (base styles).
- **UI design system (2026-06-10)** — public pages use semantic Tailwind tokens (`bg-surface-page`, `text-text-accent`, etc.) from `tokens.css`. Shared layout: `src/app/components/layout/publicPage.ts` (`PAGE_MAIN` = `pt-28 md:pt-36`). Shared components: `SectionEyebrow`, `PageHero`, `ContactForm`. Border-radius rule: cards `rounded-lg`, primary CTAs `rounded-full`, inputs `rounded-md` (contact page panels may use `rounded-xl`). Carnet pages share tokens but keep muted eyebrows (`text-text-muted`).

## Operational Task Tracking

- TickTick is the source of truth for actionable work. Use the
  `Carole - Personal site` list in the `Work` folder.
- `docs/project/NEXT_STEPS.md` was retired on 2026-07-13 after its remaining
  actionable items were reconciled with TickTick. Do not recreate a competing
  repository todo file; keep durable decisions here and operational tasks in
  TickTick.

## Repo Organization & Security (2026-06-10)

- **Guidance docs moved under `docs/`.** Entry point stays `AGENTS.md` at repo
  root (auto-discovered by Cursor/Codex/opencode/Claude Code) and acts as a
  router. Layout:
  - `docs/GUIDELINE.md`, `docs/SECURITY.md`
  - `docs/workflows/AGENT_DEV.md`
  - `docs/project/MEMORY.md`
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
