import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import type React from "react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toServiceViewModel } from "../../../cms/adapters";
import { useCmsCollection } from "../../../cms/cmsContent";
import type { CmsService } from "../../../cms/types";
import { PageHero } from "../../components/PageHero";
import { servicesPageAccents } from "../../components/serviceStyle";
import { PAGE_MAIN } from "../../components/layout/publicPage";

type Service = {
  slug: string;
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

/** WIP listing page — wire from `dev` routes when ready for preview. */
export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const locale = i18n.language;
  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((s) => toServiceViewModel(s, locale));
    }
    return t("services.items", { returnObjects: true }) as Service[];
  }, [cmsServices, usingCmsServices, locale, t]);

  return (
    <main className={`overflow-hidden ${PAGE_MAIN}`}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16"
      >
        <PageHero
          eyebrow={t("services.pageEyebrow")}
          title={
            <>
              {t("services.pageTitleStart")}{" "}
              <span className="italic text-text-accent">{t("services.pageTitleAccent")}</span>
            </>
          }
          titleClassName="max-w-[620px] text-[42px] leading-[46px] sm:text-[58px] sm:leading-[62px]"
        />

        <div className="flex flex-col justify-end gap-7">
          <p className="max-w-[640px] text-[18px] leading-8 text-text-secondary dark:text-text-secondary">
            {t("services.pageDescription")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[t("services.pageSignalOne"), t("services.pageSignalTwo")].map((signal) => (
              <div
                key={signal}
                className="rounded-lg border border-border-accent/42 bg-white/64 p-4 text-[13px] font-semibold uppercase leading-5 tracking-[1.5px] text-text-accent shadow-[0_14px_38px_rgba(91,65,55,0.05)] dark:border-white/10 dark:bg-white/5 dark:text-text-accent"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        className="mx-auto mt-16 grid max-w-[1180px] gap-5 lg:grid-cols-2"
      >
        {services.map((service, index) => {
          const accent = servicesPageAccents[index % servicesPageAccents.length];
          const previewItems = (service.whatIsIncluded ?? service.bullets).slice(0, 3);

          return (
            <motion.div
              key={service.slug}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={`/services/${service.slug}`}
                viewTransition
                style={{ viewTransitionName: `service-card-${service.slug}` } as React.CSSProperties}
                className={`group flex h-full min-h-[330px] flex-col justify-between overflow-hidden rounded-lg border ${accent.border} ${accent.surface} p-6 shadow-[0_22px_56px_rgba(91,65,55,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(91,65,55,0.12)] active:translate-y-0 dark:border-white/10 dark:bg-surface-panel`}
              >
                <span className="flex items-start justify-between gap-6">
                  <span className={`flex size-12 items-center justify-center rounded-full ${accent.marker} ${accent.text}`}>
                    {index % 2 === 0 ? (
                      <ClipboardDocumentCheckIcon className="size-5" />
                    ) : (
                      <SparklesIcon className="size-5" />
                    )}
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[2px] text-[#8d7b72] dark:text-text-muted">
                    0{index + 1}
                  </span>
                </span>

                <span className="mt-10 block">
                  <span className="block font-serif text-[34px] leading-[38px] text-text-primary dark:text-text-primary">
                    {service.title}{" "}
                    <span className={`italic ${accent.text} dark:text-text-accent`}>{service.accent}</span>
                  </span>
                  <span className="mt-5 block max-w-[620px] text-[16px] leading-7 text-text-secondary dark:text-text-secondary">
                    {service.presentation ?? service.detailIntro}
                  </span>
                </span>

                <span className="mt-8 grid gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[2px] text-text-accent dark:text-text-accent">
                    {t("services.includedPreview")}
                  </span>
                  {previewItems.map((item) => (
                    <span key={item} className="flex items-start gap-3 text-sm leading-6 text-text-secondary dark:text-text-secondary">
                      <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-text-accent dark:text-text-accent" />
                      <span>{item}</span>
                    </span>
                  ))}
                </span>

                <span className="mt-9 flex items-center justify-between gap-5 border-t border-border-accent/42 pt-5 dark:border-white/10">
                  <span>
                    <span className="block text-[28px] font-semibold tabular-nums leading-none text-text-primary dark:text-text-primary">
                      {service.metricValue}
                    </span>
                    <span className="mt-2 block max-w-[260px] text-[12px] leading-5 text-[#6d625d] dark:text-text-muted">
                      {service.metricLabel}
                    </span>
                  </span>
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1c1b1b] text-[#fcf9f8] transition duration-300 group-hover:bg-[#854d63] group-hover:translate-x-1 dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:group-hover:bg-[#f0adc4]">
                    <ArrowRightIcon className="size-5" />
                  </span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-16 grid max-w-[1180px] gap-8 rounded-lg border border-border-accent/38 bg-white p-7 shadow-[0_24px_70px_rgba(91,65,55,0.08)] dark:border-white/10 dark:bg-surface-panel sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent dark:text-text-accent">
            {t("services.pageCtaEyebrow")}
          </p>
          <h2 className="mt-4 max-w-[720px] font-serif text-[34px] leading-[38px] text-text-primary dark:text-text-primary sm:text-[44px] sm:leading-[48px]">
            {t("services.pageCtaTitle")}
          </h2>
          <p className="mt-5 max-w-[720px] text-[16px] leading-7 text-text-secondary dark:text-text-secondary">
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
