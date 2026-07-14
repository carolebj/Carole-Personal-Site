import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useMemo, useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toAboutPageViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsSingleton } from "../../cms/cmsContent";
import type { CmsAboutPage } from "../../cms/types";
import aboutPortrait from "../../assets/carole-about-portrait.avif";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { PAGE_SCROLL_MARGIN } from "../components/layout/publicPage";

type ProseSection = {
  label: string;
  paragraphs: string[];
};

type AboutPageContent = {
  hero: {
    title: string;
    subtitle: string;
  };
  imageAlt: string;
  identity: {
    label: string;
    greeting: string;
    role: string;
    paragraphs: string[];
  };
  support: ProseSection;
  value: ProseSection;
  closing: {
    paragraphs: string[];
  };
  ctaBand: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

const fadeUpInView = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

const aboutPanelSection =
  "rounded-lg border border-border-subtle bg-surface-panel p-7 shadow-[var(--shadow-panel)] md:p-10";

function IlluminatedParagraph({ children }: { children: string }) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: paragraphRef,
    offset: ["start 82%", "end 42%"],
  });
  const textOpacity = useTransform(scrollYProgress, [0, 0.22, 1], [0.42, 0.64, 1]);
  const textBrightness = useTransform(scrollYProgress, [0, 1], [0.82, 1]);
  const textBlur = useTransform(scrollYProgress, [0, 0.35, 1], [0.32, 0.08, 0]);
  const textFilter = useMotionTemplate`brightness(${textBrightness}) blur(${textBlur}px)`;

  return (
    <motion.p
      ref={paragraphRef}
      className="text-[16px] leading-[1.85] text-text-secondary md:text-[17px]"
      style={
        shouldReduceMotion
          ? undefined
          : {
              opacity: textOpacity,
              filter: textFilter,
              willChange: "opacity, filter",
            }
      }
    >
      {children}
    </motion.p>
  );
}

function ProseBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-6">
      {paragraphs.map((paragraph) => (
        <IlluminatedParagraph key={paragraph.slice(0, 48)}>
          {paragraph}
        </IlluminatedParagraph>
      ))}
    </div>
  );
}

export default function About() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: cmsAbout, usingCms } = useCmsSingleton<CmsAboutPage | null>("aboutPage", null);
  const i18nContent = t("aboutPage", { returnObjects: true }) as AboutPageContent;
  const content = useMemo(
    () => toAboutPageViewModel(cmsAbout, locale, usingCms, i18nContent),
    [cmsAbout, locale, usingCms, i18nContent],
  );
  const portraitSrc = usingCms ? cmsImageUrl(cmsAbout?.image) || aboutPortrait : aboutPortrait;

  return (
    <main className="bg-surface-page text-text-primary">
      <article className={`mx-auto max-w-[680px] px-5 pt-28 sm:px-8 md:pt-36 ${PAGE_SCROLL_MARGIN}`}>
        <motion.header
          {...fadeUp}
          className="border-b border-border-subtle pb-12 md:pb-14"
        >
          <h1 className="font-serif text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.08] tracking-[-0.02em] text-text-primary">
            {content.hero.title}
          </h1>
          <p className="mt-4 max-w-[520px] text-[17px] leading-8 text-text-secondary">
            {content.hero.subtitle}
          </p>
        </motion.header>

        <motion.section
          {...fadeUp}
          className={`mt-14 md:mt-16 ${aboutPanelSection}`}
        >
          <SectionEyebrow>{content.identity.label}</SectionEyebrow>

          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_200px] md:gap-x-10">
            <div>
              <h2 className="font-serif text-[clamp(1.65rem,4vw,2.15rem)] leading-[1.15] tracking-[-0.02em] text-text-primary">
                {content.identity.greeting}
              </h2>
              <p className="mt-4 text-[15px] font-medium leading-7 text-text-muted md:text-[16px]">
                {content.identity.role}
              </p>
            </div>

            <figure className="mx-auto w-full max-w-[220px] md:col-start-2 md:row-span-2 md:row-start-1 md:mx-0 md:max-w-none">
              <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-page">
                <img
                  src={portraitSrc}
                  alt={content.imageAlt}
                  className="aspect-[4/5] w-full object-cover object-[50%_28%]"
                />
              </div>
            </figure>

            <div className="md:col-start-1 md:row-start-2">
              <ProseBlock paragraphs={content.identity.paragraphs} />
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUpInView}
          className={`mt-8 md:mt-10 ${aboutPanelSection}`}
        >
          <SectionEyebrow>{content.support.label}</SectionEyebrow>
          <div className="mt-8">
            <ProseBlock paragraphs={content.support.paragraphs} />
          </div>
        </motion.section>

        <motion.section
          {...fadeUpInView}
          className={`mt-8 md:mt-10 ${aboutPanelSection}`}
        >
          <SectionEyebrow>{content.value.label}</SectionEyebrow>
          <div className="mt-8">
            <ProseBlock paragraphs={content.value.paragraphs} />
          </div>
        </motion.section>

        <motion.section
          {...fadeUpInView}
          className="mt-20 border-t border-border-subtle pt-16 md:mt-24 md:pt-20"
        >
          <ProseBlock paragraphs={content.closing.paragraphs} />
        </motion.section>
      </article>

      <motion.section
        {...fadeUpInView}
        className="mt-16 border-t border-border-subtle bg-surface-panel px-5 py-14 sm:px-8 md:py-20"
      >
        <div className="mx-auto max-w-[680px]">
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.35rem)] leading-[1.12] tracking-[-0.02em] text-text-primary">
            {content.ctaBand.title}
          </h2>
          <p className="mt-4 max-w-[560px] text-[16px] leading-8 text-text-secondary md:text-[17px]">
            {content.ctaBand.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-md bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1px] text-text-on-strong transition hover:bg-action-strong-hover active:scale-[0.98]"
            >
              {content.ctaBand.ctaPrimary}
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex h-11 items-center whitespace-nowrap rounded-md border border-border-accent-muted px-6 text-[12px] font-semibold uppercase tracking-[1px] text-text-accent transition hover:border-border-accent hover:text-text-primary"
            >
              {content.ctaBand.ctaSecondary}
            </Link>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
