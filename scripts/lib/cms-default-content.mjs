/**
 * Contenu CMS par défaut — dérivé de src/app/i18n/locales/fr.tsx et en.tsx.
 *
 *   npm run cms:sync-i18n -- --apply
 */

import { loadI18nPair } from "./load-i18n.mjs";

export const L = (fr, en) => ({ fr, en: en ?? "" });

const { fr, en } = loadI18nPair();

const BLOG_PUBLISHED_AT = {
  "cas-client-coworking-cotonou": "2026-06-14",
  "calendrier-editorial-campagne-lancement": "2026-04-22",
  "audit-linkedin-instagram-message": "2026-03-07",
  "brief-identite-visuelle-logo-charte": "2026-01-18",
};

const BLOG_COVER_IMAGES = {
  "cas-client-coworking-cotonou": {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
    alt: L(
      "Réunion d'équipe autour d'une table de travail",
      "Team meeting around a shared work table",
    ),
  },
  "calendrier-editorial-campagne-lancement": {
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    alt: L(
      "Ordinateur ouvert pour organiser un calendrier de campagne",
      "Laptop used to organize a campaign calendar",
    ),
  },
  "audit-linkedin-instagram-message": {
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    alt: L(
      "Tableau de données utilisé pour analyser une présence digitale",
      "Data dashboard used to analyze a digital presence",
    ),
  },
  "brief-identite-visuelle-logo-charte": {
    url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=80",
    alt: L(
      "Planche de design graphique et repères visuels",
      "Graphic design board and visual references",
    ),
  },
};

const TESTIMONIAL_PORTRAITS = {
  "uzoma-obidike": {
    url: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=1200&q=80",
    alt: L("Portrait professionnel d'Uzoma Obidike", "Professional portrait of Uzoma Obidike"),
  },
  "cynthia-s": {
    url: "https://images.unsplash.com/photo-1590649880765-91b1956b8276?auto=format&fit=crop&w=1200&q=80",
    alt: L("Portrait professionnel de Cynthia", "Professional portrait of Cynthia"),
  },
  "julian-f": {
    url: "https://images.unsplash.com/photo-1642257859842-c95f9fa8121d?auto=format&fit=crop&w=1200&q=80",
    alt: L("Portrait professionnel de Julian", "Professional portrait of Julian"),
  },
};

const CARNET_SLUG_BY_LINK = {
  "https://ledepot.co/": "le-depot",
  "https://socialmediaroom.africa/": "social-media-room",
  "https://laveiye.com/": "laveiye",
  "https://womenintech.bj/": "women-in-tech-benin",
  "https://calendrierducm.bj/": "calendrier-cm-229",
  "https://www.linkedin.com/company/women-techmakers-abomey-calavi/": "women-techmakers-abomey-calavi",
};

const BOOK_SLUG_BY_TITLE = {
  "Everybody Writes": "everybody-writes",
  Storybrand: "storybrand",
  "Le Bug Humain": "le-bug-humain",
};

const REFERENCE_SLUG_BY_TITLE = {
  "Marketing Brew": "marketing-brew",
  "Growth Letter": "growth-letter",
};

const CV_SIDEBAR_IDS = ["cv-education", "cv-skills", "cv-achievements", "cv-languages"];
const CV_SIDEBAR_CATEGORIES = ["education", "skill", "achievement", "language"];

function localizedParagraphs(pairs) {
  const frText = pairs.map(([f]) => f).join("\n\n");
  const enText = pairs.map(([, e]) => e).join("\n\n");
  return L(frText, enText);
}

function localizedList(frItems, enItems) {
  return frItems.map((item, index) => L(item, enItems[index] ?? ""));
}

