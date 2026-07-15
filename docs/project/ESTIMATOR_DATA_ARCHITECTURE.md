# Estimateur — architecture des données et rétention

Statut : architecture implémentée et migrations appliquées au projet Supabase lié.
Dernière révision : 2026-07-16

## Source de vérité

Les migrations additives `20260715193000_estimator_data_architecture.sql`,
`20260715233000_client_brief_workflow.sql`,
`20260716001000_client_brief_retention_cleanup.sql` et
`20260716013000_client_brief_integrity.sql` définissent le schéma des lots 2 à
5. Elles sont appliquées au projet Supabase lié. Elles conservent intactes les
soumissions historiques de `design_brief_submissions` et permettent leur
lecture dans l'administration avec les nouvelles `brief_submissions`.

## Frontières d'accès

- Le navigateur n'écrit jamais directement une estimation.
- `anon` n'a aucun droit direct sur les contacts,
  estimations, modèles tarifaires, taux, dossiers de Briefs clients,
  consentements ou journaux de suppression.
- Un endpoint serveur validé utilise `SUPABASE_URL` et
  `SUPABASE_SERVICE_ROLE_KEY` pour charger une grille publiée et appeler
  `record_project_estimate`.
- Les deux variables sont configurées uniquement côté serveur et restent vides
  dans `.env.example`.
- Seules les définitions publiées des templates de Brief client sont lisibles
  par le navigateur.
- Les soumissions de Brief sont lisibles et administrables uniquement depuis
  une session `authenticated`, comme les soumissions Design historiques.

## Objets privés

### Calcul et résultat

- `estimator_pricing_models` conserve les catalogues JSON versionnés, leurs
  scénarios de référence, leur statut et leur date d'effet.
- `estimator_exchange_rates` conserve des instantanés XOF, EUR et USD. XOF vaut
  toujours `1`, EUR respecte la parité fixe `655,957 XOF` et EUR/USD exigent une
  URL source BCEAO. Une seule ligne publiée est courante par devise ; les lignes
  remplacées passent à l'état `retired` et restent référencées par l'historique.
- `publish_estimator_pricing_model` sérialise les publications par clé de
  modèle, refuse de republier le même `modelVersion`, puis remplace les trois
  taux et insère le catalogue dans une transaction unique réservée au
  `service_role`. Une erreur restaure donc la version publiée précédente.
- `project_estimates` crée une ligne distincte à chaque résultat. Elle fige le
  modèle tarifaire, la devise, le taux, la source, la date et le détail du
  calcul. Une clé étrangère composite empêche de dissocier l'estimation de son
  instantané de taux. Un résultat hors cadre est conservé avec le statut
  `manual-review` et sans bornes artificielles ; un résultat `estimated` exige
  au contraire deux bornes XOF cohérentes. Un hash d'idempotence unique jusqu'à
  la purge fait qu'un retry récupère le même `{id, expires_at}` au lieu de créer
  une seconde estimation.
- Le JSON `breakdown` conserve pour chaque service son `calculationScope`
  public : périmètre de base, inclusions, volumes, options et exclusions. Il ne
  contient que les clés sémantiques, valeurs normalisées, dimensions et
  identifiants de règles du contrat publié, figés avec la version du modèle.
- `estimator_api_rate_limits` conserve uniquement un hash de scope, le début de
  fenêtre et un compteur. `consume_estimator_rate_limit` incrémente ce compteur
  atomiquement et permet à l'endpoint public de refuser les abus sans stocker
  l'adresse IP en clair.

### Contacts et bases légales

- `estimator_contacts` déduplique les adresses sur une valeur normalisée générée
  par la base.
- `estimator_consent_events` est un journal append-only des accords et retraits
  commerciaux ; un accord exige une version de notice.
- `estimator_contact_suppressions` conserve uniquement un hash SHA-256 minimal
  pour empêcher une relance après opposition, retrait ou bounce.

### Briefs clients

- `brief_templates` et `brief_template_versions` séparent l'identité d'un
  template de ses versions FR/EN publiées.
