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
- i18n: `i18next`, `react-i18next`
- CMS: Sanity Studio 4, `@sanity/client`, `@sanity/image-url`, Portable Text

## Build and Run Commands

Run from the repository root:

```bash
npm install
npm run dev
npm run build
npm run dev:site
npm run cms:dev
npm run cms:build
```

Current `package.json` scripts:

- `npm run dev`: starts the Vite site and Sanity Studio together for local work
- `npm run dev:site`: starts only the Vite site (port 5173)
- `npm run build`: builds Vite site → `dist/`, then builds Studio → `dist-studio/`, then copies to `dist/admin/`
- `npm run cms:dev`: starts Sanity Studio from `sanity.config.ts` on port 3333
- `npm run cms:build`: creates a static Studio bundle in `dist-studio/`
- `npm run cms:deploy`: deploys the Studio through Sanity hosting

Notes:

- The Sanity Studio is served at `/admin` (configurable via `basePath` in `sanity.config.ts`).
- **Local dev**: run `npm run dev` → site at `http://127.0.0.1:5173/`, Studio at `http://127.0.0.1:3333/admin/`, and `/admin` on the site redirects to the Studio server.
- **Production**: `npm run build` embeds the Studio in `dist/admin/`; Vercel serves it at `yourdomain.com/admin`
- **Important**: Sanity Studio has its own Vite server in dev; use `npm run dev` to start both processes from one terminal instead of manually running two commands.
- There is no dedicated `preview` script. If needed, use `npx vite preview` after a build.
- CMS environment variables live in `.env.local`; copy `.env.example` and set `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, `SANITY_STUDIO_PROJECT_ID`, and `SANITY_STUDIO_DATASET`.
- Optional AI translation for Studio fields uses server-side `OPENAI_API_KEY` and `OPENAI_TRANSLATION_MODEL`; never expose the key with a `VITE_` prefix.
- Preferred production translation path is Cloudflare Worker + Cloudflare AI Gateway. Vercel should set `CLOUDFLARE_TRANSLATE_WORKER_URL` and `TRANSLATE_WORKER_TOKEN`; OpenAI should stay in Cloudflare Worker secrets, not in Vercel, once this path is active.
- Keep the Vite site build and the Studio build separated: public site output is `dist/`, Studio output is `dist-studio/`. The build command copies Studio assets into `dist/admin/`.

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
6. Optional CMS content is fetched through `src/cms/`; when Sanity is not configured or returns no content, public pages fall back to the existing local i18n content.

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

CMS:

- `sanity.config.ts`: Sanity Studio configuration
- `sanity.cli.ts`: Sanity CLI project configuration for commands such as login and CORS
- `CMS_SETUP.md`: checklist for creating the Sanity project, copying env variables, and configuring CORS
- `studio/structure.ts`: editor-friendly Studio navigation, organized around the portfolio's editorial areas
- `studio/components/LocalizedFieldInput.tsx`: bilingual FR/EN Studio inputs with copy and translation actions
- `studio/components/LocalizedBlockInput.tsx`: editorial wrapper for bilingual rich content fields
- `studio/schemas/`: Sanity document and object schemas
- `src/cms/client.ts`: browser Sanity client and image URL builder
- `src/cms/queries.ts`: GROQ queries used by the frontend
- `src/cms/adapters.ts`: maps CMS documents into existing React view models
- `src/cms/useSanityQuery.ts`: fallback-safe CMS fetching hook
- `api/translate.js` and `scripts/translate-text.mjs`: server-side FR → EN translation endpoint used by the Studio when OpenAI credentials are configured
- `cloudflare/translate-worker/`: protected translation Worker that validates a bearer token, calls OpenAI through Cloudflare AI Gateway, and keeps OpenAI secrets away from the public site runtime

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

- Any user-facing text should go through translation files
- Maintain both `fr` and `en` locales together
- CMS-managed copy should use localized Sanity fields with `fr` as the required primary language and `en` as the optional secondary language until translation is available.
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

- `src/app/components/ui/`: shared primitives, likely reused across features
- `src/styles/tokens.css`: central primitive and semantic token definitions
- `src/styles/global.css`: global styles and utilities that consume tokens
- `src/app/i18n/locales/`: translation source of truth
- `MEMORY.md`: living product/design memory that should stay short and current

## Change Guidance for Future Agents

- Verify structural changes with `npm run build`
- If adding tooling, add scripts to `package.json` and document them here
- If adding a route, update routing, error boundaries, and navigation as needed
- If adding or changing a section on the current redesigned home page, update `src/app/pages/Home.tsx` and keep reusable layout pieces in `src/app/components/` only when they are shared
- If changing copy or labels, update both locale files in the same change
- If changing visual direction, prefer token or shared-style updates over scattered literal values
- If the redesign direction changes materially, update `MEMORY.md` in the same change
