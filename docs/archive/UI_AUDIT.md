# UI Audit — checklist cohérence interface (site public)

> Document de travail archivé pour la passe qualité UI réalisée avant les
> priorités CMS de l'époque. Scope : site public (`src/app/`) — pas le dashboard admin.
>
> Dernière revue : 2026-06-10. Skills de référence : Web Interface Guidelines,
> UI/UX Pro Max, make-interfaces-feel-better, fixing-motion-performance,
> react-best-practices, mastering-animate-presence, react-view-transitions.

## Comment utiliser ce document

1. Traiter les vagues **dans l'ordre** (A → B → C → D).
2. Cocher `[x]` chaque item une fois corrigé **et** vérifié visuellement (mobile +
   desktop, light + dark, `prefers-reduced-motion: reduce` si motion).
3. Régression minimale après chaque vague : `npm run typecheck` + `npm run build`.
4. Après vague C, mettre à jour `MEMORY.md` (décisions design unifiées).
5. Supprimer ou archiver ce fichier une fois toutes les vagues terminées.

### Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
```

### Références code (bons patterns existants)

| Fichier | Pourquoi le garder comme modèle |
|---------|--------------------------------|
| `src/app/pages/About.tsx` | Tokens sémantiques + `useReducedMotion` sur scroll-linked blur |
| `src/app/pages/ServiceDetail.tsx` | Tokens + `AnimatedDigits` respecte reduced-motion via `.t-digit-group` |
| `src/app/pages/BlogArticleContent.tsx` | Lecteur partagé + `viewTransitionName` appariés |
| `src/styles/tokens.css` | Source de vérité couleurs / surfaces / focus ring |
| `src/styles/global.css` | Utilitaires `.t-*` avec garde `prefers-reduced-motion` |

---

## Synthèse exécutive

| Zone | État actuel | Priorité |
|------|-------------|----------|
| Accessibilité tactile / clavier | Problèmes ciblés (carnet, dots, mega-menus) | Critique |
| Motion & performance | CSS OK ; Framer/Motion souvent sans garde reduced-motion | Haute |
| Cohérence visuelle / tokens | 3 dialectes parallèles (portfolio / carnet / tokens) | Haute |
| Responsivité | Globalement OK ; offsets `pt-*` incohérents sous nav | Moyenne |
| Structure composants | Duplication + composants legacy morts | Moyenne |

### Trois dialectes visuels à unifier

| Dialecte | Pages | Signes distinctifs |
|----------|-------|-------------------|
| Portfolio chaud | Home, Blog, Services, Contact, Cv, Navbar, Footer | `#fcf9f8`, `#854d63`, eyebrow `tracking-[3px]` |
| Carnet neutre | ToolsInspirations, ReadingsReferences | `#FBFBFA`, `#787774`, `#EAEAEA` |
| Token-based | About, ServiceDetail | `bg-surface-page`, `text-text-accent`, etc. |

**Cible** : tout le site public lit `tokens.css` ; le carnet garde sa hiérarchie
documentaire mais partage les tokens de surface/texte/bordure.

---

## Vague A — Bloquants UX

Objectif : corriger ce qui casse l'usage mobile, le clavier ou la navigation.

- [x] **A1 — CTA carnet toujours visible (mobile)**
  - Fichier : `src/app/pages/ToolsInspirations.tsx` (~L212–221)
  - Problème : lien « Visiter » masqué (`opacity-0`, `-bottom-20`) jusqu'au `:hover`
  - Fix : CTA visible par défaut ; hover desktop = enrichissement (translate, ombre)
  - Vérif : 375px tactile — lien atteignable sans hover

- [x] **A2 — Hero : boucles infinies sous garde reduced-motion**
  - Fichier : `src/app/pages/Home.tsx` (~L697–726)
  - Problème : 4 `repeat: Infinity` (portrait, shapes, badge) sans `useReducedMotion`
  - Fix : `const reduce = useReducedMotion()` → pas d'animate infini si `reduce`
  - Vérif : DevTools → Rendering → Emulate prefers-reduced-motion

- [x] **A3 — Témoignages : animation mot-à-mot trop lourde**
  - Fichier : `src/app/pages/Home.tsx` (~L328–336)
  - Problème : `filter: blur(10px)` sur chaque mot à chaque slide
  - Fix : fade/slide du bloc entier ; respecter `useReducedMotion`
  - Vérif : changement de slide fluide sur mobile bas de gamme

