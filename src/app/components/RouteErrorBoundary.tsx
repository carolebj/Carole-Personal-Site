import { useRouteError, isRouteErrorResponse, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { HomeIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  // Log en console pour le debug, jamais exposé à l'utilisateur
  console.error("[RouteErrorBoundary]", error);

  const title = is404
    ? t("errorPages.notFound.title")
    : t("errorPages.routeError.title");

  const description = is404
    ? t("errorPages.notFound.description")
    : t("errorPages.routeError.description");

  const watermark = is404 ? "404" : "Oops";

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#fcf9f8] px-4 py-20 text-[#1c1b1b] dark:bg-[#100d0d] dark:text-[#f8f1ec]">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-serif text-[10rem] text-[#854d63] sm:text-[14rem] md:text-[20rem] dark:text-[#f0adc4]"
        aria-hidden="true"
      >
        {watermark}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mx-auto max-w-xl text-center"
      >
        {!is404 && (
          <div className="flex justify-center mb-6">
            <div className="flex size-16 items-center justify-center rounded-full border border-[#e4bfb2]/50 bg-white text-[#854d63] shadow-[0_18px_48px_rgba(28,27,27,0.06)] dark:border-white/10 dark:bg-white/5 dark:text-[#f0adc4]">
              <ExclamationTriangleIcon className="size-8" />
            </div>
          </div>
        )}

        <h1 className="mb-4 font-serif text-4xl text-[#1c1b1b] sm:text-5xl dark:text-[#f8f1ec]">
          {title}
        </h1>
        <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-[#5b4137] dark:text-[#dbc9c0]">
          {description}
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#854d63] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(133,77,99,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6a364b] active:translate-y-0 dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            <HomeIcon className="size-4" />
            {t("errorPages.notFound.backHome")}
          </Link>

          {!is404 && (
            <button
              onClick={() => navigate(0)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#e4bfb2]/70 bg-white px-5 text-sm font-semibold text-[#854d63] transition hover:-translate-y-0.5 hover:border-[#854d63]/40 hover:bg-[#fbf1ee] active:translate-y-0 dark:border-white/12 dark:bg-white/5 dark:text-[#f0adc4] dark:hover:bg-white/10"
            >
              <ArrowPathIcon className="size-4" />
              {t("errorPages.routeError.retry")}
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
