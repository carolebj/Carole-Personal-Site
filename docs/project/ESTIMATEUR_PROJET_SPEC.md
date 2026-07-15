# Estimateur de projet — spécification produit

Statut : cadrage produit en cours de validation
Dernière révision : 2026-07-15

## Contexte

Le site annonce déjà un estimateur depuis le méga-menu Services avec le CTA
« Estimer mon projet ». Le produit doit permettre de composer une estimation
pour un service à la fois, comprendre les variables qui influencent le montant, recevoir
une estimation réaliste et explicable, puis proposer un dossier de briefs
préremplis que la personne peut exploiter librement ou soumettre à Carole pour
préparer un devis réel et un éventuel cadrage.

Cette spécification décrit le produit complet. Les lots ci-dessous organisent
la charge et les dépendances ; ils ne correspondent pas à des versions réduites
du produit. Les structures propres aux cinq Briefs clients sont définies dans
`docs/project/BRIEFS_CLIENTS_SPEC.md`. Le schéma privé, les frontières d'accès et
la rétention sont détaillés dans
`docs/project/ESTIMATOR_DATA_ARCHITECTURE.md`.

## Objectif

Construire un estimateur transparent qui :

- sélectionne directement un service ou en recommande un seul comme meilleur point de départ ;
- pose des questions transversales et des questions adaptatives par service ;
- calcule des fourchettes indicatives explicables ;
- affiche par défaut les montants en franc CFA BCEAO (`XOF`) et permet une
  lecture en euro (`EUR`) ou dollar américain (`USD`) ;
- affiche la fourchette du service retenu avant toute demande d'email ;
- propose ensuite, de façon facultative, d'ouvrir le template de Brief client
  propre au service estimé ;
- préremplit les champs compatibles de ces templates avec les réponses déjà
  collectées ;
- demande l'email uniquement au moment où un Brief client finalisé doit être
  téléchargé ;
- conserve chaque estimation générée pendant 15 jours ;
- déduplique les contacts sans confondre leurs différentes estimations ;
- permet une prospection ultérieure uniquement lorsque le consentement
  commercial requis a été recueilli et tracé.

## Non-objectifs

- Présenter le résultat comme un devis, un engagement contractuel ou un prix
  fixe.
- Modifier un montant à partir d'un texte libre ou d'une décision opaque d'IA.
- Masquer les hypothèses, les conversions ou les variables de prix.
- Fusionner plusieurs estimations d'un même contact en une estimation unique.
- Indexer les résultats individuels dans les moteurs de recherche.
- Faire remplir l'intégralité des briefs avant d'afficher l'estimation.
- Confondre le téléchargement d'un brief, sa soumission à Carole, une demande
  de devis et le consentement à recevoir des offres commerciales.

## Principes

### Estimation explicable

Chaque variation de la borne basse ou haute doit correspondre à une règle
identifiable : volume, périmètre, option, accompagnement, droits, urgence ou
mutualisation explicitement autorisée. À modèle tarifaire et réponses égales,
le résultat doit être identique.

### L'estimateur ne fabrique pas les briefs

Chaque service possède un template de Brief client autonome, versionné et
préexistant. Le Brief design actuel devient le Brief client du service Identité
visuelle ; les quatre autres services doivent disposer de leur propre structure
de brief.

L'estimateur ne transforme pas ses réponses en document. Il fournit uniquement
des valeurs de préremplissage aux champs dont le sens est strictement compatible
avec le template du service. L'utilisateur complète ensuite les champs propres
au brief, puis peut le télécharger ou le soumettre à Carole.

Une valeur préremplie reste modifiable et porte sa provenance. Modifier le brief
ne change jamais rétroactivement l'estimation qui lui sert de source. Si une
modification change le périmètre, une nouvelle estimation doit être générée.

### XOF comme source de vérité

Les règles tarifaires et les montants canoniques sont enregistrés en XOF.
L'utilisateur choisit sa devise au début du parcours parmi XOF, EUR et USD ;
XOF est présélectionné par défaut. Il peut ensuite basculer l'affichage sans
recalculer le projet.