- [x] **A4 — Dots pagination témoignages : touch target ≥ 44px**
  - Fichier : `src/app/pages/Home.tsx` (~L380–384)
  - Problème : boutons `h-2 w-2` (8×8px visibles)
  - Fix : hit area étendue (`p-3` invisible ou `min-h-[44px] min-w-[44px]`)
  - Vérif : `aria-label` décrit la position (« Témoignage 2 sur 5 »), pas seulement le nom

- [x] **A5 — Ancre `#carnet` morte dans la navbar**
  - Fichier : `src/app/components/Navbar.tsx` (~L307)
  - Problème : `href: "#carnet"` mais aucun `id="carnet"` dans l'app
  - Fix : route réelle (`/carnet/ressources` ou équivalent) ou section id valide
  - Vérif : clic desktop + mobile mène au bon endroit

- [x] **A6 — Blog : garde si liste vide**
  - Fichier : `src/app/pages/Blog.tsx` (~L89+)
  - Problème : `featuredPost` utilisé sans garde si `posts` vide
  - Fix : empty state ou early return avant le featured card
  - Vérif : collection blog vide en CMS ne casse pas la page

---

## Vague B — Motion, performance & focus

Objectif : fondations motion sûres et inputs accessibles au clavier.

### Motion & reduced-motion

- [x] **B1 — Hook utilitaire `useMotionSafe()`**
  - Créer : ex. `src/app/hooks/useMotionSafe.ts` (wrapper `useReducedMotion`)
  - Appliquer à : Home, Navbar, Blog, Services, carnet pages, ErrorPage
  - Pattern : `initial/animate/exit` statiques ou `transition: { duration: 0 }` si reduce

- [x] **B2 — `scroll-behavior: smooth` sous garde reduced-motion**
  - Fichier : `src/styles/global.css` (~L7–8)
  - Fix : `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`

- [x] **B3 — View transitions sous garde reduced-motion**
  - Fichier : `src/styles/global.css` (~L277–286)
  - Fix : `@media (prefers-reduced-motion: reduce)` → `animation-duration: 0ms` sur `::view-transition-*`

- [x] **B4 — Remplacer `transition-all` sur pages publiques**
  - Fichiers :
    - `src/app/pages/Home.tsx` (~L380)
    - `src/app/pages/ToolsInspirations.tsx` (~L172, L212)
    - `src/app/pages/ReadingsReferences.tsx` (~L81)
  - Remplacer par : `transition-[transform,opacity,box-shadow]` ou classes `.t-*` existantes

### Focus & formulaires

- [x] **B5 — Focus visible sur tous les inputs publics**
  - Fichiers : `Home.tsx` (~L995–1027), `Blog.tsx` (~L157), `Contact.tsx` (~L188–219), `ToolsInspirations.tsx` (~L377)
  - Problème : `outline-none` + seulement `focus:border-*`
  - Fix : `focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]` (comme `admin/fields.tsx`)

### Performance motion

- [x] **B6 — Éviter `filter: blur()` en animation continue**
  - Fichiers : `Home.tsx` témoignages (A3), `About.tsx` si `willChange` sur trop de nœuds
  - Préférer : `opacity` + `transform` uniquement

- [x] **B7 — Revoir `motion layout` sur barre filtres blog**
  - Fichier : `src/app/pages/Blog.tsx` (~L145–184)
  - Risque : layout thrash au filtrage
  - Fix : retirer `layout` ou limiter à un conteneur isolé

- [x] **B8 — Footer shader : fallback reduced-motion / low-power**
  - Fichier : `src/app/components/Footer.tsx` (~L370–388)
  - Déjà partiel (`useReducedMotion` ~L411) — confirmer arrêt complet du RAF si reduce

---

## Vague C — Design system & disposition

Objectif : un seul langage visuel via `tokens.css`, moins de duplication.

### Tokens & couleurs

- [x] **C1 — Migrer Home vers tokens sémantiques**
  - Fichier : `src/app/pages/Home.tsx` (~94 hex hardcodés)
  - Remplacer : `#fcf9f8` → `bg-surface-page`, `#854d63` → `text-text-accent`, etc.

