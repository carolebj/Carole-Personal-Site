import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import type React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toServiceViewModel } from "../../cms/adapters";
import { useCmsCollection } from "../../cms/cmsContent";
import type { CmsService } from "../../cms/types";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { useSeoOverride } from "../seo/SeoOverrideContext";

type ServiceDetail = {
  slug: string;
  title: string;
  accent: string;
  description: string;
  detailIntro: string;
  metricValue: string;
  metricLabel: string;
  projectTitle: string;
  projectDescription: string;
  bullets: string[];
  presentation?: string;
  whatIsIncluded?: string[];
  targetAudience?: string[];
  concreteApplications?: string[];
};

function AnimatedDigits({ value }: { value: string }) {
  const chars = Array.from(value);

  return (
    <span className="t-digit-group is-animating tabular-nums" aria-label={value}>
      {chars.map((char, index) => {
        const staggerIndex = index >= chars.length - 2 ? index - chars.length + 3 : undefined;
        return (
          <span
            key={`${char}-${index}`}
            aria-hidden="true"
            className="t-digit"
            data-stagger={staggerIndex}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const locale = i18n.language;
  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((s) => toServiceViewModel(s, locale));
    }
    return t("services.items", { returnObjects: true }) as ServiceDetail[];
  }, [cmsServices, usingCmsServices, locale, t]);
  const slugAliases: Record<string, string> = {
    "direction-social-media": "communication-digitale",
    "social-media-direction": "digital-communication",
    "creation-contenu": "creation-contenus",
    "audit-conseil": "audit-consulting",
  };
  const normalizedSlug = slug ? slugAliases[slug] ?? slug : "";
  const service = services.find((item) => item.slug === normalizedSlug) ?? services[0];
  const seoOverride = useMemo(
    () =>
      service
        ? {
            title: `${service.title} — ${service.accent} | Carole Tonoukouen`,
            description: service.detailIntro || service.description,
          }
        : null,
    [service],
  );
  useSeoOverride(seoOverride);
  const whatIsIncluded = service.whatIsIncluded ?? service.bullets;
  const targetAudience = service.targetAudience ?? [];
  const concreteApplications = service.concreteApplications ?? [service.projectDescription];
  const caseStudyCards = [
    {
      label: t("serviceDetail.caseStudyProblem"),
      title: service.projectTitle,
      body: service.projectDescription,
    },
    {
      label: t("serviceDetail.caseStudyMethod"),
      title: whatIsIncluded[0] ?? service.bullets[0],
      body: whatIsIncluded[1] ?? service.detailIntro,
    },
    {
      label: t("serviceDetail.caseStudyOutput"),
      title: concreteApplications[0] ?? service.metricLabel,
      body: concreteApplications[1] ?? service.metricLabel,
    },
  ];

  return (
    <main className={`${PAGE_MAIN} pb-24`}>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[1160px]"
      >
        <Link
          to="/#services"
          className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent transition hover:text-text-primary"
        >
          {t("serviceDetail.back")}
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.64fr)] lg:gap-14">
          <div className="rounded-lg border border-border-accent-muted bg-surface-panel p-7 shadow-[var(--shadow-panel)] md:p-10">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.eyebrow")}
            </p>
            <h1
              className="mt-5 max-w-[720px] text-balance font-serif text-[48px] leading-[52px] text-text-primary md:text-[66px] md:leading-[68px]"
              style={{ viewTransitionName: `service-card-${service.slug}` } as React.CSSProperties}
            >
              {service.title}
              <br />
              <span className="italic text-text-accent">{service.accent}</span>
            </h1>
            <p className="mt-7 max-w-[640px] text-[19px] leading-8 text-text-secondary">
              {service.detailIntro}
            </p>
            {service.presentation ? (
              <p className="mt-6 max-w-[700px] text-[16px] leading-8 text-text-secondary">
                {service.presentation}
              </p>
            ) : null}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {service.bullets.map((bullet) => (
                <span
                  key={bullet}
                  className="rounded-md border border-border-accent-muted bg-surface-page px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[1px] text-text-secondary"
                >
                  {bullet}
                </span>
              ))}
            </div>
            <Link
              to="/contact"
              className="mt-10 inline-flex h-[50px] items-center whitespace-nowrap rounded-md bg-action-strong px-7 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-text-on-strong transition hover:bg-action-strong-hover active:scale-[0.98]"
            >
              {t("serviceDetail.cta")}
            </Link>
          </div>

          <aside className="grid gap-5">
            <div className="rounded-lg border border-border-accent-muted bg-surface-panel p-7">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.metric")}
              </p>
              <p className="mt-5 font-serif text-[56px] leading-none text-text-primary">
                <AnimatedDigits value={service.metricValue} />
              </p>
              <p className="mt-4 text-[16px] leading-7 text-text-secondary">
                {service.metricLabel}
              </p>
            </div>

            {targetAudience.length > 0 ? (
              <div className="rounded-lg border border-border-accent-muted bg-surface-panel p-7">
                <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                  {t("serviceDetail.audience")}
                </p>
                <h2 className="mt-4 font-serif text-[28px] leading-8 text-text-primary">
                  {t("serviceDetail.audienceTitle")}
                </h2>
                <ul className="mt-6 space-y-3">
                  {targetAudience.map((item) => (
                    <li
                      key={item}
                      className="border-t border-border-accent-muted pt-3 text-[14px] leading-6 text-text-secondary first:border-t-0 first:pt-0"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </motion.section>

      <section className="mx-auto mt-14 max-w-[1160px]">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-lg border border-border-accent-muted bg-surface-panel p-7 md:p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.includes")}
            </p>
            <h2 className="mt-4 max-w-[26rem] font-serif text-[34px] leading-10 text-text-primary">
              {t("serviceDetail.presentationBlockTitle")}
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-text-secondary">
              {t("serviceDetail.presentationBlockText")}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {whatIsIncluded.map((item, index) => (
              <article
                key={item}
                className={`rounded-lg border border-border-accent-muted bg-surface-panel p-5 transition duration-300 hover:-translate-y-1 hover:border-border-accent ${
                  index === 0 ? "md:row-span-2 md:min-h-[16rem]" : ""
                }`}
              >
                <span className="font-serif text-[28px] italic leading-none text-text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-5 text-[15px] leading-7 text-text-secondary">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1160px]">
        <div className="mb-7 grid gap-4 border-t border-border-accent-muted pt-10 md:grid-cols-[0.72fr_1.28fr] md:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.caseStudy")}
            </p>
            <h2 className="mt-4 font-serif text-[36px] leading-10 text-text-primary">
              {t("serviceDetail.caseStudyTitle")}
            </h2>
          </div>
          <p className="max-w-[620px] text-[16px] leading-7 text-text-secondary md:justify-self-end">
            {t("serviceDetail.caseStudyIntro")}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[22rem] rounded-lg border border-border-accent-muted bg-surface-panel p-6 md:p-8">
            <div className="relative mx-auto h-56 max-w-[32rem]">
              {caseStudyCards.map((card, index) => (
                <motion.article
                  key={card.label}
                  animate={{
                    y: index * -10,
                    scale: 1 - index * 0.045,
                    zIndex: caseStudyCards.length - index,
                  }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-x-0 top-10 rounded-lg border border-border-accent-muted bg-surface-page p-5 shadow-[0_2px_14px_rgba(28,27,27,0.035)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[2px] text-text-accent">
                    {card.label}
                  </p>
                  <h3 className="mt-3 font-serif text-[25px] leading-8 text-text-primary">
                    {card.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-text-secondary">
                    {card.body}
                  </p>
                </motion.article>
              ))}
            </div>
            <p className="mt-10 text-[15px] leading-7 text-text-secondary">
              {service.projectDescription}
            </p>
          </div>

          <div className="grid gap-5">
            <article className="rounded-lg border border-border-accent-muted bg-surface-accent-muted p-7">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.project")}
              </p>
              <h2 className="mt-4 font-serif text-[28px] leading-8 text-text-primary">
                {service.projectTitle}
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-text-secondary">
                {service.projectDescription}
              </p>
            </article>

            <div className="grid gap-3 md:grid-cols-3">
              {concreteApplications.map((item) => (
                <article
                  key={item}
                  className="rounded-lg border border-border-accent-muted bg-surface-panel p-5 transition duration-300 hover:-translate-y-1 hover:border-border-accent"
                >
                  <p className="text-[14px] leading-6 text-text-secondary">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
