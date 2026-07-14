import { cmsImageUrl } from "../../cms/cmsContent";
import type { CmsSiteSettings } from "../../cms/types";
import { localized } from "../../cms/types";
import { getFallbackSeo, pathnameToSeoPageKey, type SeoPageKey } from "./fallbackSeo";
import type { SeoOverride } from "./SeoOverrideContext";

const DEFAULT_SITE_NAME = "Carole Tonoukouen";
const DEFAULT_SITE_URL = "https://www.carolebj.com";
const DEFAULT_SOCIAL_IMAGE = "/carole-tonoukouen-social-preview.png";

export function resolveSiteUrl(settings: CmsSiteSettings | null | undefined) {
  const fromCms = settings?.siteUrl?.trim();
  if (fromCms) return fromCms.replace(/\/$/, "");

  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_SITE_URL;
}

export function toAbsoluteUrl(url: string | undefined, siteUrl: string) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function resolveSeoMeta({
  pathname,
  locale,
  settings,
  usingCms,
  override,
}: {
  pathname: string;
  locale: string;
  settings: CmsSiteSettings | null | undefined;
  usingCms: boolean;
  override: SeoOverride | null;
}) {
  const lang = locale.startsWith("en") ? "en" : "fr";
  const fallback = getFallbackSeo(pathname, lang);
  const pageKey = pathnameToSeoPageKey(pathname);
  const siteName =
    usingCms && settings?.title ? localized(settings.title, locale, DEFAULT_SITE_NAME) : DEFAULT_SITE_NAME;
  const siteUrl = resolveSiteUrl(settings);

  let title = fallback.title;
  let description = fallback.description;

  if (usingCms && pageKey) {
    const pageMeta = settings?.seoPages?.[pageKey];
    if (pageMeta?.title) title = localized(pageMeta.title, locale, title);
    if (pageMeta?.description) description = localized(pageMeta.description, locale, description);
  }

  if (override?.title) title = override.title;
  if (override?.description) description = override.description;

  const canonicalUrl = `${siteUrl}${pathname === "/" ? "/" : pathname}`;
  const ogImage =
    toAbsoluteUrl(override?.image, siteUrl) ??
    toAbsoluteUrl(cmsImageUrl(settings?.ogImage), siteUrl) ??
    toAbsoluteUrl(DEFAULT_SOCIAL_IMAGE, siteUrl);
  const ogImageAlt =
    override?.title ??
    (lang === "fr"
      ? "Carole Tonoukouen, chargée de communication digitale"
      : "Carole Tonoukouen, digital communications officer");
  const usesDefaultSocialImage = ogImage?.endsWith("/carole-tonoukouen-social-preview.png") ?? false;

  return {
    lang,
    title,
    description,
    siteName,
    siteUrl,
    canonicalUrl,
    ogImage,
    ogImageAlt,
    ogImageType: usesDefaultSocialImage ? "image/png" : undefined,
    ogImageWidth: usesDefaultSocialImage ? "1200" : undefined,
    ogImageHeight: usesDefaultSocialImage ? "630" : undefined,
    ogType: override?.ogType ?? "website",
    pageKey: pageKey as SeoPageKey | null,
  };
}
