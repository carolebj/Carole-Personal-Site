import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { useCmsSingleton } from "../../cms/cmsContent";
import type { CmsSiteSettings } from "../../cms/types";
import { resolveSeoMeta } from "../seo/resolveSeo";
import { useSeoOverrideState } from "../seo/SeoOverrideContext";

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

function setOptionalMeta(name: string, content: string | undefined, attribute: "name" | "property" = "name") {
  if (!content) return;
  setMeta(name, content, attribute);
}

export default function Seo() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const override = useSeoOverrideState();
  const { data: siteSettings, usingCms } = useCmsSingleton<CmsSiteSettings | null>("siteSettings", null);

  const meta = useMemo(
    () =>
      resolveSeoMeta({
        pathname,
        locale: i18n.language,
        settings: siteSettings,
        usingCms,
        override,
      }),
    [pathname, i18n.language, siteSettings, usingCms, override],
  );

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Person",
      name: meta.siteName,
      url: meta.siteUrl,
      jobTitle: meta.lang === "fr" ? "Chargée de communication digitale" : "Digital communications officer",
      knowsAbout:
        meta.lang === "fr"
          ? ["Communication digitale", "Stratégie éditoriale", "Création de contenu", "SEO"]
          : ["Digital communication", "Editorial strategy", "Content creation", "SEO"],
    }),
    [meta.lang, meta.siteName, meta.siteUrl],
  );

  useEffect(() => {
    document.documentElement.lang = meta.lang;
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("og:type", meta.ogType, "property");
    setMeta("og:site_name", meta.siteName, "property");
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", meta.canonicalUrl, "property");
    setOptionalMeta("og:image", meta.ogImage, "property");
    setMeta("twitter:card", meta.ogImage ? "summary_large_image" : "summary");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setOptionalMeta("twitter:image", meta.ogImage);
    setCanonical(meta.canonicalUrl);

    let script = document.getElementById("portfolio-structured-data") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "portfolio-structured-data";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structuredData);
  }, [meta, structuredData]);

  return null;
}
