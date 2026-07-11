import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CmsResource } from "../../cms/types";
import { localized } from "../../cms/types";
import { useCmsCollection } from "../../cms/cmsContent";
import { PageHero } from "../components/PageHero";
import { PAGE_MAIN_SPACIOUS } from "../components/layout/publicPage";
import calendrierCm229Image from "../../assets/resources/calendrier-cm229.webp";
import laveiyeImage from "../../assets/resources/laveiye.webp";
import leDepotImage from "../../assets/resources/le-depot.webp";
import socialMediaRoomImage from "../../assets/resources/social-media-room.webp";
import womenInTechBeninImage from "../../assets/resources/women-in-tech-benin.webp";
import womenTechmakersImage from "../../assets/resources/women-techmakers-abomey-calavi.webp";

type ResourceItem = {
  title: string;
  type: string;
  categories: string[];
  desc: string;
  link: string;
  imageUrl?: string;
};

type CarnetPageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyState: string;
  typeFilterLabel: string;
  typeFilters: string[];
  categories: string[];
  items: ResourceItem[];
};

function TypeScopeSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 text-left">
      <p
        id={labelId}
        className="mb-2 text-[11px] font-semibold uppercase tracking-[1.4px] text-text-muted dark:text-text-muted"
      >
        {label}
      </p>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 min-w-[12.5rem] items-center justify-between gap-3 rounded-lg border bg-white px-3.5 text-left transition dark:bg-[#1c1917] ${
          open
            ? "border-[#22201f] ring-2 ring-[#22201f]/8 dark:border-[#f8f1ec]/40 dark:ring-white/10"
            : "border-[#E4E1DE] hover:border-[#22201f] dark:border-white/15 dark:hover:border-white/35"
        }`}
      >
        <span className="truncate text-[14px] font-medium leading-none text-text-primary dark:text-text-primary">
          {value}
        </span>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f5f3f1] transition dark:bg-white/8 ${open ? "bg-[#ebe8e5] dark:bg-white/12" : ""}`}
          aria-hidden="true"
        >
          <ChevronDownIcon
            className={`size-4 text-text-secondary transition-transform duration-200 dark:text-text-secondary ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 top-full z-30 mt-2 min-w-[12.5rem] overflow-hidden rounded-lg border border-border-subtle bg-white py-1.5 shadow-[0_12px_40px_rgba(28,27,27,0.12)] dark:border-white/10 dark:bg-[#1c1917] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between gap-3 rounded-md px-2.5 py-2.5 text-left text-[14px] transition ${
                    isSelected
                      ? "bg-[#22201f] font-medium text-white dark:bg-[#f8f1ec] dark:text-[#171312]"
                      : "text-text-secondary hover:bg-[#f5f3f1] hover:text-text-primary dark:text-text-secondary dark:hover:bg-white/6 dark:hover:text-[#f8f1ec]"
                  }`}
                >
                  <span>{option}</span>
                  {isSelected ? <CheckIcon className="size-4 shrink-0 opacity-90" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

const resourceImages: Record<string, string> = {
  "LE DÉPÔT": leDepotImage,
  LAVEIYE: laveiyeImage,
  "Calendrier du CM 229": calendrierCm229Image,
  "Social Media Room": socialMediaRoomImage,
  "WOMEN IN TECH BENIN": womenInTechBeninImage,
  "Women Techmakers Abomey-Calavi": womenTechmakersImage,
};

const motionProps = (index: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.42, delay: index * 0.055, ease: [0.16, 1, 0.3, 1] as const },
});

