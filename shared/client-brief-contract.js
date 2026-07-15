const t = (fr, en) => ({ fr, en });
const o = (value, fr, en) => ({ value, label: t(fr, en) });
const section = (key, fr, en, descriptionFr, descriptionEn, fields) => ({
  key,
  title: t(fr, en),
  description: t(descriptionFr, descriptionEn),
  fields,
});
const field = (key, type, fr, en, options = {}) => ({
  key,
  type,
  label: t(fr, en),
  required: false,
  ...options,
});
const text = (key, fr, en, options) => field(key, "text", fr, en, options);
const area = (key, fr, en, options) => field(key, "textarea", fr, en, options);
const single = (key, fr, en, options, config = {}) => field(key, "single", fr, en, {
  options,
  ...config,
});
const multi = (key, fr, en, options, config = {}) => field(key, "multi", fr, en, {
  options,
  ...config,
});
const scale = (key, fr, en, options, config = {}) => field(key, "scale", fr, en, { options, ...config });
const colors = (key, fr, en, config = {}) => field(key, "color-list", fr, en, config);
const date = (key, fr, en, options) => field(key, "date", fr, en, options);
const url = (key, fr, en, options) => field(key, "url", fr, en, options);

const unknown = o("to-frame", "Je ne sais pas encore — à cadrer avec Carole", "I do not know yet — to frame with Carole");
const yesNoFrame = [o("yes", "Oui", "Yes"), o("no", "Non", "No"), unknown];
const commonProfile = section(
  "project-profile",
  "Votre projet",
  "Your project",
  "Les repères communs qui permettent de comprendre votre contexte avant de parler de livrables.",
  "The shared context needed to understand your project before discussing deliverables.",
  [
    text("projectName", "Nom du projet, de l’organisation ou de la marque", "Project, organisation or brand name", { required: true, maxLength: 160 }),
    area("activity", "Que faites-vous, pour qui, et dans quel contexte ?", "What do you do, for whom, and in what context?", { required: true, maxLength: 1600 }),
    area("projectTrigger", "Pourquoi ce projet devient-il important maintenant ?", "Why is this project important now?", { required: true, maxLength: 1600 }),
    area("primaryAudience", "Quel est le public prioritaire ? Décrivez ses besoins et ses principaux freins.", "Who is the priority audience? Describe their needs and main barriers.", { required: true, maxLength: 1600 }),
    area("businessObjective", "Quel changement concret ce projet doit-il produire ?", "What concrete change should this project produce?", { required: true, maxLength: 1200 }),
    single("organizationType", "Type d’organisation", "Organisation type", [
      o("business", "Entreprise", "Business"), o("entrepreneur", "Entrepreneur·e", "Entrepreneur"),
      o("nonprofit", "Association / ONG", "Nonprofit / NGO"), o("institution", "Institution", "Institution"), unknown,
    ], { required: true, prefill: "profile.organizationType" }),
    single("projectStage", "Stade du projet", "Project stage", [
      o("idea", "Idée / exploration", "Idea / exploration"), o("launch", "Lancement", "Launch"),
      o("active", "Projet déjà actif", "Active project"), o("repositioning", "Repositionnement", "Repositioning"), unknown,
    ], { required: true, prefill: "profile.projectStage" }),
    single("marketScope", "Périmètre géographique visé", "Target market scope", [
      o("local", "Local", "Local"), o("national", "National", "National"), o("regional", "Régional", "Regional"),
      o("international", "International", "International"), unknown,
    ], { required: true, prefill: "profile.marketScope" }),
    single("timeline", "Échéance souhaitée", "Desired timeline", [
      o("urgent", "Moins d’un mois", "Less than one month"), o("one-two-months", "Un à deux mois", "One to two months"),
      o("three-plus-months", "Trois mois ou plus", "Three months or more"), o("flexible", "Flexible", "Flexible"), unknown,
    ], { required: true, prefill: "profile.timeline" }),
  ],
);

const governance = section(
  "governance",
  "Vos interlocuteurs",
  "Your contacts",
  "Indiquez simplement avec qui Carole échangera au quotidien et qui donnera l’accord final.",
  "Simply identify who Carole will speak with day to day and who will give final approval.",
  [
    text("projectLead", "Qui sera le contact principal de Carole ?", "Who will be Carole's main contact?", { required: true, maxLength: 320 }),
    text("finalDecisionMaker", "Qui donnera l’accord final sur le projet ?", "Who will give final approval for the project?", { required: true, maxLength: 240 }),
    area("confidentiality", "Y a-t-il un élément que Carole ne doit pas partager ou montrer ?", "Is there anything Carole must not share or display?", { maxLength: 800 }),
  ],
);

const finalCheck = section(
  "final-check",
  "Vérification finale",
  "Final check",
  "Rendez explicites les inconnues, les exclusions et les critères qui permettront de dire que le projet est réussi.",
  "Make unknowns, exclusions and success criteria explicit.",
  [
    area("successCriteria", "Quels critères permettront d’accepter le travail livré ?", "Which criteria will make the delivered work acceptable?", { required: true, maxLength: 1600 }),
    area("outOfScope", "Qu’est-ce qui est explicitement hors périmètre ?", "What is explicitly out of scope?", { required: true, maxLength: 1200 }),
    area("openQuestions", "Quelles questions devront encore être cadrées en réunion ?", "Which questions still need to be framed in a meeting?", { required: true, maxLength: 1200 }),
  ],
);

