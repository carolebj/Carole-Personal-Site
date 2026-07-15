# Design QA — Estimateur de projet, option 1

Date : 2026-07-15

## Références

- Source visuelle : `/Users/mrsteven/.codex/generated_images/019f630e-da4d-7c00-8e24-8ea2056a285c/exec-27b58da1-c36e-4953-a76a-16f3e38b3d89.png`
- Capture d'implémentation desktop : `/tmp/project-estimator-implementation.png`
- Comparaison côte à côte : `/tmp/project-estimator-qa-comparison.png`
- Capture mobile : `/tmp/project-estimator-mobile.png`
- Capture après retours navigateur, desktop : `/tmp/project-estimator-feedback-1360.png`
- Capture du stepper repositionné : `/tmp/project-estimator-feedback-1180.png`
- Capture après retours navigateur, mobile : `/tmp/project-estimator-feedback-mobile.png`
- Capture du récapitulatif Briefs clients, desktop : `/tmp/project-estimator-client-briefs-1360.png`
- Capture du récapitulatif Briefs clients, mobile : `/tmp/project-estimator-client-briefs-mobile.png`
- Capture desktop Lots 1–4 : `/tmp/estimator-desktop-light.png`
- Capture mobile Lots 1–4 : `/tmp/estimator-mobile.png`
- Capture mobile finale avec étape active recentrée : `/tmp/estimator-final-mobile-centered.png`
- Comparaison finale avec l'option 1 : `/tmp/estimator-comparison.png`
- Route vérifiée : `http://127.0.0.1:5174/estimer-mon-projet`

## Viewports et états

- Desktop : 1440 × 1024 px, français, étape 3 sur 6, XOF, services « Communication digitale » et « Création de contenu », 2 à 3 canaux, projet ponctuel.
- Mobile : 390 × 844 px, même état métier, navigation compacte.
- Retours annotés : 1360 × 676 px, étape 2 ; breakpoint compact vérifié à 1180 × 760 px ; mobile revérifié à 390 × 844 px.
- Modèle Briefs clients : 1360 × 768 px et 390 × 844 px, étape 6, trois services sélectionnés.

## Historique des constats

### Passe 1

- P1 corrigé : l'iconographie « 1 canal » et « 2 à 3 canaux » ne reprenait pas assez précisément les arcs de diffusion et les deux écrans superposés. Deux SVG custom à trait fin ont été ajoutés.
- P1 corrigé : les quatre choix de durée étaient trop horizontaux et ne comportaient pas les calendriers numérotés de la référence. Les cartes ont été redessinées avec calendrier, numéro et indicateur de sélection.
- P2 corrigé : le grand titre desktop se répartissait sur trois lignes au lieu de deux. Son échelle responsive a été resserrée.
- P2 corrigé : le crayon de « Création de contenu » comportait un cadre redondant. Il a été remplacé par un crayon seul.

### Passe 2

- Structure desktop conforme : navigation, trois colonnes, stepper, questions, résumé persistant, devise et actions suivent la composition de la référence.
- Hiérarchie typographique et palette conformes aux tokens existants du site.
- Iconographie cohérente : Heroicons outline 24 px complétés par des SVG custom au même poids de trait.
- Responsive validé à 390 px : aucune troncature bloquante ni débordement horizontal observé.
- Interactions vérifiées : choix obligatoires, activation du bouton Continuer, navigation étapes 3 → 4 → 3, suppression de service et changement de devise accessibles dans le DOM.
- Accessibilité vérifiée : un seul landmark `main`, région d'étape nommée, progression localisée, étape courante exposée, préférences de mouvement réduit respectées.
- Console navigateur : aucune erreur.

### Passe 3 — commentaires navigateur

