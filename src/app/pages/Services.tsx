import {
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  PaintBrushIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toServiceViewModel } from "../../cms/adapters";
import { useCmsCollection } from "../../cms/cmsContent";
import type { CmsService } from "../../cms/types";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { servicesPageAccents } from "../components/serviceStyle";

type Service = {
  slug: string;
  featured?: boolean;
  title: string;
  accent: string;
  description: string;
  detailIntro: string;
  metricValue: string;
  metricLabel: string;
  bullets: string[];
  presentation?: string;
  whatIsIncluded?: string[];
  targetAudience?: string[];
  concreteApplications?: string[];
};

const serviceNumbers = ["01", "02", "03", "04", "05", "06"];

function isDesignService(service: Service) {
  return ["identite-visuelle", "visual-identity", "design-graphique", "graphic-design"].includes(service.slug);
}

export default function Services() {
  const { t, i18n } = useTranslation();
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const locale = i18n.language;
  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((service) => toServiceViewModel(service, locale));
    }
    return t("services.items", { returnObjects: true }) as Service[];
  }, [cmsServices, usingCmsServices, locale, t]);

  const firstService = services[0];
  const featureService = services.find((service) => service.featured) ?? firstService;
  const featureIsDesign = featureService ? isDesignService(featureService) : false;
  const regularServices = services;

  return (
    <main className={`${PAGE_MAIN} overflow-hidden bg-surface-page pb-24`}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-0"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
            {t("services.pageEyebrow")}
          </p>
          <h1 className="mt-6 max-w-[1120px] text-balance font-serif text-[52px] leading-[54px] text-text-primary sm:text-[72px] sm:leading-[72px] lg:text-[88px] lg:leading-[84px]">
            {t("services.pageTitleStart")}{" "}
            <span className="italic text-text-accent">{t("services.pageTitleAccent")}</span>
          </h1>
          <p className="mt-7 max-w-[920px] text-[18px] leading-8 text-text-secondary">
            {t("services.pageDescription")}
          </p>
        </div>
      </motion.section>

      {featureService ? (
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8 lg:px-0"
        >
          <article className="grid overflow-hidden rounded-lg border border-border-accent/40 bg-[#f9eee8] shadow-[0_28px_90px_rgba(91,65,55,0.10)] dark:border-white/10 dark:bg-surface-panel lg:grid-cols-[0.58fr_0.42fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-white text-text-accent shadow-[0_12px_34px_rgba(91,65,55,0.10)] dark:bg-white/8">
                  {featureIsDesign ? <PaintBrushIcon className="size-5" /> : <SparklesIcon className="size-5" />}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[2.4px] text-text-accent">
                  {t("services.featuredOffer")}
                </span>
              </div>

              <h2 className="mt-8 max-w-[720px] font-serif text-[42px] leading-[44px] text-text-primary sm:text-[58px] sm:leading-[60px]">
                {featureService.title}{" "}
                <span className="italic text-text-accent">{featureService.accent}</span>
              </h2>
              <p className="mt-6 max-w-[660px] text-[17px] leading-8 text-text-secondary">
                {featureService.presentation ?? featureService.detailIntro}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to={`/services/${featureService.slug}`}
                  viewTransition
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-on-strong transition hover:-translate-y-0.5 hover:bg-action-strong-hover active:translate-y-0"
                >
                  {t("services.openService")}
                  <ArrowRightIcon className="size-4" />
                </Link>
                {featureIsDesign ? (
                  <Link
                    to="/services/brief-design"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-accent bg-white/70 px-6 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-accent transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 dark:border-white/15 dark:bg-white/6 dark:hover:bg-white/10"
                  >
                    {t("services.designBriefCta")}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid border-t border-border-accent/35 bg-white/54 p-7 dark:border-white/10 dark:bg-white/5 sm:p-10 lg:border-l lg:border-t-0">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("services.includedPreview")}
              </p>
              <div className="mt-8 grid content-start gap-5">
                {(featureService.whatIsIncluded ?? featureService.bullets).slice(0, 4).map((item, index) => (
                  <div key={item} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-border-accent-muted pt-5 first:border-t-0 first:pt-0">
                    <span className="font-serif text-[28px] italic leading-none text-text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-7 text-text-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </motion.section>
      ) : null}

      <section className="mx-auto mt-18 grid max-w-[1180px] gap-8 px-5 sm:px-8 lg:grid-cols-[16rem_1fr] lg:px-0">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
            {t("services.serviceMap")}
          </p>
          <div className="mt-5 hidden border-l border-border-accent-muted pl-5 lg:grid lg:gap-3">
            {services.map((service, index) => (
              <a
                key={service.slug}
                href={`#${service.slug}`}
                className="text-[13px] leading-5 text-text-secondary transition hover:text-text-accent"
              >
                {serviceNumbers[index] ?? String(index + 1).padStart(2, "0")} {service.title} {service.accent}
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {regularServices.map((service, index) => {
            const serviceIndex = services.findIndex((item) => item.slug === service.slug);
            const accent = servicesPageAccents[index % servicesPageAccents.length];
            const previewItems = (service.whatIsIncluded ?? service.bullets).slice(0, 2);

            return (
              <motion.article
                id={service.slug}
                key={service.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className={`group grid gap-7 rounded-lg border ${accent.border} bg-surface-panel p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(91,65,55,0.09)] dark:border-white/10 dark:bg-surface-panel sm:p-7 lg:grid-cols-[0.78fr_1fr_auto] lg:items-center`}
              >
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-muted">
                    {serviceNumbers[serviceIndex] ?? String(serviceIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-serif text-[34px] leading-[38px] text-text-primary">
                    {service.title} <span className={`italic ${accent.text}`}>{service.accent}</span>
                  </h3>
                </div>

                <div>
                  <p className="max-w-[560px] text-[15px] leading-7 text-text-secondary">
                    {service.presentation ?? service.detailIntro}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {previewItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-surface-page px-3 py-2 text-[12px] leading-5 text-text-secondary dark:bg-white/6"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to={`/services/${service.slug}`}
                  viewTransition
                  className="inline-flex size-12 items-center justify-center rounded-full bg-[#1c1b1b] text-white transition group-hover:translate-x-1 group-hover:bg-[#854d63] active:translate-y-0 dark:bg-white dark:text-[#1c1415]"
                  aria-label={`${t("services.openService")} ${service.title} ${service.accent}`}
                >
                  <ArrowRightIcon className="size-5" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-16 grid max-w-[1180px] gap-8 border-t border-border-accent-muted px-5 pt-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-0"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
            {t("services.pageCtaEyebrow")}
          </p>
          <h2 className="mt-4 max-w-[760px] font-serif text-[34px] leading-[38px] text-text-primary sm:text-[46px] sm:leading-[50px]">
            {t("services.pageCtaTitle")}
          </h2>
          <p className="mt-5 max-w-[680px] text-[16px] leading-7 text-text-secondary">
            {t("services.pageCtaDescription")}
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[#854d63] px-7 text-[12px] font-semibold uppercase tracking-[1.4px] text-white shadow-[0_16px_34px_rgba(133,77,99,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6a364b] active:translate-y-0 dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
        >
          {t("services.pageCta")}
        </Link>
      </motion.section>
    </main>
  );
}
