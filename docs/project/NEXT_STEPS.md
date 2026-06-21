# NEXT_STEPS — post-lancement

> Todo légère après merge `dev` → `main`. Dernière mise à jour : 2026-06-21.

## Image Open Graph

- Asset repo : `src/assets/og-carolet.png` (1200×630, ~330 Ko).
- Assignation CMS : dashboard `siteSettings` → image Open Graph, ou `npm run cms:backfill -- --apply` si le champ est encore vide.

## Prêt pour la production

- Branche `dev` réconciliée avec les derniers changements `main` sur les briefs
  design/admin ; les pages services complètes restent actives sur `dev`.
- CMS client (`ztrcnlirfbmjnzcovpgj`) opérationnel ; `npm run cms:verify` passe.
- Service `identite-visuelle` ajouté par seed additif et relié au brief design.
- Blog et témoignages actualisés sur `dev` : nouveaux articles concrets, étude
  de cas `/blog/cas-client-coworking-cotonou`, dates variées et photos réelles
  publiées dans le CMS.
- Passe UI (vagues A–D) terminée — checklist archivée dans `docs/archive/UI_AUDIT.md`.

## Reste à faire (contenu / ops)

1. **Pages services** — première refonte active sur `dev` : page offre-map,
   détails façon brief de travail, pont identité visuelle → brief design. À
   valider visuellement avec Carole avant merge final vers `main`.
2. **Blog / témoignages** — faire relire à Carole les nouveaux textes, noms de
   catégories et choix photo avant d’en faire la version définitive.
3. **Sécurité traduction** (dashboards Cloudflare/OpenAI) — plafond mensuel OpenAI + rate limit AI Gateway (`docs/SECURITY.md` §5).

## Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
npm run cms:verify
```
