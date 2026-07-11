import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { localized } from "../../cms/types";
import type { CmsReading } from "../../cms/types";
import { cmsImageUrl, useCmsCollection } from "../../cms/cmsContent";

// Dashboard stores books and references as two distinct types.
// `book` maps to the "Ouvrages recommandés" section; `reference` to "Articles, newsletters & contenus cités".
import { Book } from "../components/Book";
import { PageHero } from "../components/PageHero";
import { PAGE_MAIN_SPACIOUS } from "../components/layout/publicPage";
import everybodyWritesCover from "../../assets/books/everybody-writes.jpg";
import leBugHumainCover from "../../assets/books/le-bug-humain.jpg";
import storybrandCover from "../../assets/books/storybrand.jpg";

type ReadingItem = {
  title: string;
  author: string;
  date?: string;
  desc: string;
  link?: string;
  coverUrl?: string;
  typeLabel?: string;
  cardStyle?: "standard" | "pinned";
};

type ReadingsContent = {
  eyebrow: string;
  discoverBook: string;
  readingsTitle: string;
  readingsSubtitle: string;
  readingsSection1Desc?: string;
  readingsSection2Desc?: string;
  readingsSections: Array<{
    title: string;
    items: ReadingItem[];
  }>;
};

const bookCovers: Record<string, string> = {
  "Everybody Writes": everybodyWritesCover,
  Storybrand: storybrandCover,
  "Le Bug Humain": leBugHumainCover,
};

