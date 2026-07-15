# Calibration tarifaire de l’estimateur

Last reviewed: 2026-07-15 WAT

## Objet et statut

Ce document décrit la calibration de travail `2026-07-15-benin-calibration`.
Elle a été proposée à partir du positionnement actuel de Carole — profil
intermédiaire, offre accessible, possibilité de constituer une équipe ou de
sous-traiter — puis autorisée comme base paramétrable le 15 juillet 2026.

Ce ne sont ni des prix officiels du marché, ni des devis contractuels. Les
montants doivent être révisés avec les prochains devis réels. Une modification
crée toujours une nouvelle version ; elle ne réécrit jamais une estimation
historique.

Le catalogue actif vit dans `src/app/estimator/pricingCatalog.ts`. Le script
`npm run estimator:pricing:publish` vérifie le catalogue et les cinq scénarios
sans rien publier. L’option `-- --apply` est volontairement requise pour
publier dans Supabase avec une clé `SUPABASE_SERVICE_ROLE_KEY`. Elle reste
bloquée tant qu’une décision métier — actuellement le régime fiscal réel de
Carole — figure dans `missingPricingDecisions`. Taux et modèle sont ensuite
publiés par une seule transaction RPC : un échec conserve intégralement la
version précédente.

## Principes commerciaux

1. La charge, le risque et les livrables déterminent d’abord le prix.
2. Le budget déclaré ne modifie jamais le calcul. Il produit seulement un
   diagnostic `compatible`, `partiel` ou `insuffisant`.
3. La taille ou la localisation du client ne sont pas des multiplicateurs de
   richesse. Elles ne modifient le prix que lorsqu’elles impliquent davantage
   de gouvernance, de coordination, de langues, de marchés ou d’exposition.
4. Le recours à une équipe ou à un spécialiste reste invisible pour le client
   si Carole demeure le point focal, mais son coût, la coordination, le contrôle
   qualité et le risque de reprise doivent rester couverts.
5. Une remise d’acquisition reste une décision commerciale interne et ne doit
   pas être demandée dans l’estimateur public.
6. Les cas trop spécialisés basculent en étude manuelle au lieu d’afficher une
   fausse précision.

## Repères de marché utilisés

Les repères ont été triangulés ; aucun n’est pris isolément comme vérité.