- [x] **C2 — Migrer Blog, Services, Contact, Cv**
  - Fichiers : `Blog.tsx`, `Services.tsx`, `Contact.tsx`, `Cv.tsx`
  - Même mapping que C1

- [x] **C3 — Aligner carnet sur tokens (garder hiérarchie documentaire)**
  - Fichiers : `ToolsInspirations.tsx`, `ReadingsReferences.tsx`
  - Remplacer hex carnet par tokens ; eyebrow peut rester plus neutre (`text-text-muted`)

### Composants partagés

- [x] **C4 — Extraire `SectionEyebrow`**
  - Aujourd'hui : local `Home.tsx` (~L120–126), dupliqué inline Blog/Services
  - Créer : ex. `src/app/components/SectionEyebrow.tsx`

- [x] **C5 — Extraire `PageHero` (titre + sous-titre + eyebrow)**
  - Harmoniser tailles H1 entre pages (clamp responsive partout)

- [x] **C6 — Unifier formulaire contact**
  - Aujourd'hui : inline `Home.tsx` (~L982–1040) + `Contact.tsx` (~L172–231)
  - Créer : `src/app/components/ContactForm.tsx`
  - Décision radius : `rounded-md` inputs + `rounded-xl` panels contact page, ou tout `rounded-lg`

### Disposition & responsive

- [x] **C7 — Normaliser offset sous nav fixe**
  - Cible proposée : `pt-28 md:pt-36` sur toutes les pages + `scroll-mt-28` sur ancres
  - Pages à aligner : voir tableau offsets ci-dessous

- [x] **C8 — Border radius : règle unique**
  - Cards portfolio : `rounded-lg`
  - CTAs primaires pills : `rounded-full`
  - Inputs : `rounded-md`
  - Documenter dans `MEMORY.md`

### Tableau offsets actuels (référence)

| Page | `pt-*` mobile | `md:pt-*` |
|------|---------------|-----------|
| Home | `pt-24` / `sm:pt-28` | `lg:pt-28` |
| Blog, Contact, Tools | `pt-32` | `md:pt-36` |
| Services | `pt-28` | `md:pt-36` |
| About, ServiceDetail | `pt-32` | `md:pt-40` |
| Cv | `pt-28` | — |
| Readings | `pt-24` | `md:pt-28` |

---

## Vague D — Hygiène & polish

Objectif : dette technique, images, navigation clavier, micro-détails.

### Code mort & structure

- [x] **D1 — Archiver composants legacy non routés**
  - Fichiers : `src/app/components/Hero.tsx`, `components/Contact.tsx`, `Projects.tsx`, `Skills.tsx`, `Experience.tsx`, `Metrics.tsx`, `Certifications.tsx`, `Book.tsx`
  - Action : supprimer ou déplacer vers `src/app/_legacy/` si référence utile
  - Vérif : `grep` confirme zéro import dans `src/`

- [x] **D2 — Dédupliquer couleurs accent services**
  - `Home.tsx` (~L86–117) et `Services.tsx` (~L30–55) — une seule source (const ou CMS)

### Navigation clavier

- [x] **D3 — Mega-menus Services/Carnet accessibles clavier**
  - Fichier : `Navbar.tsx` (~L502–508, ~L608–614)
  - Problème : ouverture `mouseenter` seulement
  - Fix : `focusin`/`focusout`, ou Radix NavigationMenu / disclosure pattern

- [x] **D4 — Touch targets navbar**
  - Menu mobile : `size-10` → `min-h-11 min-w-11` (~L743)
  - Boutons thème : `size-9` → ≥ 44px (~L143, L208)

### Images & perf contenu

- [x] **D5 — Dimensions + lazy load images below-fold**
  - Ajouter `width`/`height` ou `aspect-ratio` + `loading="lazy"` hors hero
  - Fichiers prioritaires : `Home.tsx` portrait, `Blog.tsx`, carnet cards

- [x] **D6 — Vidéo about : pas d'autoplay agressif mobile**
  - Fichier : `Home.tsx` (~L819–837)
  - Option : `preload="none"`, poster, ou désactiver autoplay sous `prefers-reduced-motion`

### Typographie & détails (make-interfaces-feel-better)

