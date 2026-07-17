// Seed content for the dashboard mockup. Values are illustrative only and live
// entirely in the browser; nothing here is published to the real site.

import { bookCoversBySlug, carnetImagesBySlug } from "./carnetImages";

const L = (fr: string, en = "") => ({ fr, en });

export const seedContent = {
  homePage: {
    id: "homePage",
    hero: {
      eyebrow: L("Chargée de communication digitale", "Digital communications officer"),
      title: L("Construire une communication", "Build communication that’s"),
      accent: L("claire & engageante.", "clear & engaging."),
      titleEnd: L("", ""),
      description: L(
        "Je coordonne vos contenus, vos campagnes et vos actions de visibilité pour que votre marque parle d'une seule voix.",
        "I coordinate your content, campaigns, and visibility efforts so your brand speaks with one clear voice.",
      ),
      primaryCta: L("Discutons-en", "Let's talk"),
      secondaryCta: L("Mes services", "My services"),
      portrait: null,
    },
    manifesto: {
      title: L("Publier sans stratégie", "Posting without strategy"),
      accent: L("ne suffit plus.", "is no longer enough."),
      body: L(
        "Dans un environnement digital saturé, l'attention est la ressource la plus rare. Une communication réussie ne repose pas sur le volume, mais sur la pertinence, la clarté et la cohérence de votre message.\n\nIl est temps de passer d'une communication réactive à une organisation éditoriale intentionnelle.",
        "In a saturated digital environment, attention is the rarest resource. Strong communication is not built on volume, but on relevance, clarity, and consistency.\n\nIt is time to move from reactive communication to intentional editorial organization.",
      ),
    },
    about: {
      title: L("Enchantée,", "Lovely to meet you,"),
      accent: L("moi c'est Carole", "I'm Carole"),
      body: L(
        "J'accompagne les marques qui veulent mieux organiser leur prise de parole sans perdre ce qui les rend singulières.\n\nMon rôle mêle coordination éditoriale, rédaction et suivi de production, avec une façon de travailler fondée sur l'écoute, la clarté et le dialogue.",
        "I help brands bring more structure to the way they communicate—without losing what makes them distinctive.\n\nI combine editorial coordination, writing, and production oversight with a collaborative approach built on listening, clarity, and open dialogue.",
      ),
      image: null,
    },
    servicesSection: {
      titleAccent: L("Mes", "My"),
      titleRest: L("Services", "Services"),
      subtitle: L(
        "Des solutions sur mesure pour structurer vos contenus et vos actions de communication.",
        "Tailored support to structure your content and communication actions.",
      ),
    },
    testimonialsSection: {
      eyebrow: L("Témoignages", "Testimonials"),
      titleStart: L("Mots doux de", "Kind words from"),
      titleAccent: L("mes clients", "my clients"),
    },
    contactSection: {
      eyebrow: L("Entrer en contact", "Get in touch"),
      titleStart: L("Parlez-moi de", "Tell me what"),
      titleAccent: L("votre besoin", "you need"),
      description: L(
        "Partagez quelques informations sur votre marque, vos canaux ou l'accompagnement recherché. Je vous répondrai avec une prochaine étape claire.",
        "Share a few details about your brand, your channels, or the support you are looking for. I will get back to you with a clear next step.",
      ),
      meetingLink: L("Ou opter pour un rendez-vous", "Or choose to book a call"),
    },
  },
  aboutPage: {
    id: "aboutPage",
    hero: {
      title: L("À propos", "About"),
      subtitle: L(
        "Je vous présente ici mon parcours, le regard que je porte sur mon métier et la façon dont j'aime collaborer.",
        "Here, I share my background, the perspective I bring to my work, and the way I like to collaborate.",
      ),
    },
    image: null,
    imageAlt: L("Portrait de Carole Tonoukouen", "Portrait of Carole Tonoukouen"),
    identity: {
      label: L("Qui je suis", "Who I am"),
      greeting: L("Enchantée, moi c'est Carole Tonoukouen.", "Lovely to meet you. I'm Carole Tonoukouen."),
      role: L(
        "Chargée de communication digitale, spécialisée en coordination éditoriale et en rédaction",
        "Digital communications officer specializing in editorial coordination and writing",
      ),
      paragraphs: [
        L(
          "Je suis basée à Cotonou et je travaille avec des entreprises, des organisations et des porteurs de projets qui souhaitent mieux organiser leur prise de parole et développer une présence en ligne fidèle à leur identité, sans se laisser emporter par le rythme des réseaux sociaux.",
          "I'm based in Cotonou and work with businesses, organizations, and project owners who want to organize their messaging more effectively and build an online presence that feels true to who they are, without being swept up in the constant pace of social media.",
        ),
        L(
          "Mes expériences en coordination éditoriale et en gestion de plateformes m'ont progressivement conduite à travailler auprès de marques qui veulent sortir d'une prise de parole réactive, menée au jour le jour, pour construire un rythme éditorial plus réfléchi et porteur de sens.",
          "My experience in editorial coordination and platform management gradually led me to work with brands that want to move away from reactive, day-to-day messaging and build a more thoughtful editorial rhythm with a clear sense of purpose.",
        ),
        L(
          "Au fil du temps, une conviction s'est imposée. Une marque ne construit pas une relation durable avec son public en publiant davantage, mais en choisissant des messages justes, constants et ancrés dans sa réalité.",
          "Over time, one belief has become central to my work. A brand does not build a lasting relationship with its audience by publishing more, but by choosing messages that are relevant, consistent, and grounded in its reality.",
        ),
      ],
    },
    support: {
      label: L("Comment je vous accompagne", "How I support you"),
      paragraphs: [
        L(
          "Pour moi, une collaboration commence par une écoute attentive. Il s'agit de comprendre ce qui caractérise votre marque, la manière dont elle s'exprime et ce que vous souhaitez faire évoluer, sans lui imposer une voix qui ne lui ressemble pas.",
          "For me, every collaboration begins with careful listening. It means understanding what defines your brand, how it expresses itself, and what you want to develop, without imposing a voice that does not feel like your own.",
        ),
        L(
          "Je tiens également à ce que les échanges restent simples et que chacun sache où l'on va. Les choix sont expliqués, les priorités restent visibles et les décisions se prennent avec vous, dans un dialogue direct.",
          "I also believe the conversation should remain straightforward and the direction easy to follow. Choices are explained, priorities remain visible, and decisions are made with you through direct, open dialogue.",
        ),
        L(
          "Chaque situation appelle une réponse différente. Je ne m'appuie donc pas sur une formule toute faite. Je préfère un cadre assez solide pour avancer sereinement et assez souple pour évoluer avec vos besoins.",
          "Every situation calls for a different response. That is why I do not rely on a ready-made formula. I prefer a framework that is solid enough to move forward with confidence and flexible enough to evolve with your needs.",
        ),
      ],
    },
    value: {
      label: L("Ce que cela change pour vous", "What this changes for you"),
      paragraphs: [
        L(
          "Vous gagnez une présence plus harmonieuse, dans laquelle les contenus se répondent et rendent votre message plus facile à reconnaître. Votre public comprend clairement ce qui vous distingue, tandis que les personnes impliquées disposent de repères communs.",
          "You gain a more harmonious presence, where individual pieces of content support one another and make your message easier to recognize. Your audience can clearly understand what sets you apart, while the people involved share a common set of reference points.",
        ),
        L(
          "Vous allégez aussi la charge quotidienne liée à votre communication. Au lieu de repartir de zéro à chaque prise de parole, vous avancez avec un fil conducteur qui facilite les choix et aide à maintenir le cap dans le temps.",
          "You also reduce the day-to-day weight of communication. Instead of starting from scratch every time you need to speak, you move forward with a guiding thread that makes decisions easier and helps you stay on course over time.",
        ),
      ],
    },
    closing: {
      paragraphs: [L(
        "Que votre besoin soit déjà bien défini ou encore en cours de réflexion, je serai ravie d'en discuter avec vous.",
        "Whether your needs are already clearly defined or still taking shape, I'd be happy to discuss them with you.",
      )],
    },
    ctaBand: {
      title: L("Échangeons autour de votre projet", "Let's talk about your project"),
      subtitle: L(
        "Parlez-moi de votre contexte, de vos priorités et de ce que vous avez en tête. Nous verrons ensemble quelle forme de collaboration répond le mieux à votre situation.",
        "Tell me about your context, priorities, and what you have in mind. Together, we can identify the type of collaboration that best fits your situation.",
      ),
      ctaPrimary: L("Me contacter", "Contact me"),
      ctaSecondary: L("Voir mes services", "View my services"),
    },
  },
  cvPage: {
    id: "cvPage",
    eyebrow: L("Curriculum vitæ", "Curriculum vitae"),
    firstName: "Carole",
    lastName: "Tonoukouen",
    role: L("Chargée de communication", "Communications officer"),
    summary: L(
      "Jeune professionnelle en communication avec une expérience concrète en gestion de contenus et coordination d'activités.",
      "Young communications professional with hands-on experience in content management and activity coordination.",
    ),
    contacts: {
      email: "caroletonoukouen@gmail.com",
      phone: "+229 01 95 93 44 54",
      location: L("Cotonou, Bénin", "Cotonou, Benin"),
      portfolioLabel: L("Behance.net", "Behance.net"),
      portfolioUrl: "https://www.behance.net/caroletonoukouen",
    },
  },
  service: [
    {
      id: "service-strategy",
      slug: "strategie-editoriale",
      featured: true,
      title: L("Stratégie éditoriale", "Editorial strategy"),
      accent: L("Une ligne claire, des prises de parole utiles", ""),
      description: L("Définition de la ligne éditoriale, des piliers de contenu et du calendrier.", ""),
      detailIntro: L("", ""),
      presentation: L("", ""),
      metricValue: "+120%",
      metricLabel: L("d'engagement moyen", ""),
      bullets: [L("Audit des contenus", ""), L("Piliers éditoriaux", "")],
      whatIsIncluded: [L("Calendrier mensuel", "")],
      targetAudience: [L("Marques engagées", "")],
      concreteApplications: [L("Lancement de campagne", "")],
      caseStudy: { title: L("Refonte ligne édito", ""), description: L("", "") },
    },
    {
      id: "service-community",
      slug: "community-management",
      title: L("Community management", "Community management"),
      accent: L("Animer, fédérer, faire grandir", ""),
      description: L("Gestion quotidienne des réseaux et animation de communauté.", ""),
      detailIntro: L("", ""),
      presentation: L("", ""),
      metricValue: "x3",
      metricLabel: L("de portée organique", ""),
      bullets: [L("Modération", "")],
      whatIsIncluded: [L("Reporting mensuel", "")],
      targetAudience: [L("PME, associations", "")],
      concreteApplications: [],
      caseStudy: { title: L("", ""), description: L("", "") },
    },
  ],
  blogPost: [
    {
      id: "post-1",
      slug: "cas-client-coworking-cotonou",
      title: L("Cas client : relancer la visibilité d'un espace de coworking à Cotonou", ""),
      excerpt: L("Un cas concret autour d'un lieu de travail partagé, de ses offres et de ses preuves locales.", ""),
      category: L("Étude de cas", "Case study"),
      publishedAt: "2026-06-14",
      readingTime: L("7 min", ""),
      featured: true,
      coverImage: {
        url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
        alt: L("Réunion d'équipe autour d'une table de travail", ""),
      },
      takeaways: [L("Clarifier l'offre", ""), L("Installer des preuves locales", "")],
      body: L("Contexte\n\nUn espace de coworking avait besoin d'une présence digitale plus lisible.\n\nMéthode\n\nAudit, piliers éditoriaux, calendrier sur six semaines et contenus de preuve.", ""),
    },
    {
      id: "post-2",
      slug: "calendrier-editorial-campagne-lancement",
      title: L("Construire un calendrier éditorial autour d'un lancement", ""),
      excerpt: L("Préparer, annoncer, prouver et relancer une offre sans improviser.", ""),
      category: L("Organisation", "Organization"),
      publishedAt: "2026-04-22",
      readingTime: L("6 min", ""),
      featured: false,
      coverImage: {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
        alt: L("Ordinateur ouvert pour organiser un calendrier de campagne", ""),
      },
      takeaways: [L("Définir le jour utile", ""), L("Prévoir les ressources", "")],
      body: L("Un lancement gagne en clarté quand chaque semaine a un rôle précis.", ""),
    },
  ],
  testimonial: [
    {
      id: "bachiratou-issiako-toure",
      name: "Bachiratou ISSIAKO TOURE",
      role: L("Directrice générale, Wegal Space", "CEO, Wegal Space"),
      quote: L(
        "J’ai collaboré avec Carole sur plusieurs projets et j’ai particulièrement apprécié sa créativité et sa capacité à comprendre rapidement les besoins de ses clients. Je recommande son accompagnement sans hésitation.",
        "I worked with Carole on several projects and especially appreciated her creativity and ability to quickly understand her clients’ needs. I recommend her support without hesitation.",
      ),
      portrait: {
        url: "",
        alt: L(
          "Portrait professionnel de Bachiratou ISSIAKO TOURE",
          "Professional portrait of Bachiratou ISSIAKO TOURE",
        ),
      },
    },
    {
      id: "testimonial-julian",
      name: "Julian",
      role: L("Directeur, association culturelle", ""),
      quote: L("Une vraie vision éditoriale, rigoureuse et sensible.", ""),
      portrait: {
        url: "https://images.unsplash.com/photo-1642257859842-c95f9fa8121d?auto=format&fit=crop&w=1200&q=80",
        alt: L("Portrait professionnel de Julian", ""),
      },
    },
  ],
  // Carnet · Ressources (type implicite : Ressource)
  resource: [
    {
      id: "resource-le-depot",
      title: L("LE DÉPÔT", "LE DÉPÔT"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Une bibliothèque vivante de la communication africaine pour découvrir, déposer et référencer des campagnes d'Afrique francophone.",
        "A living library for African communication, built to discover, submit, and reference campaigns from French-speaking Africa.",
      ),
      url: "https://ledepot.co/",
      image: carnetImagesBySlug["le-depot"],
    },
    {
      id: "resource-laveiye",
      title: L("LAVEIYE", "LAVEIYE"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Une plateforme de veille qui rassemble des campagnes marketing africaines pour analyser, benchmarker et nourrir des concepts plus solides.",
        "A monitoring platform gathering African marketing campaigns to analyze, benchmark, and build stronger creative concepts.",
      ),
      url: "https://laveiye.com/",
      image: carnetImagesBySlug.laveiye,
    },
    {
      id: "resource-calendrier-cm-229",
      title: L("Calendrier du CM 229", "Calendrier du CM 229"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Un outil éditorial local mis à jour chaque année, avec dates importantes, inspirations de campagnes et conseils de professionnels du digital au Bénin.",
        "A local editorial tool updated every year with key dates, campaign inspiration, and practical advice from digital professionals in Benin.",
      ),
      url: "https://calendrierducm.bj/",
      image: carnetImagesBySlug["calendrier-cm-229"],
    },
  ],
  // Carnet · Communautés (type implicite : Communauté)
  community: [
    {
      id: "community-social-media-room",
      title: L("Social Media Room", "Social Media Room"),
      categories: ["Social media"],
      description: L(
        "Une communauté panafricaine et un cabinet d'accompagnement pour développer ses compétences en social media, accéder à des formations et échanger entre professionnels.",
        "A pan-African community and support structure for growing social media skills, joining training programs, and exchanging with professionals.",
      ),
      url: "https://socialmediaroom.africa/",
      image: carnetImagesBySlug["social-media-room"],
    },
    {
      id: "community-women-in-tech-benin",
      title: L("WOMEN IN TECH BENIN", "WOMEN IN TECH BENIN"),
      categories: ["Femmes & numérique"],
      description: L(
        "Une plateforme pour connecter, former et inspirer les filles et femmes dans le numérique au Bénin, avec répertoire, mentors, fiches métiers et événements.",
        "A platform connecting, training, and inspiring girls and women in Benin's digital sector through role models, mentors, career sheets, and events.",
      ),
      url: "https://womenintech.bj/",
      image: carnetImagesBySlug["women-in-tech-benin"],
    },
    {
      id: "community-women-techmakers-abomey-calavi",
      title: L("Women Techmakers Abomey-Calavi", "Women Techmakers Abomey-Calavi"),
      categories: ["Femmes & numérique"],
      description: L(
        "Une communauté de femmes passionnées par les technologies de programmation, portée par des sessions de renforcement de capacités, de networking et d'inspiration.",
        "A community for women passionate about programming technologies, with capacity-building sessions, networking, and inspiration around emerging tech.",
      ),
      url: "https://www.linkedin.com/company/women-techmakers-abomey-calavi/",
      image: carnetImagesBySlug["women-techmakers-abomey-calavi"],
    },
  ],
  // Carnet · Ouvrages recommandés (type implicite : Ouvrage)
  book: [
    {
      id: "book-everybody-writes",
      title: L("Everybody Writes", "Everybody Writes"),
      author: "Ann Handley",
      date: "2014",
      description: L(
        "Je le trouve indispensable pour créer du contenu avec plus de clarté. Il aide à mieux structurer ses idées et à raconter simplement.",
        "I find it essential for creating content with more clarity. It helps structure ideas and tell simple stories with confidence.",
      ),
      url: "https://books.google.com/books?id=QGtECQAAQBAJ",
      image: bookCoversBySlug["everybody-writes"],
    },
    {
      id: "book-storybrand",
      title: L("Storybrand", "Storybrand"),
      author: "Donald Miller",
      date: "2017",
      description: L(
        "J'aime sa manière très simple de ramener un message de marque à l'essentiel : le client, son problème et la promesse claire.",
        "I like how simply it brings a brand message back to what matters: the customer, their problem, and a clear promise.",
      ),
      url: "https://books.google.com/books?id=b3xDDgAAQBAJ",
      image: bookCoversBySlug.storybrand,
    },
    {
      id: "book-le-bug-humain",
      title: L("Le Bug Humain", "Le Bug Humain"),
      author: "Sébastien Bohler",
      date: "2019",
      description: L(
        "Je le garde comme repère pour comprendre nos réflexes d'attention, nos biais, et ce que le digital vient parfois amplifier.",
        "I keep it as a reference for understanding attention reflexes, biases, and what digital environments can amplify.",
      ),
      url: "https://books.google.com/books?id=_yODDwAAQBAJ",
      image: bookCoversBySlug["le-bug-humain"],
    },
  ],
  // Carnet · Articles & newsletters (type implicite : Référence)
  reference: [
    {
      id: "ref-marketing-brew",
      title: L("Marketing Brew", "Marketing Brew"),
      author: "Brew Team",
      description: L(
        "Une newsletter trihebdomadaire qui décrypte l'actualité des marques, les campagnes créatives et les mutations du secteur publicitaire.",
        "A tri-weekly newsletter decoding brand news, creative campaigns, and changes in the advertising sector.",
      ),
      url: "",
      image: null,
    },
    {
      id: "ref-growth-letter",
      title: L("Growth Letter", "Growth Letter"),
      author: "Yann Leonardi",
      description: L(
        "Des analyses concrètes des stratégies marketing, du positionnement produit et de la psychologie de l'attention.",
        "Concrete breakdowns of marketing strategies, product positioning, and the psychology of attention.",
      ),
      url: "",
      image: null,
    },
  ],
  cvEntry: [
    {
      id: "cv-exp-1",
      title: L("Chargée de communication digitale", ""),
      category: "experience",
      organization: "Agence Édito",
      period: L("2023 – aujourd'hui", ""),
      description: L("Pilotage de la communication digitale de marques engagées.", ""),
      highlights: [L("Gestion de 6 comptes clients", "")],
    },
    {
      id: "cv-edu-1",
      title: L("Master Communication", ""),
      category: "education",
      organization: "Université de Paris",
      period: L("2020 – 2022", ""),
      description: L("", ""),
      highlights: [],
    },
    {
      id: "cv-skills",
      title: L(
        "Rédaction de contenu, storytelling et communication institutionnelle",
        "Content writing, storytelling, and institutional communication",
      ),
      category: "skill",
      highlights: [
        L("Graphisme avec Canva et Adobe Suite", "Graphic design with Canva and Adobe Suite"),
        L("Community management", "Community management"),
      ],
    },
    {
      id: "cv-achievements",
      title: L(
        "Participation à la stratégie de positionnement visuel du Réseau Revia Afrique",
        "Contributed to the visual positioning strategy of Réseau Revia Afrique",
      ),
      category: "achievement",
      highlights: [
        L("Graphiste bénévole à Women in Tech Bénin", "Volunteer graphic designer for Women in Tech Benin"),
      ],
    },
    {
      id: "cv-languages",
      title: L("Français : courant, langue native", "French: fluent, native language"),
      category: "language",
      highlights: [
        L("Anglais : B2, intermédiaire avancé", "English: B2, upper-intermediate"),
      ],
    },
  ],
  siteSettings: {
    id: "siteSettings",
    title: L("Carole Tonoukouen", "Carole Tonoukouen"),
    description: L(
      "Site personnel de Carole Tonoukouen, chargée de communication digitale.",
      "Personal website of Carole Tonoukouen, digital communications officer.",
    ),
    siteUrl: "https://www.carolebj.com",
    ogImage: null,
    seoPages: {
      home: {
        title: L("Carole Tonoukouen | Communication digitale", "Carole Tonoukouen | Digital communication"),
        description: L("Site personnel de Carole Tonoukouen.", "Personal website of Carole Tonoukouen."),
      },
      about: {
        title: L("À propos | Carole Tonoukouen", "About | Carole Tonoukouen"),
        description: L("Parcours et approche éditoriale.", "Background and editorial approach."),
      },
      services: {
        title: L("Services | Carole Tonoukouen", "Services | Carole Tonoukouen"),
        description: L("Accompagnements en communication digitale.", "Digital communication services."),
      },
      blog: {
        title: L("Blog | Carole Tonoukouen", "Blog | Carole Tonoukouen"),
        description: L("Articles sur la communication digitale.", "Digital communication articles."),
      },
      contact: {
        title: L("Contact | Carole Tonoukouen", "Contact | Carole Tonoukouen"),
        description: L("Échangez sur votre projet.", "Discuss your project."),
      },
      cv: {
        title: L("CV | Carole Tonoukouen", "Resume | Carole Tonoukouen"),
        description: L("Parcours professionnel.", "Professional background."),
      },
      carnetResources: {
        title: L("Ressources & communautés", "Resources & communities"),
        description: L("Outils et communautés utiles.", "Useful tools and communities."),
      },
      carnetReadings: {
        title: L("Lectures & références", "Readings & references"),
        description: L("Ouvrages et newsletters repères.", "Reference books and newsletters."),
      },
    },
    contactEmail: "caroletonoukouen@gmail.com",
    behance: "https://www.behance.net/caroletonoukouen",
    linkedin: "https://linkedin.com/",
  },
};
