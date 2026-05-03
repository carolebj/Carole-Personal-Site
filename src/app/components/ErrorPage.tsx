import { useRouteError, isRouteErrorResponse } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { HomeIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * Fallback i18n en dur : si les traductions ne sont pas chargées
 * (ex. le Layout lui-même a crashé avant l'init i18n),
 * on utilise ce dictionnaire local.
 */
const fallback: Record<string, Record<string, string>> = {
  fr: {
    title: "Quelque chose s'est mal passé",
    description:
      "Une erreur inattendue est survenue. Veuillez réessayer ou revenir à l'accueil.",
    backHome: "Retour à l'accueil",
    retry: "Réessayer",
  },
  en: {
    title: "Something went wrong",
    description:
      "An unexpected error occurred. Please try again or go back to the homepage.",
    backHome: "Back to homepage",
    retry: "Try again",
  },
};

function getFallbackLang(): string {
  try {
    const stored = localStorage.getItem("portfolio-lang");
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    // ignore
  }
  const browserLang = navigator.language || "";
  return browserLang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export default function ErrorPage() {
  const error = useRouteError();
  const { t, ready } = useTranslation();

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  // Log en console, jamais de stack trace à l'utilisateur
  console.error("[ErrorPage]", error);

  // Utilise i18next si prêt, sinon fallback local
  const lang = getFallbackLang();
  const fb = fallback[lang] || fallback.fr;

  const title = ready
    ? is404
      ? t("errorPages.notFound.title")
      : t("errorPages.critical.title")
    : fb.title;

  const description = ready
    ? is404
      ? t("errorPages.notFound.description")
      : t("errorPages.critical.description")
    : fb.description;

  const backHomeLabel = ready
    ? t("errorPages.notFound.backHome")
    : fb.backHome;

  const retryLabel = ready
    ? t("errorPages.routeError.retry")
    : fb.retry;

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Filigrane */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[10rem] sm:text-[14rem] md:text-[20rem] text-amber-400 select-none"
        aria-hidden="true"
      >
        {is404 ? "404" : "Oops"}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl text-stone-100 mb-4">
          {title}
        </h1>
        <p className="text-stone-300 text-lg mb-10 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-emerald-950 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <HomeIcon className="w-4 h-4" />
            {backHomeLabel}
          </button>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 border border-amber-500/40 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {retryLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}