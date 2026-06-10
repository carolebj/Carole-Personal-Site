# AGENTS.md

Point d'entrée pour les agents (Cursor, Codex, opencode, Claude Code…) et les
développeurs. Les documents de guidage vivent dans **`docs/`**.

## Carte des documents

- **`docs/GUIDELINE.md`** — guide canonique : commandes, architecture, règles de
  code. À lire en premier.
- **`docs/SECURITY.md`** — modèle de sécurité et façon de travailler (secrets,
  rotation, scan pré-commit, runbook incident).
- **`docs/workflows/AGENT_DEV.md`** — workflow **seed CMS + vérification
  navigateur autonome** : lancer `npm run cms:verify`, puis ouvrir
  `AGENT_PREVIEW_URL` dans le navigateur intégré de l'outil courant (Cursor via
  MCP `browser_navigate` ; Codex/Claude Code via leur propre preview ; le
  navigateur système n'est qu'une option secondaire, en cas de bénéfice précis).
- **`docs/project/MEMORY.md`** — mémoire produit/design vivante (contexte courant).
- **`docs/project/NEXT_STEPS.md`** — passation / todo de la session en cours.
- **`docs/project/UI_AUDIT.md`** — checklist passe cohérence UI site public (motion,
  tokens, a11y, responsive) — à traiter avant les steps CMS si en cours.

## Réflexes

- Avant de coder : lire `docs/GUIDELINE.md`, `docs/project/MEMORY.md`, puis
  `docs/project/NEXT_STEPS.md` pour la todo courante.
- Avant de toucher aux secrets ou de committer : lire `docs/SECURITY.md` et
  lancer `npm run security:scan` (le hook pre-commit le fait automatiquement
  après `npm run security:install-hooks`).
- Après une modif liée au CMS : suivre `docs/workflows/AGENT_DEV.md` et confirmer
  le succès de `npm run cms:verify`.
- Mettre à jour `docs/project/MEMORY.md` à chaque changement majeur (produit,
  design, architecture, commandes, données).
