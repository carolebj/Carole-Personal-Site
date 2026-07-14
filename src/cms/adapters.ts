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
  if (!usingCms) return fallback;

  return {
    label: localized(section?.label, locale),
    paragraphs: localizedListItems(section?.paragraphs, locale),
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
    support: { label: string; paragraphs: string[] };
    value: { label: string; paragraphs: string[] };
    closing: { paragraphs: string[] };
    ctaBand: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  },
) {
  if (!usingCms) return fallback;

  return {
    hero: {
      title: localized(cms?.hero?.title, locale),
      subtitle: localized(cms?.hero?.subtitle, locale),
    },
    imageAlt: localized(cms?.imageAlt, locale),
    identity: {
      label: localized(cms?.identity?.label, locale),
      greeting: localized(cms?.identity?.greeting, locale),
      role: localized(cms?.identity?.role, locale),
      paragraphs: localizedListItems(cms?.identity?.paragraphs, locale),
    },
    support: cmsProseBlock(cms?.support, locale, usingCms, fallback.support),
    value: cmsProseBlock(cms?.value, locale, usingCms, fallback.value),
    closing: {
      paragraphs: localizedListItems(cms?.closing?.paragraphs, locale),
    },
    ctaBand: {
      title: localized(cms?.ctaBand?.title, locale),
      subtitle: localized(cms?.ctaBand?.subtitle, locale),
      ctaPrimary: localized(cms?.ctaBand?.ctaPrimary, locale),
      ctaSecondary: localized(cms?.ctaBand?.ctaSecondary, locale),
    },
  };
}

export function toCvHeaderViewModel(
  cms: CmsCvPage | null | undefined,
  locale: string,
  usingCms: boolean,
  fallback: { eyebrow: string; firstName: string; lastName: string; role: string; summary: string },
) {
  if (!usingCms) return fallback;

  return {
    eyebrow: localized(cms?.eyebrow, locale),
    firstName: cms?.firstName ?? "",
    lastName: cms?.lastName ?? "",
    role: localized(cms?.role, locale),
    summary: localized(cms?.summary, locale),
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
  const categoryItems = (category: string) =>
    entries
      .filter((entry) => entry.category === category)
      .flatMap((entry) => [
        localized(entry.title, locale),
        ...(entry.highlights?.map((item) => localized(item, locale)).filter(Boolean) ?? []),
      ])
      .filter(Boolean);

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
      title: locale.startsWith("en") ? "Education" : "Formation",
      items: categoryItems("education"),
    },
    {
      title: locale.startsWith("en") ? "Skills" : "Compétences",
      items: categoryItems("skill"),
    },
    {
      title: locale.startsWith("en") ? "Selected achievements" : "Réalisations marquantes",
      items: categoryItems("achievement"),
    },
    {
      title: locale.startsWith("en") ? "Languages" : "Langues parlées",
      items: categoryItems("language"),
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
