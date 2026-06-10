# GUIDELINE.md

Canonical implementation guide for the Carole Portfolio repo. Use this file for commands, architecture, and coding rules. Use `MEMORY.md` for current product/design decisions and living project context.

## Project Description

Carole Portfolio is a bilingual personal portfolio site built with React, Vite, TypeScript, and Tailwind CSS v4.
It renders a single-page editorial social media direction experience for Carole Tonoukouen with sections for hero content, manifesto, about/presentation, services, testimonials, and contact/newsletter footer.
Routing is handled with `react-router` in data-router style, even though the current public surface is effectively a single home page plus error and fallback routes.
Translations are managed with `react-i18next` and support French and English, with browser/localStorage-based language selection.

## Stack Summary

- Runtime: React 18, TypeScript, Vite 6
- Routing: `react-router` via `createBrowserRouter`
- Styling: Tailwind CSS v4, custom theme tokens, utility-first classes
- Animation: `motion`
- UI primitives: Radix UI, Heroicons, selected shadcn-style UI wrappers in `src/app/components/ui`
- i18n: `i18next`, `react-i18next` (public site fallback only — dashboard is the content source)
- CMS: custom admin dashboard at `/dashboard`, backed by **Supabase** (Postgres + Auth + Storage). Sanity has been fully removed.

## Build and Run Commands

Run from the repository root:

```bash
npm install
npm run dev:site      # Vite site (port 5173) — includes the /dashboard route
npm run dev           # alias of vite
npm run build
```

Current `package.json` scripts:

- `npm run dev` / `npm run dev:site`: start the Vite site (port 5173); the custom `/dashboard` route is served by the same server
- `npm run build`: builds the Vite site → `dist/`

Dashboard seed and agent verification (credentials in `.env.local` — see `AGENT_DEV.md`):

```bash
npm run cms:seed      # push content + images to Supabase
npm run cms:verify    # seed + headless browser checks on /dashboard
```

Agents must run `npm run cms:verify` after CMS-related changes and confirm success before handing off.

Notes:

- For dashboard development, only `npm run dev:site` is needed. The dashboard at `/dashboard` is served by the same Vite server as the public site.
- CMS environment variables live in `.env.local`; see `.env.example`. Required vars for the dashboard: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `npm run cms:preview` rebuilds a fresh dev server and opens the preview URL in the agent's built-in browser.

## Test and Quality Commands

There is no formal test runner, lint script, or formatter script configured in `package.json`.

Current practical checks:

- `npm run build`: primary regression check
- Manual browser verification through the Vite dev server

If you add any of the following, update this file:

- unit/integration tests
- linting
- formatting
- typecheck-only script

## Project Memory

- Every project should keep a project-level memory file named `MEMORY.md`.
- `MEMORY.md` acts as secondary memory for important project-specific information. It complements the agent's personal memory, which may occasionally miss details.
- Update `MEMORY.md` when there is a major product, design, branch, architecture, command, or content-direction change.
- Keep `MEMORY.md` short, current, and reusable; do not turn it into a granular changelog.

## Architecture Overview

## Boot Flow

1. `src/main.tsx` mounts the React app and imports global CSS.
2. `src/app/App.tsx` renders `RouterProvider`.
3. `src/app/routes.tsx` defines the browser router.
4. `src/app/Layout.tsx` initializes i18n, renders `Navbar`, `Outlet`, `Footer`, and `ScrollRestoration`.
5. `src/app/pages/Home.tsx` composes the landing page sections in order.
6. Public pages fetch content via `src/cms/cmsContent.ts` (`useCmsCollection` / `useCmsSingleton`) which reads from Supabase; when Supabase is empty or unconfigured, they fall back to local i18n data.
7. `/dashboard/*` is a separate lazy-loaded route outside `Layout`; it loads `src/admin/AdminApp.tsx` which handles its own auth and content management.

## Routing Model

- Root route uses `Layout`
- Index route renders `Home`
- `NotFoundPage` handles wildcard `*`
- Error boundaries are layered:
  - `ErrorPage`: root/layout-level failure
  - `RouteErrorBoundary`: child-route failure
  - `NotFoundPage`: normal 404 route miss