- EUR : conversion selon la parité fixe `1 EUR = 655,957 XOF`.
- USD : conversion selon un cours de référence BCEAO récupéré et mis en cache.
- Chaque estimation conserve le taux, la source et la date utilisés afin de ne
  pas changer rétroactivement.
- Les montants sont arrondis de manière lisible pour éviter une fausse
  précision ; la règle d'arrondi doit être validée avec le modèle tarifaire.

### Email au téléchargement, consentement commercial séparé

L'estimation est visible sans email. L'adresse email devient obligatoire dans
chaque Brief client au moment de télécharger le PDF finalisé. Elle sert alors à :

1. vérifier l'adresse et autoriser la livraison du Brief client ;
2. rattacher les téléchargements d'une même personne à un contact dédupliqué ;
3. permettre de renvoyer le document si sa politique de conservation l'autorise.

L'utilisation de cette adresse pour des offres ou relances commerciales est
une finalité distincte. Elle nécessite un consentement explicite, non précoché,
horodaté, versionné et révocable. Le refus ne bloque ni l'estimation, ni la
composition, ni le téléchargement des Briefs clients.

## Parcours fonctionnel

### 1. Devise

L'utilisateur choisit XOF, EUR ou USD. XOF reste le choix par défaut et la base
de tous les calculs.

### 2. Orientation

Deux entrées sont proposées :

- « Je sais quels services choisir » ;
- « Aidez-moi à identifier mon besoin ».

Le second chemin pose trois questions accessibles sur le résultat recherché,
la difficulté observée et le point de départ. Il recommande ensuite un service
principal, le retient automatiquement et signale au maximum deux autres besoins
pertinents à traiter dans des estimations séparées. L'utilisateur peut remplacer
le service retenu avant de poursuivre.

### 3. Sélection mono-service

Une estimation porte sur exactement un service. Un nouveau choix remplace le
précédent. Pour estimer un autre besoin, l'utilisateur termine ou quitte le
parcours courant, puis relance une estimation séparée. Le catalogue et ses règles
restent configurables afin d'accueillir les services actuels et futurs sans
reconstruire le parcours.

### 4. Profil et questions transversales

Les paramètres communs ne sont demandés qu'une fois : type d'accompagnement,
périmètre, volumes, éléments existants, langues, marchés, échéance, urgence,
validations, accompagnement attendu, droits et contraintes.

Les réponses indispensables au calcul sont distinguées visuellement des
informations facultatives. Les champs libres peuvent préremplir un Brief client
mais ne modifient jamais automatiquement le montant.

Le contrat du profil partagé classe `organizationType` et `investmentRange`
comme `brief-prefill-only` : ces champs sont facultatifs. Le type de structure
préremplit le Brief client ; l'enveloppe permet seulement de signaler si le
périmètre estimé est compatible, partiellement compatible ou insuffisant. Elle
ne modifie jamais le prix. `organizationScale`, `clientLocation`,
`projectStage`, `marketScope`, `languageScope`, `timeline` et
`validationProcess` sont `pricing-and-prefill`, requis pour estimer et reliés
uniquement aux dimensions déclarées dans le contrat versionné. La taille ou la
localisation ne justifient aucun coefficient de richesse : seules les charges
réelles de gouvernance, coordination, langues, marchés et exposition peuvent
modifier une fourchette par une règle chiffrée publiée.

### 5. Questions adaptatives par service

Chaque service dispose de questions, options, dépendances et limites propres.
Les embranchements inutiles restent masqués. Une combinaison hors cadre produit
« étude manuelle nécessaire » pour le service concerné plutôt qu'une fourchette
artificielle.

Le parcours présente une macro-étape « Votre besoin » contenant uniquement le
questionnaire du service retenu. La progression comporte deux niveaux :

- progression générale : Départ, Orientation, Contexte, Votre besoin,
  Vérification, Estimation ;
- progression locale : service actif et nombre de questions restantes.

Chaque question configurable porte au minimum une clé sémantique stable, sa
portée, sa finalité, sa dimension tarifaire, son caractère obligatoire, ses
conditions d'affichage, ses valeurs hors cadre et sa destination éventuelle de
préremplissage dans un template de Brief client.

