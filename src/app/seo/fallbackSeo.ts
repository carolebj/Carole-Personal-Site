export type SeoPageKey =
  | "home"
  | "about"
  | "services"
  | "blog"
  | "contact"
  | "cv"
  | "carnetResources"
  | "carnetReadings";

type SeoCopy = { title: string; description: string };

const fallbackByKey: Record<SeoPageKey, { fr: SeoCopy; en: SeoCopy }> = {
  home: {
    fr: {
      title: "Carole Tonoukouen | Communication digitale",
      description:
        "Portfolio de Carole Tonoukouen, chargée de communication digitale : stratégie éditoriale, contenus, campagnes et visibilité de marque.",
    },
    en: {
      title: "Carole Tonoukouen | Digital communication",
      description:
        "Portfolio of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
    },
  },
  about: {
    fr: {
      title: "À propos | Carole Tonoukouen",
      description:
        "Découvrez le parcours de Carole Tonoukouen et son approche de la communication digitale claire, structurée et cohérente.",
    },
    en: {
      title: "About | Carole Tonoukouen",
      description:
        "Discover Carole Tonoukouen's background and approach to clear, structured, consistent digital communication.",
    },
  },
  services: {
    fr: {
      title: "Services de communication digitale | Carole Tonoukouen",
      description:
        "Stratégie éditoriale, campagnes digitales, création de contenus et audit de présence en ligne pour clarifier votre communication.",
    },
    en: {
      title: "Digital communication services | Carole Tonoukouen",
      description:
        "Editorial strategy, digital campaigns, content creation, and online presence audits to clarify your communication.",
    },
  },
  blog: {
    fr: {
      title: "Blog communication digitale | Carole Tonoukouen",
      description:
        "Articles et notes pratiques sur la ligne éditoriale, le calendrier de contenu, les réseaux sociaux et l'audit digital.",
    },
    en: {
      title: "Digital communication blog | Carole Tonoukouen",
      description:
        "Practical articles and notes on editorial direction, content calendars, social media, and digital audits.",
    },
  },
  contact: {
    fr: {
      title: "Contact | Carole Tonoukouen",
      description:
        "Contactez Carole Tonoukouen pour échanger sur vos besoins en communication digitale, contenu et visibilité.",
    },
    en: {
      title: "Contact | Carole Tonoukouen",
      description:
        "Contact Carole Tonoukouen to discuss your digital communication, content, and visibility needs.",
    },
  },
  cv: {
    fr: {
      title: "CV | Carole Tonoukouen",
      description:
        "CV de Carole Tonoukouen : expérience, compétences, formations et réalisations en communication digitale.",
    },
    en: {
      title: "Resume | Carole Tonoukouen",
      description:
        "Carole Tonoukouen resume: experience, skills, education, and digital communication achievements.",
    },
  },
  carnetResources: {
    fr: {
      title: "Ressources & communautés | Carole Tonoukouen",
      description:
        "Ressources, outils et communautés pour nourrir une pratique de communication digitale plus solide.",
    },
    en: {
      title: "Resources & communities | Carole Tonoukouen",
      description:
        "Resources, tools, and communities for a stronger digital communication practice.",
    },
  },
  carnetReadings: {
    fr: {
      title: "Lectures & références | Carole Tonoukouen",
      description:
        "Ouvrages, newsletters et références pour affiner le regard et nourrir la pratique éditoriale.",
    },
    en: {
      title: "Readings & references | Carole Tonoukouen",
      description:
        "Books, newsletters, and references to sharpen your editorial practice.",
    },
  },
};

export function pathnameToSeoPageKey(pathname: string): SeoPageKey | null {
  if (pathname === "/") return "home";
  if (pathname === "/about") return "about";
  if (pathname === "/services") return "services";
  if (pathname.startsWith("/services/")) return null;
  if (pathname === "/blog") return "blog";
  if (pathname.startsWith("/blog/")) return null;
  if (pathname === "/contact") return "contact";
  if (pathname === "/cv") return "cv";
  if (pathname.startsWith("/carnet/outils-inspirations")) return "carnetResources";
  if (pathname.startsWith("/carnet/lectures-references")) return "carnetReadings";
  if (pathname.startsWith("/carnet/")) return "carnetResources";
  return "home";
}

export function getFallbackSeo(pathname: string, lang: "fr" | "en"): SeoCopy {
  const key = pathnameToSeoPageKey(pathname) ?? (pathname.startsWith("/services/") ? "services" : "blog");
  return fallbackByKey[key][lang];
}