Any new route should include `ErrorBoundary: RouteErrorBoundary`.

## Internationalization Model

- `src/app/i18n/i18n.tsx` initializes i18next
- Language is detected from `localStorage` first, then browser language
- Supported locales live in:
  - `src/app/i18n/locales/fr.tsx`
  - `src/app/i18n/locales/en.tsx`
- `src/app/i18n/LanguageContext.tsx` exposes the small app-facing language API

## Styling Model

- `src/styles/index.css` is the global CSS entrypoint
- `src/styles/tailwind.css` imports Tailwind v4 and declares source scanning
- `src/styles/tokens.css` defines primitive tokens, semantic tokens, dark-mode token overrides, and Tailwind `@theme` mappings
- `src/styles/global.css` defines global/base styles and design utilities that consume semantic tokens
- Components mainly use Tailwind utility classes inline
- Components should prefer semantic token utilities such as `bg-surface-page`, `bg-surface-panel`, `text-text-primary`, `text-text-secondary`, `text-text-accent`, `border-border-subtle`, and `bg-action-strong` over raw hex values
- Typography relies on tokenized font families and weights rather than ad hoc per-component declarations

## UI Composition

- `src/app/components/` contains app-specific sections and layout pieces
- `src/app/components/ui/` contains reusable low-level UI primitives and helpers
- The app-specific sections are mostly composed directly in `Home.tsx`
- The current site is section-anchor driven, with navbar links scrolling to in-page IDs

## Key File Locations

Core app:

- `package.json`: scripts and dependency list
- `vite.config.ts`: Vite config, React plugin, Tailwind plugin, `@` alias, raw asset config
- `tsconfig.json`: strict TS config, bundler module resolution
- `index.html`: Vite HTML shell
- `src/main.tsx`: React mount entry

Routing and layout:

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/Layout.tsx`
- `src/app/pages/Home.tsx`

Major page sections:

- `src/app/pages/Home.tsx`: current redesigned home page composition
- `src/app/components/Navbar.tsx`
- `src/app/components/Footer.tsx`

Error handling:

- `src/app/components/ErrorPage.tsx`
- `src/app/components/RouteErrorBoundary.tsx`
- `src/app/components/NotFoundPage.tsx`

Internationalization:

- `src/app/i18n/i18n.tsx`
- `src/app/i18n/LanguageContext.tsx`
- `src/app/i18n/locales/`

Dashboard (custom CMS):

- `src/admin/AdminApp.tsx`: main dashboard application — auth, routing, sidebar, data operations
- `src/admin/schema.ts`: **single source of truth** for all content types and their fields; forms are generated from this file
- `src/admin/fields.tsx`: renders individual form fields (text, localized, tags, image, boolean, select…)
- `src/admin/views.tsx`: `CollectionList` and `DocumentEditor` components
- `src/admin/data.ts`: unified data layer — calls Supabase when configured, falls back to `localStorage` demo store
- `src/admin/store.ts`: localStorage demo store and `emptyDoc` factory
- `src/admin/mockData.ts`: seed content for the demo store (mirrors real site content)
- `src/admin/iconMap.tsx`: maps schema `IconKey` values to Heroicons
- `src/admin/Overview.tsx`: dashboard home with KPI cards and `recharts` charts
- `src/admin/LoginScreen.tsx`: email + password login form
- `src/admin/BlogPreview.tsx`: read-only blog article preview that mirrors the public site layout
- `src/lib/supabase.ts`: Supabase client factory — reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- `supabase/schema.sql`: Supabase table definition, RLS policies, storage bucket setup
- `scripts/seed-supabase.mjs`: seed/reset script — authenticates as editor, wipes each type, reinserts real content

Public site CMS layer:

- `src/cms/cmsContent.ts`: `useCmsCollection(type, fallback)` and `useCmsSingleton(type, fallback)` hooks — fetch from Supabase, fall back to provided i18n data
- `src/cms/types.ts`: shared TypeScript types for all content models
- `src/cms/adapters.ts`: view-model mappers (CMS doc → page shape)
- `src/cms/cmsContent.ts`: Supabase reader — `useCmsCollection`, `useCmsSingleton`, `cmsImageUrl`

All public pages read from Supabase via `useCmsCollection` / `useCmsSingleton`, with i18n as fallback. Sanity (client, GROQ queries, Studio, configs, packages) has been fully removed.

Translation architecture (kept): `api/translate.js`, `cloudflare/translate-worker/`.

Styles and assets:

- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/global.css`
- `src/styles/fonts.css`
- `src/assets/`
- `src/assets/carole-redesign-*.png`: current Figma-derived redesign image assets

