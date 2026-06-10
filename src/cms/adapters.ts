import type { CmsBlogPost, CmsCvEntry, CmsService, CmsTestimonial } from "./types";
import { localized } from "./types";

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
