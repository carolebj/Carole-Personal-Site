import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import workingImage from "../../assets/carole-redesign-working.png";

type AboutPageContent = {
  eyebrow: string;
  titleStart: string;
  titleAccent: string;
  titleEnd: string;
  bioParagraphs: string[];
  positioningTitle: string;
  positioningIntro: string;
  positioningPillars: Array<{
    title: string;
    desc: string;
  }>;
  methodologyTitle: string;
  methodologySteps: Array<{
    step: string;
    title: string;
    desc: string;
  }>;
};

export default function About() {
  const { t } = useTranslation();
  const content = t("aboutPage", { returnObjects: true }) as AboutPageContent;

  return (
    <main className="bg-[#fcf9f8] px-5 pb-24 pt-32 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: "easeOut" }}
        className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
            {content.eyebrow}
          </p>
          <h1 className="mt-5 max-w-[760px] font-serif text-[44px] leading-[48px] text-[#1c1b1b] dark:text-[#f8f1ec] md:text-[64px] md:leading-[68px]">
            {content.titleStart}{" "}
            <span className="italic text-[#854d63] dark:text-[#f0adc4]">{content.titleAccent}</span>
            {content.titleEnd}
          </h1>
          <div className="mt-8 max-w-[670px] space-y-5 text-[17px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
            {content.bioParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:mr-0">
          <div className="organic-shape absolute -inset-5 rotate-6 bg-[#ffd9e4]/62 dark:bg-[#854d63]/28" />
          <div className="organic-shape-third relative aspect-[4/5] overflow-hidden bg-[#ffdcbd] shadow-[0_30px_90px_rgba(91,65,55,0.16)]">
            <img
              src={workingImage}
              alt=""
              className="h-full w-full object-cover object-[50%_28%]"
            />
          </div>
        </div>
      </motion.section>

      <section className="mx-auto mt-20 max-w-[1180px]">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
              {content.positioningTitle}
            </p>
            <h2 className="mt-4 max-w-[28rem] font-serif text-[34px] leading-10 dark:text-[#f8f1ec]">
              {content.positioningIntro}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            {content.positioningPillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className={`rounded-lg border border-[#e4bfb2]/32 bg-white p-6 shadow-[0_16px_44px_rgba(91,65,55,0.06)] dark:border-white/10 dark:bg-[#171111] ${
                  index === 0 ? "md:row-span-2 md:min-h-[20rem]" : ""
                }`}
              >
                <span className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-serif text-[28px] leading-8 text-[#1c1b1b] dark:text-[#f8f1ec]">
                  {pillar.title}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                  {pillar.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px]">
        <div className="mb-8 flex flex-col justify-between gap-5 border-t border-[#e4bfb2]/50 pt-8 dark:border-white/10 md:flex-row md:items-end">
          <h2 className="font-serif text-[38px] leading-10 dark:text-[#f8f1ec]">
            {content.methodologyTitle}
          </h2>
          <Link
            to="/contact"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[#1c1b1b] px-5 text-[12px] font-semibold uppercase tracking-[1.2px] text-white transition hover:bg-[#854d63] active:scale-[0.98] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            {t("nav.contact")}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.methodologySteps.map((item) => (
            <article
              key={item.step}
              className="group rounded-lg border border-[#e4bfb2]/32 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#854d63]/35 hover:shadow-[0_18px_46px_rgba(91,65,55,0.08)] dark:border-white/10 dark:bg-[#171111]"
            >
              <span className="font-serif text-[36px] italic leading-none text-[#854d63] dark:text-[#f0adc4]">
                {item.step}
              </span>
              <h3 className="mt-5 font-serif text-[26px] leading-8 dark:text-[#f8f1ec]">
                {item.title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
