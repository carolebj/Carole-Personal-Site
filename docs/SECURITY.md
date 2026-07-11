# SECURITY.md — façon de travailler et gestion des secrets

> Document de référence sécurité pour le portfolio Carole. À lire avant toute
> manipulation de clés, de variables d'environnement ou de déploiement.
> Inspiré d'un principe simple : **un secret ne doit jamais entrer dans Git, et
> en production il vit dans un coffre-fort, pas dans un fichier `.env`.**

## 1. Le principe (la leçon des « 47 000 € »)

Des bots scannent GitHub en continu. Une clé d'API poussée sur un dépôt (même
dans un `.env`, même sur un repo « privé ») peut être aspirée en quelques
secondes et utilisée à ton insu. La règle est donc :

1. **En local** : les secrets vivent dans `.env.local` (déjà ignoré par Git).
2. **En production** : pas de fichier `.env`. On utilise les variables
   d'environnement de l'hébergeur **et** un coffre-fort de secrets.
3. **Aucun secret n'est jamais exposé au navigateur.** Le front ne reçoit que
   des clés conçues pour être publiques (clé Supabase « publishable », protégée
   par RLS).

## 2. Où vit chaque secret (modèle actuel)

| Secret | Sensibilité | Stockage prévu | Exposé au navigateur ? |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Publique | Var d'env build (`VITE_`) | Oui (normal) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publique (protégée par RLS) | Var d'env build (`VITE_`) | Oui (normal) |
| `CRON_SECRET` | Secrète | Vercel Production uniquement | Non |
| `CMS_SEED_EMAIL` / `CMS_SEED_PASSWORD` | **Élevée** (compte éditeur) | `.env.local` uniquement | Non |
| `OPENAI_API_KEY` | **Critique** (coût) | Coffre-fort : Cloudflare AI Gateway (BYOK) | Non |
| `TRANSLATE_WORKER_TOKEN` | Élevée | `wrangler secret` (Worker) + var d'env hébergeur du site | Non |
| `CLOUDFLARE_AI_GATEWAY_TOKEN` | Élevée | `wrangler secret` (Worker) | Non |

Règle d'or sur les préfixes Vite : **toute variable préfixée `VITE_` est
embarquée dans le bundle et donc publique.** Ne jamais mettre un secret derrière
un préfixe `VITE_`.

### Propriété du projet Supabase client

Le projet Supabase reste dans une organisation appartenant au client. Le compte
du développeur est invité comme membre de cette organisation avec le rôle le
plus limité compatible avec le travail demandé :

- **Developer** pour les données, migrations et fonctions ;
- **Administrator** uniquement si les réglages du projet, les clés API ou
  l'authentification doivent être administrés.

Sur l'offre gratuite, les rôles sont appliqués à l'organisation entière : cette
organisation doit donc rester dédiée aux projets du client concernés. Ne jamais
partager le mot de passe du compte propriétaire du client, ni un Personal Access
Token. Chaque intervenant utilise son propre compte Supabase et son propre token
local.

Les migrations versionnées dans `supabase/migrations/` sont la source de vérité.

Le contrôle quotidien `/api/supabase-keepalive` est appelé uniquement par Vercel
Cron. Vercel envoie `CRON_SECRET` dans `Authorization: Bearer …` ; l'endpoint
refuse les appels sans correspondance exacte et utilise uniquement la clé
publique Supabase pour trois lectures RLS limitées à une ligne chacune.
Après l'invitation, lier le dépôt au projet client avec la CLI Supabase et
appliquer les migrations depuis ce dépôt. Le connecteur Supabase peut servir à
l'inspection, de préférence limité au `project_ref`; il ne remplace pas les
migrations versionnées pour une base contenant les données réelles du client.

## 3. Le coffre-fort de secrets, ici

La vidéo recommande un gestionnaire de secrets (AWS Secrets Manager, HashiCorp
Vault…). Pour cette stack, l'équivalent déjà en place est :

