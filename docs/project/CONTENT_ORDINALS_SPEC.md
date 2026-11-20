# Retrait des numéros décoratifs publics

## Contexte et objectif

Demande du 20 novembre 2026 : retirer les indices d’ordre décoratifs des
contenus et l’espace réservé à ces indices. Conserver le texte aligné avec
son bloc, sans redesign ni changement des contrôles, routes ou sons.

## Périmètre

- Navbar Services : numéro calculé et propriété menuIndex ; suppression du
  gap de colonne entre numéro et texte.
- Navbar Carnet : 01/02 codés en dur et leur espace de colonne.
- Dev, index Services : aperçu des livrables, carte des offres, en-têtes des
  cartes ; enlever les colonnes et marges devenues orphelines.
- Dev, détails Services : points clés et inclusions ; enlever la numérotation
  et la colonne, rapprocher le texte sans changer la présentation éditoriale.
- Main : portage limité à Navbar ; les pages Services d’attente ne sont pas
  remplacées par celles de dev.

## Non-objectifs et principes

Les copies non routées services-dev et les scénarios de test ne sont pas du
contenu éditorial public actif. Ils restent inchangés. Conserver progression,
pagination/carrousel, étapes/questions, dates, montants, résultats, métriques
et noms accessibles des couleurs. Pas de modification CMS, locales, données,
footer, hover, audio ou route. L’inventaire ne trouve pas de compteur CSS ni
de préfixe ordinal dans les locales publiques nécessitant une correction.

## Exécution et acceptation

1. Retrait ciblé des nœuds décoratifs et des paramètres d’index devenus inutiles.
2. Contrôle source et rendu des menus FR/EN, desktop/mobile : aucun indice
   décoratif, aucun emplacement vide conservé, titres/descriptions alignés.
3. Contrôle index/détails sur dev et maintien de l’attente Services sur main.
4. Audio et navigation inchangés, focus/clavier utilisables, aucun débordement.
5. Typecheck/build/tests/scan/diff-check et revue indépendante avant fusion.
   Les exceptions de scan préexistantes ne doivent pas être masquées.
