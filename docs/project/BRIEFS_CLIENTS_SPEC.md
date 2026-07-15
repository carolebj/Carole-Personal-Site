# Briefs clients — architecture produit et templates

Statut : implémenté sur `dev`, contrats v3 publiés sur le projet Supabase lié.
Dernière révision : 2026-07-16

## Contexte

Chaque service possède un Brief client autonome. L'estimateur ne génère pas ces
briefs à partir de rien : il transmet uniquement des valeurs compatibles aux
templates préexistants. Le Brief design actuel devient le template du service
Identité visuelle et doit être généralisé sans perdre les soumissions déjà
enregistrées.

## Principes

- Un template distinct existe pour chacun des cinq services. Seules la
  persistance, la progression, la sécurité et les actions finales partagent un
  moteur ; les questions, dépendances et techniques de découverte restent
  propres à chaque prestation.
- Le profil projet commun assure la continuité d'un même dossier, mais ne
  remplace jamais les questions métier propres au service.
- Une valeur n'est préremplie que lorsque le Brief est ouvert depuis le résultat
  d'une estimation encore cohérente avec son brouillon source. Un Brief ouvert
  directement depuis une page Service ne lit jamais un ancien brouillon
  d'estimation.
- Chaque valeur préremplie indique sobrement sa provenance. Cette indication
  n'est pas une case à cocher et disparaît définitivement dès la première
  modification de la valeur, même si l'utilisateur restaure ensuite le choix
  initial.
- Modifier un brief ne modifie jamais l'estimation source.
- Les champs servant au calcul et les champs d'approfondissement du brief restent
  identifiables séparément.
- Un champ `brief-prefill-only` reste facultatif dans l'estimateur, ne porte
  aucune dimension tarifaire et ne peut déclencher ni montant ni étude manuelle.
- L'utilisateur peut compléter le brief associé au service estimé, ou accéder
  directement à tout autre Brief client depuis la page du service concerné.
- Le téléchargement et la soumission à Carole sont deux actions distinctes.
- L'email est obligatoire uniquement au moment du téléchargement d'un Brief
  client finalisé.
- Le consentement commercial reste facultatif et séparé.

## Dossier de Briefs clients

Après l'estimation, une carte est affichée pour chaque service sélectionné. Elle
indique le nom du Brief client, son taux de préremplissage et son état : non
commencé, brouillon, prêt, téléchargé ou soumis.

Le dossier contient :

1. un profil projet partagé ;
2. une instance de brief créée uniquement lorsque l'utilisateur ouvre le
   template du service ;
3. les fichiers propres à chaque instance ;
4. les exports PDF et leur état de livraison ;
5. le lien avec l'estimation source et la version du template.

## Expérience de composition

Le contrat versionné vit dans `shared/client-brief-contract.js`. Le composant
public `ClientBrief` interprète ce contrat sans uniformiser le fond : cartes de
choix, sélections multiples limitées, échelles contextualisées, questions
conditionnelles et reports temporaires. Chaque question possède une aide
spécifique qui explique directement ce que le client peut répondre, avec un
exemple utile quand le sujet peut prêter à confusion. Les encarts génériques
« pourquoi cette information compte » ne sont pas utilisés : le contexte utile
est intégré sous le titre de la question.

Les versions v3 comportent des embranchements métier propres aux prestations :
stratégie existante ou à créer, campagne/community management/crise/média payé,
écriture/visuel/vidéo/production sur site, profondeur et échantillonnage d'audit,
ou encore naming/architecture de marque/système colorimétrique. Une réponse
masquée par un changement de branche est retirée avant enregistrement.

Un champ différé n'oblige pas le client à inventer une réponse : le contrôle est
désactivé et grisé, porte l'état visible « À remplir plus tard », puis peut être
réactivé avec « Répondre maintenant ». Il peut continuer à découvrir le document
et revenir plus tard. Le Brief ne peut
cependant être finalisé, téléchargé ou soumis tant que les informations
obligatoires ne sont pas complétées.
Le brouillon versionné reste sur l'appareil de l'utilisateur.

## Profil projet partagé

Les champs suivants ne doivent pas être répétés dans chaque template :

- nom de l'organisation, du projet ou de la marque ;
- stade du projet ou de l'activité ;
- description synthétique de l'activité ;
- objectif principal ;
- publics prioritaires ;
- marchés, zones géographiques et langues ;
- personne référente avec son moyen de contact, et décideur final ;
- échéance, urgence et contraintes majeures ;
- ressources, documents et éléments existants ;
- estimation source, devise et date de génération.

## Template 1 — Brief client Stratégie éditoriale

### Sections

1. Votre projet
2. Point de départ et résultat
3. Publics, existant et preuves
4. Mission, territoires et voix
5. Livrables et transmission
6. Contacts du projet
7. Vérification finale

