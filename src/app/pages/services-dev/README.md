# Services pages (WIP)

Pages complètes en cours de développement. Sur `main`, `/services` et `/services/:slug`
affichent `ServicesUnderConstruction.tsx`.

## Activer en local sur `dev`

Dans `src/app/routes.tsx`, pointer les routes services vers :

- `./pages/services-dev/ServicesPage`
- `./pages/services-dev/ServiceDetailPage`

Quand le résultat est prêt, remplacer les exports de `Services.tsx` /
`ServiceDetailPage.tsx` (ou fusionner le contenu) puis merger `dev` → `main`.
