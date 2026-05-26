# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-05-24 WAT

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
- The pre-redesign `main` state is archived with Git tag `archive-main-design-before-redesign-2026-05-22` at commit `49d37b2391f08608aae2d0f98ea3a57f33ed579c`.

## CMS Direction

- The portfolio CMS stack is Sanity Studio 4 connected to the existing Vite/React site through `@sanity/client`.
- Sanity Studio source lives in `sanity.config.ts` and `studio/`; the static Studio build goes to `dist-studio/` and is copied into `dist/admin/` during the full build.
- **The Studio is served at `/admin` in production** from the combined Vite build via `vercel.json` rewrites.
- **Local CMS work now uses one command**: `npm run dev` starts the Vite site on `127.0.0.1:5173` and Sanity Studio on `127.0.0.1:3333/admin`; visiting `/admin` on the Vite site redirects to the Studio server while the command is running.
- `npm run dev:site` and `npm run cms:dev` remain available for isolated debugging, but normal local work should not require two manually coordinated terminals.
- Studio navigation should stay close to the UBIM-style editorial model: top-level access to Informations générales, Page d'accueil, Services, Articles du blog, Catégories, Témoignages, Ressources & communautés, and CV, with nested lists only when they make editing clearer.
- Bilingual Studio fields use custom FR/EN side-by-side inputs with word counts, `Copier FR`, and `Traduire` actions. The translation action calls a server-side endpoint and requires `OPENAI_API_KEY`; without it, the UI should fail gracefully with an explanatory message.
- The safer production translation architecture is Cloudflare Worker + Cloudflare AI Gateway: Studio -> Vercel `/api/translate` -> protected Worker bearer token -> AI Gateway -> OpenAI. In this mode, Vercel needs only `CLOUDFLARE_TRANSLATE_WORKER_URL` and `TRANSLATE_WORKER_TOKEN`; `OPENAI_API_KEY` should live only as a Cloudflare Worker secret.
- If Cloudflare AI Gateway has Authenticated Gateway enabled, the Worker also needs `CLOUDFLARE_AI_GATEWAY_TOKEN` as a Cloudflare Worker secret; it is sent as `cf-aig-authorization`.
- Keep CMS UX optimized for a non-technical editor: clear document icons, short top-level navigation, guided blog groups, image alt text, category creation from blog posts, and progressive bilingual editing.
- Frontend CMS helpers live in `src/cms/`; CMS fetching is fallback-safe so the site keeps rendering local i18n content when Sanity env vars are absent or content is not migrated yet.
- All content types (blog, services, testimonials, resources, CV, homepage, site settings) are ready for progressive CMS migration.
- **Categories** are a dedicated document type (`studio/schemas/documents/category.ts`). Blog posts reference a category document, and new categories can be created inline from the blog post editor.
- Existing blog categories were migrated via `scripts/migrate-categories.mjs` (4 categories created).
- Required environment variables are documented in `.env.example`; configure both `VITE_SANITY_*` for the public site and `SANITY_STUDIO_*` for Studio.

## Active Redesign Direction

