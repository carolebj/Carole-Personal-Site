# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-06-10 WAT

## Current Branch Workflow

- Main production history lives on `main`.
- Redesign work should happen on `dev`, which tracks `origin/dev`.
- Use `npm run build` and `npm run typecheck` as regression checks (no formal test or lint scripts yet).
- Vercel should keep `main` as the production branch and use `dev` as the review/preview branch until Carole validates the redesign.
- Vercel build settings: framework `Vite`, build command `npm run build`, output directory `dist`.
- `vercel.json` rewrites all routes to `/index.html` so React Router deep links can load correctly on Vercel.
- Vercel project `carole-portfolio` exists under `stevens-projects-db687a83`; current public alias is `https://carole-portfolio.vercel.app`.
- Vercel GitHub integration is connected to `mrstev3n/Carole-Portfolio-version-1.0`.
- Git author email is now `stevenkejjad@gmail.com`; this fixed Vercel's commit-author validation.
- Current production alias points to the `main` deployment; current `dev` branch preview is `https://carole-portfolio-git-dev-stevens-projects-db687a83.vercel.app`.
- Vercel Authentication is disabled for the project; both production and `dev` preview URLs are publicly reachable without login.

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
- All content stored in a single `public.cms_documents` table: columns `type TEXT`, `doc_id TEXT`, `data JSONB`, `updated_at TIMESTAMPTZ`.
- Row Level Security: public SELECT, authenticated INSERT/UPDATE/DELETE.
- Media assets in a `media` Storage bucket (public read, authenticated write).
- Database schema and RLS policies: `supabase/schema.sql`.
- Seed: `npm run cms:seed` (reads `CMS_SEED_EMAIL` / `CMS_SEED_PASSWORD` from `.env.local`).
- Agent verification: `npm run cms:verify` — seed, fresh Vite restart, Playwright checks; then agent opens **one** URL in the **current agent tool's built-in browser** by default (Cursor → MCP `browser_navigate`; Codex/Claude Code → their own preview). System browser (Chrome/Safari) is a secondary option, used only when there's a specific benefit. Default preview path `/dashboard`; URL also written to `.cursor/preview.url`. See `../workflows/AGENT_DEV.md`.
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` (new Supabase recommended key); `VITE_SUPABASE_ANON_KEY` is accepted as fallback for older setups.

### Content Types
Singletons (one doc per type): `homePage`, `siteSettings`.
Collections (multiple docs): `service`, `blogPost`, `testimonial`, `cvEntry`, `category`.
Carnet — Ressources & communautés: `resource` (plateformes/outils), `community` (communautés africaines).
Carnet — Lectures & références: `book` (ouvrages recommandés), `reference` (articles & newsletters).

The `resource` and `community` types are **distinct** — no "type" selector field. Same principle for `book` vs `reference`. The menu context determines the content type; no ambiguity for the editor.

### Dashboard UX (editor ergonomics)
- Carnet sidebar uses **exclusive accordions**: `Ressources & communautés` and `Lectures & références`. Opening one collapses the other; first click lands on the default child (`Ressources` / `Ouvrages recommandés`).
- Save affordances follow Nielsen-style visibility: **Enregistrer** disabled when nothing changed, active when dirty, spinner while saving, toast on success/error, `Modifications non enregistrées` label, confirm before leaving with unsaved edits.
- Initial content load uses skeleton placeholders instead of a blank wait state.
- Carnet visuals are seeded from existing site assets (`public/cms/resources/` + Supabase Storage upload in `scripts/seed-supabase.mjs`). Book covers use Google Books image URLs.

### Blog — Draft/Published + Shared Reader (2026-06-10)
- **Editorial status** lives in the JSONB `data` (no SQL migration): `status: "draft" | "published"`. A doc **without** `status` is treated as published (backward compatible with pre-draft seed content). New blog posts are created as drafts (`emptyDoc` in `src/admin/store.ts`).
- **Editor** (`src/admin/views.tsx` `DocumentEditor`): blogPost shows a status pill + **Publier / Repasser en brouillon** button (publishing also persists pending edits and stamps `publishedAt` if empty). `CollectionList` shows a **Brouillon** badge.
- **Public filtering**: `isPublishedPost` in `src/cms/types.ts`; `Blog.tsx` and `BlogArticle.tsx` filter drafts before mapping to view models. Known limit: public RLS reads all rows, so drafts are filtered client-side (no UI leak; acceptable for this portfolio).
- **Shared reader**: `src/app/pages/BlogArticleContent.tsx` renders the article identically for the public page (`BlogArticle`, `interactive`) and the dashboard preview (`BlogPreview`). It accepts a plain-text `body` (paragraphs split on blank lines via `bodyToParagraphs`), PortableText blocks (legacy), or `sections` (i18n fallback).
- **Bug fixed**: `body` is plain localized text, not PortableText. It was being passed to `<PortableText>` on the public blog page **and** the home `manifesto`/`about` sections (broken render). Types are now honest (`body?: LocalizedValue`); `Home.tsx` renders paragraphs via `bodyToParagraphs`.
- **Verification**: `scripts/verify-dashboard.mjs` now exercises the full create → preview → publish flow with cleanup. Run `npm run cms:verify`.

### Dashboard polish — delete flow & CMS parity (2026-06-10)
- **Delete safety**: confirm dialog, optimistic UI with rollback + error toast (mirrors `saveDoc`). `removeDoc` / `persistDoc` call `clearCmsCache(type)` so the public site refetches after writes.
- **Empty collections**: `useCmsCollection` sets `usingCms: true` when Supabase fetch succeeds even if `[]` — prevents i18n resurrection after deleting all items.
- **Content parity fixes**: Footer reads `siteSettings` flat social fields + CMS services; Home uses CMS hero portrait and about image; Readings uses CMS book cover URLs. `CmsSiteSettings` typed with `instagram` / `linkedin`.
- **Admin UI**: collection rows `items-start`, editor toolbar wraps, localized list delete button alignment.

### Remaining optional work (2026-06-10)
- Home section headings (services, testimonials, contact) editable via CMS.
- Page `/about` and CV header still 100 % i18n.
- Orphan `category` collection (Blog does not use it).
- SEO metadata from `siteSettings`.

### Public Site Data Layer
- Hook file: `src/cms/cmsContent.ts` — exports `useCmsCollection(type, fallback)`, `useCmsSingleton(type, fallback)`, and `cmsImageUrl(image)`.
- These hooks fetch from Supabase (public RLS read) and fall back to i18n local data when Supabase returns nothing.
- **All** public pages now read from Supabase: `Home`, `Services`, `ServiceDetail`, `Blog`, `BlogArticle`, `Cv`, `Navbar`, `Footer`, `ToolsInspirations`, `ReadingsReferences`.
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
  - the footer reveal should behave like a temporary pull-beyond-footer moment with a gentle colorful wave shader
  - subtle audio haptics are enabled by default and can be toggled from the logo right-click menu

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

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
