# Essai audio : couverture sémantique

Couverture mise en œuvre après retour utilisateur du 16 octobre 2026.
Essai validé humainement ; publication du seul lot audio sur dev et main
autorisée le 20 novembre, après revue indépendante. Cette autorisation ne
couvre aucun autre lot. Aucun changement des comportements, routes,
structures visuelles ou animations.

| Surface/action réelle | Retour | Exclusion |
| --- | --- | --- |
| Bouton, lien activable, carte rendue comme lien/bouton | point B2 ; primaire explicite B1 | disabled, aria-disabled, zone silent, contenu décoratif, saisie |
| Choix dans navigation/dropdown, radio | sélection M3 | pas de second close pour le même choix |
| Dropdown : false → true | ouverture M1 | montage initial, survol sans changement, avant premier geste utilisateur |
| Dropdown : true → false | fermeture M2 | fermeture provoquée par sélection du même panneau |
| Filtre type du Carnet | M1/M2 et M3 au choix | ne pas ajouter un clic générique au trigger |
| Mobile : menu/accordéon | transitions M1/M2 | pas de clic générique sur le déclencheur |
| Footer : navigation/langue/retour haut | B2 ou M3 pour choix de langue | aucun changement au ressort/shader |
| Toggle ordinaire | T1/T2 selon état | le mute audio reste silencieux à la coupure |
| Zone hero volontairement silent / WOW | fonctionnement séparé conservé | pas de nouvelle couche audio générique |

Un seul contrôle résolu via closest par clic natif, y compris activation clavier.
Pas de sons de frappe, focus, scroll ou hover sans transition réelle. Les états
dropdown sont observés dans React, pas déduits d’un déplacement de pointeur.
Les transitions rapides sont ordonnées, sans verrou arbitraire de 90 ms qui
supprimerait une action légitime. Les requêtes sont invalidées au mute/unmount.
La lecture exige un premier geste et respecte prefers-reduced-motion.

Inventaire : menus Services/Carnet/logo/thème, menu et accordéons mobiles,
filtre type du Carnet. Les panneaux de diagnostic/démonstration et les tiroirs
de l’estimateur ne sont pas reconfigurés : leurs contrôles conservent le clic
sémantique, sans prétendre couvrir leurs cycles complets comme des dropdowns.
Les cartes Home sont des liens ; les articles Services non activables restent
silencieux sauf leur véritable lien d’ouverture. Aucun élargissement des zones
cliquables. Les liens/footer sont couverts sans modifier Footer.tsx.

Acceptation : preuves d’événements desktop/mobile/clavier pour menus, carte,
bouton/footer ; aucun double enfant/parent ou sélection/close ; aucune voix
en mute ou reduced-motion ; son WOW et footer inchangés ; typecheck/build,
tests unitaires, scan secrets et diff-check. Audition humaine requise, un
oscillateur observé n’est pas une preuve de confort ou d’audibilité.

## Recette du 16 octobre

- `scripts/verify-audio-interactions.mjs` : aucune autolecture ; ouverture hover,
  sortie, changement de menu (close puis open), clavier, sélection sans close,
  carte Home, footer/liens/langue, deux choix rapides, menu/accordéon mobile,
  sélection fermant les deux panneaux sans doublon, contexte logo, mute et
  reduced-motion : événements conformes, aucune pageerror. Sortie audio
  déconnectée dans les seuls contextes navigateur de test.
- Test ciblé du Carnet : ouverture, sélection sans double close, réouverture,
  fermeture Escape et frappe silencieuse conformes.
- Typecheck, build, 119 tests unitaires, scan secrets et diff-check réussis.
  Après revue finale du nettoyage unmount : typecheck et tests ciblés rejoués.
- Le scénario mobile utilise un onglet neuf : la restauration de scroll de
  l’onglet footer masquait sinon la navigation. Aucun patch produit pour faire
  passer cette préparation de test.
- Footer.tsx, Home.tsx/WOW et lockfile inchangés. Essai site sur localhost:5194,
  pas la planche audio isolée. Un premier geste débloque la lecture ; mute et
  reduced-motion peuvent intentionnellement maintenir le silence.

L’écoute en situation a été validée par l’utilisateur avant préparation de la
publication. Les preuves d’événements ci-dessus ne sont pas une audition par
l’agent. Disabled/inert sont exclus par garde de code ; aucune
action désactivée n’a été forcée dans le navigateur pour contourner son état.
