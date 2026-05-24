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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcf9f8] px-4 py-20 text-[#1c1b1b] dark:bg-[#100d0d] dark:text-[#f8f1ec]">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-serif text-[10rem] text-[#854d63] sm:text-[14rem] md:text-[20rem] dark:text-[#f0adc4]"
        aria-hidden="true"
      >
        {is404 ? "404" : "Oops"}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mx-auto max-w-xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="flex size-16 items-center justify-center rounded-full border border-[#e4bfb2]/50 bg-white text-[#854d63] shadow-[0_18px_48px_rgba(28,27,27,0.06)] dark:border-white/10 dark:bg-white/5 dark:text-[#f0adc4]">
            <ExclamationTriangleIcon className="size-8" />
          </div>
        </div>

        <h1 className="mb-4 font-serif text-4xl text-[#1c1b1b] sm:text-5xl dark:text-[#f8f1ec]">
          {title}
        </h1>
        <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-[#5b4137] dark:text-[#dbc9c0]">
          {description}
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={handleGoHome}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#854d63] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(133,77,99,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6a364b] active:translate-y-0 dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            <HomeIcon className="size-4" />
            {backHomeLabel}
          </button>
          <button
            onClick={handleRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#e4bfb2]/70 bg-white px-5 text-sm font-semibold text-[#854d63] transition hover:-translate-y-0.5 hover:border-[#854d63]/40 hover:bg-[#fbf1ee] active:translate-y-0 dark:border-white/12 dark:bg-white/5 dark:text-[#f0adc4] dark:hover:bg-white/10"
          >
            <ArrowPathIcon className="size-4" />
            {retryLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
