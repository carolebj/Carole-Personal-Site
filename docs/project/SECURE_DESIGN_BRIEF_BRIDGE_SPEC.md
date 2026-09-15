# Pont serveur sécurisé du Design Brief

## Contexte

Le Design Brief public est la base éditoriale du futur brief « Identité
visuelle ». Ses questions, exemples de familles de logos, références visuelles,
brouillon local et écran de récapitulatif doivent rester inchangés. Aujourd'hui,
le navigateur téléverse toutefois directement dans `brief-assets` puis insère
directement dans `design_brief_submissions` avec le rôle public.

## Objectif

Conserver le questionnaire et son modèle de données existant, tout en déplaçant
la confiance vers une fonction serveur qui :

- valide le corps, les réponses et les métadonnées de fichiers ;
- crée des autorisations d'upload signées et limitées à un chemin aléatoire ;
- applique un quota durable via `consume_estimator_rate_limit` ;
- contrôle après upload la taille enregistrée et la signature binaire du type ;
- insère avec `service_role`, avec un identifiant stable et idempotent ;
- ne fournit aucune API publique de lecture des briefs ou des fichiers privés.

## Non-objectifs

- refondre, traduire ou réduire le questionnaire ;
- importer le Client Brief, les Services ou l'estimateur de `dev` ;
- modifier le dashboard, les tables, les policies ou les buckets ;
- envoyer un e-mail ou soumettre des données pendant la revue locale ;
- retirer les permissions anonymes avant publication et vérification du pont.

## Principes

- Le navigateur ne reçoit jamais `SUPABASE_SERVICE_ROLE_KEY`.
- Un upload final accepté doit appartenir au préfixe du brief, porter un reçu
  HMAC prouvant que son chemin et ses métadonnées ont été émis par le serveur,
  avec la même expiration de deux heures que l'upload signé, et respecter
  réellement 5 MiB et les signatures PNG/JPEG/WebP/GIF/PDF.
- Huit fichiers au maximum sont attachés à un brief.
- Le même `submissionId` et le même contenu donnent le même résultat ; un même
  identifiant avec un contenu différent est refusé.
- Seuls les chemins déclarés et couverts par leurs reçus HMAC sont téléchargés
  et rattachés. Les objets abandonnés ou étrangers sous le même préfixe sont
  ignorés, sans être supprimés et sans bloquer une soumission valide.
- Toute indisponibilité du quota ou du stockage échoue fermée.

## Surfaces

- `api/design-brief.js` : frontière serveur.
- `shared/design-brief-contract.js` : validation canonique de la charge utile.
- `src/app/designBrief/api.ts` : client HTTP strict.
- `src/app/pages/DesignBrief.tsx` : branchement de l'envoi uniquement.
- `tests/design-brief-api.test.ts` : contrat, abus, idempotence et compatibilité.
- `scripts/cleanup-design-brief-assets.mjs` : inventaire conservateur et
  strictement non destructif des uploads abandonnés du bucket partagé.

## Critères d'acceptation

1. Les questions, les neuf références de styles de logo et leurs URL restent
   identiques au parent `main`.
2. Aucun appel navigateur n'insère directement en base ou n'effectue un upload
   public ; seul `uploadToSignedUrl` subsiste côté client.
3. Corps réel surdimensionné, origine étrangère, champ inconnu, mauvais MIME,
   fichier trop grand, quota indisponible et métadonnées stockées divergentes
   sont refusés avant insertion.
4. Un retry identique retourne le succès existant ; un conflit de contenu
   retourne `409`.
5. Les lignes restent compatibles avec le dashboard et les données historiques.
6. Tests ciblés, suite unitaire, typecheck, build, scan secrets et
   `git diff --check` passent.

## Uploads signés abandonnés

Le nettoyage CMS existant ne couvre que le bucket `media`. `brief-assets` est
partagé avec le Client Brief moderne : un préfixe UUID ne prouve donc pas la
propriété d'un objet. Pour préserver toutes les générations, l'inventaire :

- protège `design_brief_submissions.asset_paths`, chaque ligne de `brief_assets`,
  les chemins du payload de `brief_submissions`, les assets des challenges en
  attente et les chemins du journal de suppression ;
- ne propose jamais un chemin référencé, récent (moins de 30 jours), d'âge
  inconnu ou situé hors d'un préfixe UUID attendu ;
- refuse `--apply` et ne possède aucun code de suppression.

Le script n'est pas un cron et n'est exécuté par aucun déploiement. Sa fréquence
et son éventuelle automatisation restent à arbitrer après inventaire réel du
bucket. Une suppression sûre doit être confiée à une évolution du pipeline
moderne de rétention ou à un namespace exclusif futur, avec preuve de propriété
et traitement atomique/coordonné ; elle ne fait pas partie de ce lot.

L'inspection en lecture seule de `dev` révèle en outre un écart dans le pipeline
moderne : `purge_abandoned_brief_packages` journalise les pièces avec
`entity_type = 'brief_asset'`, tandis que `cleanupQueuedStorage` dans
`api/estimator-retention.js` filtre uniquement `brief_export`. Ce lot basé sur
`main` ne rétroporte pas le Client Brief ni son cron ; la consommation des
entrées `brief_asset` doit faire l'objet d'un correctif `dev` séparé.

Le reçu HMAC d'un upload expire après deux heures. Une soumission nouvelle ne
peut donc pas finaliser un objet ancien pendant un inventaire. Le navigateur
réessaie d'abord le chemin original, même expiré, afin qu'une réponse perdue
après insertion retrouve exactement la ligne persistée. Si aucune ligne
n'existe, le serveur répond `expired_asset` ; le navigateur invalide alors les
reçus expirés et redemande de nouveaux chemins au prochain essai.

## Publication ultérieure

Après un déploiement contrôlé et un test synthétique autorisé du pont, une
mission Supabase distincte pourra retirer l'INSERT anonyme et la policy d'upload
public. Ce retrait ne fait pas partie de ce lot local.
