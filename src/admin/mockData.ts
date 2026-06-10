// Seed content for the dashboard mockup. Values are illustrative only and live
// entirely in the browser; nothing here is published to the real site.

import type { ContentStore } from "./store";
import { bookCoversBySlug, carnetImagesBySlug } from "./carnetImages";

const L = (fr: string, en = "") => ({ fr, en });

export const seedContent: ContentStore = {
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
  ],
  category: [
    { id: "cat-strategy", title: L("Stratégie", "Strategy"), slug: "strategie" },
    { id: "cat-org", title: L("Organisation", "Organization"), slug: "organisation" },
  ],
  siteSettings: {
    id: "siteSettings",
    title: L("Carole Tonoukouen", "Carole Tonoukouen"),
    description: L("Portfolio de communication digitale.", ""),
    contactEmail: "hello@carole.com",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },
};
