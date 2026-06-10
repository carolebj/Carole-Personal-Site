// Seed content for the dashboard mockup. Values are illustrative only and live
// entirely in the browser; nothing here is published to the real site.

import { bookCoversBySlug, carnetImagesBySlug } from "./carnetImages";

const L = (fr: string, en = "") => ({ fr, en });

export const seedContent = {
  homePage: {
    id: "homePage",
    hero: {
      eyebrow: L("Communication digitale", "Digital communications"),
      title: L("Donner de la voix", "Giving voice"),
      accent: L("aux marques", "to brands"),
      titleEnd: L("qui ont du sens", "that matter"),
      description: L(
        "Chargée de communication digitale, j'accompagne les marques engagées de la stratégie à la publication.",
        "",
      ),
      primaryCta: L("Me contacter", "Get in touch"),
      secondaryCta: L("Voir les services", "View services"),
      portrait: null,
    },
    manifesto: {
      title: L("Mon manifeste", "My manifesto"),
      accent: L("intention", "intention"),
      body: L("Chaque prise de parole doit servir une intention claire et une communauté réelle.", ""),
    },
    about: {
      title: L("À propos", "About"),
      accent: L("parcours", "journey"),
      body: L("Carole Tonoukouen, chargée de communication digitale et social media.", ""),
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
        "Qui je suis, ce que je fais concrètement et la manière dont j'accompagne les marques et les projets.",
        "Who I am, what I do in practice, and how I support brands and projects.",
      ),
    },
    image: null,
    imageAlt: L("Carole travaillant sur une communication digitale", "Carole working on digital communication"),
    identity: {
      label: L("Qui je suis", "Who I am"),
      greeting: L("Enchantée, moi c'est Carole Tonoukouen.", "Lovely to meet you. I'm Carole Tonoukouen."),
      role: L(
        "Chargée de communication digitale, coordination éditoriale et rédaction",
        "Digital communications officer, editorial coordination, and writing",
      ),
      paragraphs: [
        L(
          "Je suis basée à Cotonou et j'accompagne des entreprises, des organisations et des porteurs de projets.",
          "I'm based in Cotonou and I support businesses, organizations, and project owners.",
        ),
      ],
    },
    work: {
      label: L("Ce que je fais", "What I do"),
      paragraphs: [L("Stratégie éditoriale, communication digitale et création de contenus.", "")],
    },
    value: {
      label: L("Ce que vous y gagnez", "What you gain"),
      paragraphs: [L("Plus de lisibilité et une rigueur opérationnelle.", "")],
    },
    approach: {
      label: L("Mon approche", "My approach"),
      paragraphs: [L("Contexte, cadrage, déploiement puis suivi.", "")],
    },
    closing: {
      paragraphs: [L("Je serais ravie d'en discuter avec vous.", "")],
    },
    ctaBand: {
      title: L("Parlons de votre communication", "Let's talk about your communication"),
      subtitle: L("Expliquez-moi votre contexte, vos canaux et vos priorités.", ""),
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
      slug: "construire-une-ligne-editoriale",
      title: L("Construire une ligne éditoriale qui tient", ""),
      excerpt: L("Les 4 piliers d'une présence cohérente sur les réseaux.", ""),
      category: L("Stratégie", "Strategy"),
      publishedAt: "2026-05-12",
      readingTime: L("6 min", ""),
      featured: true,
      coverImage: null,
      takeaways: [L("Définir une intention", "")],
      body: L("", ""),
    },
    {
      id: "post-2",
      slug: "calendrier-editorial-2026",
      title: L("Le calendrier éditorial, mode d'emploi", ""),
      excerpt: L("Planifier sans s'épuiser.", ""),
      category: L("Organisation", "Organization"),
      publishedAt: "2026-04-02",
      readingTime: L("4 min", ""),
      featured: false,
      coverImage: null,
      takeaways: [],
      body: L("", ""),
    },
  ],
  testimonial: [
    {
      id: "testimonial-cynthia",
      name: "Cynthia",
      role: L("Fondatrice, marque de cosmétiques", ""),
      quote: L("Carole a transformé notre présence en ligne en quelques mois.", ""),
      portrait: null,
    },
    {
      id: "testimonial-julian",
      name: "Julian",
      role: L("Directeur, association culturelle", ""),
      quote: L("Une vraie vision éditoriale, rigoureuse et sensible.", ""),
      portrait: null,
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
      "Portfolio de Carole Tonoukouen, chargée de communication digitale.",
      "Portfolio of Carole Tonoukouen, digital communications officer.",
    ),
    siteUrl: "https://carole-portfolio.vercel.app",
    ogImage: null,
    seoPages: {
      home: {
        title: L("Carole Tonoukouen | Communication digitale", "Carole Tonoukouen | Digital communication"),
        description: L("Portfolio de communication digitale.", "Digital communications portfolio."),
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
    contactEmail: "hello@carole.com",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },
};
