export type EstimatorServiceId =
  | "editorial-strategy"
  | "digital-communication"
  | "content-creation"
  | "audit-advice"
  | "visual-identity";

export type QuestionType = "choice" | "multi" | "number";
export type QuestionPurpose = "pricing-and-prefill" | "brief-prefill-only";

export type PricingDimension =
  | "base-scope"
  | "volume"
  | "complexity"
  | "duration"
  | "options"
  | "rights"
  | "urgency"
  | "validation"
  | "logistics"
  | "mutualization";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type QuestionOption = {
  value: string;
  label: LocalizedText;
};

export type QuestionnaireAnswer = string | string[] | number;
export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer | undefined>;

export type QuestionDependency = {
  questionKey: string;
  operator: "equals" | "notEquals" | "includes" | "oneOf";
  value: string | number | readonly (string | number)[];
};

export type BriefMapping = {
  brief: EstimatorServiceId | "global";
  field: string;
};

export type NumberQuestionConfig = {
  min: number;
  step: number;
  unit: LocalizedText;
};

export type ServiceQuestion = {
  key: string;
  label: LocalizedText;
  helper?: LocalizedText;
  type: QuestionType;
  requiredForEstimate: boolean;
  purpose?: QuestionPurpose;
  pricingDimension: readonly PricingDimension[];
  options?: readonly QuestionOption[];
  number?: NumberQuestionConfig;
  displayBands?: readonly QuestionOption[];
  hiddenFromJourney?: boolean;
  dependsOn?: QuestionDependency;
  manualReviewOptions?: readonly string[];
  calculationExclusionOptions?: readonly string[];
  briefMapping: BriefMapping;
};

export type ServiceQuestionnaire = {
  serviceId: EstimatorServiceId;
  label: LocalizedText;
  questions: readonly ServiceQuestion[];
};

export type QuestionnaireProgress = {
  completed: number;
  total: number;
  remaining: number;
  percentage: number;
};

export type ManualReviewFlag = {
  serviceId: EstimatorServiceId;
  questionKey: string;
  selectedOptions: string[];
};

export type SerializableQuestionContract = {
  key: string;
  type: QuestionType;
  requiredForEstimate: boolean;
  purpose: QuestionPurpose;
  pricingDimensions: PricingDimension[];
  dependsOn?: QuestionDependency;
  optionValues: string[];
  manualReviewOptions: string[];
  calculationExclusionOptions?: string[];
  number?: NumberQuestionConfig;
};

export type SerializableQuestionnaireContract = Record<EstimatorServiceId, {
  serviceId: EstimatorServiceId;
  questions: SerializableQuestionContract[];
}>;

const option = (value: string, fr: string, en: string): QuestionOption => ({
  value,
  label: { fr, en },
});

