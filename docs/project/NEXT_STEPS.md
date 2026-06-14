# NEXT_STEPS — post-lancement

> Todo légère après merge `dev` → `main`. Dernière mise à jour : 2026-06-14.

## Prêt pour la production

- Branche `dev` à jour avec `origin/dev`, sans commit en attente sur le code applicatif.
- CMS client (`ztrcnlirfbmjnzcovpgj`) opérationnel ; `npm run cms:verify` passe.
- Passe UI (vagues A–D) terminée — checklist archivée dans `docs/archive/UI_AUDIT.md`.

## Reste à faire (contenu / ops)

1. **Image OG** — déposer l'asset final dans `src/assets/` (ex. `og-default.webp`), puis l'assigner dans le dashboard (`siteSettings` → image Open Graph) ou mettre à jour le seed/backfill si besoin d'un défaut repo.
2. **Merge production** — `dev` → `main`, puis smoke test sur `https://carole-portfolio.vercel.app`.
3. **Sécurité traduction** (dashboards Cloudflare/OpenAI) — plafond mensuel OpenAI + rate limit AI Gateway (`docs/SECURITY.md` §5).

## Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
npm run cms:verify
```