Deux finalités sont autorisées. `pricing-and-prefill` désigne une information
de périmètre utilisable par une règle tarifaire et éventuellement réutilisable
dans le brief. `brief-prefill-only` désigne une information d'approfondissement
qui reste facultative pendant l'estimation, ne déclare aucune dimension
tarifaire et ne peut déclencher ni supplément ni étude manuelle. À ce stade, les
54 questions propres aux cinq services relèvent toutes de la première finalité ;
les questions de détail listées « À compléter dans le brief » restent dans les
templates de Briefs clients.

Les cinq modules initiaux couvrent :

- Stratégie éditoriale : état de la stratégie, marques/offres, canaux, publics,
  langues, livrables, corpus, benchmark, recherche, voix, transmission et
  gouvernance ;
- Communication digitale : nature du dispositif, plateformes, comptes,
  durée, cadence, responsabilités, publication, modération, campagnes,
  reporting, accès et disponibilité ;
- Création de contenu : formats, quantités, déclinaisons, canaux, matière
  source, entretiens, templates, captation/montage, langues, droits, actifs,
  cadence, validations, accessibilité et déplacements ;
- Audit & conseil : objet, actifs audités, période, données accessibles,
  profondeur, benchmark, livrables, restitution, ateliers, mise en œuvre et
  contraintes sectorielles ;
- Identité visuelle : création/refonte, actifs, naming, positionnement,
  architecture de marque, système visuel, charte, applications, langues,
  exploration, validations, fichiers, extensions graphiques et licences.

Les variables communes ne sont jamais facturées implicitement deux fois. Par
exemple, Création de contenu chiffre les formats et volumes tandis que
Communication digitale chiffre le pilotage, la publication et le reporting.
Chaque mutualisation appliquée apparaît dans le résultat.

### 6. Résultat

Le résultat affiche :

1. la fourchette indicative du service retenu ;
2. le service et le périmètre pris en compte ;
3. les prestations et volumes inclus ;
4. les options, mutualisations et majorations ;
5. les hypothèses appliquées ;
6. les éléments exclus ou à confirmer ;
7. la devise, le taux de conversion, sa source et sa date ;
8. la version du modèle tarifaire ;
9. la mention explicite indiquant que le résultat n'est pas un devis.

Chaque service transporte un snapshot public immuable `calculationScope`,
enregistré avec le résultat. Il sépare le périmètre de base du catalogue, les
inclusions, les volumes, les options et les exclusions du calcul. Une entrée ne
contient que sa portée, sa clé stable, sa valeur normalisée, ses dimensions et
les identifiants des règles appliquées ; les libellés sont résolus depuis le
contrat questionnaire versionné. Les questions masquées sont omises. Une
exclusion explicite n'est produite que si l'option est déclarée comme telle dans
le contrat ; les entrées visibles non renseignées et les champs réservés au
préremplissage du brief restent également distingués.

### 7. Accès facultatif au Brief client après l'estimation

Le résultat ne demande pas d'email. Une carte propose, sans l'ouvrir
automatiquement, de compléter le Brief client associé au service estimé.
L'utilisateur reste libre de l'ouvrir ou non. Les Briefs clients restent aussi
accessibles indépendamment depuis chaque page de service, sans passage préalable
par l'estimateur.

Chaque template reprend les champs compatibles du profil partagé et du module
tarifaire du service, signale leur provenance et demande uniquement les détails
complémentaires propres au brief. Le Brief client Identité visuelle est fondé
sur le Brief design existant, qui doit être adapté au système générique.

À la fin de chaque Brief client :

1. l'utilisateur vérifie les réponses et les champs préremplis ;
2. il saisit son email pour déverrouiller le téléchargement du PDF ;
3. il peut télécharger le brief pour l'utiliser avec n'importe quel prestataire ;
4. séparément, il peut soumettre le brief à Carole pour préparer un devis réel
   et, si nécessaire, une réunion de cadrage.

Le consentement commercial reste facultatif, non précoché et indépendant du
téléchargement comme de la soumission.

## Données

### Contacts

Un contact est identifié par une adresse normalisée et unique. Une nouvelle
visite met à jour le contact existant au lieu de créer un doublon. Le contact
conserve notamment :