- **Cloudflare Worker Secrets** (`wrangler secret put …`) : chiffrés, jamais
  dans le code. C'est notre coffre-fort pour `TRANSLATE_WORKER_TOKEN` et
  `CLOUDFLARE_AI_GATEWAY_TOKEN`.
- **Cloudflare AI Gateway (mode BYOK / Stored Keys)** : la clé OpenAI est
  stockée côté Cloudflare, jamais dans le repo ni chez l'hébergeur du site.
  L'app la récupère « à la volée » à l'exécution — exactement le schéma
  « coffre-fort numérique » de la vidéo.

Le flux de traduction est donc déjà sécurisé : navigateur → endpoint serveur →
Worker (vérifie un token) → AI Gateway → OpenAI. La clé OpenAI ne transite
jamais par le client ni par le repo.

## 4. Garde-fous anti-erreur (defense in depth)

Même avec une bonne architecture, l'erreur humaine reste le risque n°1. Deux
filets de sécurité sont en place :

- **Scan de secrets avant commit** : `npm run security:scan` (manuel) et un hook
  `pre-commit` qui bloque tout commit contenant un secret probable ou un fichier
  `.env*` (hors `.env.example`).
  - Installer le hook une fois par clone : `npm run security:install-hooks`
  - Faux positif : ajouter le marqueur `secret-scan:allow` en fin de ligne.
- **`.gitignore`** couvre `.env`, `.env.local`, `*.pem`, `*.key`, `.dev.vars`…

## 5. Plafond de dépense (le vrai garde-fou « 47 000 € »)

Une architecture propre limite l'exposition de la clé, mais ne plafonne pas la
dépense si l'endpoint est abusé. À configurer impérativement :

- **OpenAI** : un *monthly budget / hard limit* sur le compte de facturation.
- **Cloudflare AI Gateway** : un *rate limiting* (recommandé : 30 requêtes /
  10 min, fenêtre glissante) — déjà documenté côté Worker.

## 6. Point d'attention connu

- L'endpoint `api/translate.js` **exige une session Supabase valide**
  (en-tête `Authorization: Bearer <access_token>`) avant d'appeler le service de
  traduction. Le menu document-level du dashboard récupère le token via
  `getSupabase().auth.getSession()` ; il est désactivé en mode démo et affiche
  une confirmation de coût avant tout appel.
  Le plafond AI Gateway + budget OpenAI (section 5) reste recommandé en
  complément (défense en profondeur).
- Variables côté fonction serveur (Vercel) : `SUPABASE_URL` +
  `SUPABASE_PUBLISHABLE_KEY` (à défaut, les `VITE_…` équivalentes sont réutilisées).
  Optionnel : `TRANSLATE_ALLOWED_ORIGIN` pour restreindre l'origine CORS.
- Les politiques RLS Supabase sont permissives pour « authenticated »
  mais exigent désormais une session réelle (`auth.uid() is not null`). Le rôle
  anonyme ne peut lire que `cms_public_documents` et n'a aucun droit d'écriture.
- Le bucket `media` est public pour servir les images sans URL signée. Le
  listing reste réservé au compte authentifié afin que le script de nettoyage
  puisse identifier les médias orphelins.
- La protection Supabase contre les mots de passe divulgués est réservée à
  l'offre Pro. Tant que le projet reste sur l'offre gratuite, utiliser un mot de
  passe unique et long généré par un gestionnaire de mots de passe.
- Les brouillons vivent dans `cms_documents`, lisible uniquement par les
  utilisateurs authentifiés. Le site public lit exclusivement
  `cms_public_documents`; une sauvegarde ne modifie donc jamais le site tant que
  l'éditeur ne publie pas.
- Les médias remplacés restent conservés tant qu'une copie de travail, un
  snapshot public ou une révision les référence. `npm run cms:media:cleanup`
  simule le nettoyage ; ajouter `-- --apply` uniquement après revue de la liste.

