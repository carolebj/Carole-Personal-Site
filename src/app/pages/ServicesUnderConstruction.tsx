import { HomeIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ServiceWorkbench } from "../components/ServiceWorkbench";
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
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-surface-page px-5 pb-20 pt-28 text-text-primary sm:px-8 md:min-h-[calc(100vh-6rem)] md:pt-36">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-[760px] flex-col items-center text-center"
      >
        <ServiceWorkbench />

        <motion.h1
          className="mt-10 max-w-[24ch] font-serif text-[32px] leading-[1.12] text-text-primary sm:text-[44px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {t("servicesConstruction.headline")}
        </motion.h1>

        <motion.p
          className="mt-4 max-w-[62ch] text-[15px] leading-7 text-text-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {t("servicesConstruction.tagline")}
        </motion.p>

        <motion.div
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/"
            className="inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-full bg-action-strong px-7 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-on-strong transition hover:bg-action-strong-hover active:scale-[0.98]"
          >
            <HomeIcon className="size-4" aria-hidden="true" />
            {t("servicesConstruction.backHome")}
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-11 min-w-[200px] items-center justify-center rounded-full border border-border-accent bg-surface-page px-7 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-accent transition hover:border-border-accent-strong hover:bg-surface-accent-muted active:scale-[0.98]"
          >
            {t("servicesConstruction.contact")}
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
