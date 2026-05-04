const fr = {
  nav: {
    services: "Services",
    manifesto: "Manifesto",
    about: "À propos",
    testimonials: "Avis",
    contact: "Contact",
    language: "Choisir la langue",
    menu: "Ouvrir le menu",
  },

  hero: {
    eyebrow: "Social Media Agency Paris",
    titleStart: "Construire une présence sociale",
    titleAccent: "claire & engageante",
    titleEnd: "pour votre marque.",
    description:
      "Je vous accompagne dans la définition et la mise en œuvre d'une stratégie éditoriale sur mesure pour développer votre communauté avec authenticité.",
    primaryCta: "Discutons-en",
    secondaryCta: "Mes services",
    badgeTop: "Direction",
    badgeBottom: "Créative",
    imageAlt: "Portrait de Carole Tonoukouen",
  },

  manifesto: {
    titleTop: "Publier sans stratégie",
    titleAccent: "ne suffit plus.",
    p1: "Dans un environnement digital saturé, l'attention est la ressource la plus rare. Une présence sociale réussie ne repose pas sur le volume, mais sur la pertinence, la clarté et l'authenticité de votre message.",
    p2: "Il est temps de passer d'une communication réactive à une direction éditoriale intentionnelle.",
  },

  about: {
    titleTop: "Enchantée,",
    titleAccent: "moi c'est Carole",
    p1: "J'aide les petites entreprises et les organisations à transmettre leur message et maximiser leur impact tout en restant rentables et authentiques.",
    p2: "Je prends en charge la réflexion stratégique, la conception éditoriale et la création de contenus. Vous et moi collaborerons sur la vision créative, sur les sujets qui vous passionnent et que vous maîtrisez, pour bâtir une communauté engagée.",
    imageAlt: "Carole travaillant sur une direction éditoriale",
    traits: [
      { label: "Rédactrice" },
      { label: "Stratège" },
      { label: "Coffee lover" },
    ],
  },

  services: {
    titleAccent: "Mes",
    titleRest: "Services",
    subtitle:
      "Des solutions sur mesure pour structurer et amplifier votre voix digitale.",
    items: [
      {
        title: "Stratégie",
        accent: "Éditoriale",
        description:
          "Définition de votre ligne éditoriale, de vos piliers de contenu et de votre positionnement unique sur les réseaux sociaux.",
      },
      {
        title: "Direction",
        accent: "Social Media",
        description:
          "Pilotage de votre présence en ligne, création de calendriers éditoriaux engageants et gestion de vos campagnes digitales pour maximiser votre impact au quotidien.",
      },
      {
        title: "Création de",
        accent: "Contenu",
        description:
          "Rédaction de posts à forte valeur ajoutée, conception de visuels percutants et production de formats adaptés aux exigences de chaque plateforme.",
      },
      {
        title: "Audit &",
        accent: "Consulting",
        description:
          "Analyse approfondie de l'existant et recommandations stratégiques pour optimiser vos performances.",
      },
    ],
  },

  testimonials: {
    eyebrow: "Témoignages",
    titleStart: "Mots doux de",
    titleAccent: "mes clients",
    items: [
      {
        quote:
          "J'attire enfin les bonnes personnes dans ma messagerie ! En quelques semaines, j'ai converti un prospect en client long terme grâce à un post LinkedIn. Merci Carole d'avoir structuré ma présence.",
        name: "Uzoma Obidike",
        role: "Fondatrice, She Leads",
      },
      {
        quote:
          "Carole comprend ma marque, ce qu'elle représente, et génère un contenu qui est véritablement aligné avec ma vision. Elle fait un travail magnifique pour capturer ma voix unique.",
        name: "Cynthia S.",
        role: "Hôte de podcast",
      },
      {
        quote:
          "Elle nous a appris comment utiliser efficacement chaque plateforme et rester au top de ce qui est pertinent aujourd'hui. Je recommande définitivement l'investissement.",
        name: "Julian F.",
        role: "Directeur conseil",
      },
    ],
  },

  footer: {
    signature: "Social Media Direction.",
    newsletterLabel: "Adresse email pour rejoindre la newsletter",
    newsletterPlaceholder: "Rejoindre la newsletter",
    newsletterCta: "S'inscrire",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    contact: "Contact",
  },

  errorPages: {
    notFound: {
      title: "Page introuvable",
      description:
        "La page que vous recherchez n'existe pas ou a été déplacée. Vérifiez l'adresse ou revenez à l'accueil.",
      backHome: "Retour à l'accueil",
      explore: "Explorer les services",
    },
    routeError: {
      title: "Une erreur est survenue",
      description:
        "Quelque chose s'est mal passé lors du chargement de cette page. Vous pouvez réessayer ou revenir à l'accueil.",
      retry: "Réessayer",
    },
    critical: {
      title: "Quelque chose s'est mal passé",
      description:
        "Une erreur inattendue est survenue. Veuillez réessayer ou revenir à l'accueil.",
    },
  },
} as const;

export default fr;
