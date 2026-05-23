import { ArrowTopRightOnSquareIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type CarnetPageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyState: string;
  categories: string[];
  items: Array<{
    title: string;
    category: string;
    desc: string;
    link: string;
    badge: string;
  }>;
};

export default function ToolsInspirations() {
  const { t } = useTranslation();
  const content = t("carnetPage", { returnObjects: true }) as CarnetPageContent;
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

  return (
    <main className="bg-[#fcf9f8] px-5 pb-24 pt-32 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <section className="mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: "easeOut" }}
          className="grid gap-9 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
              {content.eyebrow}
            </p>
            <h1 className="mt-5 font-serif text-[48px] leading-[52px] dark:text-[#f8f1ec] md:text-[64px] md:leading-[68px]">
              {content.title}
            </h1>
            <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
              {content.subtitle}
            </p>
          </div>
          <div className="rounded-lg border border-[#e4bfb2]/32 bg-white/78 p-3 shadow-[0_18px_44px_rgba(91,65,55,0.06)] dark:border-white/10 dark:bg-[#171111]">
            <label className="relative block">
              <span className="sr-only">Recherche</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#854d63] dark:text-[#f0adc4]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-md border border-[#e4bfb2]/45 bg-[#fcf9f8] px-12 text-sm outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5"
                placeholder={content.searchPlaceholder}
              />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {content.categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`h-10 shrink-0 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[1.2px] transition active:scale-[0.98] ${
                      isActive
                        ? "border-[#854d63] bg-[#854d63] text-white"
                        : "border-[#e4bfb2]/70 bg-white text-[#5b4137] hover:border-[#854d63] dark:border-white/10 dark:bg-[#171111] dark:text-[#dbc9c0]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          {filteredItems.map((item, index) => (
            <a
              key={item.title}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className={`group rounded-lg border border-[#e4bfb2]/32 bg-white p-6 shadow-[0_16px_44px_rgba(91,65,55,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#854d63]/35 dark:border-white/10 dark:bg-[#171111] ${
                index % 3 === 0 ? "md:min-h-[18rem]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-5">
                <span className="rounded-full border border-[#e4bfb2]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#854d63] dark:border-white/10 dark:text-[#f0adc4]">
                  {item.badge}
                </span>
                <ArrowTopRightOnSquareIcon className="size-5 text-[#854d63] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-[#f0adc4]" />
              </div>
              <h2 className="mt-8 font-serif text-[32px] leading-9 dark:text-[#f8f1ec]">
                {item.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                {item.desc}
              </p>
              <p className="mt-6 text-[12px] font-semibold uppercase tracking-[1.6px] text-[#854d63] dark:text-[#f0adc4]">
                {item.category}
              </p>
            </a>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#e4bfb2]/32 bg-white p-8 text-center text-[#5b4137] dark:border-white/10 dark:bg-[#171111] dark:text-[#dbc9c0]">
            {content.emptyState}
          </div>
        ) : null}
      </section>
    </main>
  );
}
