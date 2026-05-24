# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-05-05 WAT

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
- Language selection is detected from browser language, then persisted in `localStorage` under `portfolio-lang`.
- Theme selection is handled by `src/app/theme/ThemeContext.tsx`, follows `prefers-color-scheme` on first visit, and persists the explicit choice in `localStorage` under `portfolio-theme`.
- Haptic feedback is handled by `src/app/interactions/HapticContext.tsx` and persists its on/off preference under `portfolio-haptics`.
- Public pages are route-lazy-loaded in `src/app/routes.tsx` to keep the initial bundle light; keep heavy third-party widgets out of the root route chunk.
- The Cal.com booking widget is isolated in `src/app/components/CalMeetingEmbed.tsx` and lazy-loaded only when the `/contact` meeting mode is shown.
- The redesigned home page lives in `src/app/pages/Home.tsx`.
- The redesigned navigation and footer live in `src/app/components/Navbar.tsx` and `src/app/components/Footer.tsx`.
- Figma image assets downloaded into `src/assets/` use the `carole-redesign-*` prefix.
- SVG pictograms live in `src/assets/icons/` with descriptive kebab-case names.
- Liberation Serif local font files live in `src/assets/fonts/` and are declared in `src/styles/fonts.css`.
- Design tokens are split from global design styles: `src/styles/tokens.css` holds primitive tokens, semantic tokens, dark-mode overrides, and Tailwind `@theme` mappings; `src/styles/global.css` holds base styles and utilities that consume those semantics.
- The organic image shapes are defined as utilities in `src/styles/global.css`.

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
