import type { PortableTextBlock } from "@portabletext/types";

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

export type CmsBlogPost = {
  slug: string;
  title: LocalizedValue;
  excerpt?: LocalizedValue;
  category?: LocalizedValue;
  publishedAt?: string;
  readingTime?: LocalizedValue;
  featured?: boolean;
  coverImage?: CmsImage;
  takeaways?: LocalizedValue[];
  body?: {
    fr?: PortableTextBlock[];
    en?: PortableTextBlock[];
  };
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
    body?: {
      fr?: PortableTextBlock[];
      en?: PortableTextBlock[];
    };
  };
  about?: {
    title?: LocalizedValue;
    accent?: LocalizedValue;
    body?: {
      fr?: PortableTextBlock[];
      en?: PortableTextBlock[];
    };
    image?: CmsImage;
  };
};

export function localized(value: LocalizedValue | undefined, locale: string, fallback = "") {
  if (!value) {
    return fallback;
  }

  const normalizedLocale: LocaleCode = locale.startsWith("en") ? "en" : "fr";
  return value[normalizedLocale] || value.fr || value.en || fallback;
}