### Préremplissage depuis l'estimateur

État de la stratégie, nombre de marques ou offres, canaux, publics, langues,
livrables, volume du corpus, benchmark, mode de collecte, niveau de charte,
accompagnement après remise et gouvernance.

### À compléter dans le brief

Vision, différence, sujets d'autorité, sujets interdits, perception actuelle,
exemples de contenus, mots à employer ou éviter, critères qualitatifs et
documents de référence.

## Template 2 — Brief client Communication digitale

### Sections

1. Votre projet
2. Objectifs et message
3. Canaux et périmètre opérationnel
4. Campagnes et modération
5. Média payant et mesure
6. Contacts du projet
7. Vérification finale

### Préremplissage depuis l'estimateur

Type de mission, canaux, nombre de comptes, marchés, durée, cadence, origine des
contenus, missions incluses, modération, temps forts, campagne payante,
reporting, accès, validation et disponibilité.

### À compléter dans le brief

Messages prioritaires, charte de réponse, cas d'escalade, mots de passe ou accès
transmis par un canal sécurisé, KPI détaillés, calendrier des événements,
processus interne et exemples de communication.

## Template 3 — Brief client Création de contenu

### Sections

1. Votre projet
2. Finalité et matrice des livrables
3. Sources et direction créative
4. Production et logistique
5. Droits, accessibilité et qualité
6. Contacts du projet
7. Vérification finale

### Préremplissage depuis l'estimateur

Formats, quantités, cadence, création ou adaptation, canaux, disponibilité de la
matière, entretiens, templates existants, niveau vidéo, langues, droits, actifs,
rythme de livraison, validations, accessibilité et déplacements.

### À compléter dans le brief

Message clé, angle, tonalité, CTA, scripts ou informations sources, références
appréciées, sujets interdits, personnes à filmer ou interviewer, lieux,
spécifications techniques et critères de réussite.

## Template 4 — Brief client Audit & conseil

### Sections

1. Votre projet
2. Problème et décision attendue
3. Périmètre, corpus et accès
4. Critères et méthode
5. Livrables et mise en œuvre
6. Contacts du projet
7. Vérification finale

### Préremplissage depuis l'estimateur

Objet de l'audit, actifs, comptes, marchés, période, sources de données, niveau
d'analyse, benchmark, livrables, restitution, ateliers, mise en œuvre, secteur
et urgence.

### À compléter dans le brief

Symptômes observés, décisions attendues, historique, accès détaillés, documents,
questions auxquelles l'audit doit répondre, parties prenantes, contraintes de
confidentialité et format de recommandations attendu.

## Template 5 — Brief client Identité visuelle

Le Brief design existant constitue la base de ce template. Il doit conserver ses
capacités actuelles : questions adaptatives, couleurs, styles de logo, liens,
pièces jointes, brouillon local, récapitulatif et soumission à Carole.

### Sections cibles

1. Votre projet
2. Point de départ et ambition
3. Nom et architecture de marque
4. Direction créative
5. Système, applications et production
6. Contacts du projet
7. Vérification finale

### Préremplissage depuis l'estimateur

Type de besoin, création ou refonte, éléments existants, état du nom,
positionnement, marques ou gammes, livrables, niveau de charte, supports,
usages, langues, exploration, décideurs, cycles de validation, fichiers de
production, extensions graphiques, licences et échéance.

### À compléter dans le brief

Description approfondie, différence, vision, attributs, concurrents, références,
styles de logo, couleurs, inspirations, critères de réussite, éléments à éviter
et fichiers sources.

### Ajustements obligatoires du brief existant

- le renommer et le rattacher explicitement au service Identité visuelle ;
- accepter un contexte de préremplissage versionné ;
- signaler sobrement chaque valeur préremplie tant qu'elle n'a pas été modifiée ;
- ajouter le téléchargement PDF après saisie et vérification de l'email ;
- conserver la soumission à Carole comme action séparée ;
- rendre le template bilingue ;
- empêcher la finalisation tant que les champs obligatoires manquent ;
- généraliser la persistance, les pièces jointes et les statuts ;
- migrer les soumissions historiques sans perte.

## Téléchargement d'un Brief client

Le téléchargement suit le même contrat pour les cinq templates :

1. vérification des champs obligatoires ;
2. récapitulatif final ;
3. saisie de l'email uniquement à ce moment ;
4. vérification par code à six chiffres, valable dix minutes ;
5. génération serveur du PDF ;
6. téléchargement ou livraison par lien signé ;
7. rattachement au contact dédupliqué ;
8. consentement commercial facultatif et séparé.

