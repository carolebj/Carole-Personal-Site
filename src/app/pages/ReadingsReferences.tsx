import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ReadingItem = {
  title: string;
  author: string;
  desc: string;
};

type ReadingsContent = {
  eyebrow: string;
  readingsTitle: string;
  readingsSubtitle: string;
  readingsSections: Array<{
    title: string;
    items: ReadingItem[];
  }>;
};

const bookCovers: Record<string, string> = {
  "Everybody Writes": "https://books.google.com/books/content?id=QGtECQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  Storybrand: "https://books.google.com/books/content?id=b3xDDgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  "Le Bug Humain": "https://books.google.com/books/content?id=_yODDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
};

function BookCard({ item, index }: { item: ReadingItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5 rounded-lg border border-[#EAEAEA] bg-white p-5 text-left dark:border-white/10 dark:bg-[#171312] sm:grid-cols-[8.5rem_1fr]"
    >
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[8.5rem] overflow-hidden rounded-md border border-[#EAEAEA] bg-[#F7F6F3] dark:border-white/10 dark:bg-[#211c1a]">
        <img
          src={bookCovers[item.title]}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#787774] dark:text-[#cdb9ae]">
          {item.author}
        </p>
        <h2 className="mt-3 font-serif text-[30px] leading-9 tracking-[-0.02em] text-[#22201f] dark:text-[#f8f1ec]">
          {item.title}
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-[#5d5a56] dark:text-[#dbc9c0]">
          {item.desc}
        </p>
      </div>
    </motion.article>
  );
}

function ReferenceCard({
  item,
  index,
  label,
}: {
  item: ReadingItem;
  index: number;
  label: string;
}) {
  const isPinnedNote = index % 2 === 1;

  if (isPinnedNote) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12, rotate: -0.8 }}
        animate={{ opacity: 1, y: 0, rotate: -0.8 }}
        transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-[16rem] rounded-md border border-[#EAEAEA] bg-[#FBF3DB] p-6 text-left text-[#22201f] dark:border-white/10 dark:bg-[#2b2518] dark:text-[#f8f1ec]"
      >
        <div className="mx-auto mb-5 h-2 w-16 rounded-full bg-[#956400]/18 dark:bg-[#f0d48a]/20" />
        <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#956400] dark:text-[#f0d48a]">
          {label}
        </p>
        <h2 className="mt-4 font-serif text-[30px] leading-9 tracking-[-0.02em]">
          {item.title}
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-[#5d5a56] dark:text-[#dbc9c0]">
          {item.desc}
        </p>
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#787774] dark:text-[#cdb9ae]">
          {item.author}
        </p>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-h-[16rem] overflow-hidden rounded-lg border border-[#EAEAEA] bg-[#F7F6F3] p-6 text-left text-[#22201f] dark:border-white/10 dark:bg-[#1d1817] dark:text-[#f8f1ec]"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-[#d8d2ca] dark:bg-white/10" />
      <p className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#787774] dark:text-[#cdb9ae]">
        {label}
      </p>
      <h2 className="mt-4 font-serif text-[30px] leading-9 tracking-[-0.02em]">
        {item.title}
      </h2>
      <p className="mt-4 text-[15px] leading-7 text-[#5d5a56] dark:text-[#dbc9c0]">
        {item.desc}
      </p>
      <p className="mt-6 border-t border-[#EAEAEA] pt-4 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#787774] dark:border-white/10 dark:text-[#cdb9ae]">
        {item.author}
      </p>
    </motion.article>
  );
}

export default function ReadingsReferences() {
  const { t, i18n } = useTranslation();
  const content = t("carnetPage", { returnObjects: true }) as ReadingsContent;
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

  return (
    <main className="min-h-[70vh] bg-[#FBFBFA] px-5 pb-28 pt-32 text-[#22201f] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <section className="mx-auto max-w-[960px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#787774] dark:text-[#cdb9ae]">
            {content.eyebrow}
          </p>
          <h1 className="mx-auto mt-5 max-w-[760px] font-serif text-[52px] leading-[56px] tracking-[-0.03em] md:text-[78px] md:leading-[78px]">
            {content.readingsTitle}
          </h1>
          <p className="mx-auto mt-7 max-w-[680px] text-[18px] leading-8 text-[#5d5a56] dark:text-[#dbc9c0]">
            {content.readingsSubtitle}
          </p>
        </motion.div>

        <div className="mx-auto mt-12 flex max-w-[620px] rounded-lg border border-[#EAEAEA] bg-white p-1 dark:border-white/10 dark:bg-[#171312]">
          {[booksSection, referencesSection].map((section, index) => {
            const isActive = activeSectionIndex === index;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setActiveSectionIndex(index)}
                className={`h-11 flex-1 rounded-md px-4 text-[12px] font-semibold uppercase tracking-[1.1px] transition active:scale-[0.98] ${
                  isActive
                    ? "bg-[#22201f] text-white dark:bg-[#f8f1ec] dark:text-[#171312]"
                    : "text-[#5d5a56] hover:text-[#22201f] dark:text-[#dbc9c0] dark:hover:text-[#f8f1ec]"
                }`}
              >
                {section.title}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-[1120px]">
        <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#EAEAEA] pb-5 md:flex-row md:items-end dark:border-white/10">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[1.4px] text-[#787774]">
              {itemCountLabel}
            </p>
            <h2 className="mt-3 font-serif text-[38px] leading-[42px] tracking-[-0.02em] text-[#22201f] dark:text-[#f8f1ec]">
              {activeSection.title}
            </h2>
          </div>
          <p className="max-w-[440px] text-[15px] leading-7 text-[#5d5a56] dark:text-[#dbc9c0]">
            {isBooks
              ? i18n.language === "fr"
                ? "Des livres traités comme des objets à consulter, avec leurs couvertures comme premier repère visuel."
                : "Books are treated as objects to browse, with their covers as the first visual cue."
              : i18n.language === "fr"
                ? "Les contenus courts sont distingués des livres par des formats papier plus légers: parchemins et notes épinglées."
                : "Short-form references are separated from books through lighter paper formats: scroll-like notes and pinned notes."}
          </p>
        </div>

        {isBooks ? (
          <div className="grid gap-5 lg:grid-cols-3">
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
                label={referenceLabels[index % referenceLabels.length]}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