- email normalisé ;
- statut de vérification ;
- première et dernière activité ;
- consentement commercial, date, source et version du texte accepté ;
- date de retrait ou d'opposition, le cas échéant.

### Estimations

Chaque génération de résultat crée une estimation distincte. L'enregistrement
est créé dès l'affichage du résultat et reste anonyme tant qu'aucun Brief client
n'est téléchargé ou soumis. Si un email est ensuite vérifié dans un Brief
client, le dossier peut rattacher l'estimation source au contact dédupliqué sans
fusionner les estimations entre elles. Il conserve :

- identifiant de session puis, le cas échéant, identifiant du contact ;
- réponses et service retenu ;
- fourchettes XOF et devise d'affichage ;
- taux de conversion figé ;
- version du modèle tarifaire ;
- dates de création et d'expiration.

L'expiration est fixée à 15 jours après la génération. Une tâche planifiée
supprime les données détaillées expirées. La suppression est
contrôlée, journalisée et vérifiable. Les coordonnées sans consentement
commercial ne doivent pas être conservées au-delà de la finalité opérationnelle
déclarée. Une liste minimale d'opposition peut être conservée séparément pour
éviter toute réinscription ou relance non souhaitée.

### Templates et instances de Brief client

Les Briefs clients sont des objets distincts des estimations. Le modèle cible
comprend :

- `brief_templates` : service, langue, version, statut et définition des champs ;
- `brief_packages` : estimation source, contact éventuel et profil partagé ;
- `brief_instances` : service, version du template, réponses et statut ;
- `brief_assets` : fichiers privés rattachés à une instance ;
- `brief_exports` : PDF, email vérifié, livraison et expiration éventuelle.

Le système crée une instance uniquement lorsqu'un utilisateur ouvre le Brief
client d'un service. Chaque valeur préremplie conserve sa provenance et reste
modifiable. Les statuts minimaux sont brouillon, prêt, exporté et soumis.

La politique de conservation des Briefs clients et de leurs exports est définie
séparément de l'expiration à 15 jours de l'estimation source. Le Brief design
existant doit être migré additivement vers le template Identité visuelle, sans
perdre les soumissions historiques.

## Administration

Le CMS gère les libellés, aides, questions, choix, ordre et contenus SEO. Un
espace protégé distinct gère les modèles tarifaires, conversions, règles et
scénarios de contrôle.

Un modèle passe par les états brouillon, vérification et publication. Une
publication ne remplace jamais le modèle associé aux estimations déjà générées.

Le dashboard permet de :

- retrouver un contact et son historique d'estimations ;
- distinguer clairement contact commercialisable et contact opérationnel ;
- filtrer par service, devise, statut et période ;
- renvoyer un lien tant que l'estimation n'est pas expirée ;
- enregistrer un retrait de consentement ;
- suivre les suppressions automatiques ;
- tester un modèle tarifaire avant publication.

## Sécurité et conformité

- Validation serveur de toutes les réponses et règles tarifaires.
- Calcul et génération PDF côté serveur.
- Stockage privé et liens signés à durée limitée.
- RLS Supabase stricte ; le dashboard authentifié passe par des endpoints
  serveur autorisés et ne lit pas directement les tables privées.
- Protection anti-abus, limitation de débit et journalisation minimale.
- Aucune donnée personnelle ou réponse libre dans les événements analytics.
- Consentements traçables et mécanisme de désinscription dans chaque message
  commercial.
- Politique de confidentialité, textes de consentement et formalités APDP à
  faire valider explicitement avant publication. Ces prérequis juridiques
  externes sont suivis au Lot 7 ; le schéma technique ne constitue pas une
  validation de conformité.

## SEO et mesure

La page publique de l'estimateur est indexable. Les résultats, liens signés et
exports sont privés et non indexables. Les événements mesurés excluent les
données personnelles : démarrage, devise, services choisis, progression,
résultat généré, email vérifié, export livré et consentement commercial.

## Lots de réalisation

Tous les lots font partie du produit à construire.

### Lot 1 — Modèle métier et tarifaire