- P1 corrigé : le stepper ne disparaît plus sous le breakpoint desktop. Il est repositionné en tête du formulaire sous une forme horizontale, défilable et recentrée automatiquement sur l'étape active.
- P1 corrigé : les libellés reflètent désormais le contenu réel des étapes — « Devise & orientation », « Services & objectifs » et « Livrables & options ».
- P1 corrigé : toute étape déjà visitée est cliquable. Le retour de l'étape 2 vers l'étape 1 a été vérifié sur desktop et mobile.
- P1 corrigé : la sauvegarde locale du brouillon est présentée uniquement comme une reprise automatique sur l'appareil. La conservation interne de 15 jours reste réservée à l'estimation définitive et n'est pas affichée ici.
- P1 corrigé : « Aperçu de l'estimation » explique désormais que cette zone accueillera la fourchette globale et le détail par service lorsque le moteur tarifaire sera connecté.
- P1 corrigé : retirer le dernier service invalide les étapes suivantes, ramène le parcours à l'étape 2 et empêche un export vide.
- Console navigateur : aucune erreur après les corrections.

### Passe 4 — séparation estimation et Briefs clients

- P1 corrigé : aucun email n'est demandé dans le récapitulatif de l'estimateur. Le DOM de l'étape 6 ne contient aucun champ `email`.
- P1 corrigé : l'étape finale explique le contenu du résultat sans simuler de montant tant que le moteur tarifaire n'est pas connecté.
- P1 corrigé : chaque service sélectionné est présenté comme un Brief client indépendant, dont seuls les champs sémantiquement compatibles seront préremplis.
- P1 corrigé : le téléchargement d'un Brief client et sa soumission à Carole sont explicitement présentés comme deux actions distinctes.
- Responsive validé à 390 px : largeur du document égale à la largeur du viewport, sans débordement horizontal ; le stepper reste présent et l'étape 6 est exposée comme étape courante.
- Accessibilité vérifiée : hiérarchie `h1` → `h2` → `h3`, régions nommées et trois cartes de Brief client annoncées dans le DOM.
- Console navigateur : aucune erreur.

### Passe 5 — parcours adaptatif des Lots 1–4

- Le parcours comporte six macro-étapes cohérentes : Projet, Services,
  Contexte, Vos services, Vérification et Estimation.
- L'orientation guidée exige un objectif, met en avant trois services suggérés
  sans les sélectionner à la place de l'utilisateur et laisse la combinaison
  entièrement modifiable.
- Le fil d'étapes reste visible à 1360 px, est repositionné horizontalement à
  1024 px et demeure défilable à 390 px. Le retour de l'étape 2 vers l'étape 1
  a été revérifié par interaction. Sur mobile, le passage aux étapes 5 et 6
  recentre l'étape active sans déplacer verticalement la page.
- Les cartes de services conservent l'iconographie outline proche de la
  référence, la palette, les bordures et les surfaces de l'option 1.
- L'écran final utilise le vrai moteur de calcul. Tant que la grille XOF métier
  n'est pas validée, il affiche explicitement que la calibration tarifaire est
  en cours, sans fabriquer de montant.
- Comparaison visuelle côte à côte effectuée entre la référence et la capture
  desktop en thème clair. La structure, les proportions, la typographie et la
  densité restent fidèles ; les différences visibles correspondent au nouveau
  découpage fonctionnel validé.
- Console navigateur : aucune erreur ni avertissement.

### Passe 6 — intégration finale moteur, session et résultat

- Le parcours Identité visuelle a été rejoué de l'étape 1 à l'étape 6 après
  l'intégration finale. Les 12 réponses obligatoires du service déverrouillent
  correctement la vérification et le résultat.
- Le type de structure, réservé au préremplissage du Brief client, est présenté
  comme facultatif et ne bloque pas l'estimation ; les cinq champs réellement
  tarifaires restent obligatoires.
- Quand l'API Vercel n'est pas disponible dans le serveur Vite local, l'écran
  final n'affiche aucun montant non sauvegardé et propose un état d'indisponibilité
  explicite. La carte du Brief client reste accessible sans demander d'email.
- La clé d'idempotence, les identifiants de l'estimation et son expiration sont
  conservés uniquement en session ; le retrait d'un service purge ses anciennes
  réponses avant le prochain calcul.
- Le résultat détaillé prévoit ventilation, ajustements, mutualisations,
  fiscalité, hypothèses, exclusions, conversion et version du modèle lorsque
  l'API renvoie une estimation persistée.
- Responsive mobile revérifié à 390 × 844 px. Le fil d'étapes reste visible et
  recentré ; aucun débordement horizontal bloquant observé.
