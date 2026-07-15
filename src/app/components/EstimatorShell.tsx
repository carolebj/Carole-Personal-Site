import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Link } from "react-router";
import caroleLogoSymbol from "../../assets/logos/carole-CT-logo.svg";
import { useLang } from "../i18n/LanguageContext";

type EstimatorShellProps = {
  children: ReactNode;
};

export default function EstimatorShell({ children }: EstimatorShellProps) {
  const { lang } = useLang();
  const isEnglish = lang === "en";
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-page text-text-primary">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border-subtle bg-surface-page/92 backdrop-blur-xl">
        <div className="mx-auto grid h-full w-full max-w-[1512px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-2 text-[12px] font-semibold text-text-secondary transition-colors hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page sm:px-3"
            aria-label={isEnglish ? "Leave the estimator and return to the website" : "Quitter l’estimateur et revenir au site"}
          >
            <ArrowLeftIcon className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{isEnglish ? "Back to the website" : "Retour au site"}</span>
          </Link>

          <Link
            to="/"
            className="flex size-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
            aria-label={isEnglish ? "Carole Tonoukouen — home" : "Carole Tonoukouen — accueil"}
          >
            <img
              src={caroleLogoSymbol}
              alt=""
              className="size-8 dark:invert"
              aria-hidden="true"
            />
          </Link>

          <p className="justify-self-end text-right text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted sm:text-[11px] sm:tracking-[1.8px]">
            {isEnglish ? "Project estimator" : "Estimateur de projet"}
          </p>
        </div>
      </header>

      <main className="min-w-0 flex-1">{children}</main>

      <footer className="border-t border-border-subtle bg-surface-panel/60">
        <div className="mx-auto flex min-h-16 w-full max-w-[1512px] flex-col items-center justify-center gap-2 px-5 py-4 text-center text-[11px] leading-5 text-text-muted sm:flex-row sm:justify-between sm:px-8 sm:text-left lg:px-10">
          <p>© {year} Carole Tonoukouen</p>
          <Link
            to="/"
            className="font-semibold text-text-secondary underline-offset-4 transition-colors hover:text-text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
          >
            {isEnglish ? "Return to the website" : "Retourner sur le site"}
          </Link>
        </div>
      </footer>
    </div>
  );
}