- Le [SMIG béninois est fixé à 52 000 FCFA depuis le 1er janvier
  2023](https://sgg.gouv.bj/cm/2022-12-07/). Il situe le pouvoir d’achat local,
  mais ne constitue pas une base de TJM freelance.
- Le [guide Grey Search Africa 2024–2025](https://startupmedias.net/storage/grey-search-africa-guide-des-salaires-2024-2025-cote-divoire-benin-senegal.pdf)
  fournit des repères salariés béninois et régionaux pour la communication, le
  digital et la création. Un salaire mensuel ne doit pas être divisé par vingt
  pour fabriquer un TJM : un indépendant ne facture pas tous ses jours et
  supporte ses outils, sa prospection, son administration et son risque.
- Une [agence béninoise affiche 150 000–500 000 FCFA par mois pour le community
  management et 150 000–300 000 FCFA pour une charte
  graphique](https://www.digitalinnovation.bj/services).
- Un autre [guide commercial béninois situe le community management entre
  80 000 et 900 000 FCFA par mois selon le niveau, la charte complète entre
  200 000 et 500 000 FCFA et l’identité complète entre 500 000 et 1 200 000
  FCFA](https://princedjetta.com/tout-savoir-sur-les-tarifs-dune-agence-digitale-au-benin-en-2026/).
- Un [projet institutionnel béninois publié par le ministère des Finances](https://finances.bj/wp-content/uploads/2025/11/PMPP_WEDAF_26-09-2025_clean.pdf)
  budgète 5 000 000 FCFA pour élaborer puis suivre un plan de communication sur
  une fenêtre de 120 jours. Ce repère illustre le saut de charge des missions
  institutionnelles ; il n’est pas transposé directement aux PME.
- Le cas réel CLOGIS confirme un prix initial de 250 000 FCFA, une
  contre-proposition à 150 000 FCFA et un compromis exceptionnel à 200 000
  FCFA. Le périmètre réel — cadrage, identité de marque ombrelle, mini-charte,
  déclinaisons et deux supports — doit être estimé à sa juste valeur avant toute
  remise.

## Monnaie, fiscalité et arrondi

- Monnaie canonique : XOF.
- EUR : parité fixe officielle `1 EUR = 655,957 XOF` selon la
  [BCEAO](https://www.bceao.int/fr/content/histoire-du-franc-cfa).
- USD : snapshot BCEAO daté, refusé par l’API après sept jours.
- Arrondi : pas de 5 000 XOF ; borne basse vers le bas, borne haute vers le haut.
- Fiscalité de la calibration actuelle : non calculée. Le [Code général des impôts du
  Bénin 2026 fixe le taux général de TVA à
  18 %](https://api.impots.bj/media/6984ebbbb7bc0_B%C3%A9nin-Code%20G%C3%A9n%C3%A9ral%20des%20Imp%C3%B4ts%202026.pdf),
  mais l’estimateur ne doit pas l’ajouter avant confirmation du régime fiscal
  réel de Carole. Le devis final appliquera la fiscalité légalement applicable.

## Ancrages de production internes

Ces taux servent à relire la cohérence des forfaits. Ils ne sont pas affichés au
client et ne remplacent pas les règles de périmètre.

| Mode de production | Repère interne |
| --- | ---: |
| Carole seule, profil intermédiaire | 45 000–65 000 FCFA/jour |
| Spécialiste confirmé régional | 70 000–100 000 FCFA/jour |
| Senior ou expertise rare sous-traitée | 100 000–150 000 FCFA/jour |
| Équipe hybride, moyenne consolidée | 75 000–120 000 FCFA/jour |

Une sous-traitance doit couvrir le coût externe, environ 15 % de coordination
et 5 à 12 % d’aléa selon la maturité du périmètre. Un prix négocié ne doit jamais
passer sous ce coût de production complet.

## Périmètres de base

| Service | Base XOF | Inclus avant ajustements |
| --- | ---: | --- |
| Stratégie éditoriale | 150 000–260 000 | cadrage, 1 marque, 2 publics, analyse de 10 contenus, socle de positionnement/piliers/calendrier |
| Communication digitale | 100 000–180 000 | cadrage et premier mois, 1 compte, coordination standard, jusqu’à 8 publications mensuelles |
| Création de contenu | 100 000–180 000 | premier lot de 4 contenus simples, une livraison groupée, matière exploitable |
| Audit & conseil | 100 000–200 000 | diagnostic, 1 marque, 3 actifs et 10 éléments de corpus |
| Identité visuelle | 120 000–200 000 | socle créatif accessible, 1 marque, logo principal et deux cycles de correction |

Les règles chiffrées détaillées — volumes, options, droits, logistique,
complexité, langues, validation et urgence — sont centralisées dans le
catalogue TypeScript. L’interface affiche chaque ajustement appliqué et le
périmètre pris en compte.

## Facteurs partagés

Le profil partagé collecte désormais :

- envergure de la structure ;
- localisation principale du porteur de projet ;
- stade du projet ;
- enveloppe envisagée, facultative et non tarifaire ;
- marchés visés ;
- langues ;
- délai ;
- nombre de personnes qui valident.

Le Bénin, une start-up ou petite entreprise, un marché local, une langue, un
délai normal et un valideur constituent la référence `1,00`. Les ajustements
portent uniquement sur la charge supplémentaire :

| Facteur | Ajustement candidat appliqué |
| --- | ---: |
| Entreprise établie | × 1,05–1,10 |
| Grande organisation ou institution | × 1,125–1,25 |
| UEMOA hors Bénin | × 1,05–1,125 |
| Afrique hors UEMOA | × 1,125–1,25 |
| Hors Afrique | × 1,25–1,45 |
| Projet encore au stade de l’idée | × 1,10–1,20 |
| Repositionnement | × 1,10–1,25 |
| Marché régional | × 1,125–1,25 |
| Marché international | × 1,25–1,45 |
| Deux langues | × 1,125–1,20 |
| Trois langues ou plus | × 1,25–1,40 |
| Démarrage sous deux semaines | × 1,20–1,35 |
| Deux à trois valideurs | × 1,05–1,10 |
| Quatre valideurs ou plus | × 1,15–1,25 |

Une langue ou un circuit de validation encore indéterminé déclenche une étude
manuelle. Les multiplicateurs sont appliqués aux fourchettes déjà enrichies par
le périmètre. Les scénarios extrêmes doivent être relus avant publication d’un
devis réel.

## Mutualisations multiservices

Les économies ne sont appliquées que lorsqu’une charge est réellement évitée :

| Combinaison | Assiette | Réduction |
| --- | --- | ---: |
| Stratégie éditoriale + création de contenu | contenu | 6 % |
| Communication digitale + création de contenu | contenu | 8 % |
| Stratégie éditoriale + communication digitale | communication | 5 % |

Même lorsque trois services sont sélectionnés, ces remises restent attachées à
des charges distinctes. Toute future remise d’acquisition devra être plafonnée,
non cumulable sans contrôle et appliquée uniquement côté serveur.

## Scénarios de référence

Les scénarios suivants sont recalculés avant toute publication du catalogue :

| Scénario | Fourchette XOF attendue |
| --- | ---: |
| Stratégie éditoriale standard, benchmark ciblé, charte et présentation | 245 000–425 000 |
| Communication digitale, 2 comptes, 12 posts/mois, 3 mois | 440 000–825 000 |
| Lot de 12 contenus mixtes avec gabarits adaptés | 320 000–670 000 |
| Audit approfondi de 5 actifs avec rapport, plan et accompagnement | 490 000–955 000 |
| CLOGIS à sa juste valeur, avant remise exceptionnelle | 435 000–805 000 |

Le compromis CLOGIS à 200 000 FCFA reste documenté comme geste commercial
exceptionnel. Il ne devient ni une base automatique, ni une preuve qu’un
périmètre comparable est rentable à ce prix.

## Révisions futures

À chaque nouvelle version :

1. comparer les estimations aux devis réellement acceptés et refusés ;
2. comparer la charge prévue à la charge réelle de Carole et des collaborateurs ;
3. mettre à jour les coûts externes et la marge de coordination ;
4. revalider la fiscalité avec le statut réel de Carole ;
5. mettre à jour le taux USD BCEAO ;
6. ajuster le catalogue et les scénarios dans un nouveau `modelVersion` ;
7. exécuter typecheck, tests, build, scan sécurité et simulation de publication ;
8. publier seulement après revue explicite.

## Règle de mise à jour

Ce fichier décrit l’état courant, pas l’historique des négociations. Remplacer
les valeurs devenues obsolètes, conserver les preuves sources et ne jamais
modifier rétroactivement une estimation enregistrée.