- The portfolio is being refactored from a classic community-manager portfolio into a digital communications officer portfolio for Carole T., with social media as one part of a broader communication role.
- Design source: Figma file `bHEzxP453lgz2LGEqWnOZl`, node `1:3`.
- Supporting export: `/Users/mrsteven/Downloads/stitch_carole_tonoukouen_portfolio_design.zip`.
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
- Current design decisions:
  - keep the globally reduced scale validated on a 13-inch MacBook: lower nav height, smaller max content width, lower hero title/image caps, tighter buttons, and reduced section padding
  - use the Figma-derived hero/about portraits and exported decorative arc
  - use local Liberation Serif Italic for manifesto accent text
  - keep hero and manifesto backgrounds visually continuous, with the about section on white
  - show service card color corners on hover only
  - keep motion subtle: light section entry fades, service hover lifts, and hero visual levitation only
  - hide the visual tuning panel for now; the code remains in `Home.tsx` behind `SHOW_VISUAL_TUNING_PANEL`
  - the desktop header collapses on downward scroll into a centered logo pill, returns on upward scroll or when the pill is clicked, and collapses again on the next downward scroll
  - the main navigation now uses an icon-only theme toggle; language switching belongs in the footer
  - the testimonials section should sit on a white background in light mode
  - desktop navigation order is Accueil, À propos, Services, Avis, Blog; Manifesto remains a section but is not a menu item
  - Services is both a scroll link and a hover mega menu with links to individual service pages
  - the Carnet resources page is framed as useful resources and communities: platforms, tools, inspiring campaigns, and support groups for digital communication
  - blog article links should use continuity/view transitions from list cards to article pages, especially image and title continuity
  - service detail pages should clearly separate the service presentation, audience fit, and case-study/work-output areas
  - Carnet detail pages can depart from the warmer portfolio card style and use a more minimal, document-like layout with simplified search and interactive resource cards
  - the resources grid should stay dense on desktop, with three cards per row around 1200px wide screens
  - the readings/reference page should use the same centered minimal Carnet language, with a clear switch between book covers and cited content/newsletters rendered as lighter paper objects
  - testimonials use a three-card carousel with the centered card as the active state
  - the footer reveal should behave like a temporary pull-beyond-footer moment: after a short delay it returns to the footer, and the decorative shader should stay wave-like, colorful, and gently moving rather than highly animated
  - subtle audio haptics are enabled by default for interactive elements and can be toggled from the logo right-click menu

## Implementation Notes

- Keep routing in `src/app/routes.tsx` -> `Layout`, with `Home`, `Blog`, and `ServiceDetail`.
- Keep all user-facing copy in `src/app/i18n/locales/fr.tsx` and `src/app/i18n/locales/en.tsx`.
- Responsive breakpoints are mobile `<768px`, tablet `768px-1023px`, and desktop `>=1024px`. The main navigation should stay in the mobile/tablet drawer until `lg` so logo, links, theme control, and contact CTA do not collide.
- SEO metadata is handled by `src/app/components/Seo.tsx`; keep route titles, descriptions, canonical URLs, Open Graph/Twitter tags, `html.lang`, and JSON-LD there rather than scattering direct `document.head` updates across pages.
- Language selection is detected from browser language, then persisted in `localStorage` under `portfolio-lang`.
- Theme selection is handled by `src/app/theme/ThemeContext.tsx`, follows `prefers-color-scheme` on first visit, and persists the explicit choice in `localStorage` under `portfolio-theme`.
- Haptic feedback is handled by `src/app/interactions/HapticContext.tsx` and persists its on/off preference under `portfolio-haptics`.
- Public pages are route-lazy-loaded in `src/app/routes.tsx` to keep the initial bundle light; keep heavy third-party widgets out of the root route chunk.
- CMS content should be migrated progressively and keep local i18n fallback paths until Carole validates the Studio content.
- The Cal.com booking widget is isolated in `src/app/components/CalMeetingEmbed.tsx` and lazy-loaded only when the `/contact` meeting mode is shown.
- The redesigned home page lives in `src/app/pages/Home.tsx`.
- The redesigned navigation and footer live in `src/app/components/Navbar.tsx` and `src/app/components/Footer.tsx`.
- Figma image assets downloaded into `src/assets/` use the `carole-redesign-*` prefix.
- SVG pictograms live in `src/assets/icons/` with descriptive kebab-case names.
- Liberation Serif local font files live in `src/assets/fonts/` and are declared in `src/styles/fonts.css`.
- Design tokens are split from global design styles: `src/styles/tokens.css` holds primitive tokens, semantic tokens, dark-mode overrides, and Tailwind `@theme` mappings; `src/styles/global.css` holds base styles and utilities that consume those semantics.
- The organic image shapes are defined as utilities in `src/styles/global.css`.

## Graphify (Code Navigation)

- **Graphify** (`howell5/willhong-skills@graphify`) is installed as a structural AST index of the codebase.
- CLI installed globally as `graphify` (alias `graphify-ts`).
- Graph file: `graphify-out/graph.json` (gitignored) — 197 files, 10 862 symbols, 10 722 relationships indexed.
- Commands: `graphify build .` (full rebuild), `graphify update <files>` (incremental), `graphify query <graph.json> <name>` (search symbols).
- Trigger skill with `/graphify` or use `skill graphify` when exploring the codebase.

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