const templates = {
  "editorial-strategy": {
    serviceKey: "editorial-strategy", slug: "strategie-editoriale", version: 3,
    title: t("Brief client — Stratégie éditoriale", "Client Brief — Editorial strategy"),
    shortTitle: t("Stratégie éditoriale", "Editorial strategy"),
    intro: t("Clarifiez le rôle de vos contenus, les publics servis, votre territoire éditorial et la manière dont la stratégie vivra après sa livraison.", "Clarify the role of your content, the audiences served, your editorial territory and how the strategy will live after delivery."),
    sections: [commonProfile,
      section("starting-point", "Point de départ et résultat", "Starting point and result", "Distinguez l’objectif organisationnel des simples livrables.", "Separate organisational outcomes from mere deliverables.", [
        single("currentState", "État actuel de votre stratégie éditoriale", "Current state of your editorial strategy", [o("none", "Aucune stratégie formalisée", "No formal strategy"), o("informal", "Pratiques non documentées", "Undocumented practices"), o("documented", "Stratégie documentée", "Documented strategy"), o("revision", "Stratégie à réviser", "Strategy to revise"), o("multiple-to-merge", "Plusieurs stratégies à réunir", "Several strategies to merge"), unknown], { required: true, prefill: "answers.editorial.currentState" }),
        area("existingStrategyIssues", "Qu’est-ce qui fonctionne, bloque ou se contredit dans l’existant ?", "What works, blocks progress or conflicts in the existing strategy?", { required: true, maxLength: 1400, dependsOn: { field: "currentState", oneOf: ["informal", "documented", "revision", "multiple-to-merge"] } }),
        area("desiredOutcome", "Que devra faire, penser ou décider votre public différemment ?", "What should your audience do, think or decide differently?", { required: true, maxLength: 1400 }),
        area("editorialRisks", "Qu’arriverait-il si rien ne changeait ?", "What would happen if nothing changed?", { maxLength: 900 }),
      ]),
      section("audiences-evidence", "Publics, existant et preuves", "Audiences, existing content and evidence", "Basez les choix sur ce que vous savez et signalez clairement les hypothèses.", "Base decisions on what you know and clearly label assumptions.", [
        area("audienceNeeds", "Pour chaque public : besoin, frein, action attendue et source de connaissance", "For each audience: need, barrier, expected action and source of knowledge", { required: true, maxLength: 2200, why: t("Cela évite de construire la stratégie sur des personas imaginés ou des opinions internes non vérifiées.", "This prevents the strategy from being built on invented personas or unverified internal opinions.") }),
        multi("channels", "Canaux concernés", "Channels concerned", [o("linkedin", "LinkedIn", "LinkedIn"), o("instagram", "Instagram", "Instagram"), o("facebook", "Facebook", "Facebook"), o("tiktok", "TikTok", "TikTok"), o("youtube", "YouTube", "YouTube"), o("blog", "Blog", "Blog"), o("newsletter", "Newsletter", "Newsletter"), o("other-specialized", "Autre canal", "Other channel")], { required: true, prefill: "answers.editorial.channels" }),
        area("existingEvidence", "Quels contenus, retours, études ou données peuvent être analysés ?", "Which content, feedback, studies or data can be analysed?", { required: true, maxLength: 1800 }),
        scale("evidenceConfidence", "À quel point connaissez-vous réellement vos publics aujourd’hui ?", "How well do you truly know your audiences today?", [o("1", "Principalement des intuitions", "Mostly intuition"), o("2", "Quelques retours informels", "Some informal feedback"), o("3", "Données partielles", "Partial data"), o("4", "Recherche et données régulières", "Regular research and data"), o("5", "Connaissance documentée et récente", "Recent documented knowledge")], { required: true, why: t("Le niveau de preuve détermine si Carole peut structurer directement la stratégie ou doit d’abord organiser une phase de recherche.", "The evidence level determines whether Carole can structure the strategy directly or should first organise research.") }),
        url("representativeContent", "Lien vers un contenu représentatif", "Link to representative content"),
      ]),
      section("territory-voice", "Mission, territoires et voix", "Mission, territories and voice", "Définissez ce que la marque peut apporter légitimement et ce qu’elle doit éviter.", "Define what the brand can legitimately contribute and what it must avoid.", [
        area("editorialMission", "Complétez : Nous aidons… à… grâce à…", "Complete: We help… to… through…", { required: true, maxLength: 900 }),
        area("contentPillars", "Quels piliers éditoriaux, preuves et exemples pressentez-vous ?", "Which editorial pillars, evidence and examples do you foresee?", { required: true, maxLength: 1800 }),
        area("voice", "Décrivez la voix : “nous sommes…, mais pas…”", "Describe the voice: “we are…, but not…”", { required: true, maxLength: 1200 }),
        area("forbiddenTopics", "Sujets, termes ou promesses à éviter", "Topics, terms or claims to avoid", { required: true, maxLength: 900 }),
      ]),
      section("deliverables-handoff", "Livrables et transmission", "Deliverables and handoff", "Précisez l’usage réel de chaque livrable et qui le fera vivre.", "Specify the real use of each deliverable and who will maintain it.", [
        area("deliverables", "Quels livrables attendez-vous, et à quoi serviront-ils ?", "Which deliverables do you expect, and what will they be used for?", { required: true, maxLength: 1600, prefill: "answers.editorial.deliverables" }),
        area("channelCadence", "Pour chaque canal : rôle, public, formats, cadence et responsable", "For each channel: role, audience, formats, cadence and owner", { required: true, maxLength: 2200 }),
        area("handoffSupport", "Quel accompagnement est nécessaire après la remise ?", "What support is needed after handoff?", { required: true, maxLength: 1000, prefill: "answers.editorial.handoffSupport" }),
      ]), governance, finalCheck],
  },
  "digital-communication": {
    serviceKey: "digital-communication", slug: "communication-digitale", version: 3,
    title: t("Brief client — Communication digitale", "Client Brief — Digital communication"), shortTitle: t("Communication digitale", "Digital communication"),
    intro: t("Cadrez les objectifs, canaux, campagnes, règles de modération, média payant et mesure avant d’engager la production.", "Frame goals, channels, campaigns, moderation rules, paid media and measurement before production starts."),
    sections: [commonProfile,
      section("objectives-message", "Objectifs et message", "Goals and message", "Reliez chaque action à un résultat et à une action attendue du public.", "Connect every action to an outcome and an expected audience action.", [
        single("engagementType", "Type de dispositif", "Engagement type", [o("ongoing", "Pilotage continu", "Ongoing management"), o("campaign", "Campagne", "Campaign"), o("launch", "Lancement", "Launch"), o("event", "Événement", "Event"), o("hybrid-complex", "Dispositif hybride", "Hybrid programme"), unknown], { required: true, prefill: "answers.communication.engagementType" }),
        single("primaryGoal", "Objectif principal", "Primary goal", [o("awareness", "Notoriété", "Awareness"), o("traffic", "Trafic qualifié", "Qualified traffic"), o("engagement", "Engagement", "Engagement"), o("leads", "Prospects", "Leads"), o("sales", "Ventes", "Sales"), o("loyalty", "Fidélisation", "Loyalty"), o("reputation", "Réputation", "Reputation"), unknown], { required: true, why: t("L’objectif pilote le choix des canaux, l’optimisation des campagnes et les indicateurs. “Publier plus” n’est pas un objectif en soi.", "The goal drives channel choice, campaign optimisation and indicators. “Publishing more” is not a goal in itself.") }),
        area("message", "Message principal, preuve et appel à l’action", "Primary message, evidence and call to action", { required: true, maxLength: 1400 }),
        area("toneRestrictions", "Ton attendu, termes à employer et sujets interdits", "Expected tone, preferred terms and prohibited topics", { required: true, maxLength: 1200 }),
      ]),
      section("channels-operations", "Canaux et périmètre opérationnel", "Channels and operational scope", "Décrivez les comptes, les responsabilités et ce qui reste hors périmètre.", "Describe accounts, responsibilities and what remains out of scope.", [
        multi("channels", "Canaux concernés", "Channels concerned", [o("instagram", "Instagram", "Instagram"), o("facebook", "Facebook", "Facebook"), o("linkedin", "LinkedIn", "LinkedIn"), o("tiktok", "TikTok", "TikTok"), o("youtube", "YouTube", "YouTube"), o("newsletter", "Newsletter", "Newsletter"), o("website", "Site web", "Website"), o("other", "Autre", "Other")], { required: true, prefill: "answers.communication.channels" }),
        area("accounts", "Pour chaque compte : URL, propriétaire et état des accès (sans mot de passe)", "For each account: URL, owner and access status (no passwords)", { required: true, maxLength: 1800 }),
        area("operationalTasks", "Missions incluses, volume, rythme et responsabilités de contenu", "Included tasks, volume, cadence and content responsibilities", { required: true, maxLength: 1800, prefill: "answers.communication.tasks" }),
        area("excludedTasks", "Missions explicitement non incluses", "Explicitly excluded tasks", { required: true, maxLength: 1000 }),
      ]),
      section("campaign-moderation", "Campagnes et modération", "Campaigns and moderation", "Documentez les temps forts et les règles d’escalade avant de publier.", "Document key moments and escalation rules before publishing.", [
        area("campaigns", "Temps forts : objectif, offre, dates, destination et matériel requis", "Key moments: goal, offer, dates, destination and required assets", { required: true, maxLength: 1800, dependsOn: { field: "engagementType", oneOf: ["campaign", "launch", "event", "hybrid-complex"] } }),
        single("communityManagementLevel", "Quel niveau de community management faut-il prévoir ?", "Which community management level is needed?", [o("none", "Aucun", "None"), o("standard", "Réponses en jours ouvrés", "Business-day responses"), o("extended", "Suivi quotidien étendu", "Extended daily coverage"), o("real-time", "Temps réel pendant certains temps forts", "Real-time during key moments"), o("crisis", "Dispositif de crise", "Crisis coverage")], { required: true, prefill: "answers.communication.communityManagement" }),
        area("moderation", "Horaires, délai de réponse, sujets sensibles et contacts d’escalade", "Hours, response time, sensitive topics and escalation contacts", { required: true, maxLength: 1800, dependsOn: { field: "communityManagementLevel", notEquals: "none" } }),
        area("crisisRules", "Règles pour masquer, supprimer, bloquer ou déclencher une escalade", "Rules for hiding, deleting, blocking or escalating", { required: true, maxLength: 1400, dependsOn: { field: "communityManagementLevel", oneOf: ["real-time", "crisis"] } }),
        scale("responseCoverage", "Quel niveau de disponibilité opérationnelle est réellement possible ?", "What level of operational availability is realistically possible?", [o("1", "Réponses ponctuelles", "Occasional responses"), o("2", "Jours ouvrés", "Business days"), o("3", "Suivi quotidien", "Daily monitoring"), o("4", "Plages étendues", "Extended hours"), o("5", "Dispositif de crise organisé", "Organised crisis coverage")], { required: true, dependsOn: { field: "communityManagementLevel", notEquals: "none" }, why: t("Cette réponse évite de promettre du “temps réel” sans équipe, horaires ni règle d’escalade.", "This avoids promising “real-time” service without a team, hours or escalation rules.") }),
      ]),
      section("paid-measurement", "Média payant et mesure", "Paid media and measurement", "Séparez le budget média des honoraires et définissez une source de vérité.", "Separate media spend from fees and define a source of truth.", [
        single("paidMedia", "Un média payant est-il prévu ?", "Is paid media planned?", [o("none", "Non", "No"), o("creative-coordination", "Coordination créative", "Creative coordination"), o("strategy", "Stratégie média", "Media strategy"), o("media-buying", "Achat et pilotage média", "Media buying and management"), unknown], { required: true, prefill: "answers.communication.paidMedia" }),
        area("paidMediaDetails", "Si oui : plateformes, budget média, ciblage, conversion, tracking et responsable du paiement", "If yes: platforms, media spend, targeting, conversion, tracking and payment owner", { maxLength: 1800, dependsOn: { field: "paidMedia", notEquals: "none" } }),
        area("measurement", "KPI principal, valeur de référence, cible, source de vérité et fréquence de reporting", "Primary KPI, baseline, target, source of truth and reporting cadence", { required: true, maxLength: 1800 }),
      ]), governance, finalCheck],
  },
  "content-creation": {
    serviceKey: "content-creation", slug: "creation-contenus", version: 3,
    title: t("Brief client — Création de contenu", "Client Brief — Content creation"), shortTitle: t("Création de contenu", "Content creation"),
    intro: t("Transformez un besoin flou en matrice de contenus exploitable : message, formats, sources, production, droits et critères qualité.", "Turn a vague need into an actionable content matrix: message, formats, sources, production, rights and quality criteria."),
    sections: [commonProfile,
      section("purpose-deliverables", "Finalité et matrice des livrables", "Purpose and deliverable matrix", "Une quantité globale ne suffit pas : chaque contenu a un rôle, un canal et un format.", "A global quantity is not enough: every asset needs a role, channel and format.", [
        area("contentPurpose", "Que doit comprendre, ressentir ou faire le public après ce contenu ?", "What should the audience understand, feel or do after this content?", { required: true, maxLength: 1400 }),
        multi("contentFormats", "Quels formats faut-il produire ?", "Which formats need to be produced?", [o("short-post", "Publication courte", "Short post"), o("long-post", "Publication longue", "Long post"), o("article", "Article", "Article"), o("carousel", "Carrousel", "Carousel"), o("short-video-script", "Script vidéo courte", "Short-video script"), o("static-visual", "Visuel statique", "Static visual"), o("short-video", "Vidéo courte", "Short video"), o("custom-format", "Format sur mesure", "Custom format")], { required: true, prefill: "answers.content.formats", why: t("Le parcours ouvre ensuite uniquement les modules utiles aux formats choisis.", "The journey then opens only the modules needed for the selected formats.") }),
        area("writingDetails", "Pour les textes : sujets, longueur, SEO, sources et quantité", "For written content: topics, length, SEO, sources and quantity", { required: true, maxLength: 1800, dependsOn: { field: "contentFormats", includesAny: ["short-post", "long-post", "article"] } }),
        area("visualDetails", "Pour les visuels : formats, dimensions, quantité, déclinaisons et éléments de marque", "For visuals: formats, dimensions, quantity, variants and brand assets", { required: true, maxLength: 1800, dependsOn: { field: "contentFormats", includesAny: ["carousel", "static-visual"] } }),
        area("videoDetails", "Pour la vidéo : durée, scénario, tournage, voix, sous-titres et quantité", "For video: duration, script, shooting, voice, captions and quantity", { required: true, maxLength: 1800, dependsOn: { field: "contentFormats", includesAny: ["short-video", "short-video-script"] } }),
        area("customFormatDetails", "Décrivez le format sur mesure et son usage", "Describe the custom format and its use", { required: true, maxLength: 1400, dependsOn: { field: "contentFormats", includes: "custom-format" } }),
        area("cta", "Quel appel à l’action doit accompagner chaque famille de contenu ?", "Which call to action should accompany each content family?", { required: true, maxLength: 1000 }),
      ]),
      section("sources-direction", "Sources et direction créative", "Sources and creative direction", "Identifiez ce qui est factuel, qui le valide et quelle direction doit guider la création.", "Identify what is factual, who validates it and which direction should guide creation.", [
        area("sourceMaterial", "Documents, données, entretiens ou experts disponibles", "Available documents, data, interviews or experts", { required: true, maxLength: 1800, prefill: "answers.content.sourceMaterial" }),
        area("factChecking", "Qui vérifiera les noms, chiffres, promesses et informations techniques ?", "Who will check names, figures, claims and technical information?", { required: true, maxLength: 1000 }),
        area("creativeDirection", "Message, ton, références appréciées et éléments à éviter", "Message, tone, liked references and elements to avoid", { required: true, maxLength: 1800 }),
        url("brandGuide", "Lien vers une charte ou des exemples existants", "Link to a brand guide or existing examples"),
      ]),
      section("production", "Production et logistique", "Production and logistics", "Anticipez les personnes, lieux, matériels et variantes nécessaires.", "Anticipate the people, locations, equipment and variants required.", [
        single("productionMode", "Où et comment la production se fera-t-elle ?", "Where and how will production happen?", [o("remote", "À distance, sans tournage", "Remote, no shoot"), o("on-site", "Sur un lieu", "On location"), o("multi-site", "Sur plusieurs lieux", "Multiple locations"), o("mixed", "Dispositif mixte", "Mixed production"), unknown], { required: true }),
        area("productionPlan", "Planning, personnes à mobiliser et responsabilités", "Schedule, people to involve and responsibilities", { required: true, maxLength: 1800 }),
        area("onSiteLogistics", "Lieu, accès, lumière, bruit, sécurité et plan de repli", "Location, access, lighting, noise, safety and contingency plan", { required: true, maxLength: 1600, dependsOn: { field: "productionMode", oneOf: ["on-site", "multi-site", "mixed"] } }),
        area("variants", "Variantes de langue, ratio, plateforme ou campagne à prévoir", "Language, ratio, platform or campaign variants to plan", { required: true, maxLength: 1200 }),
        scale("productionReadiness", "À quel point la matière nécessaire est-elle prête ?", "How ready is the required source material?", [o("1", "Tout est à rechercher", "Everything must be researched"), o("2", "Quelques idées existent", "Some ideas exist"), o("3", "Matière partielle", "Partial source material"), o("4", "Matière presque complète", "Almost complete material"), o("5", "Sources validées et organisées", "Validated and organised sources")], { required: true, why: t("La préparation des sources influence directement le travail de recherche, d’interview et de validation factuelle.", "Source readiness directly affects research, interviews and fact-checking work.") }),
      ]),
      section("rights-quality", "Droits, accessibilité et qualité", "Rights, accessibility and quality", "Cadrez les usages, licences, sources et exigences d’accessibilité avant production.", "Frame usage, licences, source files and accessibility requirements before production.", [
        area("usageRights", "Usages, territoires, durée, diffusion payante et exclusivité éventuelle", "Uses, territories, duration, paid distribution and possible exclusivity", { required: true, maxLength: 1800, prefill: "answers.content.usageRights" }),
        area("thirdPartyRights", "Talents, musique, images, lieux ou contenus tiers : qui détient les autorisations ?", "Talent, music, images, locations or third-party content: who holds permissions?", { required: true, maxLength: 1600 }),
        area("accessibility", "Sous-titres, transcript, texte alternatif, contraste et lisibilité requis", "Required captions, transcript, alternative text, contrast and legibility", { required: true, maxLength: 1400 }),
        area("delivery", "Formats finaux, fichiers sources, nommage, transfert et durée de conservation", "Final formats, source files, naming, transfer and retention period", { required: true, maxLength: 1400 }),
      ]), governance, finalCheck],
  },
  "audit-advice": {
    serviceKey: "audit-advice", slug: "audit-consulting", version: 3,
    title: t("Brief client — Audit & conseil", "Client Brief — Audit & advisory"), shortTitle: t("Audit & conseil", "Audit & advisory"),
    intro: t("Séparez le symptôme, la question d’audit, le périmètre vérifiable, les preuves accessibles et la décision attendue.", "Separate the symptom, audit question, verifiable scope, available evidence and expected decision."),
    sections: [commonProfile,
      section("problem-decision", "Problème et décision attendue", "Problem and expected decision", "Un bon audit répond à une question et permet une décision, pas seulement une liste de constats.", "A good audit answers a question and enables a decision, rather than merely listing findings.", [
        area("observedProblem", "Quel problème observez-vous concrètement, depuis quand et pourquoi maintenant ?", "What concrete problem do you observe, since when and why now?", { required: true, maxLength: 1800 }),
        area("auditQuestion", "Quelle question principale l’audit doit-il résoudre ?", "Which main question should the audit answer?", { required: true, maxLength: 1000 }),
        area("expectedDecision", "Quelle décision le rapport doit-il permettre, et qui la prendra ?", "Which decision should the report enable, and who will make it?", { required: true, maxLength: 1200 }),
        area("previousAttempts", "Qu’avez-vous déjà tenté et avec quel résultat ?", "What have you already tried and with what result?", { maxLength: 1200 }),
      ]),
      section("scope-data", "Périmètre, corpus et accès", "Scope, corpus and access", "Listez ce qui sera réellement vérifiable et les limites connues des données.", "List what can actually be verified and known data limitations.", [
        area("auditScope", "Axes, actifs, marques, période incluse et éléments exclus", "Areas, assets, brands, included period and excluded elements", { required: true, maxLength: 2200, prefill: "answers.audit.focus" }),
        area("inventory", "Inventaire : nom, URL, propriétaire, marché et statut de chaque actif", "Inventory: name, URL, owner, market and status of each asset", { required: true, maxLength: 2200 }),
        area("dataAccess", "Données disponibles, période, qualité, propriétaire et mode d’accès (sans mot de passe)", "Available data, period, quality, owner and access method (no passwords)", { required: true, maxLength: 2200, prefill: "answers.audit.dataAccess", why: t("Un audit ne peut conclure solidement que sur les éléments réellement observables. Ne partagez jamais de mot de passe dans ce document.", "An audit can only draw sound conclusions from observable evidence. Never share a password in this document.") }),
        single("sensitivity", "Niveau de sensibilité", "Sensitivity level", [o("public", "Public", "Public"), o("internal", "Interne", "Internal"), o("confidential", "Confidentiel", "Confidential"), o("restricted", "Restreint", "Restricted"), unknown], { required: true }),
        scale("evidenceConfidence", "Quel niveau de confiance accordez-vous aux données disponibles ?", "How much confidence do you place in the available data?", [o("1", "Très incomplètes", "Very incomplete"), o("2", "Fragiles", "Fragile"), o("3", "Exploitables avec réserves", "Usable with caveats"), o("4", "Fiables", "Reliable"), o("5", "Fiables, complètes et récentes", "Reliable, complete and recent")], { required: true }),
      ]),
      section("criteria-method", "Critères et méthode", "Criteria and method", "Précisez les référentiels, la profondeur et les limites de l’analyse.", "Specify standards, depth and limitations of the analysis.", [
        single("auditDepth", "Quel niveau d’analyse recherchez-vous ?", "What depth of analysis do you need?", [o("diagnostic", "Diagnostic rapide", "Rapid diagnostic"), o("deep-audit", "Audit approfondi", "In-depth audit"), o("roadmap", "Audit avec feuille de route", "Audit with roadmap"), o("undefined-scope", "Profondeur à cadrer", "Depth to frame")], { required: true, prefill: "answers.audit.depth" }),
        area("criteria", "Critères prioritaires : clarté, cohérence, accessibilité, conversion, gouvernance…", "Priority criteria: clarity, consistency, accessibility, conversion, governance…", { required: true, maxLength: 1600 }),
        area("standards", "Chartes, normes ou politiques de référence", "Reference guidelines, standards or policies", { maxLength: 1200 }),
        area("samplingMethod", "Corpus complet ou échantillon : expliquez la règle de sélection", "Full corpus or sample: explain the selection rule", { required: true, maxLength: 1400, dependsOn: { field: "auditDepth", oneOf: ["deep-audit", "roadmap", "undefined-scope"] } }),
        single("benchmarkNeeded", "Faut-il comparer avec des concurrents ou références ?", "Should competitors or references be benchmarked?", yesNoFrame, { required: true }),
        area("benchmarkPeers", "Quels concurrents ou références comparer, et pourquoi ?", "Which competitors or references should be compared, and why?", { required: true, maxLength: 1200, dependsOn: { field: "benchmarkNeeded", equals: "yes" } }),
        area("knownLimits", "Quelles limites le rapport devra-t-il déclarer ?", "Which limitations must the report disclose?", { required: true, maxLength: 1200 }),
      ]),
      section("recommendations", "Livrables et mise en œuvre", "Deliverables and implementation", "Cadrez le niveau de justification et la capacité réelle à agir sur les recommandations.", "Frame the level of evidence and the real ability to act on recommendations.", [
        area("auditDeliverables", "Livrables, format des recommandations et niveau de preuve attendu", "Deliverables, recommendation format and expected evidence level", { required: true, maxLength: 1800, prefill: "answers.audit.deliverables" }),
        area("implementation", "Qui mettra les recommandations en œuvre, avec quel accompagnement ?", "Who will implement recommendations and with what support?", { required: true, maxLength: 1400, prefill: "answers.audit.implementationSupport" }),
        single("specialistReview", "Une compétence technique, juridique ou réglementaire spécialisée semble-t-elle nécessaire ?", "Does specialised technical, legal or regulatory expertise seem necessary?", yesNoFrame, { required: true }),
      ]), governance, finalCheck],
  },
  "visual-identity": {
    serviceKey: "visual-identity", slug: "identite-visuelle", version: 3,
    title: t("Brief client — Identité visuelle", "Client Brief — Visual identity"), shortTitle: t("Identité visuelle", "Visual identity"),
    intro: t("Commencez par le problème de marque et les usages réels avant d’exprimer une direction graphique.", "Start with the brand problem and real use cases before expressing a visual direction."),
    sections: [commonProfile,
      section("brand-ambition", "Point de départ et ambition", "Starting point and ambition", "Expliquez le problème de perception que l’identité devra résoudre.", "Explain the perception problem the identity should solve.", [
        single("projectType", "Nature du projet", "Project type", [o("complete-identity", "Identité visuelle complète", "Complete visual identity"), o("logo", "Logo ou logotype", "Logo or logotype"), o("guidelines", "Charte graphique", "Brand guidelines"), o("refresh", "Clarification ou refonte", "Clarification or redesign"), o("assets", "Supports graphiques ponctuels", "One-off graphic assets"), o("custom-combination", "Combinaison sur mesure", "Custom combination")], { required: true, prefill: "answers.identity.projectType" }),
        area("existingIdentityDetails", "Quels éléments existants doivent être conservés, corrigés ou prolongés ?", "Which existing elements should be preserved, corrected or extended?", { required: true, maxLength: 1600, dependsOn: { field: "projectType", oneOf: ["guidelines", "refresh", "assets"] } }),
        area("brandProblem", "Quelle perception actuelle faut-il faire évoluer, et vers quelle perception souhaitée ?", "Which current perception should evolve, and toward which desired perception?", { required: true, maxLength: 1600, why: t("Une identité utile résout un problème de reconnaissance ou de perception ; elle ne se résume pas à “faire joli”.", "A useful identity solves a recognition or perception problem; it is not merely about “looking nice”.") }),
        area("difference", "Quelle différence ou preuve la marque peut-elle défendre légitimement ?", "Which difference or proof can the brand legitimately defend?", { required: true, maxLength: 1200 }),
        area("preserveAvoid", "Que faut-il absolument préserver, abandonner ou éviter ?", "What must be preserved, abandoned or avoided?", { required: true, maxLength: 1200 }),
        scale("creativeClarity", "À quel point votre direction créative est-elle déjà définie ?", "How clearly is your creative direction already defined?", [o("1", "J’ai besoin d’être guidé·e", "I need guidance"), o("2", "Quelques intuitions", "Some intuitions"), o("3", "Des références existent", "References exist"), o("4", "Une direction assez précise", "A fairly precise direction"), o("5", "Un système existant à prolonger", "An existing system to extend")], { required: true }),
      ]),
      section("naming-architecture", "Nom et architecture de marque", "Naming and brand architecture", "Un nom non validé ou plusieurs entités changent profondément le périmètre.", "An unvalidated name or multiple entities profoundly changes scope.", [
        single("namingState", "État du nom", "Naming state", [o("validated", "Nom validé", "Validated name"), o("shortlist", "Liste courte", "Shortlist"), o("naming-help", "Accompagnement naming nécessaire", "Naming support needed"), o("legal-clearance", "Vérification juridique à organiser", "Legal review to arrange"), unknown], { required: true, prefill: "answers.identity.namingState" }),
        area("namingDetails", "Pistes de nom, sens, contraintes juridiques et domaines envisagés", "Name ideas, meaning, legal constraints and planned domains", { required: true, maxLength: 1400, dependsOn: { field: "namingState", notEquals: "validated" } }),
        single("brandArchitectureMode", "Combien d’entités l’identité doit-elle organiser ?", "How many entities must the identity organise?", [o("single", "Une seule marque", "One brand"), o("multiple", "Plusieurs marques, gammes ou sous-marques", "Several brands, ranges or sub-brands"), unknown], { required: true }),
        area("brandArchitecture", "Décrivez la hiérarchie et les liens entre les entités", "Describe the hierarchy and relationships between entities", { required: true, maxLength: 1600, dependsOn: { field: "brandArchitectureMode", equals: "multiple" } }),
      ]),
      section("creative-direction", "Direction créative", "Creative direction", "Les préférences sont des indices à interpréter, pas une solution imposée.", "Preferences are clues to interpret, not an imposed solution.", [
        area("desiredAttributes", "Choisissez 3 à 5 attributs souhaités et expliquez ce qu’ils signifient pour vous", "Choose 3 to 5 desired attributes and explain what they mean to you", { required: true, maxLength: 1400 }),
        area("visualReferences", "Références appréciées ou refusées : qu’aimez-vous ou rejetez-vous précisément ?", "Liked or rejected references: what exactly do you like or reject?", { required: true, maxLength: 1800 }),
        area("inspirationLinks", "Liens d’inspiration — Pinterest, Behance, Instagram, anciens logos ou moodboards", "Inspiration links — Pinterest, Behance, Instagram, previous logos or moodboards", { maxLength: 2200, why: t("Collez un lien par ligne. Si vous n’en avez pas maintenant, vous pourrez revenir compléter cette partie sans inventer de référence.", "Paste one link per line. If you do not have any yet, you can return to complete this section without inventing a reference.") }),
        multi("logoStyles", "Quels styles de logo vous parlent le plus ?", "Which logo styles speak to you most?", [
          o("wordmark", "Le nom écrit devient le logo", "The written name becomes the logo"),
          o("pictorial", "Un symbole figuratif facile à reconnaître", "An easy-to-recognise pictorial symbol"),
          o("abstract", "Une forme abstraite propre à la marque", "An abstract shape unique to the brand"),
          o("lettermark", "Les initiales du nom", "The initials of the name"),
          o("letterform", "Une seule lettre emblématique", "A single emblematic letter"),
          o("monogram", "Des initiales entrelacées", "Interlaced initials"),
          o("mascot", "Un personnage qui représente la marque", "A character that represents the brand"),
          o("combination", "Le nom accompagné d’un symbole", "The name paired with a symbol"),
          o("emblem", "Le nom intégré dans un sceau ou un badge", "The name inside a seal or badge"),
          o("open", "Aidez-moi à choisir le style le plus adapté", "Help me choose the most suitable style"),
        ], { required: true, maxSelections: 2 }),
        colors("colorPalette", "Palette pressentie — jusqu’à 5 couleurs", "Preferred palette — up to 5 colours", { maxSelections: 5, why: t("Ces couleurs sont des indices de discussion, pas une direction imposée. Carole vérifiera notamment leur accessibilité et leur rôle dans le système.", "These colours are discussion cues, not an imposed direction. Carole will notably assess accessibility and their role in the system.") }),
        area("colorDirection", "Couleurs interdites, symbolique attendue et contraintes d’accessibilité", "Prohibited colours, expected symbolism and accessibility constraints", { required: true, maxLength: 1200 }),
      ]),
      section("system-applications", "Système, applications et production", "System, applications and production", "Définissez les usages prioritaires, les déclinaisons et les fichiers nécessaires.", "Define priority use cases, variants and required files.", [
        multi("identityDeliverables", "Que souhaitez-vous pouvoir utiliser à la fin du projet ?", "What would you like to be able to use at the end of the project?", [
          o("logo-suite", "Un logo principal et ses versions utiles", "A primary logo and its useful versions"),
          o("visual-system", "Les couleurs, typographies et éléments graphiques de la marque", "The brand's colours, typefaces and graphic elements"),
          o("usage-guide", "Un guide simple pour utiliser l’identité correctement", "A practical guide for using the identity correctly"),
          o("social-starter", "Un kit de démarrage pour les réseaux sociaux", "A social media starter kit"),
          o("recommended-package", "Le pack recommandé pour démarrer sereinement", "The recommended package for a confident start"),
          o("custom", "Un ensemble sur mesure à préciser avec Carole", "A custom set to define with Carole"),
          o("to-frame", "Je préfère que Carole me recommande les bons livrables", "I would like Carole to recommend the right deliverables"),
        ], { required: true, prefill: "answers.identity.deliverables" }),
        multi("priorityApplications", "Où l’identité devra-t-elle être utilisée en priorité ?", "Where will the identity be used first?", [
          o("social-media", "Réseaux sociaux", "Social media"),
          o("website", "Site web ou application", "Website or app"),
          o("sales-documents", "Présentations et documents commerciaux", "Presentations and sales documents"),
          o("print", "Papeterie, affiches ou autres impressions", "Stationery, posters or other print"),
          o("packaging", "Emballages ou étiquettes", "Packaging or labels"),
          o("signage", "Enseigne, signalétique ou espace physique", "Signage or physical space"),
          o("motion", "Vidéo, animation ou générique", "Video, animation or titles"),
          o("recommended", "Je veux commencer par les supports les plus utiles", "I want to start with the most useful applications"),
          o("custom", "Un autre support à préciser", "Another application to specify"),
        ], { required: true, prefill: "answers.identity.usage" }),
        area("technicalConstraints", "Y a-t-il des contraintes de langue, de format ou de fabrication déjà connues ?", "Are there any known language, format or production constraints?", { maxLength: 1800, prefill: "answers.identity.languageScripts" }),
        multi("rightsSources", "Quels fichiers souhaitez-vous recevoir pour utiliser l’identité ?", "Which files would you like to receive to use the identity?", [
          o("digital-ready", "Des fichiers prêts pour le web et les réseaux sociaux", "Files ready for web and social media"),
          o("print-ready", "Des fichiers prêts pour l’impression", "Print-ready files"),
          o("editable-sources", "Les fichiers modifiables pour de futures adaptations", "Editable source files for future adaptations"),
          o("provider-kit", "Un dossier à transmettre à d’autres prestataires", "A package to share with other providers"),
          o("recommended", "Le pack de fichiers recommandé par Carole", "The file package recommended by Carole"),
          o("to-frame", "Je ne sais pas encore quels fichiers seront utiles", "I do not yet know which files will be useful"),
        ], { required: true, prefill: "answers.identity.productionFiles" }),
        multi("assetSources", "Quelles ressources visuelles avez-vous déjà ?", "Which visual resources do you already have?", [
          o("brand-photos", "Des photos propres à la marque ou au projet", "Photos created for the brand or project"),
          o("stock-library", "Un abonnement ou une banque d’images déjà utilisée", "An existing stock image subscription or library"),
          o("illustrations", "Des illustrations, icônes ou motifs existants", "Existing illustrations, icons or patterns"),
          o("videos", "Des vidéos ou séquences déjà disponibles", "Existing videos or footage"),
          o("provider", "Un photographe, illustrateur ou autre prestataire habituel", "A regular photographer, illustrator or other provider"),
          o("none", "Aucune ressource prête pour le moment", "No resources are ready yet"),
          o("other", "Une autre ressource à préciser", "Another resource to specify"),
        ], { required: true }),
        single("assetSupport", "Comment souhaitez-vous gérer les images et autres ressources à créer ?", "How would you like to handle images and other resources that need to be created?", [
          o("client-provides", "Nous fournirons les ressources nécessaires", "We will provide the required resources"),
          o("organise-existing", "Carole peut nous aider à trier et organiser l’existant", "Carole can help us organise what already exists"),
          o("licensed-library", "Carole peut rechercher des ressources sous licence", "Carole can source licensed resources"),
          o("coordinate-production", "Carole peut coordonner une production photo ou illustration", "Carole can coordinate photography or illustration production"),
          o("recommended", "Je préfère recevoir une recommandation adaptée au projet", "I would prefer a recommendation suited to the project"),
          o("to-frame", "Ce point doit encore être discuté", "This still needs to be discussed"),
        ], { required: true }),
      ]), governance, finalCheck],
  },
};

