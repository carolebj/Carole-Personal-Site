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
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-emerald-950 px-4 py-20">
      {/* Filigrane */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[10rem] sm:text-[14rem] md:text-[20rem] text-amber-400 select-none"
        aria-hidden="true"
      >
        {watermark}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        {!is404 && (
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        )}

        <h1 className="font-serif text-4xl sm:text-5xl text-stone-100 mb-4">
          {title}
        </h1>
        <p className="text-stone-300 text-lg mb-10 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-emerald-950 rounded-lg hover:bg-amber-400 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            {t("errorPages.notFound.backHome")}
          </Link>

          {!is404 && (
            <button
              onClick={() => navigate(0)}
              className="inline-flex items-center gap-2 px-6 py-3 border border-amber-500/40 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              {t("errorPages.routeError.retry")}
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}