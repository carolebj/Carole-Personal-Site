import { HomeIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { PageHero } from "../components/PageHero";
import { useSeoOverride } from "../seo/SeoOverrideContext";

export default function ServicesUnderConstruction() {
  const { t } = useTranslation();
  const seoOverride = useMemo(
    () => ({
      title: t("servicesConstruction.seoTitle"),
      description: t("servicesConstruction.description"),
    }),
    [t],
  );
  useSeoOverride(seoOverride);

  return (
    <main className={PAGE_MAIN}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[820px]"
      >
        <PageHero
          eyebrow={t("servicesConstruction.eyebrow")}
          title={
            <>
              {t("servicesConstruction.titleStart")}{" "}
              <span className="italic text-text-accent">{t("servicesConstruction.titleAccent")}</span>
            </>
          }
          titleClassName="text-[42px] leading-[46px] sm:text-[56px] sm:leading-[60px]"
        />

        <div className="mt-10 rounded-lg border border-border-accent/42 bg-surface-panel p-7 shadow-[var(--shadow-panel)] sm:p-10">
          <div className="flex size-14 items-center justify-center rounded-full bg-surface-accent-muted text-text-accent">
            <WrenchScrewdriverIcon className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-text-secondary">
            {t("servicesConstruction.description")}
          </p>
          <p className="mt-4 max-w-[640px] text-[15px] leading-7 text-text-muted">
            {t("servicesConstruction.note")}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-on-strong transition hover:bg-action-strong-hover active:scale-[0.98]"
            >
              <HomeIcon className="size-4" aria-hidden="true" />
              {t("servicesConstruction.backHome")}
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border-accent bg-surface-page px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-accent transition hover:border-border-accent-strong hover:bg-surface-accent-muted active:scale-[0.98]"
            >
              {t("servicesConstruction.contact")}
            </Link>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
