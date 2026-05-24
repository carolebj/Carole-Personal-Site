import type { PortableTextBlock } from "@portabletext/types";

export type LocaleCode = "fr" | "en";

export type LocalizedValue = {
  fr?: string;
  en?: string;
};

export type SanityImage = {
  asset?: {
    _ref?: string;
    url?: string;
  };
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
  coverImage?: SanityImage;
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
  portrait?: SanityImage;
};

export type CmsResource = {
  title: LocalizedValue;
  kind?: string;
  description?: LocalizedValue;
  url?: string;
  image?: SanityImage;
};

export type CmsCvEntry = {
  title: LocalizedValue;
  category: string;
  organization?: string;
  period?: LocalizedValue;
  description?: LocalizedValue;
  highlights?: LocalizedValue[];
};

export type CmsHomePage = {
  hero?: {
    eyebrow?: LocalizedValue;
    title?: LocalizedValue;
    accent?: LocalizedValue;
    description?: LocalizedValue;
    primaryCta?: LocalizedValue;
    secondaryCta?: LocalizedValue;
    portrait?: SanityImage;
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
    image?: SanityImage;
  };
};

export function localized(value: LocalizedValue | undefined, locale: string, fallback = "") {
  if (!value) {
    return fallback;
  }

  const normalizedLocale: LocaleCode = locale.startsWith("en") ? "en" : "fr";
  return value[normalizedLocale] || value.fr || value.en || fallback;
}