Catalogue complet, variables, fourchettes XOF, règles, limites, mutualisations,
arrondis, traitement fiscal et scénarios de référence. La calibration active
`2026-07-15-benin-calibration` est paramétrable et part du contexte béninois et
du positionnement intermédiaire de Carole. Elle distingue la juste valeur du
périmètre des remises commerciales exceptionnelles et ne calcule aucune taxe
tant que le régime fiscal réel de Carole n'est pas confirmé.

### Lot 2 — Architecture des données et conformité

Contacts dédupliqués, estimations multiples, consentements, expiration à 15
jours, suppression, modèle versionné, sécurité et traçabilité nécessaires à la
conformité. Ce lot prépare les preuves et garde-fous techniques, sans déclarer
validés la politique de confidentialité, les textes juridiques ou les
formalités APDP.

### Lot 3 — Parcours et conception d'interaction

Devise, orientation directe ou guidée, sélection mono-service, profil partagé,
questionnaire propre au service, progression à deux niveaux, résumé responsive,
fourchette de budget, reprise de brouillon, mode démo isolé et accessibilité.

### Lot 4 — Moteur de calcul et conversions

Calcul déterministe en XOF, conversion EUR/USD, taux figés, cas hors cadre,
hypothèses et résultat détaillé.

### Lot 5 — Briefs clients, email, PDF et acquisition

Templates des cinq services, préremplissage depuis l'estimation, composition et
validation, email obligatoire au téléchargement, génération PDF, liens signés,
soumission séparée à Carole, consentement commercial, désinscription et
déduplication.

État au 16 juillet 2026 : implémenté sur `dev`. Le lot comprend cinq structures
de découverte distinctes, le compositeur bilingue et responsive, les entrées
depuis Services et l'estimateur, le brouillon local, le préremplissage à
confirmer, la vérification e-mail, le PDF serveur privé, la soumission et la
publication versionnée des templates. Les quatre migrations ont été appliquées
au projet Supabase lié et les dix contrats v2 sont publiés. L'activation du
workflow sur Vercel reste conditionnée à la présence des secrets serveur dans
le projet de Carole ; cette configuration et le déploiement relèvent du lot 7.

### Lot 6 — CMS, dashboard, SEO et analytics

Administration des questions et modèles, consultation des contacts et
estimations, contenus SEO, mesure non nominative et suivi des expirations.

### Lot 7 — Vérification et mise en production

Tests de calcul, conversion, sécurité, suppression, emails, accessibilité,
responsive, français/anglais, scénarios limites et vérification navigateur.
La publication reste bloquée tant que la politique de confidentialité, les
textes de consentement, les durées de conservation finales et les formalités
APDP n'ont pas été revus et explicitement validés par les personnes compétentes.

## Critères d'acceptation

- L'intégralité des lots est réalisée et vérifiée.
- Chaque estimation générée est conservée séparément pendant exactement 15
  jours puis supprimée selon la politique définie.
- Une même adresse ne crée jamais plusieurs contacts, mais peut posséder
  plusieurs estimations.
- XOF est la source de vérité ; EUR et USD restent des conversions traçables.
- L'estimation est visible sans email.
- Chaque service possède un template de Brief client autonome et versionné.
- L'email est obligatoire uniquement pour télécharger un Brief client finalisé.
- Une estimation mono-service propose le Brief client correspondant sans
  l'ouvrir automatiquement ; les autres services nécessitent des estimations
  séparées.
- Le téléchargement d'un Brief client et sa soumission à Carole sont deux
  actions distinctes.
- La prospection n'est possible que pour les contacts disposant d'une base
  légale et d'une opposition ou d'un consentement correctement gérés.
- Les montants sont explicables et reproductibles.
- Aucun résultat ni export n'est présenté comme un devis.
- Les données privées ne sont ni publiques, ni indexées, ni exposées dans les
  analytics.
- Le parcours fonctionne sur mobile et desktop, au clavier, en français et en
  anglais.

## Règle de mise à jour

Ce document conserve uniquement le fonctionnement durable et les décisions du
produit. Les tâches opérationnelles, blocages et dates de réalisation restent
dans TickTick.
