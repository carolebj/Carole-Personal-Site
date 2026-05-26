import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

const SITE_URL = "https://carole-portfolio.vercel.app";
const SITE_NAME = "Carole Tonoukouen";

type SeoEntry = {
  title: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
};

const seoEntries: Record<string, SeoEntry> = {
  "/": {
    title: {
      fr: "Carole Tonoukouen | Communication digitale",
      en: "Carole Tonoukouen | Digital communication",
    },
    description: {
      fr: "Portfolio de Carole Tonoukouen, chargee de communication digitale: strategie editoriale, contenus, campagnes et visibilite de marque.",
      en: "Portfolio of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
    },
  },
  "/about": {
    title: {
      fr: "A propos | Carole Tonoukouen",
      en: "About | Carole Tonoukouen",
    },
    description: {
      fr: "Decouvrez le parcours de Carole Tonoukouen et son approche de la communication digitale claire, structuree et coherente.",
      en: "Discover Carole Tonoukouen's background and approach to clear, structured, consistent digital communication.",
    },
  },
  "/services": {
    title: {
      fr: "Services de communication digitale | Carole Tonoukouen",
      en: "Digital communication services | Carole Tonoukouen",
    },
    description: {
      fr: "Strategie editoriale, campagnes digitales, creation de contenus et audit de presence en ligne pour clarifier votre communication.",
      en: "Editorial strategy, digital campaigns, content creation, and online presence audits to clarify your communication.",
    },
  },
  "/blog": {
    title: {
      fr: "Blog communication digitale | Carole Tonoukouen",
      en: "Digital communication blog | Carole Tonoukouen",
    },
    description: {
      fr: "Articles et notes pratiques sur la ligne editoriale, le calendrier de contenu, les reseaux sociaux et l'audit digital.",
      en: "Practical articles and notes on editorial direction, content calendars, social media, and digital audits.",
    },
  },
  "/contact": {
    title: {
      fr: "Contact | Carole Tonoukouen",
      en: "Contact | Carole Tonoukouen",
    },
    description: {
      fr: "Contactez Carole Tonoukouen pour echanger sur vos besoins en communication digitale, contenu et visibilite.",
      en: "Contact Carole Tonoukouen to discuss your digital communication, content, and visibility needs.",
    },
  },
  "/cv": {
    title: {
      fr: "CV | Carole Tonoukouen",
      en: "Resume | Carole Tonoukouen",
    },
    description: {
      fr: "CV de Carole Tonoukouen: experience, competences, formations et realisations en communication digitale.",
      en: "Carole Tonoukouen resume: experience, skills, education, and digital communication achievements.",
    },
  },
};

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }

  element.href = url;
}

function getSeoEntry(pathname: string) {
  if (pathname.startsWith("/services/")) {
    return seoEntries["/services"];
  }

  if (pathname.startsWith("/blog/")) {
    return seoEntries["/blog"];
  }

  if (pathname.startsWith("/carnet/")) {
    return {
      title: {
        fr: "Carnet ressources | Carole Tonoukouen",
        en: "Resource notebook | Carole Tonoukouen",
      },
      description: {
        fr: "Ressources, lectures, outils et inspirations pour nourrir une pratique de communication digitale plus solide.",
        en: "Resources, readings, tools, and inspiration for a stronger digital communication practice.",
      },
    };
  }

  return seoEntries[pathname] ?? seoEntries["/"];
}

export default function Seo() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const lang = i18n.language.startsWith("en") ? "en" : "fr";
  const entry = getSeoEntry(pathname);
  const title = entry.title[lang];
  const description = entry.description[lang];
  const canonicalUrl = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
      jobTitle: lang === "fr" ? "Chargee de communication digitale" : "Digital communications officer",
      knowsAbout:
        lang === "fr"
          ? ["Communication digitale", "Strategie editoriale", "Creation de contenu", "SEO"]
          : ["Digital communication", "Editorial strategy", "Content creation", "SEO"],
    }),
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = title;
    setMeta("description", description);
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonicalUrl, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setCanonical(canonicalUrl);

    let script = document.getElementById("portfolio-structured-data") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "portfolio-structured-data";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structuredData);
  }, [canonicalUrl, description, lang, structuredData, title]);

  return null;
}