- [x] **D7 — `text-balance` sur H1/H2 principaux**
- [x] **D8 — `tabular-nums` sur compteurs / dates animées**
- [x] **D9 — `-webkit-font-smoothing: antialiased` sur root layout**
- [x] **D10 — Contours images** : `outline: 1px solid rgba(0,0,0,0.1)` light / `rgba(255,255,255,0.1)` dark

### View transitions (optionnel)

- [x] **D11 — Étendre VT aux routes services (list → detail)**
  - Pattern existant blog : `viewTransition` + `viewTransitionName` appariés
  - Fichiers : `Services.tsx`, `ServiceDetail.tsx`
  - Ajouter reduced-motion CSS (B3) avant d'étendre

### Accessibilité contenu

- [x] **D12 — `ReadingsReferences.tsx` (~L104)** : label type depuis données CMS, pas `index % 2`
- [x] **D13 — `Blog.tsx` images** : `alt` descriptif ou `aria-hidden` si redondant avec titre lien

---

## Findings détaillés (référence file:line)

Format Web Interface Guidelines — pour navigation IDE.

### Accessibilité

```
ToolsInspirations.tsx:212-221 - CTA hover-only, inaccessible tactile
Home.tsx:380-384 - dots pagination 8×8px
Navbar.tsx:307 - href="#carnet" sans cible
Navbar.tsx:502-508,608-614 - mega-menus hover-only
Navbar.tsx:743-744 - menu mobile 40px
Navbar.tsx:143,208 - boutons thème 36px
Home.tsx:995-1027 - inputs outline-none sans focus-visible ring
Blog.tsx:157 - idem
Contact.tsx:188-219 - idem
ToolsInspirations.tsx:377 - idem
ReadingsReferences.tsx:104 - label type arbitraire (index % 2)
Blog.tsx:98-100 - img alt="" dans lien
```

### Motion

```
Home.tsx:697-726 - boucles infinies sans useReducedMotion
Home.tsx:328-336 - blur mot-à-mot témoignages
Home.tsx:380 - transition-all dots
global.css:7-8 - scroll-behavior smooth sans garde
global.css:277-286 - view-transition sans garde reduced-motion
ToolsInspirations.tsx:172,212 - transition-all
ReadingsReferences.tsx:81 - transition-all
About.tsx:62-83 - ✓ useReducedMotion (modèle)
Footer.tsx:411 - ✓ shader pause si reducedMotion
```

### Performance

```
Home.tsx:328-336 - filter blur animé (paint-heavy)
About.tsx:82 - willChange sur paragraphes scrollés
global.css:73-223 - will-change large sur utilitaires .t-*
Footer.tsx:370-388 - WebGL RAF continu
Blog.tsx:145-184 - motion layout filtres
Home.tsx:714-722 - portrait sans dimensions explicites
```

### Structure / cohérence

```
Home.tsx - SectionEyebrow local, form contact dupliqué, ~94 hex
Services.tsx - accent colors dupliquées vs Home
Contact.tsx vs Home.tsx - deux implémentations formulaire
Hero.tsx, components/Contact.tsx, etc. - legacy mort (thème emerald)
```

---

## Critères de done (global)

Avant de considérer la passe UI terminée :

- [x] Toutes les cases Vagues A + B cochées (minimum livrable)
- [x] Vague C au moins C1–C7 (tokens + offsets + composants partagés)
- [x] Vague D complète (hygiène & polish)
- [ ] Test manuel : iPhone 375px, desktop 1280px, dark mode, reduced motion
- [ ] `npm run typecheck` + `npm run build` passent
- [ ] `MEMORY.md` mis à jour (tokens, radius, offsets, décision carnet)
- [x] Reporter les priorités CMS restantes dans le suivi opérationnel

---

## Ordre suggéré à l'époque

| Ordre | Travail | Pourquoi |
|-------|---------|----------|
| 1 | Vagues A + B (ce document) | Bloquants UX + fondations motion avant nouveau contenu CMS |
| 2 | Vague C (tokens + composants) | Les nouveaux champs CMS (titres Home, About) utiliseront les bons patterns |
| 3 | Priorités CMS P1–P4 | Contenu éditable branché sur UI déjà cohérente |
| 4 | Vague D | Polish et dette — peut être parallélisé avec P3/P4 |