- Console navigateur après rechargement propre et parcours complet : aucune
  erreur ni avertissement.

### Passe 7 — parcours mono-service et Briefs clients spécialisés

- L'estimateur traite désormais un seul service à la fois. Le parcours direct
  permet de choisir ce service ; le parcours guidé révèle successivement trois
  signaux simples, recommande un service principal et présente les éventuels
  besoins voisins comme des estimations séparées.
- Les questions de contexte et de service ont été relues depuis la posture d'un
  client non expert : intitulé accessible, explication utile, raison de la
  question et indication explicite du type de sélection. Les 54 questions de
  service ont été ramenées à 40 sans retirer les informations nécessaires au
  calcul.
- Les valeurs numériques difficiles à estimer ont été remplacées par des choix
  sémantiques pondérés ou des curseurs guidés. La fourchette de budget utilise
  deux poignées, des champs de saisie et des repères ; les volumes utilisent un
  curseur à paliers lorsque ce composant rend réellement la réponse plus simple.
- Le passage au résultat déclenche un interstitiel de calcul. Le flou progressif
  et trois éclats discrets créent un moment de révélation sans transformer les
  sparkles en motif décoratif global. `prefers-reduced-motion` supprime les
  mouvements non essentiels.
- Le résultat public ne montre plus d'adéquation budgétaire, d'identifiant de
  démonstration, de version technique ou de source interne. Il présente la
  fourchette, le service retenu et une explication courte de la méthode Carole.
- Les cinq Briefs clients conservent un moteur de persistance commun, mais
  disposent chacun d'expériences de collecte propres au métier. Le Brief
  Identité visuelle rétablit les familles de logo illustrées, le choix limité à
  deux références, la palette avec sélecteur natif/hex/eyedropper, les liens et
  les téléversements d'inspiration. Les quatre autres briefs utilisent des
  composants dédiés à leurs réalités plutôt qu'une suite de champs génériques.
- Le mode démo est isolé aux environnements de développement/preview et propose
  des scénarios fictifs pour parcourir l'estimateur et chaque Brief client sans
  écrire de données serveur.
- Responsive vérifié sur desktop, tablette et mobile : fil d'étapes toujours
  visible, résumé séparé du formulaire, contenus spécialisés sans débordement.
  Console navigateur : aucune erreur ni avertissement.
- Vérifications finales : 95 tests unitaires réussis, typecheck, build,
  `security:scan`, `git diff --check` et scénario CMS complet réussis.

### Passe 8 — environnement immersif, erreurs explicites et navigation corrective

- L'estimateur dispose désormais d'une barre compacte propre avec retour au
  site et d'un pied de page réduit ; le menu public complet et la date sans rôle
  ont disparu de ce parcours.
- Le calcul est matérialisé par un interstitiel réellement plein écran pendant
  au moins 3,6 secondes. Le contenu passe par quatre phases, un flou progressif
  et trois éclats discrets ; la révélation attend à la fois la durée minimale et
  la réponse du calculateur.
- L'absence de l'API sécurisée dans Vite local est identifiée comme une
  prévisualisation locale, et non comme une erreur de réponse du client. Chaque
  famille d'échec possède une explication, une cause compréhensible et une
  action adaptée ; aucune mention d'e-mail n'est affichée sur le résultat. Une
  requête suspendue est interrompue après 15 secondes afin de ne jamais enfermer
  l'utilisateur dans l'interstitiel.
- Les réponses nécessitant un cadrage complémentaire sont nommées avec leur
  service, la question et la réponse choisie. L'action associée ouvre l'étape 4,
  défile jusqu'à la question exacte et lui donne le focus.
- Sous 1280 px, le récapitulatif s'ouvre une première fois sous forme de tiroir
  droit animé. Une fois fermé, son bouton reste en bas à droite et le mode démo
  se place au-dessus. Le focus reste dans le tiroir et le verrou de défilement
  est partagé avec l'interstitiel pour éviter les conflits au changement de
  breakpoint. Vérifié à 1196 × 706 px et 390 × 844 px.
- Vérification navigateur : aucune erreur ni avertissement console.

## Résultat

final result: passed
