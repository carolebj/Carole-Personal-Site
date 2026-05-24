import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { HomeIcon, MapIcon } from "@heroicons/react/24/outline";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#fcf9f8] px-4 py-20 text-[#1c1b1b] dark:bg-[#100d0d] dark:text-[#f8f1ec]">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-serif text-[12rem] text-[#854d63] sm:text-[18rem] md:text-[24rem] dark:text-[#f0adc4]"
        aria-hidden="true"
      >
        404
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mx-auto max-w-xl text-center"
      >
        <h1 className="mb-4 font-serif text-4xl text-[#1c1b1b] sm:text-5xl dark:text-[#f8f1ec]">
          {t("errorPages.notFound.title")}
        </h1>
        <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-[#5b4137] dark:text-[#dbc9c0]">
          {t("errorPages.notFound.description")}
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#854d63] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(133,77,99,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6a364b] active:translate-y-0 dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            <HomeIcon className="size-4" />
            {t("errorPages.notFound.backHome")}
          </Link>
          <Link
            to="/#projects"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#e4bfb2]/70 bg-white px-5 text-sm font-semibold text-[#854d63] transition hover:-translate-y-0.5 hover:border-[#854d63]/40 hover:bg-[#fbf1ee] active:translate-y-0 dark:border-white/12 dark:bg-white/5 dark:text-[#f0adc4] dark:hover:bg-white/10"
          >
            <MapIcon className="size-4" />
            {t("errorPages.notFound.explore")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