function ResourceCard({
  item,
  index,
  linkLabel,
  overviewLabel,
}: {
  item: ResourceItem;
  index: number;
  linkLabel: string;
  overviewLabel: string;
}) {
  const imageUrl = item.imageUrl || resourceImages[item.title] || leDepotImage;
  const [isEngaged, setIsEngaged] = useState(false);

  return (
    <motion.a
      {...motionProps(index)}
      href={item.link}
      target="_blank"
      rel="noreferrer"
      aria-label={`${item.title} — ${linkLabel}`}
      onMouseEnter={() => setIsEngaged(true)}
      onMouseLeave={() => setIsEngaged(false)}
      onFocus={() => setIsEngaged(true)}
      onBlur={() => setIsEngaged(false)}
      className="group relative block h-full min-h-[24rem] w-full overflow-hidden rounded-xl border border-border-subtle bg-[#1c1b1b] shadow-[0_14px_38px_rgba(58,42,35,0.10)] outline-none transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/30 hover:shadow-[0_24px_60px_rgba(58,42,35,0.18)] focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-4 motion-reduce:transition-none dark:border-white/10 dark:focus-visible:ring-offset-[#171312]"
    >
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:scale-[1.025] [@media(hover:hover)]:group-hover:blur-[4px] [@media(hover:hover)]:group-hover:brightness-[0.48] group-focus-visible:scale-[1.025] group-focus-visible:blur-[4px] group-focus-visible:brightness-[0.48] motion-reduce:transition-none"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#151313]/90 via-[#151313]/12 to-transparent transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:bg-[#151313]/62 group-focus-visible:bg-[#151313]/62 motion-reduce:transition-none" />

      <div className="relative flex h-full min-h-[24rem] flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-10 w-fit items-center justify-center rounded-full border border-white/50 bg-black/20 px-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/95 backdrop-blur-sm">
            {item.type}
          </span>
          <span className="flex size-10 items-center justify-center rounded-full border border-white/55 bg-black/16 text-white backdrop-blur-sm transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-0.5 [@media(hover:hover)]:group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5" aria-hidden="true">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </div>

        <div className="absolute inset-x-6 bottom-6">
          <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:-translate-y-[9.25rem] group-focus-visible:-translate-y-[9.25rem] [@media(hover:none)]:-translate-y-[9.25rem] motion-reduce:transition-none">
            <h3 className="line-clamp-2 font-serif text-[1.7rem] font-bold leading-[1.02] tracking-[-0.02em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:text-[1.95rem]">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-1 text-sm font-medium text-white/88 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">{item.categories[0]}</p>
          </div>

          <div
            data-open={isEngaged ? "true" : "false"}
            className="t-panel-slide resource-card__overview absolute inset-x-0 bottom-0 border-t border-white/30 pt-4 [--panel-translate-y:24px]"
          >
            <h4 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-white/90">
              {overviewLabel}
            </h4>
            <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-white/82">
              {item.desc}
            </p>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export default function ToolsInspirations() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  // Resources and communities are stored as two distinct types in the dashboard.
  // The type label (Ressource / Communauté) is inferred from the collection name.
  const { data: cmsResourceItems, usingCms: usingCmsResources } = useCmsCollection("resource", [] as CmsResource[]);
  const { data: cmsCommunityItems, usingCms: usingCmsCommunities } = useCmsCollection("community", [] as CmsResource[]);

  const content = useMemo((): CarnetPageContent => {
    const usingCms = usingCmsResources || usingCmsCommunities;
    if (usingCms) {
      const langPrefix = locale.startsWith("en") ? "en" : "fr";
      const typeLabel = (isCommunity: boolean) =>
        isCommunity
          ? langPrefix === "en" ? "Community" : "Communauté"
          : langPrefix === "en" ? "Resource" : "Ressource";

      const toItem = (r: CmsResource, isCommunity: boolean): ResourceItem => {
        const title = localized(r.title, locale);
        return {
          title,
          type: typeLabel(isCommunity),
          categories: Array.isArray(r.categories) ? r.categories : [],
          desc: localized(r.description, locale),
          link: r.url ?? "",
          imageUrl: r.image?.url || resourceImages[title] || undefined,
        };
      };

      const items: ResourceItem[] = [
        ...cmsResourceItems.map((r) => toItem(r, false)),
        ...cmsCommunityItems.map((r) => toItem(r, true)),
      ];
      const categories = [langPrefix === "en" ? "All" : "Tout", ...Array.from(new Set(items.flatMap((i) => i.categories).filter(Boolean)))];
      const typeFilters = [langPrefix === "en" ? "All" : "Tous", ...Array.from(new Set(items.map((i) => i.type).filter(Boolean)))];
      const fallback = t("carnetPage", { returnObjects: true }) as CarnetPageContent;
      return {
        eyebrow: fallback.eyebrow,
        title: fallback.title,
        subtitle: fallback.subtitle,
        searchPlaceholder: fallback.searchPlaceholder,
        emptyState: fallback.emptyState,
        typeFilterLabel: fallback.typeFilterLabel,
        typeFilters,
        categories,
        items,
      };
    }
    return t("carnetPage", { returnObjects: true }) as CarnetPageContent;
  }, [cmsResourceItems, cmsCommunityItems, usingCmsResources, usingCmsCommunities, locale, t]);

  const typeFilters = content.typeFilters;
  const categoryFilters = content.categories;
  const allTypesLabel = typeFilters[0];
  const allCategoriesLabel = categoryFilters[0];

  const [activeTypeFilter, setActiveTypeFilter] = useState(allTypesLabel);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(allCategoriesLabel);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!typeFilters.includes(activeTypeFilter)) {
      setActiveTypeFilter(allTypesLabel);
    }
  }, [activeTypeFilter, allTypesLabel, typeFilters]);

  const itemsInTypeScope = useMemo(() => {
    return content.items.filter(
      (item) => activeTypeFilter === allTypesLabel || item.type === activeTypeFilter,
    );
  }, [activeTypeFilter, allTypesLabel, content.items]);

  const availableCategoryFilters = useMemo(() => {
    const categoriesWithItems = new Set<string>();
    for (const item of itemsInTypeScope) {
      for (const category of item.categories) {
        categoriesWithItems.add(category);
      }
    }
    return [
      allCategoriesLabel,
      ...categoryFilters.slice(1).filter((category) => categoriesWithItems.has(category)),
    ];
  }, [allCategoriesLabel, categoryFilters, itemsInTypeScope]);

  useEffect(() => {
    if (!availableCategoryFilters.includes(activeCategoryFilter)) {
      setActiveCategoryFilter(allCategoriesLabel);
    }
  }, [activeCategoryFilter, allCategoriesLabel, availableCategoryFilters]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return content.items.filter((item) => {
      const matchesType =
        activeTypeFilter === allTypesLabel || item.type === activeTypeFilter;
      const matchesCategory =
        activeCategoryFilter === allCategoriesLabel ||
        item.categories.includes(activeCategoryFilter);
      const matchesSearch =
        !query ||
        `${item.title} ${item.type} ${item.categories.join(" ")} ${item.desc}`
          .toLowerCase()
          .includes(query);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [
    activeCategoryFilter,
    activeTypeFilter,
    allCategoriesLabel,
    allTypesLabel,
    content.items,
    search,
  ]);
  const resultLabel =
    i18n.language === "fr"
      ? `${filteredItems.length} ressource${filteredItems.length > 1 ? "s" : ""}`
      : `${filteredItems.length} resource${filteredItems.length > 1 ? "s" : ""}`;
  const linkLabel = i18n.language === "fr" ? "Ouvrir la ressource" : "Open resource";
  const overviewLabel = i18n.language === "fr" ? "À propos" : "About";

  return (
    <main className={PAGE_MAIN_SPACIOUS}>
      <section className="mx-auto max-w-[1060px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <PageHero
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            align="center"
            eyebrowTone="muted"
            titleClassName="mx-auto max-w-[780px] text-[52px] leading-[56px] tracking-[-0.03em] md:text-[78px] md:leading-[78px]"
            subtitleClassName="mt-7 max-w-[660px]"
          />
        </motion.div>

        <motion.div className="mx-auto mt-12 max-w-[900px]">
          <label className="relative block border-b border-border-subtle pb-3 text-left dark:border-white/10">
            <span className="sr-only">Recherche</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 font-serif text-[24px] text-text-muted" aria-hidden="true">
              /
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="public-input h-12 w-full border-transparent bg-transparent pl-8 pr-0 text-[16px] text-text-primary placeholder:text-text-muted dark:text-text-primary dark:placeholder:text-[#cdb9ae]/68 sm:pr-24"
              placeholder={content.searchPlaceholder}
            />
            <span className="mt-2 block font-mono text-[12px] uppercase tracking-[1px] text-text-muted sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
              {resultLabel}
            </span>
          </label>

          <div className="mt-5 flex flex-wrap items-end gap-3 px-2 pb-1 sm:gap-4">
            <TypeScopeSelect
              label={content.typeFilterLabel}
              options={typeFilters}
              value={activeTypeFilter}
              onChange={setActiveTypeFilter}
            />

            <span
              className="mb-[0.35rem] hidden h-9 w-px shrink-0 bg-[#EAEAEA] sm:block dark:bg-white/15"
              aria-hidden="true"
            />

            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {availableCategoryFilters.map((filter) => {
                const isActive = activeCategoryFilter === filter;
                return (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setActiveCategoryFilter(filter)}
                    className={`h-9 min-w-[3.35rem] shrink-0 whitespace-nowrap rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[1.1px] transition active:scale-[0.98] ${
                      isActive
                        ? "bg-[#22201f] text-white dark:bg-[#f8f1ec] dark:text-[#171312]"
                        : "border border-border-subtle bg-transparent text-text-secondary hover:border-[#22201f] hover:text-text-primary dark:border-white/10 dark:text-text-secondary dark:hover:border-white/40 dark:hover:text-[#f8f1ec]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mt-14 grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => (
          <ResourceCard
            key={`${item.title}-${item.link}`}
            item={item}
            index={index}
            linkLabel={linkLabel}
            overviewLabel={overviewLabel}
          />
        ))}
      </section>

      {filteredItems.length === 0 ? (
        <div className="mx-auto mt-10 max-w-[760px] border-t border-border-subtle pt-8 text-center text-text-secondary dark:border-white/10 dark:text-text-secondary">
          {content.emptyState}
        </div>
      ) : null}
    </main>
  );
}
