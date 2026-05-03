# Guidelines — Carole Portfolio

## 0. Règle absolue : comprendre, reformuler, valider, puis implémenter

**Cette règle prime sur toutes les autres.** Aucune ligne de code ne doit être écrite avant d'avoir suivi ce protocole :

1. **Lire la consigne** attentivement.
2. **Reformuler** la compréhension de la demande dans sa réponse : ce qui a été compris, ce qui va être fait, les choix techniques envisagés.
3. **Attendre la validation explicite** de Steven avant de commencer l'implémentation.
4. **Implémenter** uniquement après accord.

Si un doute subsiste sur un point (couleur, typo, interaction, scope), **poser la question plutôt que deviner**. Ce flux s'applique à chaque nouvelle consigne, sans exception.

## Language & Copy

- Always use correct French spelling and grammar (accords, accents, conjugaisons).
- **Never use em dashes** ( — / – ) in French copy. Replace with commas, periods, or rephrase.
- Use French quotation marks ( « » ) when the context is francophone.
- Respect non-breaking spaces before double punctuation marks ( : ; ! ? ).

## Architecture & Routing

- Use `react-router` (imported from `'react-router'`), **never** `react-router-dom`.
- The router follows the Data mode pattern: `RouterProvider` in `App.tsx`, `createBrowserRouter` in `routes.ts`.
- Translations are managed by `react-i18next` with locale files in `/src/app/i18n/locales/`.

## Components & Structure

- Favor multiple reusable components in `/src/app/components/` over monolithic files.
- Only create `.tsx` files.
- Keep files reasonably sized; extract helpers and hooks into dedicated files.
- Default to `flexbox` and `grid` layouts. Reserve `position: absolute` for strictly necessary cases.

## Mobile & Responsive

- Always design responsively. Hover interactions must have a tap equivalent on mobile (see `useTooltipInteraction`).
- Horizontal scrollable navigation is the preferred pattern for tabs on mobile.

## Error Handling (3 niveaux)

Le portfolio dispose d'un système de gestion des erreurs à 3 niveaux. **Toute nouvelle route ajoutée doit inclure `ErrorBoundary: RouteErrorBoundary`** pour être couverte.

| Niveau | Composant | Fichier | Rendu dans le Layout ? | Déclencheur |
|--------|-----------|---------|------------------------|-------------|
| 1 | `NotFoundPage` | `/src/app/components/NotFoundPage.tsx` | Oui (nav + footer) | Route `path: "*"` (404 classique) |
| 2 | `RouteErrorBoundary` | `/src/app/components/RouteErrorBoundary.tsx` | Oui (nav + footer) | Erreur dans une route enfant (`ErrorBoundary` par route) |
| 3 | `ErrorPage` | `/src/app/components/ErrorPage.tsx` | Non (autonome) | Crash du Layout lui-même (root `ErrorBoundary`) |

### Ajout d'une nouvelle route

Lors de l'ajout d'une route dans `routes.tsx`, toujours ajouter `ErrorBoundary: RouteErrorBoundary` :

```tsx
{
  path: "nouvelle-page",
  Component: NouvellePage,
  ErrorBoundary: RouteErrorBoundary, // Ne pas oublier !
},
```

### Traductions

Les clés i18n sont dans `errorPages.notFound.*`, `errorPages.routeError.*` et `errorPages.critical.*` (dans `fr.tsx` et `en.tsx`). `ErrorPage` inclut un fallback i18n en dur au cas ou les traductions ne seraient pas chargées.

## Icônes

### Librairie principale : Heroicons

Le projet utilise **Heroicons** (`@heroicons/react/24/outline`) comme librairie d'icônes principale. Toute nouvelle icône doit d'abord être cherchée dans Heroicons.

### Librairie secondaire : Lucide React

**Lucide React** (`lucide-react`) est conservé uniquement pour les cas où Heroicons n'a pas d'équivalent :

- **Icônes de marques** : `Linkedin`, `Twitter` (utilisées dans le Footer)
- **Icônes UI internes shadcn** sans équivalent : `CircleIcon` (radio buttons), `GripVerticalIcon` (resizable), `PanelLeftIcon` (sidebar)

### Règle de gouvernance

Avant toute utilisation de Lucide pour un **nouveau** besoin :

1. **Vérifier** qu'aucune icône Heroicons ne correspond.
2. **Expliquer** le manque côté Heroicons à Steven.
3. **Attendre sa validation** avant d'ajouter l'import Lucide.

**Ne jamais mélanger les deux librairies dans un même composant** sauf si c'est strictement nécessaire (ex : Footer avec icônes de marques Lucide + icônes génériques Heroicons).

### Convention d'import

```tsx
// Heroicons (par défaut) — toujours depuis outline 24
import { HomeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

// Lucide (exception validée) — uniquement pour les cas sans équivalent
import { Linkedin, Twitter } from "lucide-react";
```

### Dimensionnement

Heroicons utilise `className` pour le sizing (pas de prop `size`) :

| Taille souhaitée | Classe Tailwind |
|-------------------|-----------------|
| 12px | `w-3 h-3` |
| 14px | `w-3.5 h-3.5` |
| 16px | `w-4 h-4` |
| 20px | `w-5 h-5` |
| 24px | `w-6 h-6` |
| 32px | `w-8 h-8` |