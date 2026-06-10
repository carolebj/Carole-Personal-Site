export type LocaleCode = "fr" | "en";

export type LocalizedValue = {
  fr?: string;
  en?: string;
};

// Dashboard-managed image: a flat public URL (Supabase Storage) + alt text.
export type CmsImage = {
  url?: string;
  alt?: LocalizedValue;
};

export type CmsService = {
  slug: string;
  title: LocalizedValue;
  accent?: LocalizedValue;
  description?: LocalizedValue;
  detailIntro?: LocalizedValue;
  presentation?: LocalizedValue;
  metricValue?: string;
  metricLabel?: LocalizedValue;
  bullets?: LocalizedValue[];
  whatIsIncluded?: LocalizedValue[];
  targetAudience?: LocalizedValue[];
  concreteApplications?: LocalizedValue[];
  caseStudy?: {
    title?: LocalizedValue;
    description?: LocalizedValue;
  };
};

export type PublishStatus = "draft" | "published";

export type CmsBlogPost = {
  slug: string;
  title: LocalizedValue;
  excerpt?: LocalizedValue;
  category?: LocalizedValue;
  publishedAt?: string;
  // Editorial state. Missing/undefined is treated as published for backward
  // compatibility with content seeded before drafts existed.
  status?: PublishStatus;
  readingTime?: LocalizedValue;
  featured?: boolean;
  coverImage?: CmsImage;
  takeaways?: LocalizedValue[];
  // Plain-text body (paragraphs separated by blank lines), localized.
  body?: LocalizedValue;
};

export type CmsTestimonial = {
  quote: LocalizedValue;
  name: string;
  role?: LocalizedValue;
  portrait?: CmsImage;
};

export type CmsResource = {
  title: LocalizedValue;
  kind?: string;
  categories?: string[];
  description?: LocalizedValue;
  url?: string;
  image?: CmsImage;
};

export type CmsReading = {
  title: LocalizedValue;
  format?: string;
  author?: string;
  date?: string;
  description?: LocalizedValue;
  url?: string;
  image?: CmsImage;
};

export type CmsCvEntry = {
  title: LocalizedValue;
  category: string;
  organization?: string;
  period?: LocalizedValue;
  description?: LocalizedValue;
  highlights?: LocalizedValue[];
};

export type CmsSiteSettings = {
  title?: LocalizedValue;
  description?: LocalizedValue;
  contactEmail?: string;
  socialLinks?: Array<{
    label?: string;
    url?: string;
  }>;
};

export type CmsHomePage = {
  hero?: {
    eyebrow?: LocalizedValue;
    title?: LocalizedValue;
    accent?: LocalizedValue;
    titleEnd?: LocalizedValue;
    description?: LocalizedValue;
    primaryCta?: LocalizedValue;
    secondaryCta?: LocalizedValue;
    portrait?: CmsImage;
  };
  manifesto?: {
    title?: LocalizedValue;
    accent?: LocalizedValue;
    body?: LocalizedValue;
  };
  about?: {
    title?: LocalizedValue;
    accent?: LocalizedValue;
    body?: LocalizedValue;
    image?: CmsImage;
  };
};

// A post is public unless explicitly marked as a draft. Content seeded before
// drafts existed has no `status` and must stay visible.
export function isPublishedPost(post: { status?: string } | null | undefined): boolean {
  return post?.status !== "draft";
}

export function localized(value: LocalizedValue | undefined, locale: string, fallback = "") {
  if (!value) {
    return fallback;
  }

  const normalizedLocale: LocaleCode = locale.startsWith("en") ? "en" : "fr";
  return value[normalizedLocale] || value.fr || value.en || fallback;
}
