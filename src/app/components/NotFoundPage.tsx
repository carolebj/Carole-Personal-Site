import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { HomeIcon, MapIcon } from "@heroicons/react/24/outline";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-emerald-950 px-4 py-20">
      {/* Grand 404 en filigrane */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[12rem] sm:text-[18rem] md:text-[24rem] text-amber-400 select-none"
        aria-hidden="true"
      >
        404
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        <h1 className="font-serif text-4xl sm:text-5xl text-stone-100 mb-4">
          {t("errorPages.notFound.title")}
        </h1>
        <p className="text-stone-300 text-lg mb-10 leading-relaxed">
          {t("errorPages.notFound.description")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-emerald-950 rounded-lg hover:bg-amber-400 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            {t("errorPages.notFound.backHome")}
          </Link>
          <Link
            to="/#projects"
            className="inline-flex items-center gap-2 px-6 py-3 border border-amber-500/40 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
          >
            <MapIcon className="w-4 h-4" />
            {t("errorPages.notFound.explore")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}