- `brief_packages` porte le profil projet partagé et son estimation source.
- `brief_instances` fige la version utilisée par un Brief client ouvert.
- `brief_prefill_values` trace chaque valeur, sa clé source, sa confirmation et
  sa modification éventuelle.
- `brief_assets`, `brief_exports` et `brief_submissions` restent indépendants :
  télécharger un PDF ne soumet pas le brief à Carole.
- `brief_email_challenges` conserve l'adresse normalisée, ses hashes
  d'adresse/session/code, le nombre de tentatives, la charge finalisée du Brief
  et une expiration de dix minutes. La charge n'est persistée dans l'instance
  définitive qu'après consommation atomique du code. La table force la RLS et
  reste accessible au seul `service_role`; le code n'est jamais stocké en clair.
- Le bucket `brief-exports` est privé. `/api/client-brief` produit le PDF côté
  serveur avec le service, la version et les réponses, puis retourne une URL
  signée valable au plus 15 jours. La définition de chaque template est publiée
  depuis le contrat versionné du dépôt ; les instances déjà ouvertes continuent
  de référencer leur version figée.
- `brief-assets` est privé. Le navigateur obtient un jeton d'upload à usage
  limité auprès du serveur puis utilise `uploadToSignedUrl`; la politique
  d'insertion publique historique est supprimée.
- La publication des versions de template est atomique et immuable. Une version
  existante ne peut pas être réécrite sous le même numéro.

## Rétention et suppression

`project_estimates.expires_at` doit être exactement égal à `created_at + 15
days`. `purge_expired_project_estimates` supprime les résultats arrivés à
expiration par lots, avec verrouillage `skip locked`, et enregistre une entrée
non personnelle dans `estimator_deletion_logs`.

`purge_expired_brief_exports` supprime les métadonnées d'exports expirés et
place le chemin Storage dans le journal avec
`storage_cleanup_required = true`. Le job `/api/estimator-retention` supprime
ensuite physiquement chaque objet par l'API Storage et ne marque la ligne comme
nettoyée qu'après succès. Une erreur sur un objet n'interrompt pas le lot.

Les challenges expirés/consommés, les compteurs de débit et les dossiers
abandonnés sans export ni soumission sont également purgés. Les pièces jointes
des dossiers abandonnés sont supprimées après 30 jours ; les PDF en état
`generating` ou `failed` ne restent pas indéfiniment.

Ces fonctions sont appelables par le cron serveur déclaré dans `vercel.json`,
mais l'activation distante dépend de la configuration du projet Vercel. Elles sont exécutables
uniquement par `service_role`, acceptent une taille de lot bornée et utilisent
un `search_path` vide. `purge_estimator_rate_limits` supprime séparément les
scopes hashés dont la fenêtre n'est plus utile ; son seuil est fourni par le job
serveur et vaut un jour par défaut.

## Vérification

`tests/estimatorDataMigration.test.ts` contrôle statiquement :

- la présence des objets attendus et l'absence de modification destructive du
  Brief design historique ;
- la déduplication, la conservation exacte de 15 jours et les journaux de
  suppression ;
- les contraintes de version et d'instantané tarifaire ;
- RLS forcée, privilèges minimaux et fonctions réservées à `service_role` ;
- les index des clés étrangères et chemins de purge.

## Décisions de conformité encore externes au schéma

Le schéma fournit des capacités de traçabilité ; il ne prouve pas à lui seul la
conformité du produit. La politique de confidentialité et les textes de
consentement ne sont pas encore déclarés validés, la formalité APDP reste à
confirmer et la durée de conservation propre aux Briefs clients/exports doit
encore être confirmée juridiquement. L'implémentation technique actuelle fixe
à 15 jours les estimations générées et les PDF privés ; elle doit être reflétée
sans ambiguïté dans la politique publiée. Ces prérequis juridiques externes sont
suivis au Lot 7 et bloquent la publication tant qu'ils ne sont pas explicitement
levés.

## Règle de mise à jour

Mettre ce document à jour uniquement lorsque le modèle de données, les
frontières d'accès ou les règles de rétention changent. Les opérations de
déploiement et les exécutions de cron restent dans leurs runbooks dédiés.