const editorialStrategyQuestions = [
  {
    key: "editorial.currentState",
    label: {
      fr: "Aujourd’hui, comment décidez-vous de ce que votre marque publie ?",
      en: "How do you currently decide what your brand publishes?",
    },
    helper: {
      fr: "Un seul choix. Cela permet de savoir s’il faut partir de zéro, organiser l’existant ou le faire évoluer.",
      en: "One choice. This shows whether we need to start from scratch, organise what exists, or improve it.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "complexity"],
    options: [
      option("none", "Nous avançons sans cadre défini", "We currently work without a defined framework"),
      option("informal", "Nous avons des habitudes, mais rien n’est écrit", "We have habits, but nothing is written down"),
      option("documented", "Nous avons un document qui nous guide déjà", "We already have a document that guides us"),
      option("revision", "Notre cadre existe, mais il ne répond plus à nos besoins", "Our framework exists, but no longer meets our needs"),
      option("multiple-to-merge", "Plusieurs équipes ou marques suivent des approches différentes", "Several teams or brands follow different approaches"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["multiple-to-merge"],
    briefMapping: { brief: "editorial-strategy", field: "currentState" },
  },
  {
    key: "editorial.brandCount",
    label: {
      fr: "Combien d’activités, de marques ou d’offres devront parler différemment ?",
      en: "How many activities, brands, or offers will need distinct messaging?",
    },
    helper: {
      fr: "Un seul choix. Deux offres qui ne parlent pas au même public peuvent demander deux lignes éditoriales.",
      en: "One choice. Two offers aimed at different audiences may require two distinct editorial directions.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one", "Une seule", "One"),
      option("two-three", "Deux à trois", "Two to three"),
      option("four-plus", "Quatre ou plus", "Four or more"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "editorial-strategy", field: "brandCount" },
  },
  {
    key: "editorial.channels",
    label: {
      fr: "Où souhaitez-vous prendre la parole ?",
      en: "Where would you like your brand to communicate?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Sélectionnez les espaces utilisés aujourd’hui ou réellement prévus.",
      en: "Several choices are possible. Select the channels you use today or genuinely plan to use.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "volume"],
    options: [
      option("linkedin", "LinkedIn", "LinkedIn"),
      option("instagram", "Instagram", "Instagram"),
      option("facebook", "Facebook", "Facebook"),
      option("tiktok", "TikTok", "TikTok"),
      option("youtube", "YouTube", "YouTube"),
      option("blog", "Blog ou média propriétaire", "Blog or owned media"),
      option("newsletter", "Newsletter", "Newsletter"),
      option("other-specialized", "Autre canal spécialisé", "Other specialized channel"),
      option("recommended", "Aidez-moi à choisir les canaux utiles", "Help me choose the useful channels"),
    ],
    manualReviewOptions: ["other-specialized"],
    briefMapping: { brief: "editorial-strategy", field: "channels" },
  },
  {
    key: "editorial.audienceCount",
    label: {
      fr: "À combien de groupes différents votre communication s’adresse-t-elle ?",
      en: "How many different groups does your communication address?",
    },
    helper: {
      fr: "Un seul choix. Vous n’avez pas à définir des profils marketing : indiquez simplement ce que vous savez aujourd’hui.",
      en: "One choice. You do not need to define marketing personas; simply indicate what you know today.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one", "Un groupe principal bien identifié", "One clearly identified main group"),
      option("two-three", "Deux à trois groupes différents", "Two to three different groups"),
      option("four-plus", "Quatre groupes ou plus", "Four groups or more"),
      option("unknown", "Je ne sais pas encore à qui parler en priorité", "I do not yet know who to prioritise"),
    ],
    briefMapping: { brief: "editorial-strategy", field: "audienceCount" },
  },
  {
    key: "editorial.deliverables",
    label: {
      fr: "À la fin, qu’aimeriez-vous pouvoir faire plus facilement ?",
      en: "What would you like to do more easily at the end of this work?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Exprimez le résultat attendu ; Carole traduira ensuite ces besoins en documents adaptés.",
      en: "Several choices are possible. Describe the outcome you need; Carole will translate it into the right documents.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "options", "volume"],
    options: [
      option("positioning-audit", "Comprendre ce qui brouille mon message actuel", "Understand what currently makes my message unclear"),
      option("content-pillars", "Savoir quels grands sujets aborder", "Know which main topics to cover"),
      option("editorial-charter", "Garder un ton et un message cohérents", "Keep a consistent tone and message"),
      option("calendar-template", "Organiser les publications dans le temps", "Organise publications over time"),
      option("angle-bank", "Disposer d’idées de sujets concrètes", "Have a practical bank of content ideas"),
      option("channel-rules", "Adapter le message à chaque canal", "Adapt the message to each channel"),
      option("presentation", "Présenter la stratégie à mon équipe", "Present the strategy to my team"),
      option("team-training", "Aider mon équipe à l’utiliser au quotidien", "Help my team use it day to day"),
      option("follow-up", "Être accompagné pendant les premières semaines", "Receive support during the first few weeks"),
      option("recommended", "Je préfère le cadre complet le plus adapté", "I prefer the most suitable complete framework"),
    ],
    briefMapping: { brief: "editorial-strategy", field: "deliverables" },
  },
  {
    key: "editorial.existingCorpusSize",
    label: {
      fr: "Quelle quantité de contenus, notes ou retours existe déjà ?",
      en: "How much existing content, notes, or feedback do you already have?",
    },
    helper: {
      fr: "Un seul choix. Ces éléments permettent de comprendre l’existant sans vous demander de compter chaque fichier.",
      en: "One choice. This helps us understand what exists without asking you to count every file.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("none", "Rien d’exploitable pour le moment", "Nothing usable yet"),
      option("up-to-ten", "Quelques éléments, jusqu’à une dizaine", "A few items, up to about ten"),
      option("eleven-thirty", "Un ensemble moyen, entre 11 et 30 éléments", "A medium set, between 11 and 30 items"),
      option("thirty-plus", "Beaucoup d’éléments, plus de 30", "A large set, more than 30 items"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "editorial-strategy", field: "existingCorpusSize" },
  },
  {
    key: "editorial.benchmarkScope",
    label: {
      fr: "Souhaitez-vous regarder aussi comment d’autres acteurs communiquent ?",
      en: "Would you also like to look at how other organisations communicate?",
    },
    helper: {
      fr: "Un seul choix. Il ne s’agit pas de copier, mais de repérer les usages du secteur et les possibilités de se différencier.",
      en: "One choice. This is not about copying, but about understanding sector habits and opportunities to stand out.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["options", "volume", "complexity"],
    options: [
      option("none", "Non, ce n’est pas nécessaire", "No, this is not necessary"),
      option("focused", "Oui, quelques références utiles choisies par Carole", "Yes, a few useful references selected by Carole"),
      option("extended", "Oui, plusieurs acteurs du secteur", "Yes, several organisations in the sector"),
      option("multi-market", "Oui, dans plusieurs pays ou marchés", "Yes, across several countries or markets"),
      option("unknown", "Je ne sais pas, je préfère être conseillé·e", "I am not sure and would like guidance"),
    ],
    manualReviewOptions: ["multi-market"],
    calculationExclusionOptions: ["none"],
    briefMapping: { brief: "editorial-strategy", field: "benchmarkScope" },
  },
  {
    key: "editorial.discoveryMethod",
    label: {
      fr: "Que pourrez-vous partager pour aider Carole à comprendre votre activité ?",
      en: "What can you share to help Carole understand your activity?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Sélectionnez seulement ce qui est réellement disponible ; il est normal de ne pas tout avoir.",
      en: "Several choices are possible. Select only what is genuinely available; it is normal not to have everything.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["options", "volume", "complexity"],
    options: [
      option("documents", "Des documents ou contenus existants", "Existing documents or content"),
      option("questionnaire", "Des réponses écrites détaillées", "Detailed written answers"),
      option("interviews", "Un ou plusieurs échanges avec les personnes concernées", "One or more conversations with the people involved"),
      option("workshop", "Un temps de travail collectif avec l’équipe", "A group working session with the team"),
      option("limited", "Très peu d’informations sont disponibles pour le moment", "Very little information is available at the moment"),
      option("recommended", "Aidez-moi à choisir la bonne façon de commencer", "Help me choose the right way to start"),
    ],
    manualReviewOptions: ["limited"],
    briefMapping: { brief: "editorial-strategy", field: "discoveryMethod" },
  },
] as const satisfies readonly ServiceQuestion[];

const digitalCommunicationQuestions = [
  {
    key: "communication.engagementType",
    label: {
      fr: "Quelle situation correspond le mieux à votre besoin ?",
      en: "Which situation best matches your need?",
    },
    helper: {
      fr: "Un seul choix. Choisissez la situation que vous vivez ; Carole définira ensuite la méthode de travail adaptée.",
      en: "One choice. Select the situation you are facing; Carole will then define the right working approach.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "duration"],
    options: [
      option("ongoing", "Animer ma communication au quotidien", "Manage my communication day to day"),
      option("launch", "Préparer le lancement d’une offre ou d’une activité", "Prepare the launch of an offer or activity"),
      option("campaign", "Mener une campagne avec un début et une fin", "Run a campaign with a start and end date"),
      option("event", "Communiquer autour d’un événement", "Communicate around an event"),
      option("hybrid-complex", "Combiner plusieurs de ces situations", "Combine several of these situations"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["hybrid-complex"],
    briefMapping: { brief: "digital-communication", field: "engagementType" },
  },
  {
    key: "communication.channels",
    label: {
      fr: "Quels comptes ou espaces doivent être animés ?",
      en: "Which accounts or spaces need to be managed?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Sélectionnez les canaux déjà ouverts ou réellement prévus.",
      en: "Several choices are possible. Select channels that already exist or are genuinely planned.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "volume"],
    options: [
      option("linkedin", "LinkedIn", "LinkedIn"),
      option("instagram", "Instagram", "Instagram"),
      option("facebook", "Facebook", "Facebook"),
      option("tiktok", "TikTok", "TikTok"),
      option("youtube", "YouTube", "YouTube"),
      option("blog", "Blog", "Blog"),
      option("newsletter", "Newsletter", "Newsletter"),
      option("other-specialized", "Autre canal spécialisé", "Other specialized channel"),
      option("recommended", "Aidez-moi à choisir les canaux utiles", "Help me choose the useful channels"),
    ],
    manualReviewOptions: ["other-specialized"],
    briefMapping: { brief: "digital-communication", field: "channels" },
  },
  {
    key: "communication.accountCount",
    label: {
      fr: "Combien de comptes ou de pages sont concernés au total ?",
      en: "How many accounts or pages are involved in total?",
    },
    helper: {
      fr: "Un seul choix. Deux pages Instagram de marques différentes comptent comme deux comptes.",
      en: "One choice. Two Instagram pages for different brands count as two accounts.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one", "Un compte ou une page", "One account or page"),
      option("two-three", "Deux à trois", "Two to three"),
      option("four-six", "Quatre à six", "Four to six"),
      option("seven-plus", "Sept ou plus", "Seven or more"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "digital-communication", field: "accountCount" },
  },
  {
    key: "communication.durationMonths",
    label: {
      fr: "Pendant combien de temps souhaitez-vous déléguer ce pilotage ?",
      en: "For how long would you like to delegate this work?",
    },
    helper: {
      fr: "Un seul choix. Cette question apparaît uniquement pour une gestion suivie dans le temps.",
      en: "One choice. This question only appears for ongoing communication management.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["duration"],
    options: [
      option("one", "Un mois pour démarrer", "One month to get started"),
      option("three", "Trois mois", "Three months"),
      option("six", "Six mois", "Six months"),
      option("twelve-plus", "Douze mois ou plus", "Twelve months or more"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    dependsOn: { questionKey: "communication.engagementType", operator: "equals", value: "ongoing" },
    briefMapping: { brief: "digital-communication", field: "durationMonths" },
  },
  {
    key: "communication.postsPerMonth",
    label: {
      fr: "À quel rythme imaginez-vous publier ?",
      en: "How often do you expect to publish?",
    },
    helper: {
      fr: "Un seul choix. Une estimation suffit : le calendrier précis sera construit plus tard.",
      en: "One choice. A rough estimate is enough; the detailed calendar will be built later.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume"],
    options: [
      option("light", "Léger — une à deux publications par semaine", "Light — one to two posts per week"),
      option("regular", "Régulier — trois à quatre par semaine", "Regular — three to four per week"),
      option("sustained", "Soutenu — presque tous les jours", "Sustained — almost every day"),
      option("intensive", "Intensif — plusieurs publications par jour", "Intensive — several posts per day"),
      option("unknown", "Le rythme n’est pas encore décidé", "The publishing rhythm is not decided yet"),
    ],
    briefMapping: { brief: "digital-communication", field: "postsPerMonth" },
  },
  {
    key: "communication.contentResponsibility",
    label: {
      fr: "Qui fournit les contenus à publier ?",
      en: "Who provides the content to be published?",
    },
    helper: {
      fr: "Un seul choix. Pensez aux textes, aux visuels et aux vidéos nécessaires pour publier.",
      en: "One choice. Consider the text, visuals, and videos needed for publication.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "mutualization", "complexity"],
    options: [
      option("client", "Les contenus sont fournis par le client", "The client provides the content"),
      option("coordination-only", "Les contenus sont produits par d'autres prestataires et doivent être coordonnés", "Other vendors produce the content and need coordination"),
      option("carole", "Les contenus doivent être produits dans le projet", "Content needs to be produced within the project"),
      option("mixed", "Responsabilité partagée", "Shared responsibility"),
      option("undefined", "La répartition n'est pas encore définie", "Responsibilities are not defined yet"),
    ],
    manualReviewOptions: ["undefined"],
    briefMapping: { brief: "digital-communication", field: "contentResponsibility" },
  },
  {
    key: "communication.tasks",
    label: {
      fr: "Que souhaitez-vous confier à Carole ?",
      en: "What would you like Carole to handle?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Si vous hésitez, choisissez la gestion complète adaptée.",
      en: "Several choices are possible. If you are unsure, choose the suitable full-management option.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "options", "volume"],
    options: [
      option("planning", "Organiser le calendrier des publications", "Organise the publication calendar"),
      option("creative-coordination", "Préparer ou coordonner les contenus", "Prepare or coordinate content"),
      option("scheduling", "Programmation des publications", "Post scheduling"),
      option("publishing", "Publication", "Publishing"),
      option("campaign-management", "Pilotage de campagne", "Campaign management"),
      option("community-replies", "Répondre aux messages et commentaires", "Reply to messages and comments"),
      option("reporting-recommendations", "Suivre les résultats et proposer des améliorations", "Track results and suggest improvements"),
      option("reporting-meeting", "Faire un point régulier pour expliquer les résultats", "Hold a regular meeting to explain results"),
      option("vendor-management", "Coordination de plusieurs prestataires", "Multiple vendor coordination"),
      option("recommended", "Prendre en charge la gestion complète la plus adaptée", "Handle the most suitable complete management package"),
    ],
    briefMapping: { brief: "digital-communication", field: "tasks" },
  },
  {
    key: "communication.communityManagement",
    label: {
      fr: "À quel moment faut-il répondre aux messages et commentaires ?",
      en: "When should messages and comments be answered?",
    },
    helper: {
      fr: "Un seul choix. Les réponses très rapides demandent une organisation et une disponibilité particulières.",
      en: "One choice. Very fast response times require specific organisation and availability.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["options", "volume", "duration"],
    options: [
      option("none", "Aucune gestion de communauté", "No community management"),
      option("standard", "Pendant les jours et horaires de travail convenus", "During agreed working days and hours"),
      option("extended", "Tous les jours, sur des horaires définis", "Every day, during defined hours"),
      option("real-time", "Très rapidement pendant certains temps forts", "Very quickly during specific key moments"),
      option("crisis", "Avec un dispositif prévu pour les situations sensibles", "With a plan for sensitive situations"),
      option("unknown", "Aidez-moi à cadrer ce besoin", "Help me define this need"),
    ],
    manualReviewOptions: ["real-time", "crisis"],
    calculationExclusionOptions: ["none"],
    dependsOn: { questionKey: "communication.tasks", operator: "includes", value: "community-replies" },
    briefMapping: { brief: "digital-communication", field: "communityManagement" },
  },
  {
    key: "communication.paidMedia",
    label: {
      fr: "Prévoyez-vous de sponsoriser des publications ou de faire de la publicité en ligne ?",
      en: "Do you plan to sponsor posts or run online advertising?",
    },
    helper: {
      fr: "Un seul choix. Le budget versé aux plateformes reste distinct du travail de préparation et de pilotage.",
      en: "One choice. The amount paid to platforms remains separate from the preparation and management work.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["options", "complexity"],
    options: [
      option("none", "Non", "No"),
      option("creative-coordination", "Coordination des créations publicitaires uniquement", "Advertising creative coordination only"),
      option("strategy", "Recommandation de campagne", "Campaign recommendation"),
      option("media-buying", "Achat média et optimisation", "Media buying and optimization"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["media-buying"],
    calculationExclusionOptions: ["none"],
    briefMapping: { brief: "digital-communication", field: "paidMedia" },
  },
] as const satisfies readonly ServiceQuestion[];

const contentCreationQuestions = [
  {
    key: "content.formats",
    label: {
      fr: "Quels formats faut-il produire ?",
      en: "Which content formats need to be produced?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Choisissez les formats que vous reconnaissez ; vous n’avez pas besoin de connaître leur méthode de production.",
      en: "Several choices are possible. Select the formats you recognise; you do not need to know how they are produced.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "complexity"],
    options: [
      option("short-post", "Posts courts", "Short-form posts"),
      option("long-post", "Posts longs", "Long-form posts"),
      option("article", "Articles", "Articles"),
      option("carousel", "Carrousels", "Carousels"),
      option("short-video-script", "Scripts de vidéos courtes", "Short-form video scripts"),
      option("static-visual", "Visuels statiques", "Static visuals"),
      option("short-video", "Vidéos courtes", "Short-form videos"),
      option("custom-format", "Autre format sur mesure", "Other custom format"),
      option("recommended", "Aidez-moi à choisir le mélange le plus adapté", "Help me choose the most suitable mix"),
    ],
    manualReviewOptions: ["custom-format"],
    briefMapping: { brief: "content-creation", field: "formats" },
  },
  {
    key: "content.totalVolume",
    label: {
      fr: "Quelle quantité de contenus souhaitez-vous produire ?",
      en: "How much content would you like to produce?",
    },
    helper: {
      fr: "Un seul choix. Comptez chaque publication, article, visuel ou vidéo comme un contenu ; une fourchette suffit.",
      en: "One choice. Count each post, article, visual, or video as one item; a range is enough.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume"],
    options: [
      option("one-four", "Un petit lot — 1 à 4 contenus", "A small batch — 1 to 4 items"),
      option("five-ten", "Un lot moyen — 5 à 10 contenus", "A medium batch — 5 to 10 items"),
      option("eleven-twenty", "Un lot important — 11 à 20 contenus", "A large batch — 11 to 20 items"),
      option("twenty-plus", "Une production régulière — plus de 20 contenus", "Ongoing production — more than 20 items"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "content-creation", field: "totalVolume" },
  },
  {
    key: "content.channels",
    label: {
      fr: "Pour quels canaux les contenus doivent-ils être adaptés ?",
      en: "Which channels should the content be adapted for?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Un même sujet peut demander plusieurs versions selon les plateformes.",
      en: "Several choices are possible. The same topic may require different versions for different platforms.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity", "mutualization"],
    options: [
      option("linkedin", "LinkedIn", "LinkedIn"),
      option("instagram", "Instagram", "Instagram"),
      option("facebook", "Facebook", "Facebook"),
      option("tiktok", "TikTok", "TikTok"),
      option("youtube", "YouTube", "YouTube"),
      option("blog", "Blog", "Blog"),
      option("newsletter", "Newsletter", "Newsletter"),
      option("other-specialized", "Autre canal spécialisé", "Other specialized channel"),
      option("recommended", "Aidez-moi à choisir les canaux utiles", "Help me choose the useful channels"),
    ],
    manualReviewOptions: ["other-specialized"],
    briefMapping: { brief: "content-creation", field: "channels" },
  },
  {
    key: "content.sourceMaterial",
    label: {
      fr: "De quoi Carole pourra-t-elle partir pour créer les contenus ?",
      en: "What will Carole be able to use as a starting point?",
    },
    helper: {
      fr: "Un seul choix. Plus les informations sont prêtes, moins il faut prévoir de recherche ou d’entretiens.",
      en: "One choice. The more prepared the information is, the less research or interviewing will be needed.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options"],
    options: [
      option("ready", "Les textes, images et informations sont prêts", "The text, images, and information are ready"),
      option("partial", "Une partie est prête, mais il faudra compléter", "Some material is ready, but more will be needed"),
      option("ideas-only", "Nous avons surtout des idées à développer", "We mainly have ideas that need developing"),
      option("interviews", "Les informations devront être recueillies lors d’échanges", "The information will need to be gathered through conversations"),
      option("research", "Carole devra rechercher et vérifier les informations", "Carole will need to research and verify information"),
      option("technical-research", "Le sujet demande des recherches très spécialisées", "The topic requires highly specialised research"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["technical-research"],
    briefMapping: { brief: "content-creation", field: "sourceMaterial" },
  },
  {
    key: "content.visualTemplates",
    label: {
      fr: "Disposez-vous déjà d’un style visuel réutilisable ?",
      en: "Do you already have a reusable visual style?",
    },
    helper: {
      fr: "Un seul choix. Pensez aux couleurs, polices et modèles qui permettent de reconnaître votre marque.",
      en: "One choice. Think of the colours, fonts, and templates that make your brand recognisable.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options", "mutualization"],
    options: [
      option("available", "Oui, ils sont prêts à l'emploi", "Yes, they are ready to use"),
      option("adapt", "Oui, mais ils doivent être adaptés", "Yes, but they need adaptation"),
      option("create-simple", "Non, des templates simples doivent être créés", "No, simple templates need to be created"),
      option("identity-needed", "Non, une direction visuelle complète est nécessaire", "No, a complete visual direction is needed"),
      option("not-needed", "Ce projet ne comprend pas de visuels", "This project does not include visuals"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["identity-needed"],
    briefMapping: { brief: "content-creation", field: "visualTemplates" },
  },
  {
    key: "content.videoLevel",
    label: {
      fr: "Pour les vidéos, que faut-il prendre en charge ?",
      en: "For video content, what needs to be handled?",
    },
    helper: {
      fr: "Un seul choix. Indiquez ce que vous pouvez déjà fournir et ce qui reste à produire.",
      en: "One choice. Indicate what you can already provide and what still needs to be produced.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options", "logistics"],
    options: [
      option("script-only", "Écriture des scripts uniquement", "Scriptwriting only"),
      option("edit-client-rushes", "Montage à partir de rushes fournis", "Editing from client-provided footage"),
      option("shoot-and-edit", "Captation simple et montage", "Simple filming and editing"),
      option("advanced-production", "Production avancée, plusieurs lieux, animation ou 3D", "Advanced production, multiple locations, animation, or 3D"),
      option("unknown", "Aidez-moi à choisir le niveau adapté", "Help me choose the right level"),
    ],
    manualReviewOptions: ["advanced-production"],
    dependsOn: { questionKey: "content.formats", operator: "includes", value: "short-video" },
    briefMapping: { brief: "content-creation", field: "videoLevel" },
  },
  {
    key: "content.deliveryRhythm",
    label: {
      fr: "Quel rythme de livraison souhaitez-vous ?",
      en: "What delivery cadence do you need?",
    },
    helper: {
      fr: "Un seul choix. Le rythme change l’organisation nécessaire pour produire, faire valider et corriger les contenus.",
      en: "One choice. The cadence affects how content is produced, reviewed, and revised.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["duration", "urgency", "complexity"],
    options: [
      option("single-batch", "Un lot unique", "A single batch"),
      option("weekly", "Livraisons hebdomadaires", "Weekly deliveries"),
      option("monthly", "Livraisons mensuelles", "Monthly deliveries"),
      option("campaign-milestones", "Livraisons selon les jalons d'une campagne", "Delivery against campaign milestones"),
      option("continuous-urgent", "Production continue avec délais très courts", "Continuous production with very short deadlines"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["continuous-urgent"],
    briefMapping: { brief: "content-creation", field: "deliveryRhythm" },
  },
  {
    key: "content.usageRights",
    label: {
      fr: "Comment les contenus seront-ils utilisés ?",
      en: "How will the content be used?",
    },
    helper: {
      fr: "Plusieurs choix possibles. La publicité, la musique, les personnes filmées ou une large diffusion peuvent demander des autorisations supplémentaires.",
      en: "Several choices are possible. Advertising, music, featured people, or broad distribution may require additional permissions.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["rights", "options"],
    options: [
      option("organic", "Diffusion organique", "Organic distribution"),
      option("paid", "Publicité payante", "Paid advertising"),
      option("internal", "Communication interne", "Internal communication"),
      option("extended-territories", "Diffusion sur des territoires étendus", "Distribution across extended territories"),
      option("talent-music-licensing", "Talents, musique ou licences spécifiques", "Talent, music, or specific licensing"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["talent-music-licensing"],
    briefMapping: { brief: "content-creation", field: "usageRights" },
  },
  {
    key: "content.onSiteProduction",
    label: {
      fr: "Faut-il se déplacer pour filmer ou créer les images ?",
      en: "Will travel be required to film or create the visuals?",
    },
    helper: {
      fr: "Un seul choix. Les lieux, les déplacements et le temps de présence influencent directement la production.",
      en: "One choice. Locations, travel, and time on site directly affect production.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["logistics", "complexity"],
    options: [
      option("none", "Non", "No"),
      option("local", "Oui, sur un site local", "Yes, at one local site"),
      option("multiple-local", "Oui, sur plusieurs sites locaux", "Yes, at several local sites"),
      option("international", "Oui, avec déplacement international", "Yes, with international travel"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["international"],
    calculationExclusionOptions: ["none"],
    dependsOn: { questionKey: "content.formats", operator: "includes", value: "short-video" },
    briefMapping: { brief: "content-creation", field: "onSiteProduction" },
  },
] as const satisfies readonly ServiceQuestion[];

const auditAdviceQuestions = [
  {
    key: "audit.focus",
    label: {
      fr: "Qu’est-ce qui vous pousse à demander un regard extérieur ?",
      en: "What is prompting you to seek an outside perspective?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Décrivez ce que vous observez ; Carole déterminera ensuite la méthode d’analyse adaptée.",
      en: "Several choices are possible. Describe what you observe; Carole will then determine the right analysis method.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "complexity"],
    options: [
      option("profiles", "Mes pages ou profils ne présentent pas clairement l’activité", "My pages or profiles do not present the activity clearly"),
      option("content", "Les contenus sont irréguliers ou manquent de cohérence", "The content is inconsistent or lacks coherence"),
      option("message", "Le message semble mal compris", "The message seems misunderstood"),
      option("visual-consistency", "L’univers visuel change trop d’un support à l’autre", "The visual style changes too much from one asset to another"),
      option("performance", "Les résultats sont difficiles à comprendre ou à améliorer", "Results are difficult to understand or improve"),
      option("conversion", "La communication génère peu de demandes ou d’actions", "Communication generates few enquiries or actions"),
      option("overall", "Je souhaite un bilan général", "I would like an overall review"),
      option("unknown", "Je ne sais pas encore où se trouve le problème", "I do not yet know where the problem is"),
    ],
    briefMapping: { brief: "audit-advice", field: "focus" },
  },
  {
    key: "audit.assetCount",
    label: {
      fr: "Combien de pages, comptes ou supports faut-il examiner ?",
      en: "How many pages, accounts, or assets need to be reviewed?",
    },
    helper: {
      fr: "Un seul choix. Une fourchette suffit : Carole définira ensuite l’échantillon pertinent.",
      en: "One choice. A range is enough; Carole will later define the relevant sample.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one-three", "Un à trois", "One to three"),
      option("four-six", "Quatre à six", "Four to six"),
      option("seven-twelve", "Sept à douze", "Seven to twelve"),
      option("thirteen-plus", "Plus de douze", "More than twelve"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "audit-advice", field: "assetCount" },
  },
  {
    key: "audit.brandCount",
    label: {
      fr: "Le projet concerne combien de marques, d’offres ou d’activités différentes ?",
      en: "How many different brands, offers, or activities are involved?",
    },
    helper: {
      fr: "Un seul choix. Plusieurs activités avec des publics différents élargissent le travail d’analyse.",
      en: "One choice. Several activities with different audiences broaden the analysis work.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one", "Une seule", "One"),
      option("two-three", "Deux à trois", "Two to three"),
      option("four-plus", "Quatre ou plus", "Four or more"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "audit-advice", field: "brandCount" },
  },
  {
    key: "audit.dataAccess",
    label: {
      fr: "À quelles informations Carole pourra-t-elle accéder ?",
      en: "What information will Carole be able to access?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Ne partagez jamais de mot de passe dans ce formulaire ; les accès seront organisés de façon sécurisée plus tard.",
      en: "Several choices are possible. Never share a password in this form; access will be arranged securely later.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options"],
    options: [
      option("public", "Les éléments visibles publiquement", "Publicly visible information"),
      option("exports", "Des captures ou exports de résultats", "Screenshots or exported results"),
      option("analytics", "Un accès en lecture aux statistiques", "Read-only access to statistics"),
      option("internal", "Des documents ou retours internes", "Internal documents or feedback"),
      option("unavailable", "Les informations ne sont pas encore disponibles", "The information is not available yet"),
      option("unknown", "Je ne sais pas encore ce qui peut être partagé", "I do not yet know what can be shared"),
    ],
    briefMapping: { brief: "audit-advice", field: "dataAccess" },
  },
  {
    key: "audit.depth",
    label: {
      fr: "À la fin de l’analyse, de quoi avez-vous besoin pour avancer ?",
      en: "At the end of the review, what do you need in order to move forward?",
    },
    helper: {
      fr: "Un seul choix. Choisissez le résultat attendu ; Carole déterminera la profondeur et le format du travail.",
      en: "One choice. Select the outcome you need; Carole will determine the depth and format of the work.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "complexity"],
    options: [
      option("diagnostic", "Repérer rapidement les problèmes prioritaires", "Quickly identify the priority issues"),
      option("deep-audit", "Comprendre en détail ce qui fonctionne ou non", "Understand in detail what works and what does not"),
      option("roadmap", "Recevoir un plan d’actions classé par priorité", "Receive a prioritised action plan"),
      option("presentation", "Présenter les constats et les décisions à une équipe", "Present the findings and decisions to a team"),
      option("implementation", "Être accompagné pour appliquer les recommandations", "Receive support to implement the recommendations"),
      option("undefined-scope", "Aidez-moi à choisir le niveau utile", "Help me choose the useful level"),
    ],
    briefMapping: { brief: "audit-advice", field: "depth" },
  },
  {
    key: "audit.benchmarkScope",
    label: {
      fr: "Faut-il aussi regarder ce que font d’autres acteurs ?",
      en: "Should we also look at what other organisations are doing?",
    },
    helper: {
      fr: "Un seul choix. Cette comparaison sert à comprendre le secteur et à repérer des pistes d’amélioration, pas à copier.",
      en: "One choice. This comparison helps understand the sector and identify improvements, not copy others.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["options", "volume", "complexity"],
    options: [
      option("none", "Non, ce n’est pas nécessaire", "No, this is not necessary"),
      option("focused", "Oui, quelques références utiles choisies par Carole", "Yes, a few useful references selected by Carole"),
      option("extended", "Oui, plusieurs acteurs du secteur", "Yes, several organisations in the sector"),
      option("multi-market", "Oui, dans plusieurs pays ou marchés", "Yes, across several countries or markets"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["multi-market"],
    calculationExclusionOptions: ["none"],
    briefMapping: { brief: "audit-advice", field: "benchmarkScope" },
  },
] as const satisfies readonly ServiceQuestion[];

const visualIdentityQuestions = [
  {
    key: "identity.projectType",
    label: {
      fr: "Quel besoin décrit le mieux votre projet ?",
      en: "Which need best describes your project?",
    },
    helper: {
      fr: "Un seul choix. Choisissez la situation qui vous ressemble ; vous n’avez pas besoin de connaître les termes du design.",
      en: "One choice. Select the situation that sounds like yours; you do not need to know design terminology.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "complexity"],
    options: [
      option("complete-identity", "Créer une identité depuis le début", "Create an identity from scratch"),
      option("logo", "Créer seulement un logo", "Create a logo only"),
      option("guidelines", "Organiser une identité existante dans un guide", "Organise an existing identity into a guide"),
      option("refresh", "Moderniser ou corriger une identité existante", "Modernise or improve an existing identity"),
      option("assets", "Créer quelques supports à partir d’une identité existante", "Create a few assets from an existing identity"),
      option("custom-combination", "Combiner plusieurs de ces besoins", "Combine several of these needs"),
      option("unknown", "Je ne sais pas exactement", "I am not exactly sure"),
    ],
    manualReviewOptions: ["custom-combination"],
    briefMapping: { brief: "visual-identity", field: "projectType" },
  },
  {
    key: "identity.visualState",
    label: {
      fr: "Quels éléments graphiques existent déjà ?",
      en: "Which visual assets already exist?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Sélectionnez seulement ce que vous pourrez réellement transmettre à Carole.",
      en: "Several choices are possible. Select only what you will genuinely be able to share with Carole.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "mutualization"],
    options: [
      option("logo", "Logo existant", "Existing logo"),
      option("colors", "Couleurs existantes", "Existing colors"),
      option("typography", "Des polices déjà utilisées", "Fonts already in use"),
      option("guidelines", "Des règles qui expliquent comment utiliser l’identité", "Rules explaining how to use the identity"),
      option("templates", "Des modèles de publications ou de documents", "Post or document templates"),
      option("source-files-missing", "Des éléments existent, mais pas les fichiers modifiables", "Assets exist, but editable files are missing"),
      option("none", "Aucun élément", "No existing assets"),
      option("unknown", "Je ne sais pas ce qui est exploitable", "I do not know what can be reused"),
    ],
    manualReviewOptions: ["source-files-missing"],
    briefMapping: { brief: "visual-identity", field: "visualState" },
  },
  {
    key: "identity.namingState",
    label: {
      fr: "Le nom de la marque est-il prêt ?",
      en: "Is the brand name ready?",
    },
    helper: {
      fr: "Un seul choix. Un nom encore en réflexion peut demander un travail supplémentaire avant de créer le logo.",
      en: "One choice. A name that is still being considered may require extra work before the logo is created.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options"],
    options: [
      option("validated", "Oui, il est choisi et validé", "Yes, it is chosen and validated"),
      option("shortlist", "Nous hésitons entre quelques noms", "We are choosing between a few names"),
      option("naming-help", "Nous avons besoin d’aide pour trouver le nom", "We need help finding the name"),
      option("legal-clearance", "Le nom est choisi, mais pas encore vérifié", "The name is chosen, but not yet checked"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["naming-help", "legal-clearance"],
    briefMapping: { brief: "visual-identity", field: "namingState" },
  },
  {
    key: "identity.positioningState",
    label: {
      fr: "Pouvez-vous expliquer clairement ce que la marque propose et à qui elle s’adresse ?",
      en: "Can you clearly explain what the brand offers and who it is for?",
    },
    helper: {
      fr: "Un seul choix. Si ce point est encore flou, un temps de cadrage devra précéder le travail visuel.",
      en: "One choice. If this is still unclear, a framing phase will be needed before the visual work.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "mutualization"],
    options: [
      option("clear", "Oui, c’est clair et partagé", "Yes, it is clear and shared"),
      option("partial", "Globalement, mais certains points restent flous", "Broadly, but some points remain unclear"),
      option("needs-framing", "Non, l’offre ou le public sont encore en construction", "No, the offer or audience is still being defined"),
      option("multi-brand", "Plusieurs activités ou marques doivent être réunies", "Several activities or brands need to be aligned"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    manualReviewOptions: ["multi-brand"],
    briefMapping: { brief: "visual-identity", field: "positioningState" },
  },
  {
    key: "identity.brandCount",
    label: {
      fr: "L’identité doit-elle couvrir une seule marque ou plusieurs entités liées ?",
      en: "Should the identity cover one brand or several related entities?",
    },
    helper: {
      fr: "Un seul choix. Plusieurs gammes ou sous-marques demandent un système capable de les distinguer et de les relier.",
      en: "One choice. Several ranges or sub-brands require a system that can distinguish and connect them.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume", "complexity"],
    options: [
      option("one", "Une seule marque", "One brand"),
      option("two-three", "Deux à trois marques, gammes ou sous-marques", "Two to three brands, ranges, or sub-brands"),
      option("four-plus", "Quatre ou plus", "Four or more"),
      option("unknown", "Je ne sais pas encore", "I do not know yet"),
    ],
    briefMapping: { brief: "visual-identity", field: "brandCount" },
  },
  {
    key: "identity.coreDeliverables",
    label: {
      fr: "À la fin, de quoi souhaitez-vous disposer ?",
      en: "What would you like to have at the end of the project?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Si vous ne connaissez pas les éléments nécessaires, choisissez le kit le plus adapté.",
      en: "Several choices are possible. If you do not know what is needed, choose the most suitable kit.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["base-scope", "options", "volume"],
    options: [
      option("logo", "Un logo principal reconnaissable", "A recognisable primary logo"),
      option("logo-variants", "Des versions adaptées aux petits formats et aux fonds différents", "Versions for small sizes and different backgrounds"),
      option("colors", "Des couleurs de marque faciles à réutiliser", "Brand colours that are easy to reuse"),
      option("typography", "Des polices et des règles simples pour les textes", "Fonts and simple rules for text"),
      option("graphic-elements", "Des formes et éléments visuels réutilisables", "Reusable shapes and visual elements"),
      option("art-direction", "Une direction claire pour garder le même style", "A clear direction for maintaining a consistent style"),
      option("social-kit", "Un kit de départ pour les réseaux sociaux", "A starter kit for social media"),
      option("guide-compact", "Un guide simple pour bien utiliser l’identité", "A simple guide for using the identity correctly"),
      option("guide-detailed", "Un guide détaillé pour une équipe ou des prestataires", "A detailed guide for a team or external providers"),
      option("icons", "De petites icônes personnalisées", "Custom small icons"),
      option("illustrations", "Des illustrations personnalisées", "Custom illustrations"),
      option("motion", "Un logo ou des éléments animés", "An animated logo or visual elements"),
      option("complete-kit", "Tout ce qui est utile pour déployer la marque", "Everything useful for rolling out the brand"),
      option("recommended", "Aidez-moi à choisir le kit adapté", "Help me choose the right kit"),
    ],
    briefMapping: { brief: "visual-identity", field: "deliverables" },
  },
  {
    key: "identity.supportCount",
    label: {
      fr: "En plus du logo, combien de supports concrets faut-il préparer ?",
      en: "Besides the logo, how many practical assets need to be prepared?",
    },
    helper: {
      fr: "Un seul choix. Par exemple : carte de visite, modèle de publication, couverture de document ou affiche.",
      en: "One choice. For example: a business card, post template, document cover, or poster.",
    },
    type: "choice",
    requiredForEstimate: true,
    pricingDimension: ["volume"],
    options: [
      option("none", "Aucun support supplémentaire", "No additional asset"),
      option("one-two", "Un à deux supports", "One to two assets"),
      option("three-five", "Trois à cinq supports", "Three to five assets"),
      option("six-plus", "Six supports ou plus", "Six assets or more"),
      option("unknown", "Aidez-moi à choisir les supports utiles", "Help me choose the useful assets"),
    ],
    briefMapping: { brief: "visual-identity", field: "supportCount" },
  },
  {
    key: "identity.priorityUses",
    label: {
      fr: "Où l'identité devra-t-elle vivre en priorité ?",
      en: "Where will the identity be used most?",
    },
    helper: {
      fr: "Plusieurs choix possibles. Les usages prévus déterminent les déclinaisons et les fichiers à préparer.",
      en: "Several choices are possible. Planned uses determine the adaptations and files that need to be prepared.",
    },
    type: "multi",
    requiredForEstimate: true,
    pricingDimension: ["complexity", "options"],
    options: [
      option("social", "Réseaux sociaux", "Social media"),
      option("web", "Site web", "Website"),
      option("commercial-docs", "Documents commerciaux", "Sales documents"),
      option("print", "Impression papier", "Print"),
      option("event", "Événementiel", "Events"),
      option("signage", "Enseigne ou signalétique", "Signage"),
      option("packaging", "Packaging", "Packaging"),
      option("industrial", "Usage industriel ou technique particulier", "Special industrial or technical use"),
      option("recommended", "Partout où ce sera utile pour démarrer", "Wherever it will be useful to get started"),
    ],
    manualReviewOptions: ["industrial"],
    briefMapping: { brief: "visual-identity", field: "usage" },
  },
] as const satisfies readonly ServiceQuestion[];

export const editorialStrategyQuestionnaire = {
  serviceId: "editorial-strategy",
  label: { fr: "Stratégie éditoriale", en: "Editorial strategy" },
  questions: editorialStrategyQuestions,
} as const satisfies ServiceQuestionnaire;

export const digitalCommunicationQuestionnaire = {
  serviceId: "digital-communication",
  label: { fr: "Communication digitale", en: "Digital communication" },
  questions: digitalCommunicationQuestions,
} as const satisfies ServiceQuestionnaire;

export const contentCreationQuestionnaire = {
  serviceId: "content-creation",
  label: { fr: "Création de contenu", en: "Content creation" },
  questions: contentCreationQuestions,
} as const satisfies ServiceQuestionnaire;

export const auditAdviceQuestionnaire = {
  serviceId: "audit-advice",
  label: { fr: "Audit & conseil", en: "Audit & consulting" },
  questions: auditAdviceQuestions,
} as const satisfies ServiceQuestionnaire;

export const visualIdentityQuestionnaire = {
  serviceId: "visual-identity",
  label: { fr: "Identité visuelle", en: "Visual identity" },
  questions: visualIdentityQuestions,
} as const satisfies ServiceQuestionnaire;

export const serviceQuestionnaires = {
  "editorial-strategy": editorialStrategyQuestionnaire,
  "digital-communication": digitalCommunicationQuestionnaire,
  "content-creation": contentCreationQuestionnaire,
  "audit-advice": auditAdviceQuestionnaire,
  "visual-identity": visualIdentityQuestionnaire,
} as const satisfies Record<EstimatorServiceId, ServiceQuestionnaire>;

export const estimatorServiceIds = Object.keys(serviceQuestionnaires) as EstimatorServiceId[];
export const MAX_ESTIMATOR_NUMBER_ANSWER = 1_000_000;

export function getServiceQuestionnaire(serviceId: EstimatorServiceId): ServiceQuestionnaire {
  return serviceQuestionnaires[serviceId];
}

export function isQuestionVisible(question: ServiceQuestion, answers: QuestionnaireAnswers): boolean {
  const dependency = question.dependsOn;
  if (!dependency) return true;

  const answer = answers[dependency.questionKey];

  if (dependency.operator === "equals") return answer === dependency.value;
  if (dependency.operator === "notEquals") return answer !== dependency.value;
  if (dependency.operator === "includes") {
    return Array.isArray(answer) && answer.includes(String(dependency.value));
  }

  const acceptedValues = Array.isArray(dependency.value) ? dependency.value : [dependency.value];
  return acceptedValues.includes(answer as string | number);
}

export function getVisibleQuestions(
  serviceId: EstimatorServiceId,
  answers: QuestionnaireAnswers,
): ServiceQuestion[] {
  return serviceQuestionnaires[serviceId].questions.filter((question) => isQuestionVisible(question, answers));
}

export function isNumberQuestionAnswerValid(
  question: ServiceQuestion,
  answer: unknown,
): answer is number {
  if (question.type !== "number" || typeof answer !== "number" || !Number.isFinite(answer)) return false;
  const minimum = question.number?.min ?? 0;
  const step = question.number?.step ?? 1;
  if (step <= 0 || answer < minimum || answer > MAX_ESTIMATOR_NUMBER_ANSWER) return false;
  const stepCount = (answer - minimum) / step;
  return Math.abs(stepCount - Math.round(stepCount)) < 1e-9;
}

export function isQuestionAnswered(question: ServiceQuestion, answer: QuestionnaireAnswer | undefined): boolean {
  if (question.type === "multi") return Array.isArray(answer) && answer.length > 0;
  if (question.type === "number") return isNumberQuestionAnswerValid(question, answer);
  return typeof answer === "string" && answer.trim().length > 0;
}

export function pruneHiddenServiceAnswers(
  serviceIds: readonly EstimatorServiceId[],
  answers: QuestionnaireAnswers,
): QuestionnaireAnswers {
  const nextAnswers = { ...answers };
  const questions = serviceIds.flatMap(
    (serviceId) => serviceQuestionnaires[serviceId].questions as readonly ServiceQuestion[],
  );
  let removedHiddenAnswer: boolean;
  do {
    removedHiddenAnswer = false;
    for (const question of questions) {
      if (nextAnswers[question.key] !== undefined && !isQuestionVisible(question, nextAnswers)) {
        delete nextAnswers[question.key];
        removedHiddenAnswer = true;
      }
    }
  } while (removedHiddenAnswer);
  return nextAnswers;
}

export function getQuestionPurpose(question: ServiceQuestion): QuestionPurpose {
  return question.purpose ?? "pricing-and-prefill";
}

export function getQuestionnaireProgress(
  serviceIds: readonly EstimatorServiceId[],
  answers: QuestionnaireAnswers,
): QuestionnaireProgress {
  const requiredQuestions = serviceIds.flatMap((serviceId) =>
    getVisibleQuestions(serviceId, answers).filter((question) => question.requiredForEstimate),
  );
  const completed = requiredQuestions.filter((question) => isQuestionAnswered(question, answers[question.key])).length;
  const total = requiredQuestions.length;

  return {
    completed,
    total,
    remaining: Math.max(0, total - completed),
    percentage: total === 0 ? 100 : Math.round((completed / total) * 100),
  };
}

export function getServiceProgress(
  serviceId: EstimatorServiceId,
  answers: QuestionnaireAnswers,
): QuestionnaireProgress {
  return getQuestionnaireProgress([serviceId], answers);
}

export function getManualReviewFlags(
  serviceIds: readonly EstimatorServiceId[],
  answers: QuestionnaireAnswers,
): ManualReviewFlag[] {
  return serviceIds.flatMap((serviceId) =>
    getVisibleQuestions(serviceId, answers).flatMap((question) => {
      if (!question.manualReviewOptions?.length) return [];

      const answer = answers[question.key];
      const selectedValues = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
      const selectedOptions = selectedValues.filter((value) => question.manualReviewOptions?.includes(value));

      return selectedOptions.length > 0
        ? [{ serviceId, questionKey: question.key, selectedOptions }]
        : [];
    }),
  );
}

/**
 * Returns the language-neutral runtime contract needed by a future server-side
 * validator. It deliberately excludes labels and pricing rules: API validation
 * only needs stable keys, input types, dependencies and allowed values.
 */
export function getSerializableQuestionnaireContract(): SerializableQuestionnaireContract {
  return Object.fromEntries(
    estimatorServiceIds.map((serviceId) => [
      serviceId,
      {
        serviceId,
        questions: (serviceQuestionnaires[serviceId].questions as readonly ServiceQuestion[]).map((question) => ({
          key: question.key,
          type: question.type,
          requiredForEstimate: question.requiredForEstimate,
          purpose: getQuestionPurpose(question),
          pricingDimensions: [...question.pricingDimension],
          ...(question.dependsOn ? { dependsOn: question.dependsOn } : {}),
          optionValues: question.options?.map((entry) => entry.value) ?? [],
          manualReviewOptions: [...(question.manualReviewOptions ?? [])],
          calculationExclusionOptions: [...(question.calculationExclusionOptions ?? [])],
          ...(question.number ? { number: { ...question.number, max: MAX_ESTIMATOR_NUMBER_ANSWER } } : {}),
        })),
      },
    ]),
  ) as SerializableQuestionnaireContract;
}