const fieldGuidance = {
  projectName: t("Écrivez le nom que Carole doit utiliser pour désigner ce projet, même s’il est encore provisoire.", "Enter the name Carole should use for this project, even if it is still provisional."),
  activity: t("Expliquez simplement ce que vous proposez, à qui vous vous adressez et dans quelle situation vos clients font appel à vous.", "Simply explain what you offer, who it is for and when customers turn to you."),
  projectTrigger: t("Indiquez l’événement, le problème ou l’opportunité qui vous pousse à agir maintenant.", "Share the event, problem or opportunity prompting you to act now."),
  primaryAudience: t("Décrivez les personnes que vous souhaitez toucher en premier : leur situation, leurs attentes et ce qui peut les freiner.", "Describe the people you most want to reach: their situation, expectations and possible barriers."),
  businessObjective: t("Nommez un résultat observable, par exemple être mieux compris, générer des demandes ou faciliter un lancement.", "Name an observable result, such as being better understood, generating enquiries or supporting a launch."),
  organizationType: t("Choisissez la catégorie qui décrit le mieux la structure porteuse du projet.", "Choose the category that best describes the organisation behind the project."),
  projectStage: t("Indiquez où en est réellement le projet aujourd’hui, indépendamment de son ambition future.", "Indicate where the project genuinely stands today, regardless of its future ambition."),
  marketScope: t("Choisissez la zone principale dans laquelle l’offre ou la communication doit fonctionner.", "Choose the main area in which the offer or communication needs to work."),
  timeline: t("Choisissez le délai souhaité le plus réaliste ; il servira à organiser les priorités, pas à promettre une date.", "Choose the most realistic preferred timeframe; it will guide priorities, not promise a date."),
  currentState: t("Choisissez la situation la plus proche de votre organisation actuelle des contenus.", "Choose the situation closest to how your content is currently organised."),
  existingStrategyIssues: t("Donnez un ou deux exemples de ce qui aide déjà l’équipe et de ce qui crée de la confusion, des retards ou des contradictions.", "Give one or two examples of what already helps the team and what causes confusion, delay or contradiction."),
  desiredOutcome: t("Décrivez ce que votre public devrait comprendre ou faire autrement après avoir rencontré vos contenus.", "Describe what your audience should understand or do differently after encountering your content."),
  editorialRisks: t("Expliquez la conséquence la plus importante si la communication reste telle qu’elle est aujourd’hui.", "Explain the most important consequence if communication stays as it is today."),
  audienceNeeds: t("Partez d’une personne ou d’un groupe réel : sa situation, ce qu’il cherche, ce qui le freine et ce qui lui donnerait confiance.", "Start with a real person or group: their situation, what they seek, what holds them back and what would build trust."),
  channels: t("Sélectionnez les espaces réellement concernés aujourd’hui ; Carole pourra ensuite recommander ceux à privilégier.", "Select the spaces genuinely involved today; Carole can then recommend which ones to prioritise."),
  existingEvidence: t("Citez les contenus, messages clients, études ou statistiques disponibles, même s’ils sont incomplets.", "List available content, customer messages, studies or statistics, even if incomplete."),
  evidenceConfidence: t("Choisissez le palier qui correspond aux informations vérifiables dont vous disposez, pas à votre intuition seule.", "Choose the level that matches the verifiable information you have, rather than intuition alone."),
  representativeContent: t("Collez le lien d’un contenu qui représente bien votre communication actuelle, en bien ou en mal.", "Paste a link to content that represents your current communication well, positively or negatively."),
  editorialMission: t("Complétez la phrase avec le public aidé, le changement recherché et la manière dont vos contenus y contribuent.", "Complete the sentence with the audience helped, the desired change and how your content contributes."),
  contentPillars: t("Nommez les grands sujets sur lesquels votre marque peut être utile et les expériences ou preuves qui lui donnent de la crédibilité.", "Name the broad topics where your brand can be useful and the experience or evidence that gives it credibility."),
  voice: t("Décrivez votre manière de parler avec des contrastes concrets, par exemple experte mais jamais professorale.", "Describe how you want to sound using concrete contrasts, for example expert but never lecturing."),
  forbiddenTopics: t("Listez les sujets, mots ou promesses que la marque ne doit pas employer, avec la raison si elle est utile.", "List topics, words or promises the brand must avoid, adding the reason when useful."),
  deliverables: t("Indiquez les documents ou outils dont votre équipe a besoin et ce qu’elle devra pouvoir en faire au quotidien.", "State which documents or tools your team needs and what it should be able to do with them day to day."),
  channelCadence: t("Pour chaque canal important, précisez son rôle actuel, les formats habituels et la personne qui peut fournir la matière.", "For each important channel, describe its current role, usual formats and who can provide source material."),
  handoffSupport: t("Dites si votre équipe aura besoin d’une présentation, d’une formation ou d’un accompagnement après la livraison.", "Say whether your team will need a presentation, training or follow-up support after delivery."),
  projectLead: t("Indiquez le nom, le rôle et au moins un moyen de contact de la personne avec qui Carole échangera au quotidien.", "Provide the name, role and at least one contact method for the person Carole will speak with day to day."),
  finalDecisionMaker: t("Indiquez le nom ou la fonction de la personne qui pourra valider définitivement le travail.", "Provide the name or role of the person who can give final approval."),
  confidentiality: t("Mentionnez uniquement les informations ou supports qui ne doivent pas être publiés, montrés en portfolio ou transmis à un tiers. Laissez vide s’il n’y en a pas.", "Mention only information or materials that must not be published, shown in a portfolio or shared with a third party. Leave blank if none."),
  successCriteria: t("Donnez deux ou trois signes concrets qui vous feront dire que le résultat répond bien au besoin.", "Give two or three concrete signs that will show the result meets the need."),
  outOfScope: t("Notez ce que vous savez déjà ne pas vouloir inclure dans ce projet ; laissez vide si rien n’est encore décidé.", "Note anything you already know should not be included; leave blank if nothing has been decided."),
  openQuestions: t("Listez les points que vous souhaitez discuter avec Carole plutôt que d’inventer une réponse maintenant.", "List anything you would rather discuss with Carole than guess at now."),
  engagementType: t("Choisissez la situation la plus proche : animation régulière, campagne limitée, lancement ou événement.", "Choose the closest situation: ongoing activity, a limited campaign, a launch or an event."),
  primaryGoal: t("Sélectionnez le résultat prioritaire que la communication doit soutenir ; les autres objectifs pourront rester secondaires.", "Select the main result communication should support; other goals can remain secondary."),
  message: t("Écrivez l’idée principale à faire comprendre, la preuve qui la rend crédible et l’action souhaitée ensuite.", "Write the main idea to communicate, the evidence that makes it credible and the action desired next."),
  toneRestrictions: t("Donnez des exemples de ton à adopter et de formulations à éviter, notamment sur les sujets sensibles.", "Give examples of the tone to use and wording to avoid, especially around sensitive topics."),
  accounts: t("Pour chaque compte concerné, collez son lien et indiquez qui en est responsable. Ne saisissez jamais de mot de passe.", "For each relevant account, paste its link and name its owner. Never enter a password."),
  operationalTasks: t("Précisez ce que Carole devra prendre en charge, le rythme envisagé et ce que votre équipe fournira ou validera.", "Clarify what Carole should handle, the expected pace and what your team will provide or approve."),
  excludedTasks: t("Nommez les tâches que vous savez déjà vouloir garder en interne ou confier à quelqu’un d’autre.", "Name tasks you already know will remain in-house or be handled by someone else."),
  campaigns: t("Pour chaque temps fort connu, indiquez l’objectif, l’offre, la période et la page ou le contact vers lequel orienter le public.", "For each known key moment, state the goal, offer, period and page or contact the audience should be directed to."),
  communityManagementLevel: t("Choisissez ce que vous attendez concrètement pour les commentaires et messages reçus sur vos espaces.", "Choose what you concretely expect for comments and messages received on your channels."),
  moderation: t("Indiquez quand votre équipe peut répondre, les sujets à lui transmettre et la personne à contacter en cas de doute.", "Indicate when your team can respond, which topics should be escalated and who to contact when unsure."),
  crisisRules: t("Décrivez uniquement les règles déjà décidées pour les messages agressifs, faux, sensibles ou urgents.", "Describe only existing rules for aggressive, false, sensitive or urgent messages."),
  responseCoverage: t("Choisissez le niveau de présence que votre équipe peut réellement soutenir dans la durée.", "Choose the level of availability your team can realistically sustain over time."),
  paidMedia: t("Indiquez si le projet comprend de la publicité payante et le niveau d’aide attendu de Carole.", "Indicate whether the project includes paid advertising and the level of help expected from Carole."),
  paidMediaDetails: t("Si vous les connaissez, précisez les plateformes, le montant consacré à la diffusion, la cible et qui effectuera le paiement.", "If known, state the platforms, media spend, audience and who will make payment."),
  measurement: t("Expliquez comment vous reconnaîtrez une amélioration et où vous consultez aujourd’hui les chiffres correspondants.", "Explain how you will recognise improvement and where you currently find the relevant figures."),
  contentPurpose: t("Décrivez le changement attendu après consultation du contenu : comprendre une idée, faire confiance, s’inscrire, acheter ou agir.", "Describe the desired change after someone sees the content: understand, trust, register, buy or act."),
  contentFormats: t("Sélectionnez tout ce que le public devra voir, lire ou écouter ; les exemples vous orientent sans limiter le projet.", "Select everything the audience should see, read or hear; the examples guide without limiting the project."),
  writingDetails: t("Pour les textes, indiquez les sujets, la longueur approximative, la quantité et les sources déjà disponibles.", "For written content, state topics, approximate length, quantity and available sources."),
  visualDetails: t("Pour les visuels, indiquez les supports, dimensions connues, quantité et éléments de marque déjà disponibles.", "For visuals, state applications, known dimensions, quantity and existing brand assets."),
  videoDetails: t("Pour la vidéo, précisez la durée, ce qui doit être filmé, les personnes disponibles et si un scénario existe déjà.", "For video, state duration, what needs filming, who is available and whether a script already exists."),
  customFormatDetails: t("Décrivez à quoi servira ce format particulier et où le public le consultera.", "Describe what this custom format is for and where the audience will use it."),
  cta: t("Indiquez l’action simple que chaque contenu doit encourager, par exemple visiter une page, écrire ou demander un devis.", "State the simple action each content item should encourage, such as visiting a page, writing or requesting a quote."),
  sourceMaterial: t("Listez les documents, données, personnes ou produits que Carole pourra consulter pour créer un contenu exact.", "List documents, data, people or products Carole can consult to create accurate content."),
  factChecking: t("Indiquez qui pourra confirmer les noms, chiffres, caractéristiques et promesses avant publication.", "Name who can confirm names, figures, features and claims before publication."),
  creativeDirection: t("Décrivez le message, l’ambiance et quelques références appréciées, puis ce que vous ne voulez surtout pas reproduire.", "Describe the message, mood and a few references you like, then what you definitely do not want to reproduce."),
  brandGuide: t("Collez un lien consultable vers votre charte, vos anciens contenus ou une référence utile.", "Paste an accessible link to your guidelines, previous content or a useful reference."),
  productionMode: t("Choisissez si le contenu peut être créé à distance ou nécessite un tournage sur un ou plusieurs lieux.", "Choose whether content can be created remotely or requires a shoot at one or more locations."),
  productionPlan: t("Donnez le volume approximatif et les personnes, événements ou disponibilités qui influencent l’organisation.", "Give the approximate volume and any people, events or availability affecting production."),
  onSiteLogistics: t("Indiquez ce que vous savez déjà sur le lieu : accès, horaires, autorisation, bruit, lumière ou solution de repli.", "Share what you already know about the location: access, hours, permission, noise, light or backup plan."),
  variants: t("Listez les langues, tailles, plateformes ou versions de campagne qui devront recevoir une adaptation.", "List languages, sizes, platforms or campaign versions that will need adaptation."),
  productionReadiness: t("Choisissez le palier correspondant à la matière réellement prête et validée aujourd’hui.", "Choose the level matching the source material genuinely ready and approved today."),
  usageRights: t("Expliquez où, pendant combien de temps et dans quels pays le contenu sera diffusé, notamment s’il servira à de la publicité.", "Explain where, for how long and in which countries content will be used, especially for advertising."),
  thirdPartyRights: t("Indiquez qui possède ou peut obtenir l’autorisation d’utiliser les personnes, musiques, images et lieux concernés.", "State who owns or can secure permission for the people, music, images and locations involved."),
  accessibility: t("Cochez ou mentionnez les adaptations nécessaires pour que le contenu reste lisible et compréhensible : sous-titres, transcription, contraste ou texte alternatif.", "Mention any adaptations needed to keep content readable and understandable: captions, transcript, contrast or alternative text."),
  delivery: t("Indiquez les formats dont votre équipe a besoin et si elle doit pouvoir modifier les fichiers après livraison.", "State the formats your team needs and whether it should be able to edit files after delivery."),
  observedProblem: t("Décrivez des faits observables : ce qui se passe, depuis quand et ce que cela empêche de faire. Ne cherchez pas à poser le diagnostic.", "Describe observable facts: what happens, since when and what it prevents. Do not try to diagnose the cause."),
  auditQuestion: t("Écrivez ce que vous aimeriez enfin comprendre grâce à l’audit, avec vos mots.", "Write what you would finally like to understand through the audit, in your own words."),
  expectedDecision: t("Indiquez la décision que vous pourrez prendre une fois le problème mieux compris et qui la prendra.", "State the decision you will be able to make once the problem is better understood and who will make it."),
  previousAttempts: t("Citez les actions déjà testées et ce qui s’est passé, même si le résultat a été décevant ou difficile à mesurer.", "List actions already tried and what happened, even if results were disappointing or hard to measure."),
  auditScope: t("Listez les pages, comptes, documents, périodes ou activités que vous souhaitez voir examinés en priorité.", "List the pages, accounts, documents, periods or activities you most want examined."),
  inventory: t("Pour chaque élément à auditer, donnez son nom, son lien si possible et la personne qui le gère.", "For each item to audit, provide its name, a link if possible and who manages it."),
  dataAccess: t("Indiquez les statistiques ou documents disponibles, la période couverte et qui pourra donner un accès sécurisé. Aucun mot de passe ici.", "State available statistics or documents, the period covered and who can grant secure access. Never include passwords."),
  sensitivity: t("Choisissez le niveau de précaution nécessaire pour consulter et partager les éléments de l’audit.", "Choose the level of care needed when accessing and sharing audit material."),
  auditDepth: t("Choisissez le résultat que vous recherchez : comprendre rapidement, approfondir les causes ou obtenir une feuille de route.", "Choose the outcome you seek: a quick understanding, deeper causes or an action roadmap."),
  criteria: t("Indiquez les qualités ou problèmes qui comptent le plus pour vous, par exemple clarté, cohérence, accessibilité ou conversion.", "State the qualities or issues that matter most, such as clarity, consistency, accessibility or conversion."),
  standards: t("Citez uniquement les chartes, obligations ou règles que le projet doit respecter. Laissez vide si vous n’en connaissez pas.", "List only guidelines, obligations or rules the project must follow. Leave blank if none are known."),
  samplingMethod: t("Si tout ne peut pas être analysé, indiquez les éléments ou périodes qui vous semblent les plus représentatifs.", "If everything cannot be analysed, identify the items or periods that feel most representative."),
  benchmarkNeeded: t("Indiquez si certaines organisations ou références doivent aider à situer les forces et écarts de votre projet.", "Indicate whether organisations or references should help position your project's strengths and gaps."),
  benchmarkPeers: t("Nommez les références à regarder et ce que vous trouvez pertinent chez chacune, sans demander de les copier.", "Name references to examine and what feels relevant about each, without asking for imitation."),
  knownLimits: t("Mentionnez les données manquantes ou les situations particulières qui pourraient limiter les conclusions.", "Mention missing data or special circumstances that could limit conclusions."),
  auditDeliverables: t("Indiquez comment votre équipe utilisera le résultat : présentation, rapport, priorités d’action ou feuille de route.", "State how your team will use the result: presentation, report, action priorities or roadmap."),
  implementation: t("Indiquez qui pourra appliquer les recommandations et le type d’aide dont cette personne pourrait avoir besoin.", "State who can implement recommendations and what support they may need."),
  specialistReview: t("Signalez si le sujet touche au droit, à la réglementation ou à une technique qui exige déjà un spécialiste identifié.", "Flag whether the topic involves legal, regulatory or technical expertise that already requires a specialist."),
  projectType: t("Choisissez ce que vous pensez rechercher aujourd’hui ; l’option sur mesure permet de combiner plusieurs besoins.", "Choose what you believe you need today; the custom option allows several needs to be combined."),
  existingIdentityDetails: t("Listez les éléments actuels à garder, améliorer ou abandonner, et expliquez brièvement pourquoi.", "List current elements to keep, improve or discard, briefly explaining why."),
  brandProblem: t("Décrivez comment la marque est perçue aujourd’hui et comment vous aimeriez qu’elle soit comprise demain.", "Describe how the brand is perceived today and how you would like it to be understood tomorrow."),
  difference: t("Donnez un fait concret qui distingue la marque : méthode, histoire, savoir-faire, expérience ou résultat vérifiable.", "Give a concrete fact that distinguishes the brand: method, story, expertise, experience or verifiable result."),
  preserveAvoid: t("Citez les symboles, couleurs, habitudes ou associations à conserver, puis ceux qui ne doivent surtout pas apparaître.", "Name symbols, colours, habits or associations to retain, then those that must not appear."),
  creativeClarity: t("Placez le curseur selon ce que vous pouvez déjà montrer ou expliquer, sans chercher à paraître plus avancé.", "Move the slider according to what you can already show or explain, without trying to appear further along."),
  namingState: t("Indiquez si le nom est définitivement choisi, encore en sélection ou s’il faut être accompagné pour le définir.", "Indicate whether the name is final, still being selected or needs support to define."),
  namingDetails: t("Partagez les noms envisagés, leur sens et les contraintes déjà connues. N’inventez pas d’information juridique.", "Share possible names, their meaning and any known constraints. Do not guess legal information."),
  brandArchitectureMode: t("Indiquez si l’identité concerne une seule marque ou doit organiser plusieurs offres, gammes ou sous-marques.", "Indicate whether the identity covers one brand or must organise several offers, ranges or sub-brands."),
  brandArchitecture: t("Nommez les différentes entités et expliquez simplement comment le public doit comprendre leur relation.", "Name the different entities and simply explain how the audience should understand their relationship."),
  desiredAttributes: t("Choisissez des mots concrets, puis expliquez ce qu’ils changeraient visuellement ou dans la perception de la marque.", "Choose concrete words, then explain what they would change visually or in brand perception."),
  visualReferences: t("Pour chaque référence, dites précisément ce qui vous attire ou vous dérange : couleurs, simplicité, énergie, composition ou ambiance.", "For each reference, say exactly what appeals or bothers you: colour, simplicity, energy, composition or mood."),
  inspirationLinks: t("Ajoutez un lien par ligne vers une image, une marque ou un univers utile. Vous pouvez aussi téléverser des fichiers juste en dessous.", "Add one link per line to a useful image, brand or visual world. You can also upload files below."),
  logoStyles: t("Comparez les familles à partir des marques montrées et choisissez au maximum deux directions qui vous parlent, ou demandez à être guidé.", "Compare the families using the brands shown and choose up to two directions that appeal to you, or ask for guidance."),
  colorPalette: t("Ajoutez uniquement les couleurs déjà importantes pour vous. Elles serviront de repères et pourront être ajustées pour mieux fonctionner ensemble.", "Add only colours already important to you. They are reference points and may be adjusted to work better together."),
  colorDirection: t("Mentionnez les couleurs à éviter, les significations culturelles importantes et les besoins de lisibilité connus.", "Mention colours to avoid, important cultural meanings and any known legibility needs."),
  identityDeliverables: t("Sélectionnez tout ce que vous aimeriez pouvoir utiliser. Si vous hésitez, choisissez le pack recommandé ou demandez conseil à Carole.", "Select everything you would like to use. If unsure, choose the recommended package or ask Carole for guidance."),
  priorityApplications: t("Choisissez les supports qui seront utilisés en premier. Ils aideront à concevoir une identité adaptée aux situations réelles.", "Choose the applications that will be used first. They help shape an identity suited to real situations."),
  technicalConstraints: t("Indiquez seulement les contraintes déjà connues : langues ou alphabets, dimensions imposées, imprimeur, fabricant ou format obligatoire. Laissez vide sinon.", "State only known constraints: languages or scripts, fixed dimensions, printer, manufacturer or required format. Leave blank otherwise."),
  rightsSources: t("Sélectionnez les fichiers dont votre équipe aura concrètement besoin. L’option recommandée convient si les formats techniques ne vous sont pas familiers.", "Select the files your team will genuinely need. Choose the recommended option if technical formats are unfamiliar."),
  assetSources: t("Cochez les photos, vidéos, illustrations, abonnements ou prestataires déjà disponibles pour éviter de prévoir une production inutile.", "Select any photos, videos, illustrations, subscriptions or providers already available to avoid unnecessary production."),
  assetSupport: t("Choisissez qui fournira ou organisera les ressources visuelles manquantes. Carole pourra confirmer la solution après avoir vu l’existant.", "Choose who will provide or organise missing visual resources. Carole can confirm the approach after reviewing what exists."),
};