function sectionsToBody(sectionsFr, sectionsEn) {
  const toBody = (sections) =>
    sections
      .map((section) => [section.title, ...section.body].join("\n\n"))
      .join("\n\n\n");
  return L(toBody(sectionsFr), toBody(sectionsEn));
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function testimonialDocId(name) {
  return slugify(name.replace(/\./g, ""));
}

/** homePage — textes publics (images conservées à la sync). */
export function buildHomePageContent() {
  return {
    id: "homePage",
    hero: {
      eyebrow: L(fr.hero.eyebrow, en.hero.eyebrow),
      title: L(fr.hero.titleStart, en.hero.titleStart),
      accent: L(fr.hero.titleAccent, en.hero.titleAccent),
      titleEnd: L(fr.hero.titleEnd, en.hero.titleEnd),
      description: L(fr.hero.description, en.hero.description),
      primaryCta: L(fr.hero.primaryCta, en.hero.primaryCta),
      secondaryCta: L(fr.hero.secondaryCta, en.hero.secondaryCta),
      portrait: null,
    },
    manifesto: {
      title: L(fr.manifesto.titleTop, en.manifesto.titleTop),
      accent: L(fr.manifesto.titleAccent, en.manifesto.titleAccent),
      body: localizedParagraphs([
        [fr.manifesto.p1, en.manifesto.p1],
        [fr.manifesto.p2, en.manifesto.p2],
      ]),
    },
    about: {
      title: L(fr.about.titleTop, en.about.titleTop),
      accent: L(fr.about.titleAccent, en.about.titleAccent),
      body: localizedParagraphs([
        [fr.about.p1, en.about.p1],
        [fr.about.p2, en.about.p2],
      ]),
      image: null,
    },
    servicesSection: {
      titleAccent: L(fr.services.titleAccent, en.services.titleAccent),
      titleRest: L(fr.services.titleRest, en.services.titleRest),
      subtitle: L(fr.services.subtitle, en.services.subtitle),
    },
    testimonialsSection: {
      eyebrow: L(fr.testimonials.eyebrow, en.testimonials.eyebrow),
      titleStart: L(fr.testimonials.titleStart, en.testimonials.titleStart),
      titleAccent: L(fr.testimonials.titleAccent, en.testimonials.titleAccent),
    },
    contactSection: {
      eyebrow: L(fr.contactSection.eyebrow, en.contactSection.eyebrow),
      titleStart: L(fr.contactSection.titleStart, en.contactSection.titleStart),
      titleAccent: L(fr.contactSection.titleAccent, en.contactSection.titleAccent),
      description: L(fr.contactSection.description, en.contactSection.description),
      meetingLink: L(fr.contactSection.meetingLink, en.contactSection.meetingLink),
    },
  };
}

export function buildAboutPageContent() {
  const prose = (blockFr, blockEn) => ({
    label: L(blockFr.label, blockEn.label),
    paragraphs: localizedList(blockFr.paragraphs, blockEn.paragraphs),
  });

  return {
    id: "aboutPage",
    hero: {
      title: L(fr.aboutPage.hero.title, en.aboutPage.hero.title),
      subtitle: L(fr.aboutPage.hero.subtitle, en.aboutPage.hero.subtitle),
    },
    image: null,
    imageAlt: L(fr.aboutPage.imageAlt, en.aboutPage.imageAlt),
    identity: {
      label: L(fr.aboutPage.identity.label, en.aboutPage.identity.label),
      greeting: L(fr.aboutPage.identity.greeting, en.aboutPage.identity.greeting),
      role: L(fr.aboutPage.identity.role, en.aboutPage.identity.role),
      paragraphs: localizedList(fr.aboutPage.identity.paragraphs, en.aboutPage.identity.paragraphs),
    },
    work: prose(fr.aboutPage.work, en.aboutPage.work),
    value: prose(fr.aboutPage.value, en.aboutPage.value),
    approach: prose(fr.aboutPage.approach, en.aboutPage.approach),
    closing: {
      paragraphs: localizedList(fr.aboutPage.closing.paragraphs, en.aboutPage.closing.paragraphs),
    },
    ctaBand: {
      title: L(fr.aboutPage.ctaBand.title, en.aboutPage.ctaBand.title),
      subtitle: L(fr.aboutPage.ctaBand.subtitle, en.aboutPage.ctaBand.subtitle),
      ctaPrimary: L(fr.aboutPage.ctaBand.ctaPrimary, en.aboutPage.ctaBand.ctaPrimary),
      ctaSecondary: L(fr.aboutPage.ctaBand.ctaSecondary, en.aboutPage.ctaBand.ctaSecondary),
    },
  };
}

export function buildCvPageContent() {
  const email = fr.cv.contacts.find((item) => item.label === "Email");
  const phone = fr.cv.contacts.find((item) => item.label === "Téléphone");
  const location = fr.cv.contacts.find((item) => item.label === "Localisation");
  const portfolio = fr.cv.contacts.find((item) => item.label === "Portfolio");
  const emailEn = en.cv.contacts.find((item) => item.label === "Email");
  const phoneEn = en.cv.contacts.find((item) => item.label === "Phone");
  const locationEn = en.cv.contacts.find((item) => item.label === "Location");
  const portfolioEn = en.cv.contacts.find((item) => item.label === "Portfolio");

  return {
    id: "cvPage",
    eyebrow: L(fr.cv.eyebrow, en.cv.eyebrow),
    firstName: "Carole",
    lastName: "Tonoukouen",
    role: L(fr.cv.role, en.cv.role),
    summary: L(fr.cv.summary, en.cv.summary),
    contacts: {
      email: email?.value ?? "",
      phone: phone?.value ?? "",
      location: L(location?.value ?? "", locationEn?.value ?? ""),
      portfolioLabel: L(portfolio?.value ?? "", portfolioEn?.value ?? ""),
      portfolioUrl: portfolio?.href ?? portfolioEn?.href ?? "",
    },
  };
}

export function buildSiteSettingsContent() {
  const siteDescription = L(
    "Portfolio de Carole Tonoukouen, chargée de communication digitale : stratégie éditoriale, contenus, campagnes et visibilité de marque.",
    "Portfolio of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
  );

  return {
    id: "siteSettings",
    title: L("Carole Tonoukouen", "Carole Tonoukouen"),
    description: siteDescription,
    siteUrl: "https://carole-portfolio.vercel.app",
    ogImage: null,
    seoPages: {
      home: {
        title: L("Carole Tonoukouen | Communication digitale", "Carole Tonoukouen | Digital communication"),
        description: siteDescription,
      },
      about: {
        title: L("À propos | Carole Tonoukouen", "About | Carole Tonoukouen"),
        description: L(
          "Découvrez le parcours de Carole Tonoukouen et son approche de la communication digitale claire, structurée et cohérente.",
          "Discover Carole Tonoukouen's background and approach to clear, structured, consistent digital communication.",
        ),
      },
      services: {
        title: L(
          "Services de communication digitale | Carole Tonoukouen",
          "Digital communication services | Carole Tonoukouen",
        ),
        description: L(
          "Stratégie éditoriale, campagnes digitales, création de contenus et audit de présence en ligne pour clarifier votre communication.",
          "Editorial strategy, digital campaigns, content creation, and online presence audits to clarify your communication.",
        ),
      },
      blog: {
        title: L("Blog communication digitale | Carole Tonoukouen", "Digital communication blog | Carole Tonoukouen"),
        description: L(
          "Articles et notes pratiques sur la ligne éditoriale, le calendrier de contenu, les réseaux sociaux et l'audit digital.",
          "Practical articles and notes on editorial direction, content calendars, social media, and digital audits.",
        ),
      },
      contact: {
        title: L("Contact | Carole Tonoukouen", "Contact | Carole Tonoukouen"),
        description: L(
          "Contactez Carole Tonoukouen pour échanger sur vos besoins en communication digitale, contenu et visibilité.",
          "Contact Carole Tonoukouen to discuss your digital communication, content, and visibility needs.",
        ),
      },
      cv: {
        title: L("CV | Carole Tonoukouen", "Resume | Carole Tonoukouen"),
        description: L(
          "CV de Carole Tonoukouen : expérience, compétences, formations et réalisations en communication digitale.",
          "Carole Tonoukouen resume: experience, skills, education, and digital communication achievements.",
        ),
      },
      carnetResources: {
        title: L("Ressources & communautés | Carole Tonoukouen", "Resources & communities | Carole Tonoukouen"),
        description: L(
          "Ressources, outils et communautés pour nourrir une pratique de communication digitale plus solide.",
          "Resources, tools, and communities for a stronger digital communication practice.",
        ),
      },
      carnetReadings: {
        title: L("Lectures & références | Carole Tonoukouen", "Readings & references | Carole Tonoukouen"),
        description: L(
          "Ouvrages, newsletters et références pour affiner le regard et nourrir la pratique éditoriale.",
          "Books, newsletters, and references to sharpen your editorial practice.",
        ),
      },
    },
    contactEmail: "caroletonoukouen@gmail.com",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  };
}

export function buildServices() {
  return fr.services.items.map((item, index) => {
    const enItem = en.services.items[index];
    return {
      slug: item.slug,
      title: L(item.title, enItem.title),
      accent: L(item.accent, enItem.accent),
      description: L(item.description, enItem.description),
      detailIntro: L(item.detailIntro, enItem.detailIntro),
      presentation: L(item.presentation, enItem.presentation),
      metricValue: item.metricValue,
      metricLabel: L(item.metricLabel, enItem.metricLabel),
      bullets: localizedList(item.bullets, enItem.bullets),
      whatIsIncluded: localizedList(item.whatIsIncluded, enItem.whatIsIncluded),
      targetAudience: localizedList(item.targetAudience, enItem.targetAudience),
      concreteApplications: localizedList(item.concreteApplications, enItem.concreteApplications),
      caseStudy: {
        title: L(item.projectTitle, enItem.projectTitle),
        description: L(item.projectDescription, enItem.projectDescription),
      },
    };
  });
}

export function buildTestimonials() {
  return fr.testimonials.items.map((item, index) => {
    const enItem = en.testimonials.items[index];
    const id = testimonialDocId(item.name);
    return {
      id,
      name: item.name,
      role: L(item.role, enItem.role),
      quote: L(item.quote, enItem.quote),
      portrait: TESTIMONIAL_PORTRAITS[id] ?? null,
    };
  });
}

export function buildBlogPosts() {
  return fr.blog.posts.map((post, index) => {
    const enPost = en.blog.posts[index];
    return {
      slug: post.slug,
      title: L(post.title, enPost.title),
      excerpt: L(post.excerpt, enPost.excerpt),
      category: L(post.category, enPost.category),
      publishedAt: BLOG_PUBLISHED_AT[post.slug] ?? "2026-05-01",
      readingTime: L(post.readingTime, enPost.readingTime),
      featured: post.featured ?? false,
      coverImage: BLOG_COVER_IMAGES[post.slug] ?? null,
      takeaways: localizedList(post.takeaways, enPost.takeaways),
      body: sectionsToBody(post.sections, enPost.sections),
    };
  });
}

function buildCarnetItem(itemFr, itemEn, slug) {
  return {
    slug,
    title: L(itemFr.title, itemEn.title),
    categories: itemFr.categories,
    description: L(itemFr.desc, itemEn.desc),
    url: itemFr.link,
    image: null,
  };
}

export function buildResources() {
  return fr.carnetPage.items
    .map((item, index) => ({ item, enItem: en.carnetPage.items[index] }))
    .filter(({ item }) => item.type === "Ressource")
    .map(({ item, enItem }) => buildCarnetItem(item, enItem, CARNET_SLUG_BY_LINK[item.link]));
}

export function buildCommunities() {
  return fr.carnetPage.items
    .map((item, index) => ({ item, enItem: en.carnetPage.items[index] }))
    .filter(({ item }) => item.type === "Communauté")
    .map(({ item, enItem }) => buildCarnetItem(item, enItem, CARNET_SLUG_BY_LINK[item.link]));
}

export function buildBooks() {
  const booksFr = fr.carnetPage.readingsSections[0].items;
  const booksEn = en.carnetPage.readingsSections[0].items;
  return booksFr.map((book, index) => {
    const enBook = booksEn[index];
    return {
      slug: BOOK_SLUG_BY_TITLE[book.title],
      title: L(book.title, enBook.title),
      author: book.author,
      date: book.date,
      description: L(book.desc, enBook.desc),
      url: book.link,
      image: null,
    };
  });
}

export function buildReferences() {
  const refsFr = fr.carnetPage.readingsSections[1].items;
  const refsEn = en.carnetPage.readingsSections[1].items;
  return refsFr.map((ref, index) => {
    const enRef = refsEn[index];
    return {
      slug: REFERENCE_SLUG_BY_TITLE[ref.title],
      title: L(ref.title, enRef.title),
      author: ref.author,
      typeLabel: L(index === 0 ? "Newsletter" : "Contenu cité", index === 0 ? "Newsletter" : "Cited content"),
      cardStyle: index === 1 ? "pinned" : "standard",
      description: L(ref.desc, enRef.desc),
      url: "",
      image: null,
    };
  });
}

export function buildCvEntries() {
  const entries = [];

  fr.cv.experiences.forEach((exp, index) => {
    const enExp = en.cv.experiences[index];
    entries.push({
      id: `exp-${slugify(exp.organization)}`,
      category: "experience",
      title: L(exp.title, enExp.title),
      organization: exp.organization,
      period: L(exp.period, enExp.period),
      highlights: localizedList(exp.bullets, enExp.bullets),
    });
  });

  fr.cv.sidebar.forEach((section, index) => {
    const enSection = en.cv.sidebar[index];
    const [first, ...rest] = section.items;
    const [enFirst, ...enRest] = enSection.items;
    entries.push({
      id: CV_SIDEBAR_IDS[index],
      category: CV_SIDEBAR_CATEGORIES[index],
      title: L(first, enFirst),
      highlights: localizedList(rest, enRest),
    });
  });

  return entries;
}

/** Singletons dont le texte doit suivre l'i18n à l'init et à la resync. */
export const i18nSingletons = {
  homePage: buildHomePageContent,
  aboutPage: buildAboutPageContent,
  cvPage: buildCvPageContent,
  siteSettings: buildSiteSettingsContent,
};

/** Collections éditoriales (slug ou id stable). */
export const i18nCollections = {
  service: { build: buildServices, matchKey: "slug" },
  testimonial: { build: buildTestimonials, matchKey: "id" },
  blogPost: { build: buildBlogPosts, matchKey: "slug" },
  resource: { build: buildResources, matchKey: "slug" },
  community: { build: buildCommunities, matchKey: "slug" },
  book: { build: buildBooks, matchKey: "slug" },
  reference: { build: buildReferences, matchKey: "slug" },
  cvEntry: { build: buildCvEntries, matchKey: "id" },
};

/** Types de collection où les slugs absents de l'i18n sont dépubliés. */
export const i18nOrphanDepublishTypes = new Set(["service", "blogPost", "cvEntry", "testimonial"]);
