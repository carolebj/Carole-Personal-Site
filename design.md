# Design — Carole Tonoukoin

Système verrouillé pour les parcours guidés du site. Les pages de l’estimateur
et des Briefs clients lisent ce document avant toute évolution visuelle. Il
complète les tokens existants sans redessiner le site public hors de ce périmètre.

## Genre

Éditorial chaleureux, précis et pédagogique. La page ressemble davantage à un
carnet de cadrage accompagné qu’à un tableau de bord ou à un questionnaire
administratif.

## Audience, usage et ton

- Audience : porteurs de projet, indépendants et équipes souvent non spécialistes.
- Usage : comprendre un besoin, obtenir une estimation pour un seul service,
  puis composer librement le Brief client correspondant.
- Ton : adulte, rassurant, direct. Chaque terme technique est traduit ou expliqué.

## Macrostructure family

- Pages marketing : préserver la structure publique existante.
- Parcours guidés : **Narrative Workflow** — une étape, une intention et une
  décision principale à la fois. Les numéros servent uniquement à la progression.
- Résultat : **Long Document court** — montant, facteurs retenus, méthode Carole,
  puis choix clair entre terminer et poursuivre vers le Brief client.
- Briefs clients : **Narrative Workflow spécialisé** — même shell, mais outils et
  rythme propres au métier concerné.

## Theme

Le thème est une adaptation du registre Linen aux couleurs existantes de Carole.

- `--color-paper` : `oklch(98% 0.008 25)`
- `--color-paper-2` : `oklch(96% 0.009 25)`
- `--color-ink` : `oklch(22% 0.008 35)`
- `--color-ink-2` : `oklch(37% 0.02 35)`
- `--color-rule` : `oklch(90% 0.009 25)`
- `--color-accent` : `oklch(48% 0.09 345)`
- `--color-accent-soft` : `oklch(94% 0.025 345)`
- `--color-focus` : `oklch(48% 0.09 345)`

L’accent prune indique un choix, un lien ou un focus. Il ne remplit pas de
grandes surfaces. Les surfaces de récapitulatif utilisent un papier légèrement
plus chaud, jamais un bleu de dashboard.

## Typography

- Display : Newsreader, poids 300–500, normal ou italique selon la phrase.
- Body et UI : Inter, poids 400 ; 500 uniquement pour les contrôles.
- Outlier : Liberation Serif uniquement pour la signature ou un moment de marque.
- Display tracking : `-0.025em`.
- Texte courant : 16 px minimum, mesure idéale de 45 à 70 caractères.

Le maintien d’Inter est volontaire : il appartient au site existant. La voix de
marque vient du contraste avec Newsreader et du rythme éditorial, pas d’un
changement global de fonte.

## Spacing

Échelle de 4 points, exprimée par des tokens. Les questions utilisent trois
rythmes visibles : serré pour le contexte, moyen pour le choix, ample entre deux
intentions. Aucun empilement uniforme de cartes.

## Motion

- Easings : `--ease-out`, `--ease-in`, `--ease-in-out`.
- Changement d’étape : sortie courte puis entrée en fondu avec translation de 8 px.
- Calcul : interstitiel plein écran d’au moins 3,6 secondes, composé de quatre
  phases lisibles, d’un flou progressif et de trois éclats discrets. Ces éclats
  accompagnent uniquement la révélation du résultat ; ils ne deviennent jamais
  un motif décoratif récurrent.
- Sélection : coche ou radio en 120 ms, pas de zoom universel.
- Reduced motion : fondu seul, 150 ms maximum ; résultat final affiché directement.
- Maximum : trois primitives de mouvement par page.

## Microinteractions stance

- Succès silencieux quand le résultat est déjà visible.
- Aucune notification décorative.
- Focus immédiat, visible et non animé.
- Validation après sortie du champ, puis mise à jour pendant la correction.
- Les cartes de choix uniques et multiples ont des marqueurs visuellement distincts.
- Toute aide disponible au survol est aussi disponible au focus et au toucher.

## CTA voice

- Primaire : fond prune, libellé d’action précis et court — « Voir mon estimation »,
  « Enregistrer et continuer », « Télécharger mon Brief ».
- Secondaire : texte ou contour fin — « Revenir », « Modifier », « Je ne sais pas ».
- Les boutons restent sur une ligne et leurs cibles tactiles font au moins 44 px.

## Question contract

Chaque question contient :

1. un titre formulé dans le langage du client ;
2. une courte aide qui dit quoi répondre ;
3. cette aide explique directement, lorsque c’est utile, pourquoi l’information
   est demandée ; aucun encart séparé « Pourquoi cette réponse compte » ;
4. une indication explicite « Un choix » ou « Plusieurs choix possibles » ;
5. un astérisque s’il faut répondre, jamais un badge « Obligatoire ».

Les options « Je ne sais pas encore », « Aidez-moi à choisir » ou « Le plus adapté
pour démarrer » sont proposées dès qu’un non-spécialiste pourrait légitimement
hésiter. Les nombres exacts sont remplacés par des situations ou des fourchettes
compréhensibles, pondérées en interne.

## Service-specific experiences

- Identité visuelle : 9 styles de logo illustrés, 2 choix maximum, palette avec
  pipette, liens d’inspiration, dépôt d’images avec aperçu et questions adaptatives.
- Stratégie éditoriale : portrait libre du public, carte des canaux et résultats
  attendus exprimés sans jargon de livrable.
- Communication digitale : configurateur canaux × rythme × responsabilités.
- Création de contenu : galerie de formats illustrés et planification visuelle du volume.
- Audit & conseil : carte des symptômes, éléments déjà disponibles et niveau d’accès.

## Demo mode

Le mode démo est un outil privé de test visuel. Il peut préremplir un scénario,
mais les termes « demo », identifiants techniques et versions de fixtures ne sont
jamais rendus dans le contenu public ni dans les PDF.

## Public result contract

Le résultat public montre la fourchette, le service retenu, les principaux
facteurs qui l’expliquent et la **Méthode Carole**. Il ne montre ni source brute,
ni référentiel technique, ni version de modèle, ni identifiant interne, ni
comparaison avec une enveloppe déclarée.

La Méthode Carole est décrite comme une approche personnalisée construite à partir
du service, de l’ampleur, du contexte béninois et de références régionales et
internationales. L’estimation reste indicative et non contractuelle.

## Responsive

- Le suivi d’étapes reste toujours visible : rail latéral sur grand écran,
  tête de parcours compacte sur tablette et mobile.
- Le récapitulatif devient un panneau repliable sous 60 rem, puis une feuille
  accessible par un bouton fixe sur mobile.
- Vérification obligatoire à 320, 375, 414 et 768 px.
- `html` et `body` utilisent `overflow-x: clip`.

## What pages MUST share

- La palette crème, prune et rose ; Newsreader + Inter ; les focus ; les boutons.
- Le shell de progression, la sauvegarde locale et le mode démo privé.
- Le contrat de question et les transitions de changement d’étape.

## What pages MAY differ on

- Les composants de collecte, les aides, les illustrations et le nombre d’étapes.
- La couleur d’un aperçu métier, dans les tokens de la palette existante.
- La densité du récapitulatif selon le service.

## Exports

Les formats de production restent centralisés dans `src/styles/tokens.css`, qui
porte les variables CSS et l’export Tailwind v4 `@theme inline`. Aucun second
fichier de tokens concurrent ne doit être créé à la racine.

## Update rule

Modifier ce document uniquement lorsqu’une décision durable de marque, de parcours
ou d’accessibilité change. Ne pas y enregistrer l’historique des itérations.
