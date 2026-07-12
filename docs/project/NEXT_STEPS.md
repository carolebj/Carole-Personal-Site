# NEXT_STEPS — post-lancement

> Todo légère après merge `dev` → `main`. Dernière mise à jour : 2026-07-12.

## Image Open Graph

- Asset repo : `src/assets/og-carolet.png` (1200×630, ~330 Ko).
- Assignation CMS : dashboard `siteSettings` → image Open Graph, ou `npm run cms:backfill -- --apply` si le champ est encore vide.

## Prêt pour la production

- Branche `dev` réconciliée avec les derniers changements `main` sur les briefs
  design/admin ; les pages services complètes restent actives sur `dev`.
- CMS client (`ztrcnlirfbmjnzcovpgj`) opérationnel ; `npm run cms:verify` passe.
- Service `identite-visuelle` ajouté par seed additif et relié au brief design.
- Blog et témoignages actualisés sur `dev` : nouveaux articles concrets, étude
  de cas `/blog/cas-client-coworking-cotonou`, dates variées et photos réelles
  publiées dans le CMS.
- Passe UI (vagues A–D) terminée — checklist archivée dans `docs/archive/UI_AUDIT.md`.

## Reste à faire (contenu / ops)

1. **Pages services** — première refonte active sur `dev` : page offre-map,
   détails façon brief de travail, pont identité visuelle → brief design. À
   valider visuellement avec Carole avant merge final vers `main`.
2. **Blog / témoignages** — faire relire à Carole les nouveaux textes, noms de
   catégories et choix photo avant d’en faire la version définitive.
3. **Sécurité traduction** (dashboards Cloudflare/OpenAI) — plafond mensuel OpenAI + rate limit AI Gateway (`docs/SECURITY.md` §5).
4. **Envoi du formulaire de contact** — le compte Resend de Carole, la clé
   dédiée et les variables Vercel Preview + Production sont configurés. Le
   domaine `carolebj.com` est vérifié dans Resend (DKIM, SPF et MX chez
   Namecheap) et l'expéditeur retenu est `Carole Tonoukouen
   <contact@carolebj.com>`. Le test de preview du 2026-07-12 est arrivé à
   `caroletonoukouen@gmail.com` avec le statut `Delivered` dans Resend > Emails
   > Sending. Ne pas créer de boîte de réception équivalente dans le dashboard
   du site. Le formulaire de production et le rendu HTML personnalisé ont été
   validés dans Gmail le 2026-07-12. Le `reply_to` natif et le bouton de réponse
   du template ciblent correctement l'adresse visiteur. Reste à valider la
   protection anti-abus durable (Turnstile ou rate limit). Conserver la tâche
   TickTick ouverte jusqu'à cette validation.
   La réception Resend, le MX racine Namecheap, la clé entrante dédiée, le
   webhook signé et le transfert vers Gmail sont configurés en production ; le
   webhook Resend actif cible `https://www.carolebj.com/api/resend-inbound`.
   `contact@carolebj.com` est ajouté et vérifié dans Gmail via SMTP Resend ;
   Gmail peut désormais envoyer avec cet alias. Le test Gmail →
   `contact@carolebj.com` → webhook
   Resend → Gmail a réussi le 2026-07-12 avec un HTTP 200 dès la première
   tentative.
5. **Contenu CMS footer** — Behance et la nouvelle photo À propos avec son texte
   alternatif ont été publiés le 2026-07-12. Ne pas réintroduire le champ
   Instagram dans `siteSettings`.

## Commandes utiles

```bash
npm run dev:site
npm run typecheck
npm run build
npm run cms:verify
```
