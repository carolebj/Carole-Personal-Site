import type {
  CmsAboutPage,
  CmsBlogPost,
  CmsCvEntry,
  CmsCvPage,
  CmsProseBlock,
  CmsService,
  CmsTestimonial,
  LocalizedValue,
} from "./types";
import { localized } from "./types";

export function localizedListItems(items: LocalizedValue[] | undefined, locale: string) {
  return items?.map((item) => localized(item, locale)).filter(Boolean) ?? [];
}

function cmsProseBlock(
  section: CmsProseBlock | undefined,
  locale: string,
  usingCms: boolean,
  fallback: { label: string; paragraphs: string[] },
) {
  return {
    label: usingCms && section?.label ? localized(section.label, locale) : fallback.label,
    paragraphs:
      usingCms && section?.paragraphs?.length
        ? localizedListItems(section.paragraphs, locale)
        : fallback.paragraphs,
  };
}

export function toAboutPageViewModel(
  cms: CmsAboutPage | null | undefined,
  locale: string,
  usingCms: boolean,
  fallback: {
    hero: { title: string; subtitle: string };
    imageAlt: string;
    identity: { label: string; greeting: string; role: string; paragraphs: string[] };
    work: { label: string; paragraphs: string[] };
    value: { label: string; paragraphs: string[] };
    approach: { label: string; paragraphs: string[] };
    closing: { paragraphs: string[] };
    ctaBand: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  },
) {
  return {
    hero: {
      title: usingCms && cms?.hero?.title ? localized(cms.hero.title, locale) : fallback.hero.title,
      subtitle:
        usingCms && cms?.hero?.subtitle ? localized(cms.hero.subtitle, locale) : fallback.hero.subtitle,
    },
    imageAlt: usingCms && cms?.imageAlt ? localized(cms.imageAlt, locale) : fallback.imageAlt,
    identity: {
      label: usingCms && cms?.identity?.label ? localized(cms.identity.label, locale) : fallback.identity.label,
      greeting:
        usingCms && cms?.identity?.greeting
          ? localized(cms.identity.greeting, locale)
          : fallback.identity.greeting,
      role: usingCms && cms?.identity?.role ? localized(cms.identity.role, locale) : fallback.identity.role,
      paragraphs:
        usingCms && cms?.identity?.paragraphs?.length
          ? localizedListItems(cms.identity.paragraphs, locale)
          : fallback.identity.paragraphs,
    },
    work: cmsProseBlock(cms?.work, locale, usingCms, fallback.work),
    value: cmsProseBlock(cms?.value, locale, usingCms, fallback.value),
    approach: cmsProseBlock(cms?.approach, locale, usingCms, fallback.approach),
    closing: {
      paragraphs:
        usingCms && cms?.closing?.paragraphs?.length
          ? localizedListItems(cms.closing.paragraphs, locale)
          : fallback.closing.paragraphs,
    },
    ctaBand: {
      title: usingCms && cms?.ctaBand?.title ? localized(cms.ctaBand.title, locale) : fallback.ctaBand.title,
      subtitle:
        usingCms && cms?.ctaBand?.subtitle ? localized(cms.ctaBand.subtitle, locale) : fallback.ctaBand.subtitle,
      ctaPrimary:
        usingCms && cms?.ctaBand?.ctaPrimary
          ? localized(cms.ctaBand.ctaPrimary, locale)
          : fallback.ctaBand.ctaPrimary,
      ctaSecondary:
        usingCms && cms?.ctaBand?.ctaSecondary
          ? localized(cms.ctaBand.ctaSecondary, locale)
          : fallback.ctaBand.ctaSecondary,
    },
  };
}

export function toCvHeaderViewModel(
  cms: CmsCvPage | null | undefined,
  locale: string,
  usingCms: boolean,
  fallback: { eyebrow: string; firstName: string; lastName: string; role: string; summary: string },
) {
  return {
    eyebrow: usingCms && cms?.eyebrow ? localized(cms.eyebrow, locale) : fallback.eyebrow,
    firstName: usingCms && cms?.firstName ? cms.firstName : fallback.firstName,
    lastName: usingCms && cms?.lastName ? cms.lastName : fallback.lastName,
    role: usingCms && cms?.role ? localized(cms.role, locale) : fallback.role,
    summary: usingCms && cms?.summary ? localized(cms.summary, locale) : fallback.summary,
  };
}

export function toServiceViewModel(service: CmsService, locale: string) {
  const bullets = service.bullets?.map((item) => localized(item, locale)).filter(Boolean) ?? [];
  const whatIsIncluded = service.whatIsIncluded?.map((item) => localized(item, locale)).filter(Boolean);
  const targetAudience = service.targetAudience?.map((item) => localized(item, locale)).filter(Boolean);
  const concreteApplications = service.concreteApplications?.map((item) => localized(item, locale)).filter(Boolean);

  return {
    slug: service.slug,
    title: localized(service.title, locale),
    accent: localized(service.accent, locale),
    description: localized(service.description, locale),
    menuDescription: localized(service.description, locale),
    detailIntro: localized(service.detailIntro, locale, localized(service.description, locale)),
    metricValue: service.metricValue ?? "",
    metricLabel: localized(service.metricLabel, locale),
    projectTitle: localized(service.caseStudy?.title, locale),
    projectDescription: localized(service.caseStudy?.description, locale),
    bullets,
    presentation: localized(service.presentation, locale),
    whatIsIncluded,
    targetAudience,
    concreteApplications,
  };
}

export function toBlogPostViewModel(post: CmsBlogPost, locale: string) {
  const publishedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale.startsWith("en") ? "en" : "fr", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(post.publishedAt))
    : "";

  return {
    slug: post.slug,
    title: localized(post.title, locale),
    excerpt: localized(post.excerpt, locale),
    category: localized(post.category, locale),
    date: publishedDate,
    readingTime: localized(post.readingTime, locale),
    featured: post.featured,
    takeaways: post.takeaways?.map((item) => localized(item, locale)).filter(Boolean) ?? [],
    sections: [],
    body: localized(post.body, locale),
    coverImage: post.coverImage,
  };
}

export function toCvViewModel(entries: CmsCvEntry[], locale: string) {
  const experiences = entries
    .filter((e) => e.category === "experience")
    .map((e) => ({
      title: localized(e.title, locale),
      organization: e.organization ?? "",
      period: localized(e.period, locale),
      bullets: e.highlights?.map((h) => localized(h, locale)).filter(Boolean) ?? [],
    }));

  const sidebar = [
    {
      title: "Compétences",
      items: entries
        .filter((e) => e.category === "skill")
        .map((e) => localized(e.title, locale)),
    },
    {
      title: "Langues",
      items: entries
        .filter((e) => e.category === "language")
        .map((e) => localized(e.title, locale)),
    },
    {
      title: "Réalisations",
      items: entries
        .filter((e) => e.category === "achievement")
        .map((e) => localized(e.title, locale)),
    },
    {
      title: "Formation",
      items: entries
        .filter((e) => e.category === "education")
        .map((e) => localized(e.title, locale)),
    },
  ].filter((s) => s.items.length > 0);

  return { experiences, sidebar };
}

export function toTestimonialViewModel(testimonial: CmsTestimonial, locale: string) {
  return {
    quote: localized(testimonial.quote, locale),
    name: testimonial.name,
    role: localized(testimonial.role, locale),
    portrait: testimonial.portrait,
  };
}
