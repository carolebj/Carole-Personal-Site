import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import type React from "react";
import { useMemo } from "react";
import { Link, useParams } from "react-router";
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

const slugAliases: Record<string, string> = {
  "direction-social-media": "communication-digitale",
  "social-media-direction": "digital-communication",
  "creation-contenu": "creation-contenus",
  "content-creation": "creation-contenus",
  "audit-conseil": "audit-consulting",
  "graphic-design": "identite-visuelle",
  "visual-identity": "identite-visuelle",
  "design-graphique": "identite-visuelle",
};

function isDesignService(service: ServiceDetail) {
  return ["identite-visuelle", "visual-identity"].includes(service.slug);
}

function AnimatedDigits({ value }: { value: string }) {
  return (
    <span className="t-digit-group is-animating tabular-nums" aria-label={value}>
      {Array.from(value).map((char, index, chars) => {
        const staggerIndex = index >= chars.length - 2 ? index - chars.length + 3 : undefined;
        return (
          <span key={`${char}-${index}`} aria-hidden="true" className="t-digit" data-stagger={staggerIndex}>
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
      return cmsServices.map((service) => toServiceViewModel(service, locale));
    }
    return t("services.items", { returnObjects: true }) as ServiceDetail[];
  }, [cmsServices, usingCmsServices, locale, t]);
  const normalizedSlug = slug ? slugAliases[slug] ?? slug : "";
  const service = services.find((item) => item.slug === normalizedSlug) ?? services[0];
  const detailIsDesign = service ? isDesignService(service) : false;
  const seoOverride = useMemo(
    () =>
      service
        ? {
            title: `${service.title} ${service.accent} | Carole Tonoukouen`,
            description: service.detailIntro || service.description,
          }
        : null,
    [service],
  );
  useSeoOverride(seoOverride);

  if (!service) {
    return (
      <main className={`${PAGE_MAIN} px-5 pb-24 sm:px-8`}>
        <div className="mx-auto max-w-[760px] rounded-lg border border-border-accent-muted bg-surface-panel p-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
            {t("serviceDetail.eyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-[42px] leading-[46px] text-text-primary">
            {t("services.pageTitleStart")}
          </h1>
          <Link to="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-text-accent">
            <ArrowLeftIcon className="size-4" />
            {t("serviceDetail.back")}
          </Link>
        </div>
      </main>
    );
  }

  const whatIsIncluded = service.whatIsIncluded?.length ? service.whatIsIncluded : service.bullets;
  const targetAudience = service.targetAudience ?? [];
  const concreteApplications = service.concreteApplications?.length ? service.concreteApplications : [service.projectDescription];
  const nextService = services[(services.findIndex((item) => item.slug === service.slug) + 1) % services.length];

  return (
    <main className={`${PAGE_MAIN} overflow-hidden bg-surface-page pb-24`}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-0"
      >
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[2px] text-text-accent transition hover:text-text-primary"
        >
          <ArrowLeftIcon className="size-4" />
          {t("serviceDetail.back")}
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.48fr)] lg:gap-14">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.eyebrow")}
            </p>
            <h1
              className="mt-5 max-w-[820px] text-balance font-serif text-[58px] leading-[58px] text-text-primary sm:text-[82px] sm:leading-[78px]"
              style={{ viewTransitionName: `service-card-${service.slug}` } as React.CSSProperties}
            >
              {service.title}
              <br />
              <span className="italic text-text-accent">{service.accent}</span>
            </h1>
            <p className="mt-8 max-w-[700px] text-[20px] leading-9 text-text-secondary">
              {service.detailIntro}
            </p>
          </div>

          <aside className="self-end rounded-lg border border-border-accent-muted bg-surface-panel p-6 shadow-[var(--shadow-panel)]">
            <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
              {t("serviceDetail.metric")}
            </p>
            <p className="mt-5 font-serif text-[54px] leading-none text-text-primary">
              <AnimatedDigits value={service.metricValue} />
            </p>
            <p className="mt-4 text-[15px] leading-7 text-text-secondary">
              {service.metricLabel}
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <Link
                to={detailIsDesign ? "/services/brief-design" : "/contact"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-on-strong transition hover:-translate-y-0.5 hover:bg-action-strong-hover active:translate-y-0"
              >
                {detailIsDesign ? t("services.designBriefCta") : t("serviceDetail.cta")}
                <ArrowRightIcon className="size-4" />
              </Link>
              {detailIsDesign ? (
                <Link
                  to="/contact"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border-accent-muted px-5 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-accent transition hover:bg-surface-accent-muted"
                >
                  {t("serviceDetail.cta")}
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      </motion.section>

      <section className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <article className="rounded-lg bg-[#f8eee9] p-7 dark:bg-white/5 md:p-9">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.presentationBlockTitle")}
            </p>
            <p className="mt-6 text-[18px] leading-9 text-text-secondary">
              {service.presentation ?? service.description}
            </p>
          </article>

          <div className="grid gap-3 md:grid-cols-3">
            {service.bullets.map((bullet, index) => (
              <article
                key={bullet}
                className="flex min-h-[11rem] flex-col justify-between rounded-lg border border-border-accent-muted bg-surface-panel p-5"
              >
                <span className="font-serif text-[30px] italic leading-none text-text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-8 text-[14px] font-semibold uppercase leading-6 tracking-[1px] text-text-secondary">
                  {bullet}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0">
        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.includes")}
            </p>
            <h2 className="mt-4 font-serif text-[40px] leading-[44px] text-text-primary">
              {t("serviceDetail.presentationBlockText")}
            </h2>
          </div>

          <div className="grid gap-4">
            {whatIsIncluded.map((item, index) => (
              <article
                key={item}
                className="grid gap-4 rounded-lg border border-border-accent-muted bg-surface-panel p-5 transition duration-300 hover:border-border-accent sm:grid-cols-[3rem_1fr]"
              >
                <span className="font-serif text-[30px] italic leading-none text-text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[16px] leading-7 text-text-secondary">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-border-accent-muted bg-surface-panel p-7 md:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-accent-muted text-text-accent">
                <ClipboardDocumentCheckIcon className="size-5" />
              </span>
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.project")}
              </p>
            </div>
            <h2 className="mt-6 font-serif text-[34px] leading-10 text-text-primary">
              {service.projectTitle}
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-text-secondary">
              {service.projectDescription}
            </p>
          </article>

          <div className="grid gap-5">
            {targetAudience.length > 0 ? (
              <article className="rounded-lg bg-[#fff7ed] p-7 dark:bg-white/5 md:p-8">
                <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                  {t("serviceDetail.audience")}
                </p>
                <h2 className="mt-4 font-serif text-[30px] leading-9 text-text-primary">
                  {t("serviceDetail.audienceTitle")}
                </h2>
                <ul className="mt-6 grid gap-3">
                  {targetAudience.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] leading-7 text-text-secondary">
                      <CheckCircleIcon className="mt-1 size-5 shrink-0 text-text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {detailIsDesign ? (
              <article className="rounded-lg border border-border-accent bg-[#fff3f6] p-7 dark:border-white/10 dark:bg-white/6 md:p-8">
                <div className="flex items-center gap-3">
                  <PaintBrushIcon className="size-5 text-text-accent" />
                  <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                    {t("services.designBridgeEyebrow")}
                  </p>
                </div>
                <p className="mt-5 text-[16px] leading-8 text-text-secondary">
                  {t("services.designBridgeDescription")}
                </p>
                <Link
                  to="/services/brief-design"
                  className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-accent transition hover:text-text-primary"
                >
                  {t("services.designBriefCta")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0">
        <div className="grid gap-4 border-t border-border-accent-muted pt-10 md:grid-cols-[18rem_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.caseStudyOutput")}
            </p>
            <h2 className="mt-4 font-serif text-[34px] leading-10 text-text-primary">
              {t("serviceDetail.caseStudyTitle")}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {concreteApplications.map((item) => (
              <article key={item} className="rounded-lg bg-surface-panel p-5 shadow-[0_1px_2px_rgba(28,27,27,0.04)]">
                <p className="text-[14px] leading-7 text-text-secondary">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {nextService ? (
        <section className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0">
          <Link
            to={`/services/${nextService.slug}`}
            className="group grid gap-6 rounded-lg border border-border-accent-muted bg-surface-panel p-6 transition hover:border-border-accent md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.nextService")}
              </p>
              <h2 className="mt-3 font-serif text-[34px] leading-10 text-text-primary">
                {nextService.title} <span className="italic text-text-accent">{nextService.accent}</span>
              </h2>
            </div>
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#1c1b1b] text-white transition group-hover:translate-x-1 group-hover:bg-[#854d63] dark:bg-white dark:text-[#1c1415]">
              <ArrowRightIcon className="size-5" />
            </span>
          </Link>
        </section>
      ) : null}
    </main>
  );
}
