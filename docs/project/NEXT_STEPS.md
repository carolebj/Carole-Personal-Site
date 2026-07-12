# NEXT_STEPS — post-lancement

> Todo légère après merge `dev` → `main`. Dernière mise à jour : 2026-07-12.

## Image Open Graph

- Asset repo : `src/assets/og-carolet.png` (1200×630, ~330 Ko).
- Assignation CMS : dashboard `siteSettings` → image Open Graph, ou `npm run cms:backfill -- --apply` si le champ est encore vide.

## Prêt pour la production

- Branche `dev` à jour avec `origin/dev`, sans commit en attente sur le code applicatif.
- CMS client (`ztrcnlirfbmjnzcovpgj`) opérationnel ; `npm run cms:verify` passe.
- Passe UI (vagues A–D) terminée — checklist archivée dans `docs/archive/UI_AUDIT.md`.

## Reste à faire (contenu / ops)

1. **Pages services** — sur `main`, `/services` affiche « en construction » ; le WIP vit dans `src/app/pages/services-dev/`. Sur `dev`, brancher ces routes (voir README du dossier) jusqu'au merge final.
2. **Sécurité traduction** (dashboards Cloudflare/OpenAI) — plafond mensuel OpenAI + rate limit AI Gateway (`docs/SECURITY.md` §5).
3. **Envoi du formulaire de contact** — le compte Resend de Carole, la clé
   dédiée et les variables Vercel Preview + Production sont configurés. Le
   domaine `carolebj.com` est vérifié dans Resend (DKIM, SPF et MX chez
   Namecheap) et l'expéditeur retenu est `Carole Tonoukouen
   <contact@carolebj.com>`. Le test de preview du 2026-07-12 est arrivé à
   `caroletonoukouen@gmail.com` avec le statut `Delivered` dans Resend > Emails
   > Sending. Ne pas créer de boîte de réception équivalente dans le dashboard
   du site. Restent à valider : la protection anti-abus durable (Turnstile ou
   rate limit), le comportement `reply_to` en répondant au message reçu, puis
   la publication du lot de code en production. Conserver la tâche TickTick
   ouverte jusqu'à ces validations.
   La réception Resend, le MX racine Namecheap, la clé entrante dédiée, le
   webhook signé et le transfert vers Gmail sont configurés en preview.
   `contact@carolebj.com` est ajouté dans Gmail via SMTP Resend et attend la
   validation du MX entrant pour recevoir son e-mail de confirmation. Restent
   le test réel réception/réponse, puis le remplacement de l'URL éphémère du
   webhook par l'URL de production après publication explicite.
4. **Contenu CMS footer** — Behance et la nouvelle photo À propos avec son texte
   alternatif ont été publiés le 2026-07-12. Ne pas réintroduire le champ
   Instagram dans `siteSettings`.

## Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
npm run cms:verify
```