Les PDF sont conservés dans le bucket privé `brief-exports` et exposés par URL
signée pendant 15 jours. Les codes sont stockés uniquement sous forme de HMAC,
limités en fréquence et en tentatives, puis consommés atomiquement. La charge
complète du Brief reste dans le challenge dix minutes seulement jusqu'à
vérification ; elle n'est persistée comme instance finalisée qu'après succès.
Les adresses sont dédupliquées par
`upsert_estimator_contact`, sans fusionner les instances, exports ou
soumissions.

Le PDF indique le service, la version du template, la date, les réponses, les
pièces jointes référencées et, lorsqu'il provient de l'estimateur, l'identifiant
de l'estimation source. Il ne constitue ni un devis ni un engagement de Carole.

## Soumission à Carole

L'action « Soumettre à Carole » est proposée séparément dans chaque brief et au
niveau du dossier. L'utilisateur choisit les briefs concernés. La soumission :

- transmet les réponses et pièces jointes sélectionnées ;
- rattache l'estimation source si elle existe encore ;
- demande les coordonnées nécessaires au suivi ;
- précise qu'un devis réel peut nécessiter une étude complémentaire et une
  réunion de cadrage ;
- n'active aucun consentement commercial par défaut.

Les soumissions utilisent une clé d'idempotence, des limites par adresse et par
origine, et un mécanisme de réclamation de notification afin qu'un retry ne
multiplie ni les dossiers ni les e-mails. Les pièces jointes sont envoyées par
URL signée dans le bucket privé `brief-assets` ; aucun rôle public n'a le droit
d'y écrire directement.

## Modèle de données cible

- `brief_templates`
- `brief_template_versions`
- `brief_packages`
- `brief_instances`
- `brief_prefill_values`
- `brief_assets`
- `brief_exports`
- `brief_submissions`

Les définitions de champs, règles conditionnelles, traductions et mappings de
préremplissage sont versionnés. Une nouvelle version ne modifie jamais un brief
déjà commencé, exporté ou soumis.

## Critères d'acceptation

- Les cinq services disposent chacun d'un template complet.
- Une estimation mono-service présente un accès facultatif au Brief client
  correspondant, sans ouverture automatique.
- Aucun champ n'est prérempli sur la seule base d'un libellé ressemblant.
- Les valeurs préremplies restent identifiables et modifiables sans imposer une
  confirmation artificielle.
- Les champs partagés ne sont renseignés qu'une fois.
- Aucun email n'est demandé dans l'estimateur ou pour afficher le résultat.
- Chaque téléchargement de Brief client exige un email valide.
- Le téléchargement fonctionne sans soumission à Carole.
- La soumission fonctionne sans consentement commercial.
- Le Brief client Identité visuelle conserve les capacités utiles du Brief
  design existant et ajoute le téléchargement.
- Le parcours fonctionne en français et en anglais, sur mobile et desktop, au
  clavier et avec reprise de brouillon.

## Publication et vérification

- `npm run briefs:publish` valide localement les cinq définitions et leurs
  empreintes sans écrire à distance.
- `npm run briefs:publish -- --apply` publie les versions FR et EN après
  application des migrations Supabase.
- Les quatre migrations `20260715193000`, `20260715233000`, `20260716001000`
  et `20260716013000` sont appliquées au projet lié ; les dix définitions v3
  publiées (cinq services × deux langues) ont été vérifiées dans Supabase puis
  republiées de façon idempotente avec le script local. La clé
  `SUPABASE_SERVICE_ROLE_KEY` reste uniquement dans `.env.local`, ignoré par
  Git et protégé avec le mode `0600` ; elle ne doit jamais être placée dans le
  navigateur applicatif ni dans une variable `VITE_*`.
- Une version publiée est immuable : toute évolution du contrat exige une
  nouvelle version.
- `/services/:slug/brief-client` est la route canonique ;
  `/services/brief-design` redirige vers le Brief Identité visuelle.
- Chaque page Service comporte une entrée dans le panneau d'introduction, une
  carte de cadrage et un rappel final. Les cartes du résultat d'estimation
  ouvrent les mêmes routes avec préremplissage local explicite.

L'activation sur Vercel exige que les secrets serveur documentés dans
`.env.example`, notamment `BRIEF_VERIFICATION_SECRET`, soient présents dans le
projet `carole-personal-site`. Le lien local pointe bien vers ce projet de
Carole, mais le compte CLI actuellement authentifié n'a pas accès à son équipe ;
aucun relinkage vers un autre projet ne doit être effectué pour contourner ce
contrôle d'accès.

## Règle de mise à jour

Ce document conserve les structures durables des Briefs clients. Les tarifs,
tâches opérationnelles, dates de livraison et contenus encore non validés restent
dans leurs sources dédiées ou dans TickTick.
