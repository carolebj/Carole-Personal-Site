# Carole Portfolio version 1.0

Bilingual editorial portfolio (React + Vite + TypeScript + Tailwind v4) with a custom admin dashboard at `/dashboard` backed by Supabase.

## Commands

```bash
npm install
npm run dev        # Vite site (port 5173), includes /dashboard
npm run build      # production build → dist/
npm run cms:seed   # ajoute uniquement les contenus et images initiaux absents
npm run cms:verify # vérification dashboard non destructive
```

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings → API).
3. For seed/verify automation, set `CMS_SEED_EMAIL` and `CMS_SEED_PASSWORD`.

See `docs/GUIDELINE.md` for architecture, `docs/SECURITY.md` for the security model, and `docs/workflows/AGENT_DEV.md` for the agent seed/verify workflow. Guidance docs live in `docs/` (entry point: `AGENTS.md`).
