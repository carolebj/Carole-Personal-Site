# AGENT_DEV.md

Guide pour les agents (et développeurs) qui travaillent sur le dashboard CMS. Objectif : **initialisation additive optionnelle, test navigateur et validation sans action manuelle de Carole**.

## Configuration unique (`.env.local`, non versionné)

En plus de `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, ajouter :

```bash
CMS_SEED_EMAIL=email-du-compte-dashboard@exemple.com
CMS_SEED_PASSWORD="mot-de-passe-du-compte"
```

Si le mot de passe contient `#`, utilise des guillemets (sinon tout après `#` est ignoré).

Ces identifiants correspondent au compte **Supabase > Authentication > Users** utilisé pour `/dashboard`. Ils permettent au seed et aux scripts de vérification de s'authentifier sans argument CLI.

## Configuration Vercel

Dans **Vercel > Carole’s Team > carole-personal-site > Settings > Environment Variables**, ajouter
les deux variables publiques suivantes aux environnements **Preview** et
**Production** :

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sans elles, le dashboard déployé affiche volontairement le mode démo
`localStorage` et le site public utilise les contenus i18n de secours. Les
variables `CMS_SEED_EMAIL` et `CMS_SEED_PASSWORD` restent uniquement dans
`.env.local` et ne doivent jamais être ajoutées à Vercel.

Les variables `VITE_*` sont intégrées au build Vite : après leur ajout ou leur
modification, redéployer la branche concernée. L'URL publique canonique du
dashboard est :

```text
https://www.carolebj.com/dashboard
```

Pour une vérification sur `dev`, utiliser l'URL du dernier déploiement de cette
branche affichée par Vercel. Ne pas conserver une URL de preview générée comme
référence durable dans la documentation.

L'ancienne route `/admin` redirige vers `/dashboard`.

Optionnel :

```bash
DASHBOARD_URL=http://127.0.0.1:5173
```

## Commandes agents (à lancer après chaque changement CMS)

```bash
npm run cms:verify
```

Ce script :