for (const template of Object.values(templates)) {
  for (const entry of template.sections.flatMap((item) => item.fields)) {
    entry.guidance = fieldGuidance[entry.key];
    if (!entry.guidance) throw new Error(`Missing Client Brief guidance for ${template.serviceKey}.${entry.key}`);
  }
}

export const CLIENT_BRIEF_SCHEMA_VERSION = 1;
export const CLIENT_BRIEF_SERVICE_KEYS = Object.freeze(Object.keys(templates));
export const CLIENT_BRIEF_TEMPLATES = Object.freeze(templates);
export const CLIENT_BRIEF_SLUG_TO_SERVICE = Object.freeze(Object.fromEntries(
  Object.values(templates).flatMap((template) => [
    [template.slug, template.serviceKey],
    [template.serviceKey, template.serviceKey],
    ...(template.serviceKey === "audit-advice" ? [["audit-conseil", template.serviceKey]] : []),
  ]),
));

export function getClientBriefTemplate(serviceKey) {
  return CLIENT_BRIEF_TEMPLATES[serviceKey] ?? null;
}

export function getClientBriefTemplateBySlug(slug) {
  return getClientBriefTemplate(CLIENT_BRIEF_SLUG_TO_SERVICE[slug]);
}

export function isClientBriefFieldVisible(fieldDefinition, answers) {
  const dependency = fieldDefinition.dependsOn;
  if (!dependency) return true;
  const value = answers[dependency.field];
  if (Object.hasOwn(dependency, "equals")) return value === dependency.equals;
  if (Object.hasOwn(dependency, "notEquals")) return value !== dependency.notEquals;
  if (dependency.includes) return Array.isArray(value) && value.includes(dependency.includes);
  if (dependency.includesAny) return Array.isArray(value) && dependency.includesAny.some((entry) => value.includes(entry));
  if (dependency.oneOf) return dependency.oneOf.includes(value);
  return true;
}

