# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-06-10 WAT

## Current Branch Workflow

- Main production history lives on `main`.
- Redesign work should happen on `dev`, which tracks `origin/dev`.
- Use `npm run build` as the primary regression check because the repo has no formal test, lint, or formatter scripts yet.
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
- Agent verification: `npm run cms:verify` — seed, fresh Vite restart, Playwright checks; then agent opens **one** URL in the **current agent tool's built-in browser** by default (Cursor → MCP `browser_navigate`; Codex/Claude Code → their own preview). System browser (Chrome/Safari) is a secondary option, used only when there's a specific benefit. Default preview path `/dashboard`; URL also written to `.cursor/preview.url`. See `AGENT_DEV.md`.
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

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
