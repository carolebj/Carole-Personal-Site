# Carole Personal Site — Centre de contrôle

Last reviewed: 2026-08-12 WAT

## Identité et frontière

- Tâche : `🗼 Carole Personal Site — Centre de contrôle`
- Identifiant : `019ff632-f77f-7a33-be83-d9723b32e8f6`
- Dossier autorisé : `/Users/mrsteven/Documents/GitHub/Carole Portfolio version 1.0`
- Projet : Carole Personal Site, exclusivement.

Le centre coordonne, qualifie les preuves, consolide les décisions et suit les
missions. Il ne devient jamais un centre global et n'intervient dans aucun autre
projet. Un dossier commun ou une tâche visible ne suffit pas à établir un
rattachement : l'objectif ou les livrables doivent appartenir à Carole Personal
Site.

## Autorité

Le centre peut inspecter le projet, maintenir ce registre, cadrer ou relancer
une tâche Carole, suivre ses jalons et résoudre une difficulté technique petite,
réversible et déjà couverte par l'autorité accordée. Le responsable humain garde
la décision finale.

Sans autorisation explicite, le centre ne committe, ne pousse, ne déploie, ne
publie, ne communique à l'extérieur, ne crée pas de worktree et ne supprime pas
de données. Il préserve toujours les modifications préexistantes.

## Règles pour les tâches Carole

Toute tâche nouvelle ou reprise doit :

1. lire `AGENTS.md`, `docs/GUIDELINE.md`, `docs/project/MEMORY.md` et ce protocole ;
2. confirmer son périmètre Carole et inspecter l'état réel du dépôt ;
3. préserver les changements existants et distinguer local, commit, push et publication ;
4. signaler rapidement un blocage réel au centre ;
5. continuer le travail indépendant lorsqu'un blocage secondaire le permet ;
6. envoyer un rapport au centre à un jalon matériel utile et obligatoirement en fin de mission.

Les tâches spécialisées ne modifient pas directement le registre. Le centre ne
réveille pas les tâches historiques sans besoin matériel.

## Blocage

```text
ALERTE BLOCAGE Carole Personal Site
Tâche : <titre et identifiant>
Problème : <fait ou erreur exacte>
Impact : <bloqué / non bloqué>
Tentatives sûres : <actions et résultats>
Travail poursuivi : <ce qui avance encore>
Attente : <aide ou arbitrage précis>
```

La tâche suspend seulement l'action affectée, sauf risque de sécurité, action
destructive, autorisation absente, conflit de fichiers insoluble, chemin critique
entièrement bloqué ou décision humaine indispensable. Le centre garde l'alerte
ouverte jusqu'au retour explicite de la tâche.

## Rapport

```text
RAPPORT Carole Personal Site
Tâche : <titre et identifiant>
Statut : TERMINÉ | PARTIEL | DÉCISION REQUISE | BLOQUÉ | ANNULÉ
Objectif : <objectif traité>
Résultat : <résultat concret>
Fichiers et surfaces : <chemins, services ou aucun>
Vérification : <commandes, rendu, URL ou preuve>
Décisions durables : <faits ou aucun>
Risques et points ouverts : <limites ou aucun>
Git et publication : <local, commit, push, déploiement ou aucun>
Recommandation : <prochaine action>
```

Une mission lancée ou relancée par le centre reste suivie jusqu'à un état final
explicite. Un statut d'interface ou le silence d'une tâche ne prouve pas sa fin.

## Cycle de coordination

Qualifier le besoin, rattacher uniquement les tâches Carole, cadrer la mission,
suivre les jalons utiles, traiter les alertes, vérifier le rapport, puis mettre à
jour le registre et la mémoire seulement si un fait durable change. Les preuves
distinguent toujours : produit, vérifié, décidé, validé par le client, local,
committé, poussé et réellement publié.

## Photographie initiale

État observé le 2026-08-12 : branche `dev`, cinq commits devant `origin/dev`.
Un diff non committé préexistant touche `src/app/components/Footer.tsx`. Quatre
rapports HTML d'audit sont non suivis, dont le cahier d'exécution
`docs/project/CURSOR_AUDIT_IMPLEMENTATION_BRIEF.html`. Aucun push ni déploiement
n'a été vérifié pendant l'installation du centre.

### Actives ou à reprendre

