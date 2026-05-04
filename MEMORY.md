# MEMORY.md

## Purpose

This file is the project-level memory for the Carole Portfolio repo. Keep it short, current, and useful for future agents working on the site.

Last reviewed: 2026-05-04 16:19 WAT

## Current Branch Workflow

- Main production history lives on `main`.
- Redesign work should happen on `dev`, which tracks `origin/dev`.
- Use `npm run build` as the primary regression check because the repo has no formal test, lint, or formatter scripts yet.
- Vercel should keep `main` as the production branch and use `dev` as the review/preview branch until Carole validates the redesign.
- Vercel build settings: framework `Vite`, build command `npm run build`, output directory `dist`.
- `vercel.json` rewrites all routes to `/index.html` so React Router deep links can load correctly on Vercel.
- Vercel project `carole-portfolio` exists under `stevens-projects-db687a83`; current public alias is `https://carole-portfolio.vercel.app`.
- GitHub integration still needs to be connected in Vercel UI because CLI connection failed for `mrstev3n/Carole-Portfolio-version-1.0`.

## Active Redesign Direction

- The portfolio is being refactored from a classic community-manager portfolio into an editorial social media direction site for Carole T.
- Design source: Figma file `bHEzxP453lgz2LGEqWnOZl`, node `1:3`.
- Supporting export: `/Users/mrsteven/Downloads/stitch_carole_tonoukouen_portfolio_design.zip`.
- The visual direction is warm editorial minimalism: cream surface, plum/rose accents, peach/terracotta support colors, large Newsreader headlines, compact Inter navigation and labels.
- Current page structure:
  - editorial hero
  - manifesto
  - about/presentation
  - services bento grid
  - testimonials
  - newsletter/contact footer
- Current design decisions:
  - keep the globally reduced scale validated on a 13-inch MacBook: lower nav height, smaller max content width, lower hero title/image caps, tighter buttons, and reduced section padding
  - use the Figma-derived hero/about portraits and exported decorative arc
  - use local Liberation Serif Italic for manifesto accent text
  - keep hero and manifesto backgrounds visually continuous, with the about section on white
  - show service card color corners on hover only

## Implementation Notes

- Keep routing as-is: `src/app/routes.tsx` -> `Layout` -> `Home`.
- Keep all user-facing copy in `src/app/i18n/locales/fr.tsx` and `src/app/i18n/locales/en.tsx`.
- The redesigned home page lives in `src/app/pages/Home.tsx`.
- The redesigned navigation and footer live in `src/app/components/Navbar.tsx` and `src/app/components/Footer.tsx`.
- Figma image assets downloaded into `src/assets/` use the `carole-redesign-*` prefix.
- SVG pictograms live in `src/assets/icons/` with descriptive kebab-case names.
- Liberation Serif local font files live in `src/assets/fonts/` and are declared in `src/styles/fonts.css`.
- The organic image shapes are defined as utilities in `src/styles/theme.css`.

## Update Rule

Update this file when there is a major product, design, branch, architecture, command, or content-direction change. Do not turn it into a changelog; keep only reusable context.