export function isClientBriefFieldValueValid(fieldDefinition, value) {
  const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  if (empty) return true;
  if (["multi", "color-list"].includes(fieldDefinition.type)) {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) return false;
    if (new Set(value).size !== value.length) return false;
    if (fieldDefinition.type === "color-list") {
      if (!value.every((entry) => /^#[0-9a-f]{6}$/i.test(entry))) return false;
    } else {
      const allowed = new Set(fieldDefinition.options?.map((entry) => entry.value) ?? []);
      if (!value.every((entry) => allowed.has(entry))) return false;
    }
    return !fieldDefinition.maxSelections || value.length <= fieldDefinition.maxSelections;
  }
  if (typeof value !== "string") return false;
  if (!value.trim()) return false;
  if (fieldDefinition.maxLength && value.length > fieldDefinition.maxLength) return false;
  if (["single", "scale"].includes(fieldDefinition.type)) {
    return Boolean(fieldDefinition.options?.some((entry) => entry.value === value));
  }
  if (fieldDefinition.type === "url") {
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  }
  if (fieldDefinition.type === "date") return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  return ["text", "textarea"].includes(fieldDefinition.type);
}

export function validateClientBriefAnswers(template, answers) {
  const errors = {};
  if (!template || !answers || typeof answers !== "object" || Array.isArray(answers)) return { valid: false, errors: { _form: "invalid" } };
  const fields = template.sections.flatMap((item) => item.fields);
  const allowedKeys = new Set(fields.map((entry) => entry.key));
  for (const key of Object.keys(answers)) if (!allowedKeys.has(key)) errors[`_unknown:${key}`] = "unknown_field";
  for (const entry of fields) {
    if (!isClientBriefFieldVisible(entry, answers)) continue;
    const value = answers[entry.key];
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (entry.required && empty) errors[entry.key] = "required";
    else if (!empty && !isClientBriefFieldValueValid(entry, value)) errors[entry.key] = "invalid_value";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildClientBriefPrefill(template, estimatorDraft) {
  if (!template || !estimatorDraft || typeof estimatorDraft !== "object") return { answers: {}, provenance: {} };
  const source = { profile: estimatorDraft.profile ?? {}, answers: estimatorDraft.serviceAnswers ?? {} };
  const answers = {};
  const provenance = {};
  for (const entry of template.sections.flatMap((item) => item.fields)) {
    if (!entry.prefill) continue;
    const [root, ...segments] = entry.prefill.split(".");
    const sourceKey = segments.join(".");
    const value = source[root]?.[sourceKey];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    // Estimator service answers are stable choice codes, arrays of codes or
    // numbers. They must not be copied into prose fields as if the client had
    // written those machine values.
    if (root === "answers" && ["text", "textarea", "url", "date"].includes(entry.type)) continue;
    if (!isClientBriefFieldValueValid(entry, value)) continue;
    answers[entry.key] = value;
    // Provenance is informative, not a second form field. An unchanged value
    // can be submitted as-is; editing it consumes the UI marker in the client.
    provenance[entry.key] = { source: entry.prefill, confirmed: true, modified: false };
  }
  return { answers, provenance };
}
