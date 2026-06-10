# NEXT STEPS — document de passation (temporaire)

> Brouillon de travail pour reprendre la prochaine session. À supprimer une
> fois les items repris dans `MEMORY.md` / traités. Dernière mise à jour :
> 2026-06-10.

## Où on en est (fait ✅)

Les priorités précédentes sont terminées et poussées sur `dev` :

- **P1 — Blog** : brouillon/publié, lecteur partagé, vérif automatisée (`cms:verify`).
- **P2 — Dashboard** : alignements, parité contenu (Footer, Home, carnet), suppression
  sécurisée + invalidation cache.
- **P3 — Hygiène** : `npm run typecheck`, README worker sans Sanity, doc consolidée.

Voir `MEMORY.md` pour le détail technique et l'historique.

## Prérequis UI ✅

Vagues **A**, **B** et **C** de `UI_AUDIT.md` sont traitées (bloquants UX, motion/focus,
design system partagé). Vague **D** (hygiène, legacy, polish) reste optionnelle.

## Fait (session en cours) ✅

### Priorité 1 — Home : titres de section éditables via CMS

Singleton `homePage` étendu avec `servicesSection`, `testimonialsSection`,
`contactSection` (schéma admin, types, seed, `Home.tsx` avec fallback i18n).

### Priorité 2 — Page About + en-tête CV depuis le CMS

Singletons `aboutPage` (contenu éditorial `/about`) et `cvPage` (en-tête CV :
nom, rôle, intro). Adapters `toAboutPageViewModel` / `toCvHeaderViewModel`,
seed et fallback i18n.

### Priorité 3 — Collection `category` orpheline

**Décision : option A** — collection `category` supprimée. Le blog garde un champ
`blogPost.category` localisé par article ; les filtres publics restent dérivés des
libellés des articles publiés. Nettoyage Supabase via `legacyTypes` au prochain seed.

### Priorité 4 — SEO depuis `siteSettings`

`siteSettings` étendu (`siteUrl`, `ogImage`, `seoPages` par route). `Seo.tsx`
lit le CMS avec fallback i18n ; overrides sur articles blog et fiches service.

## Fait (session en cours) ✅

### Vague D — Hygiène & polish (`UI_AUDIT.md`)

Legacy supprimé, `serviceStyle.ts` partagé, footer shader static en reduced-motion,
mega-menus clavier, lazy load, VT services, références CMS (`typeLabel` / `cardStyle`).

## À faire (prochaine session) 🔜

- Image OG par défaut à uploader dans le dashboard quand l'asset est prêt.
- Archiver ou supprimer `docs/project/UI_AUDIT.md` si la passe UI est validée visuellement.

## Pour reprendre vite (commandes)

```bash
npm run dev:site     # serveur + /dashboard
npm run cms:seed     # (re)peupler Supabase
npm run cms:verify   # seed + checks navigateur
npm run typecheck    # tsc --noEmit
npm run build        # régression build
```

Identifiants seed/verify : `.env.local` (`CMS_SEED_EMAIL` / `CMS_SEED_PASSWORD`).

## Points de repère code

- Dashboard : `src/admin/` (`schema.ts`, `views.tsx`, `AdminApp.tsx`).
- Reader public : `src/cms/cmsContent.ts`.
- Types contenu : `src/cms/types.ts`.
- Seed : `scripts/seed-supabase.mjs`.
- Guides : `../GUIDELINE.md`, `MEMORY.md`, `../workflows/AGENT_DEV.md`, `../SECURITY.md`.