| Tâche | Identifiant | Statut réel | Rôle | Dernier résultat vérifiable | Attente suivante |
|---|---|---|---|---|---|
| Centre de contrôle | `019ff632-f77f-7a33-be83-d9723b32e8f6` | Actif | Coordination exclusive | Protocole installé ; photographie Git établie | Consolider les prochains rapports |
| Intégrer les correctifs de l'audit | `019fa0d2-33a8-7a51-ac90-36be8d4ba280` | TERMINÉ localement — D3-A | Audit et validation des correctifs | D3-A intégré sur quatre usages publics et vérifié ; admin intact | Proposer un commit D3-A séparé ; aucun push sans autorisation |

### Arbitrages remontés au centre

1. **Footer — VALIDÉ humainement le 2026-08-12** — la version non committée est
   acceptée : comportement historique dans le flux, scroll inverse,
   survol/sortie et clic prolongé. Le commit local `195b0f2` contient une
   approche ensuite refusée ; le diff courant la corrige et doit être conservé
   jusqu'à sa clôture Git séparée.
2. **Icône publique — exploration active** — choisir la signature canonique
   remplaçant `SparklesIcon`. Une tâche spécialisée prépare
   `docs/project/SPARKLE_ICON_DIRECTIONS.html`, espace comparatif avec plusieurs
   SVG originaux mis en situation. Aucun remplacement ne doit précéder
   l'arbitrage humain.
   **Décision humaine du 2026-08-12** : D3 Astérisque éditorial irrégulier est
   retenu. Une courte finalisation optique du seul D3 doit préserver son geste
   manuel et sa distance avec l'étoile « IA », puis faire valider la forme
   canonique avant tout remplacement public. L'iconMap admin reste hors
   intégration automatique.
   **Finalisation livrée** : D3-A Équilibre éditorial, D3-B Geste manuscrit et
   D3-C Note minimale. Recommandation optique : D3-A, sous réserve de confirmer
   le noyau actuel ou légèrement réduit.
   **Décision finale du 2026-08-12** : D3-A Équilibre éditorial avec son noyau
   actuel est la forme canonique retenue. L'intégration doit centraliser le
   glyphe, remplacer les usages publics concernés et laisser l'iconMap admin
   inchangé.
3. **Suite du chantier** — choisir entre l'inspection sécurité live en lecture
   seule (Lots 2/2B, recommandée avant toute mutation distante) et les restes
   évidents du design system (Lot 3).
4. **Décisions séparées** — architecture SEO/deep-links, règle de publication
   bilingue du CMS et cadre légal/confidentialité restent soumis à validation
   humaine avant implémentation.

### Backlog opérationnel TickTick

La liste `Work > Carole - Personal site` reste la source opérationnelle. La
recherche du 2026-08-12 a confirmé le parent `Audit site 2026 — intégrer les
trois rapports` (`6a66a11f8f08f8252583a470`) et ses lots 1A, 1B, 2, 2B, 3 et 4,
ainsi que trois sujets « À valider » et une vérification d'environnement. Cette
présence ne prouve ni achèvement ni priorité actuelle : lire la tâche et ses
commentaires avant toute reprise. Le centre ne recopie pas ici le backlog
détaillé et ne modifie pas son statut sans preuve d'exécution.

### Historiques réutilisables

Les travaux About/video, cadrage de l'estimateur, publication contrôlée de
l'accueil/navigation et rollback du second lot sont confirmés par les fichiers,
commits ou synthèses antérieures. Ils servent de contexte durable mais ne sont
pas inscrits comme missions actives : aucune tâche visible distincte n'a été
qualifiée pour eux dans la fenêtre de recherche actuelle.

## Lacunes connues

- La liste visible des tâches Codex est limitée aux résultats actuellement
  disponibles dans l'application ; des tâches plus anciennes peuvent ne pas y
  apparaître.
- Les états historiques de build, push, Vercel et navigateur ne sont pas
  considérés comme actuels sans nouvelle vérification.
- L'origine exacte et la validation du diff footer actuellement non committé ne
  sont pas établies par cette installation ; il doit être préservé.
- TickTick reste la source opérationnelle des lots d'audit. Le registre n'en
  duplique pas les micro-itérations.

## Règle de mise à jour

Mettre ce document à jour lorsqu'une tâche est créée, change matériellement de
mission, se bloque, attend une décision ou atteint un état final. Remplacer les
états périmés ; ne pas transformer le registre en journal exhaustif.
