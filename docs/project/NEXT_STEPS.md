# NEXT_STEPS — post-lancement

> Todo légère après merge `dev` → `main`. Dernière mise à jour : 2026-06-14.

## Image Open Graph

- Asset repo : `src/assets/og-carolet.png` (1200×630, ~330 Ko).
- Assignation CMS : dashboard `siteSettings` → image Open Graph, ou `npm run cms:backfill -- --apply` si le champ est encore vide.

## Prêt pour la production

- Branche `dev` à jour avec `origin/dev`, sans commit en attente sur le code applicatif.
- CMS client (`ztrcnlirfbmjnzcovpgj`) opérationnel ; `npm run cms:verify` passe.
- Passe UI (vagues A–D) terminée — checklist archivée dans `docs/archive/UI_AUDIT.md`.

## Reste à faire (contenu / ops)

1. **Pages services** — sur `main`, `/services` affiche « en construction » ; le WIP vit dans `src/app/pages/services-dev/`. Sur `dev`, brancher ces routes (voir README du dossier) jusqu'au merge final.
2. **Sécurité traduction** (dashboards Cloudflare/OpenAI) — plafond mensuel OpenAI + rate limit AI Gateway (`docs/SECURITY.md` §5).

## Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
npm run cms:verify
```
