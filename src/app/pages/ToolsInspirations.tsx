import type React from "react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { localized } from "../../cms/types";
import { resourcesQuery } from "../../cms/queries";
import type { CmsResource } from "../../cms/types";
import { useSanityQuery } from "../../cms/useSanityQuery";

type ResourceItem = {
  title: string;
  category: string;
  desc: string;
  link: string;
  badge: string;
};

type CarnetPageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyState: string;
  categories: string[];
  items: ResourceItem[];
};

function ResourceCard({
  item,
  index,
  linkLabel,
}: {
  item: CarnetPageContent["items"][number];
  index: number;
  linkLabel: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: [0.16, 1, 0.3, 1] }}
      className="[perspective:1000px]"
      tabIndex={0}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setIsFlipped((current) => !current);
        }
      }}
    >
      <div
        className={`relative min-h-[15.5rem] rounded-lg border border-[#EAEAEA] bg-white transition duration-700 [transform-style:preserve-3d] dark:border-white/10 dark:bg-[#171312] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 rounded-lg bg-white p-5 text-[#22201f] [backface-visibility:hidden] [transform:rotateY(0deg)] dark:bg-[#171312] dark:text-[#f8f1ec]">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-5">
              <span className="rounded-full bg-[#FDEBEC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#9F2F2D] dark:bg-[#3a2225] dark:text-[#f0adc4]">
                {item.badge}
              </span>
              <span className="font-mono text-[12px] text-[#787774]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-9 font-serif text-[28px] leading-[32px] tracking-[-0.02em]">
              {item.title}
            </h2>
            <p className="mt-auto border-t border-[#EAEAEA] pt-5 text-[12px] font-semibold uppercase tracking-[1.4px] text-[#787774] dark:border-white/10 dark:text-[#cdb9ae]">
              {item.category}
            </p>
          </div>
        </div>

        <div className="absolute inset-0 rounded-lg bg-[#F9F9F8] p-5 text-[#22201f] [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-[#1d1817] dark:text-[#f8f1ec]">
          <div className="flex h-full flex-col">
            <p className="text-[14px] leading-6 text-[#5d5a56] dark:text-[#dbc9c0]">
              {item.desc}
            </p>
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="mt-auto inline-flex w-fit items-center whitespace-nowrap rounded-md border border-[#EAEAEA] bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-[#22201f] transition hover:border-[#22201f] active:scale-[0.98] dark:border-white/10 dark:bg-[#171312] dark:text-[#f8f1ec] dark:hover:border-white/40"
            >
              {linkLabel}
              <span className="ml-2" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function ToolsInspirations() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: cmsResources } = useSanityQuery(resourcesQuery, [] as CmsResource[]);

  const content = useMemo((): CarnetPageContent => {
    if (cmsResources.length > 0) {
      const langPrefix = locale.startsWith("en") ? "en" : "fr";
      const kindLabels: Record<string, string> = langPrefix === "en"
        ? { platform: "Platform", tool: "Tool", campaign: "Campaign", community: "Community", reading: "Reading", reference: "Reference" }
        : { platform: "Plateforme", tool: "Outil", campaign: "Campagne", community: "Communauté", reading: "Lecture", reference: "Référence" };
      const items: ResourceItem[] = cmsResources.map((r) => ({
        title: localized(r.title, locale),
        category: r.kind ?? "",
        desc: localized(r.description, locale),
        link: r.url ?? "",
        badge: r.kind ? (kindLabels[r.kind] ?? r.kind) : "",
      }));
      const categories = [langPrefix === "en" ? "All" : "Tout", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
      const fallback = t("carnetPage", { returnObjects: true }) as CarnetPageContent;
      return {
        eyebrow: fallback.eyebrow,
        title: fallback.title,
        subtitle: fallback.subtitle,
        searchPlaceholder: fallback.searchPlaceholder,
        emptyState: fallback.emptyState,
        categories,
        items,
      };
    }
    return t("carnetPage", { returnObjects: true }) as CarnetPageContent;
  }, [cmsResources, locale, t]);

  const [activeCategory, setActiveCategory] = useState(content.categories[0]);
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return content.items.filter((item) => {
      const matchesCategory = activeCategory === content.categories[0] || item.category === activeCategory;
      const matchesSearch = !query || `${item.title} ${item.category} ${item.desc}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, content.categories, content.items, search]);
  const resultLabel =
    i18n.language === "fr"
      ? `${filteredItems.length} ressource${filteredItems.length > 1 ? "s" : ""}`
      : `${filteredItems.length} resource${filteredItems.length > 1 ? "s" : ""}`;
  const linkLabel = i18n.language === "fr" ? "Ouvrir la ressource" : "Open resource";

  return (
    <main className="min-h-[70vh] bg-[#FBFBFA] px-5 pb-28 pt-32 text-[#22201f] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <section className="mx-auto max-w-[1060px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#787774] dark:text-[#cdb9ae]">
            {content.eyebrow}
          </p>
          <h1 className="mx-auto mt-5 max-w-[780px] font-serif text-[52px] leading-[56px] tracking-[-0.03em] md:text-[78px] md:leading-[78px]">
            {content.title}
          </h1>
          <p className="mx-auto mt-7 max-w-[660px] text-[18px] leading-8 text-[#5d5a56] dark:text-[#dbc9c0]">
            {content.subtitle}
          </p>
        </motion.div>

        <motion.div
          layout
          className="mx-auto mt-12 max-w-[900px]"
        >
          <label className="relative block border-b border-[#EAEAEA] pb-3 text-left dark:border-white/10">
            <span className="sr-only">Recherche</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 font-serif text-[24px] text-[#787774]" aria-hidden="true">
              /
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full bg-transparent pl-8 pr-0 text-[16px] text-[#22201f] outline-none placeholder:text-[#787774] dark:text-[#f8f1ec] dark:placeholder:text-[#cdb9ae]/68 sm:pr-24"
              placeholder={content.searchPlaceholder}
            />
            <span className="mt-2 block font-mono text-[12px] uppercase tracking-[1px] text-[#787774] sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
              {resultLabel}
            </span>
          </label>

          <div className="mt-5 flex justify-start gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {content.categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`h-9 min-w-[3.35rem] shrink-0 whitespace-nowrap rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[1.1px] transition active:scale-[0.98] ${
                    isActive
                      ? "bg-[#22201f] text-white dark:bg-[#f8f1ec] dark:text-[#171312]"
                      : "border border-[#EAEAEA] bg-transparent text-[#5d5a56] hover:border-[#22201f] hover:text-[#22201f] dark:border-white/10 dark:text-[#dbc9c0] dark:hover:border-white/40 dark:hover:text-[#f8f1ec]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mt-14 grid max-w-[1180px] gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => (
          <ResourceCard key={item.title} item={item} index={index} linkLabel={linkLabel} />
        ))}
      </section>

      {filteredItems.length === 0 ? (
        <div className="mx-auto mt-10 max-w-[760px] border-t border-[#EAEAEA] pt-8 text-center text-[#5d5a56] dark:border-white/10 dark:text-[#dbc9c0]">
          {content.emptyState}
        </div>
      ) : null}
    </main>
  );
}