1. Préserve les contenus existants et crée uniquement des documents temporaires préfixés `__E2E__`
2. Réutilise Vite s'il tourne déjà (`--fresh` pour forcer un redémarrage)
3. Vérifie le dashboard en headless (Playwright)
4. **Prépare une URL unique** — par défaut `/dashboard` (point d'entrée pour naviguer)
5. Affiche un bloc **« OÙ VÉRIFIER »** + ligne `AGENT_PREVIEW_URL=…` (aussi écrite dans `.cursor/preview.url`)
6. **L'agent ouvre cette URL dans le navigateur intégré de l'outil agent en cours** (choix par défaut)

### Navigateur : celui de l'outil agent (préférence Carole)

Carole travaille selon les environnements avec différents outils (Cursor, Codex, Claude Code, …). **Chaque outil a son propre navigateur intégré.** Préférence par défaut : **le navigateur interne de l'outil en cours**. Les navigateurs système (Chrome/Safari) restent une **option secondaire**, à utiliser uniquement quand il y a un bénéfice particulier (sinon rester sur le classique).

| Cible | Comportement |
|-------|----------------|
| `agent` (défaut) | Pas de `open` macOS. L'agent affiche l'URL dans son navigateur interne |
| `system` | Ouvre Safari/Chrome (`--browser=system` ou `BROWSER_TARGET=system`) — cas particuliers |

Selon l'outil :
- **Cursor** : MCP `browser_navigate` (plugin Browse) ou `Cmd+Shift+P → Simple Browser: Show`
- **Codex / Claude Code / autre** : utiliser le navigateur/preview intégré équivalent de l'outil

Après `npm run cms:verify`, l'agent **doit** afficher `AGENT_PREVIEW_URL` dans le navigateur interne de l'outil courant.

Variantes :

```bash
npm run cms:seed                              # initialisation additive, n'écrase rien
npm run cms:backfill                          # simule les compléments de champs vides
npm run cms:backfill -- --apply               # complète + publie sans écraser
npm run cms:export                            # export JSON avant migration/maintenance
npm run cms:reset -- --confirm=RESET_CMS      # remise à zéro destructive explicite
npm run cms:media:cleanup                     # simulation médias orphelins > 30 jours
npm run cms:trash:cleanup                     # simulation corbeille expirée > 30 jours
npm run cms:preview                             # redémarre Vite + ouvre 1 onglet
npm run cms:verify -- --seed                  # initialise les contenus manquants avant vérif
npm run cms:verify -- --no-open                 # vérif sans ouvrir le navigateur
npm run cms:verify -- --fresh                   # tuer le port 5173 + Vite --force (cache deps)
npm run playwright:install                      # une fois par machine (ou après bump playwright)
npm run cms:verify -- --open=/carnet/outils-inspirations   # ouvrir une page site précise
npm run cms:verify -- --open-all                # exception : lister toutes les URLs carnet
npm run cms:verify -- --browser=system          # ouvrir Safari/Chrome (déconseillé)
```

### Quelle URL ouvrir ?

| Travail en cours | URL à ouvrir (`--open=`) |
|------------------|--------------------------|
| Dashboard / édition CMS (défaut) | `/dashboard` |
| Rendu public carnet ressources | `/carnet/outils-inspirations` |
| Rendu public carnet lectures | `/carnet/lectures-references` |
| Blog, services, accueil… | la route concernée |

Optionnel dans `.env.local` : `CMS_OPEN_PATH=/dashboard`

**Règle : une seule URL, navigateur interne.** Carole navigue depuis ce point d'entrée. N'utiliser `--open-all` ou `--browser=system` que sur demande explicite.

## Règle pour les agents

Après toute modification touchant :

- `src/admin/*`
- `scripts/seed-supabase.mjs`
- `public/cms/**`
- `src/cms/cmsContent.ts`
- pages Carnet (`ToolsInspirations`, `ReadingsReferences`)

→ **Exécuter `npm run cms:verify` et ne pas conclure sans sortie `🎉 Vérification dashboard OK`.**

Dans la réponse à Carole, **donner une seule URL principale** + confirmer qu'elle est ouverte dans le **navigateur intégré de l'outil agent** (choix par défaut ; navigateur système seulement si bénéfice particulier).

Workflow agent après `cms:verify` :
1. Lire `AGENT_PREVIEW_URL=…` dans la sortie du script (ou `.cursor/preview.url`)
2. Ouvrir cette URL avec le navigateur interne de l'outil courant :
   - Cursor → `CallMcpTool` serveur `plugin-browse-browser`, tool `browser_navigate`, `{ "url": "…" }`
   - autre outil → son navigateur/preview intégré équivalent

En cas d'échec : corriger, relancer, documenter dans la réponse ce qui a été vérifié.

Si l'affichage semble ancien : **Cmd+Shift+R** sur l'onglet ouvert.

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `.env.local` | Secrets locaux (Supabase + identifiants seed) |
| `.env.example` | Modèle sans secrets |
| `scripts/seed-supabase.mjs` | Source de vérité initiale → Supabase |
| `scripts/backfill-cms-content.mjs` | Compléments éditoriaux et médias, fusion additive uniquement |
| `scripts/verify-dashboard.mjs` | Checks Playwright isolés, seed uniquement avec `--seed` |
| `public/cms/resources/` | Visuels carnet servis au dashboard et au site |
| `src/admin/carnetImages.ts` | URLs partagées seed / mock |

## Dépannage

| Symptôme | Action |
|----------|--------|
| `Identifiants manquants` | Compléter `CMS_SEED_*` dans `.env.local` |
| `Connexion dashboard impossible` | Vérifier email/mot de passe Supabase Auth |
| `Visuel ressource absent` | Vérifier `public/cms/resources/` puis `npm run cms:seed` |
| Port 5173 occupé | `DASHBOARD_URL=http://127.0.0.1:5185` ou libérer le port |
| Playwright manquant | `npm run playwright:install` (cache persistant `~/Library/Caches/ms-playwright` sur macOS) |
| Vite affiche une vieille version | `npm run cms:verify -- --fresh` puis hard refresh navigateur |

## Sécurité

- Ne **jamais** committer `.env.local` ni copier les mots de passe dans `../project/MEMORY.md`, `../GUIDELINE.md` ou les messages utilisateur.
- Les clés `VITE_*` sont publiques côté client ; la protection repose sur les RLS Supabase.
