# CMS Setup

This project uses Sanity Studio for editorial content.

## 1. Create or Open the Sanity Project

Aller sur :

https://www.sanity.io/manage

Projet existant : `Carole Portfolio` (ID: `vo8cimnh`)
Dataset : `production`

## 2. Variables d'environnement

Le fichier `.env.local` est déjà configuré avec :

```
VITE_SANITY_PROJECT_ID=vo8cimnh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2026-05-24

SANITY_STUDIO_PROJECT_ID=vo8cimnh
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_API_VERSION=2026-05-24
```

## 3. CORS Origins

Dans Sanity Manage > API > CORS origins, ajouter :

```
http://localhost:5173
https://carole-portfolio.vercel.app
https://carole-portfolio-git-dev-stevens-projects-db687a83.vercel.app
```

## 4. Démarrer le CMS en local

```bash
# Terminal 1 — Studio Sanity
npm run cms:dev

# Terminal 2 — Site Vite
npm run dev
```

Accès :
- Site : http://localhost:5173
- Studio : http://localhost:5173/admin (proxy Vite → Studio)

## 5. Build de production

```bash
npm run build
```

Le build combine le site Vite (`dist/`) et le Studio (`dist/admin/`).
Sur Vercel, `/admin` est servi depuis `dist/admin/` via les règles dans `vercel.json`.

## 6. Types de contenu disponibles

| Type document | Description | Singleton |
|---|---|---|
| `siteSettings` | Paramètres du site (nom, SEO, email, liens sociaux) | Oui |
| `homePage` | Page d'accueil (hero, manifesto, à propos) | Oui |
| `category` | Catégories d'articles (nom bilingue, slug) | Non |
| `service` | Services (description, métriques, inclus, cas d'usage) | Non |
| `blogPost` | Articles de blog (titre, contenu riche, image, catégorie) | Non |
| `testimonial` | Témoignages (citation, nom, rôle, portrait) | Non |
| `resource` | Ressources & communautés (type, lien, description) | Non |
| `cvEntry` | Entrées CV (expérience, formation, etc.) | Non |

## 7. Catégories d'articles

Les catégories sont un type de document dédié. Depuis le Studio :
1. Aller dans **Catégories** dans le menu de navigation
2. Créer/modifier les catégories (nom français + anglais)
3. Dans un article, sélectionner une catégorie existante ou cliquer sur **+** pour en créer une nouvelle à la volée

## 8. Contenu bilingue

- Le français (fr) est la langue principale requise
- L'anglais (en) est optionnel, à remplir quand la traduction est disponible
- Le site affiche automatiquement la langue selon les préférences du visiteur

## 9. Build Checks

```bash
npm run build
```

Le site est dans `dist/`, le Studio est dans `dist/admin/`.
