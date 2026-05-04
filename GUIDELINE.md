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

## Build and Run Commands

Run from the repository root:

```bash
npm install
npm run dev
npm run build
```

Current `package.json` scripts:

- `npm run dev`: starts the Vite dev server
- `npm run build`: creates a production bundle in `dist/`

Notes:

- There is no dedicated `preview` script. If needed, use `npx vite preview` after a build.
- The project already has `node_modules/` and builds successfully with `npm run build`.
- In the restricted Codex sandbox, the Vite dev server may fail to bind `127.0.0.1:5173` with `EPERM`; rerun the dev command with elevated local permissions when needed.

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
- `src/styles/theme.css` defines theme variables, color tokens, radius tokens, typography defaults, and dark-mode token overrides
- Components mainly use Tailwind utility classes inline
- Typography relies on theme variables and font families defined in CSS rather than ad hoc per-component declarations

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

Styles and assets:

- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/theme.css`
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
- Reuse theme tokens from `theme.css` instead of inventing one-off values when a token exists
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
- `src/styles/theme.css`: central theme and token definitions
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