## 7. Rotation des secrets

À faire si un secret a pu fuiter, et au minimum une fois par an :

- **Mot de passe éditeur** : Supabase → Authentication → Users → reset.
- **`TRANSLATE_WORKER_TOKEN`** : régénérer une valeur aléatoire longue, puis
  `wrangler secret put TRANSLATE_WORKER_TOKEN` **et** mettre la même valeur dans
  les variables de l'hébergeur du site. Les deux doivent rester identiques.
- **Clé OpenAI** : révoquer dans le dashboard OpenAI, en créer une nouvelle,
  la remettre dans AI Gateway → Provider Keys (pas dans le repo, pas dans
  l'hébergeur).

## 8. Runbook : « un secret a fuité »

1. **Révoquer immédiatement** la clé concernée chez le fournisseur (ne pas
   attendre de « nettoyer Git » d'abord — la révocation prime).
2. Générer une nouvelle clé et la stocker dans le bon coffre-fort (section 2/3).
3. Vérifier la facturation / les logs d'usage pour détecter un abus.
4. Si le secret est passé dans l'historique Git : le purger
   (`git filter-repo` / BFG) puis forcer la mise à jour du remote — mais
   **seulement après** révocation, car l'historique peut déjà avoir été cloné.
5. Noter l'incident et la date de rotation ici ou dans `project/MEMORY.md`.

## 9. Checklist avant chaque push

- [ ] `npm run security:scan` passe.
- [ ] Aucun `.env*` (hors `.env.example`) n'est ajouté au commit.
- [ ] Aucune valeur réelle dans `.env.example` (champs vides uniquement).
- [ ] Aucun nouveau secret derrière un préfixe `VITE_`.

## 10. Travailler depuis plusieurs machines

`.env.local` reste **volontairement local** (ignoré par Git). Sur une nouvelle
machine, après `git clone`, il faut donc le recréer. Bonne nouvelle : la
plupart des valeurs ne sont pas secrètes.

Ce que `.env.local` contient et son niveau de sensibilité :

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` : **publiques** (conçues
  pour le navigateur, protégées par RLS). On peut les recopier sans risque
  depuis Supabase → Project Settings → API.
- `CMS_SEED_EMAIL` / `CMS_SEED_PASSWORD` : **le seul vrai secret** local (compte
  éditeur). C'est uniquement cette valeur qu'il faut transporter de façon sûre.

Options, de la plus simple à la plus avancée :

1. **Gestionnaire de mots de passe (recommandé)** — Bitwarden (gratuit),
   1Password… Stocker le contenu de `.env.local` dans une note sécurisée. Sur
   une nouvelle machine : ouvrir le coffre, copier/coller dans un nouveau
   `.env.local`. Rien ne passe par Git. Simple et sûr.
2. **`.env` chiffré, versionnable dans Git** — avec
   [`dotenvx`](https://dotenvx.com) : `npx @dotenvx/dotenvx encrypt` produit un
   `.env` chiffré (commitable) et une clé privée `.env.keys` (à **ne pas**
   committer, à garder dans le gestionnaire de mots de passe). Sur une autre
   machine : `git clone` + déposer `.env.keys`, et tout se déchiffre à
   l'exécution. C'est le « transport via GitHub » sécurisé. (Alternative
   équivalente : SOPS + age.)
3. **Tout reconfigurer à la main** — recopier les clés publiques Supabase et
   réinitialiser le mot de passe éditeur. Aucun outil, mais manuel.

Quelle que soit l'option, **ne jamais committer `.env.local` ni `.env.keys`**
(les deux sont déjà couverts par `.gitignore`). Les secrets de production
(clé OpenAI, tokens Worker) ne sont pas concernés : ils vivent déjà dans leurs
coffres respectifs (Cloudflare AI Gateway / `wrangler secret`), pas en local.
