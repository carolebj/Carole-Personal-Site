import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

type ReadingsContent = {
  eyebrow: string;
  readingsTitle: string;
  readingsSubtitle: string;
  readingsSections: Array<{
    title: string;
    items: Array<{
      title: string;
      author: string;
      desc: string;
    }>;
  }>;
};

export default function ReadingsReferences() {
  const { t } = useTranslation();
  const content = t("carnetPage", { returnObjects: true }) as ReadingsContent;

  return (
    <main className="bg-[#fcf9f8] px-5 pb-24 pt-32 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: "easeOut" }}
        className="mx-auto max-w-[1180px]"
      >
        <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
          {content.eyebrow}
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <h1 className="font-serif text-[48px] leading-[52px] dark:text-[#f8f1ec] md:text-[64px] md:leading-[68px]">
            {content.readingsTitle}
          </h1>
          <p className="max-w-[640px] text-[18px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
            {content.readingsSubtitle}
          </p>
        </div>
      </motion.section>

      <section className="mx-auto mt-14 max-w-[1180px] space-y-12">
        {content.readingsSections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className="grid gap-5 border-t border-[#e4bfb2]/50 pt-8 dark:border-white/10 lg:grid-cols-[18rem_1fr]"
          >
            <div>
              <span className="font-serif text-[38px] italic leading-none text-[#854d63] dark:text-[#f0adc4]">
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-4 font-serif text-[30px] leading-9 dark:text-[#f8f1ec]">
                {section.title}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.items.map((item) => (
                <article
                  key={`${section.title}-${item.title}`}
                  className="rounded-lg border border-[#e4bfb2]/32 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#854d63]/35 dark:border-white/10 dark:bg-[#171111]"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[1.8px] text-[#854d63] dark:text-[#f0adc4]">
                    {item.author}
                  </p>
                  <h3 className="mt-4 font-serif text-[28px] leading-8 dark:text-[#f8f1ec]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