function BookCard({ item, index }: { item: ReadingItem; index: number }) {
  const { t } = useTranslation();
  const coverUrl = bookCovers[item.title] ?? item.coverUrl;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: "0 18px 40px rgba(34, 32, 31, 0.08)",
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group/book-card flex flex-col gap-5 rounded-lg border border-border-subtle bg-white p-4 text-left transition-colors duration-300 hover:border-[#d9d0c8] dark:border-white/10 dark:bg-surface-panel dark:hover:border-white/20 min-[560px]:flex-row sm:gap-6 sm:p-5"
    >
      <div className="shrink-0 self-start">
        <Book
          title={item.title}
          coverUrl={coverUrl}
          width={180}
          color="#22201f"
          textColor="#f8f1ec"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-text-muted dark:text-text-muted">
          {item.author}
        </p>
        <h2 className="mt-1.5 font-serif text-[24px] leading-8 tracking-[-0.02em] text-text-primary dark:text-text-primary">
          {item.title}
        </h2>
        <p className="mt-0.5 text-[13px] text-[#a09c98] dark:text-text-muted/60">
          {item.date}
        </p>
        <p className="mt-2.5 text-[14px] leading-6 text-text-secondary dark:text-text-secondary">
          {item.desc}
        </p>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md bg-[#22201f] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-white transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#8f4f68] hover:shadow-[0_8px_18px_rgba(143,79,104,0.18)] active:translate-y-0 active:scale-[0.97] dark:bg-[#f8f1ec] dark:text-[#171312] dark:hover:bg-[#8f4f68] dark:hover:text-white"
        >
          {t("carnetPage.discoverBook")}
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </motion.article>
  );
}

function ReferenceCard({
  item,
  index,
  fallbackLabel,
}: {
  item: ReadingItem;
  index: number;
  fallbackLabel: string;
}) {
  const label = item.typeLabel ?? fallbackLabel;
  const normalizedLabel = label.toLocaleLowerCase();
  const isNewsletter = normalizedLabel.includes("newsletter");

  if (isNewsletter) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3, rotate: -0.25 }}
        transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-[18rem] overflow-hidden rounded-r-lg border border-[#d8cfc4] bg-[#fbfaf6] py-7 pl-16 pr-7 text-left text-text-primary shadow-[0_16px_35px_rgba(69,52,42,0.10)] dark:border-white/10 dark:bg-[#211d1b] dark:text-text-primary"
      >
        <div className="absolute inset-y-0 left-0 w-9 border-r border-[#5e463b]/25 bg-[#8f4f68] shadow-[inset_-5px_0_10px_rgba(67,34,47,0.18)] dark:bg-[#6e3d50]" />
        <div className="absolute inset-y-0 left-[1.65rem] flex flex-col justify-around py-4" aria-hidden="true">
          {Array.from({ length: 8 }, (_, ring) => (
            <span key={ring} className="relative block size-4 -translate-x-1/2 rounded-full border border-[#8d8178] bg-[#f2eee8] shadow-[inset_0_1px_2px_rgba(47,35,29,0.22)] dark:border-white/25 dark:bg-[#171312]">
              <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-[#514740]/45" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-9 right-0 opacity-55 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(137,113,99,.18)_32px)] [background-position:0_4.5rem] dark:opacity-20" />

        <div className="relative flex min-h-[14rem] flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#8f4f68] dark:text-[#dda6b8]">
            {label}
          </p>
          <h2 className="mt-4 font-serif text-[32px] leading-9 tracking-[-0.02em]">
            {item.title}
          </h2>
          <p className="mt-5 text-[15px] leading-8 text-text-secondary dark:text-text-secondary">
            {item.desc}
          </p>
          <p className="mt-auto pt-6 text-[12px] font-semibold uppercase tracking-[1.5px] text-text-muted dark:text-text-muted">
            {item.author}
          </p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, rotate: 0.65 }}
      animate={{ opacity: 1, y: 0, rotate: 0.65 }}
      whileHover={{ y: -4, rotate: -0.35 }}
      transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-h-[18rem] overflow-hidden bg-[#f7df75] p-7 text-left text-[#382f20] shadow-[0_18px_36px_rgba(92,69,25,0.16),inset_0_-18px_28px_rgba(155,112,23,0.08)] dark:bg-[#c9a94f] dark:text-[#241f15]"
    >
      <div className="absolute left-1/2 top-0 h-7 w-28 -translate-x-1/2 -translate-y-1/3 rotate-[-2deg] border-x border-white/35 bg-[#eee2c7]/72 shadow-[0_2px_5px_rgba(73,56,30,0.08)] backdrop-blur-[1px]" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 size-12 bg-[linear-gradient(135deg,rgba(139,103,30,.16)_0_49%,#fff4b5_50%_100%)] shadow-[-3px_-3px_8px_rgba(116,83,18,0.10)] dark:bg-[linear-gradient(135deg,rgba(75,54,18,.18)_0_49%,#e5c966_50%_100%)]" aria-hidden="true" />
      <div className="relative flex min-h-[14rem] flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#81601c] dark:text-[#503b10]">
          {label}
        </p>
        <h2 className="mt-4 font-serif text-[30px] leading-9 tracking-[-0.02em]">
          {item.title}
        </h2>
        <p className="mt-5 text-[15px] leading-7 text-[#594b2d] dark:text-[#332a19]">
          {item.desc}
        </p>
        <p className="mt-auto pt-6 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#765a22] dark:text-[#493711]">
          {item.author}
        </p>
      </div>
    </motion.article>
  );
}

export default function ReadingsReferences() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: cmsBooks, usingCms: usingCmsBooks } = useCmsCollection("book", [] as CmsReading[]);
  const { data: cmsReferences, usingCms: usingCmsReferences } = useCmsCollection("reference", [] as CmsReading[]);

  const content = useMemo((): ReadingsContent => {
    const fallback = t("carnetPage", { returnObjects: true }) as ReadingsContent;
    const usingCms = usingCmsBooks || usingCmsReferences;
    if (!usingCms) return fallback;

    const toBookItem = (r: CmsReading): ReadingItem => ({
      title: localized(r.title, locale),
      author: r.author ?? "",
      date: r.date || undefined,
      desc: localized(r.description, locale),
      link: r.url || undefined,
      coverUrl: cmsImageUrl(r.image),
    });

    const toReferenceItem = (r: CmsReading, index: number): ReadingItem => ({
      title: localized(r.title, locale),
      author: r.author ?? "",
      date: r.date || undefined,
      desc: localized(r.description, locale),
      link: r.url || undefined,
      typeLabel: r.typeLabel ? localized(r.typeLabel, locale) : undefined,
      cardStyle: r.cardStyle ?? (index % 2 === 1 ? "pinned" : "standard"),
    });

    const bookItems = cmsBooks.map(toBookItem);
    const referenceItems = cmsReferences.map(toReferenceItem);

    const readingsSections = fallback.readingsSections.map((section, i) => {
      const items = i === 0 ? bookItems : referenceItems;
      return { ...section, items };
    });

    return { ...fallback, readingsSections };
  }, [cmsBooks, cmsReferences, usingCmsBooks, usingCmsReferences, locale, t]);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const booksSection = content.readingsSections[0];
  const referencesSection = content.readingsSections[1];
  const activeSection = content.readingsSections[activeSectionIndex] ?? booksSection;
  const isBooks = activeSectionIndex === 0;
  const itemCountLabel =
    i18n.language === "fr"
      ? `${activeSection.items.length} élément${activeSection.items.length > 1 ? "s" : ""}`
      : `${activeSection.items.length} item${activeSection.items.length > 1 ? "s" : ""}`;
  const referenceLabels =
    i18n.language === "fr"
      ? ["Newsletter", "Contenu cité"]
      : ["Newsletter", "Cited content"];
  const sectionButtonLabels =
    i18n.language === "fr"
      ? [
          ["Ouvrages recommandés"],
          ["Articles, newsletters", "& contenus cités"],
        ]
      : [
          ["Recommended books"],
          ["Articles, newsletters", "& cited contents"],
        ];

  return (
    <main className={PAGE_MAIN_SPACIOUS}>
      <section className="mx-auto max-w-[960px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <PageHero
            eyebrow={content.eyebrow}
            title={content.readingsTitle}
            subtitle={content.readingsSubtitle}
            align="center"
            eyebrowTone="muted"
            titleClassName="mx-auto mt-4 max-w-[760px] text-[48px] leading-[52px] tracking-[-0.03em] md:text-[70px] md:leading-[70px]"
            subtitleClassName="mt-5 max-w-[680px] text-[17px]"
          />
        </motion.div>

        <div className="mx-auto mt-8 grid max-w-[670px] grid-cols-2 rounded-[18px] border border-[#ded7cf] bg-[#f2ede7]/80 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-10px_24px_rgba(54,38,28,0.05),0_12px_30px_rgba(54,38,28,0.07)] dark:border-white/10 dark:bg-[#211b19] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.22)]">
          {[booksSection, referencesSection].map((section, index) => {
            const isActive = activeSectionIndex === index;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setActiveSectionIndex(index)}
                aria-label={section.title}
                className={`relative isolate min-h-14 rounded-[13px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[1.35px] transition-colors duration-300 active:scale-[0.99] sm:text-[12px] ${
                  isActive
                    ? "text-white dark:text-[#171312]"
                    : "text-text-secondary hover:text-[#8f4f68] dark:text-text-secondary dark:hover:text-[#f8f1ec]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="readings-section-indicator"
                    className="absolute inset-0 -z-10 rounded-[12px] bg-[#253a50] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-10px_18px_rgba(12,22,32,0.28),0_2px_5px_rgba(34,32,31,0.16)] dark:bg-[#f8f1ec] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_12px_rgba(0,0,0,0.26)]"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className="relative flex flex-col items-center justify-center gap-0.5 leading-[1.15]">
                  {sectionButtonLabels[index].map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1120px]">
        <div className="mb-7 grid gap-5 border-y border-border-subtle py-6 md:grid-cols-[0.9fr_1fr] md:items-end dark:border-white/10">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[1.4px] text-text-muted">
              {itemCountLabel}
            </p>
            <h2 className="mt-3 font-serif text-[38px] leading-[42px] tracking-[-0.02em] text-text-primary dark:text-text-primary">
              {activeSection.title}
            </h2>
          </div>
          <p className="max-w-[520px] text-[15px] leading-7 text-text-secondary md:justify-self-end dark:text-text-secondary">
            {isBooks
              ? content.readingsSection1Desc
              : content.readingsSection2Desc}
          </p>
        </div>

        {isBooks ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {activeSection.items.map((item, index) => (
              <BookCard key={item.title} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {activeSection.items.map((item, index) => (
              <ReferenceCard
                key={item.title}
                item={item}
                index={index}
                fallbackLabel={referenceLabels[index % referenceLabels.length]}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