Project guidance:

- `GUIDELINE.md`: canonical repo-specific implementation guide
- `MEMORY.md`: current project memory and redesign notes

## Coding Conventions

Follow the existing codebase before introducing new patterns.

### TypeScript and React

- Use function components and TypeScript `.tsx` files
- Keep `strict`-compatible typings; avoid `any` unless there is no reasonable alternative
- Prefer small composable components over monolithic page files
- Use default exports for top-level page/section components when that matches nearby files
- Keep route composition declarative in `routes.tsx`

### Imports and Paths

- Prefer the `@` alias for `src` when it improves readability
- Use `react-router`, not `react-router-dom`
- Keep imports grouped logically: framework, third-party, local modules, local styles/assets

### Styling

- Prefer Tailwind utility classes for component styling
- Reuse semantic tokens from `tokens.css` instead of inventing one-off values when a token exists
- Default to flex/grid layouts
- Use `absolute` positioning only when it is genuinely layout-critical
- Preserve responsive behavior; mobile interactions must have a non-hover fallback

### Motion and Interaction

- The project already uses `motion` for entrance animations and language-transition micro-animations
- Match existing animation tone: restrained, presentational, and section-focused
- Avoid adding gratuitous motion or scroll effects that compete with the content

### i18n and Copy

- i18n locales (`fr.tsx`, `en.tsx`) are now **fallback only** — the dashboard (Supabase) is the primary content source
- Do not add new content to i18n if it will be managed from the dashboard; update Supabase via the seed script or the dashboard UI instead
- Keep both `fr` and `en` locales in sync for the fallback to remain accurate
- French copy quality matters: correct spelling, accents, and punctuation
- Avoid em dashes in French copy
- Use French quotation marks (`« »`) when the surrounding copy is francophone
- Respect French spacing before double punctuation where feasible (`:`, `;`, `!`, `?`)

### Icons and UI Libraries

- Prefer Heroicons for new icons
- Use Lucide only when Heroicons lacks the needed symbol
- Do not casually mix icon libraries inside a single component
- The `ui/` directory contains reusable primitives; do not duplicate a primitive before checking there
- For Heroicons, import from `@heroicons/react/24/outline` and size icons with Tailwind classes rather than a `size` prop

### Error Handling

- New routes should wire `RouteErrorBoundary`
- Preserve the current three-level error model
- If adding critical top-level behavior, consider how it fails inside the root `Layout`

### Files to Treat Carefully

- `src/admin/schema.ts`: the single definition driving all dashboard forms — changes here ripple to UI, data, and the seed script
- `src/app/components/ui/`: shared primitives, likely reused across features
- `src/styles/tokens.css`: central primitive and semantic token definitions
- `src/styles/global.css`: global styles and utilities that consume tokens
- `src/app/i18n/locales/`: fallback copy — keep accurate but do not treat as primary source
- `MEMORY.md`: living product/design memory that should stay short and current

## Change Guidance for Future Agents

- Verify structural changes with `npm run build`
- If adding tooling, add scripts to `package.json` and document them here
- If adding a route, update routing, error boundaries, and navigation as needed
- If adding or changing a section on the home page, update `src/app/pages/Home.tsx` and keep reusable pieces in `src/app/components/` only when shared
- **If adding a new content type to the dashboard**: (1) add it to `src/admin/schema.ts`, (2) add mock data in `mockData.ts`, (3) add icon key in `iconMap.tsx`, (4) add the seed data in `scripts/seed-supabase.mjs`, (5) create a `useCmsCollection` hook call in the relevant public page
- If changing copy that is also managed from the dashboard, update the seed script and Supabase — not just i18n
- If changing visual direction, prefer token or shared-style updates over scattered literal values
- **Always update `MEMORY.md`** when there is a major product, CMS, data model, or architecture change
