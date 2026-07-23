import { CalendarDaysIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { lazy, Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { ContactForm } from "../components/ContactForm";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { PAGE_MAIN_SPACIOUS, PAGE_SCROLL_MARGIN } from "../components/layout/publicPage";

type ContactMode = "form" | "meeting";

const CalMeetingEmbed = lazy(() => import("../components/CalMeetingEmbed"));

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const contentPanelRef = useRef<HTMLDivElement>(null);
  const scrollAfterModeChangeRef = useRef(false);
  const mode: ContactMode = searchParams.get("mode") === "form" ? "form" : "meeting";

  const scrollToContentPanel = () => {
    const panel = contentPanelRef.current;
    if (!panel) {
      return;
    }

    const navOffset = 112;
    const top = window.scrollY + panel.getBoundingClientRect().top - navOffset;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const selectMode = (nextMode: ContactMode) => {
    scrollAfterModeChangeRef.current = true;
    setSearchParams(nextMode === "form" ? { mode: "form" } : {}, { preventScrollReset: true });
  };

  useEffect(() => {
    if (!scrollAfterModeChangeRef.current) {
      return;
    }

    scrollAfterModeChangeRef.current = false;
    const runScroll = () => scrollToContentPanel();
    const frame = window.requestAnimationFrame(runScroll);
    const timer = window.setTimeout(runScroll, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [mode]);

  return (
    <main className={PAGE_MAIN_SPACIOUS}>
      <section className="mx-auto max-w-[1160px]">
        <div className="max-w-[860px]">
          <SectionEyebrow className="tracking-[4px]">{t("contactPage.eyebrow")}</SectionEyebrow>
          <h1 className="mt-4 max-w-[820px] font-serif text-[clamp(3.15rem,6.2vw,5.85rem)] leading-[0.92] lg:max-w-[760px]">
            {t("contactPage.titleStart")}{" "}
            <span className="block italic text-text-accent dark:text-text-accent">{t("contactPage.titleAccent")}</span>
          </h1>
          <p className="mt-8 max-w-[850px] text-base leading-7 text-text-secondary dark:text-text-secondary">
            {t("contactPage.description")}
          </p>
        </div>

        <div className="mt-9 grid max-w-[790px] gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectMode("form")}
            aria-pressed={mode === "form"}
            className={`min-h-[124px] rounded-[16px] border p-5 text-left transition ${
              mode === "form"
                ? "border-[#854d63]/55 bg-[#ffd9e4]/60 text-text-accent dark:border-[#f0adc4]/55 dark:bg-[#854d63]/28 dark:text-text-accent"
                : "border-border-subtle bg-white text-text-secondary hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-text-secondary"
            }`}
          >
            <span className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[3px]">
              <PaperAirplaneIcon className="size-5 shrink-0" />
              {t("contactPage.formOption")}
            </span>
            <span className="mt-4 block max-w-[24rem] text-[15px] leading-7 text-text-secondary dark:text-text-secondary">
              {t("contactPage.formOptionDescription")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => selectMode("meeting")}
            aria-pressed={mode === "meeting"}
            className={`min-h-[124px] rounded-[16px] border p-5 text-left transition ${
              mode === "meeting"
                ? "border-[#854d63]/55 bg-[#ffd9e4]/60 text-text-accent dark:border-[#f0adc4]/55 dark:bg-[#854d63]/28 dark:text-text-accent"
                : "border-border-subtle bg-white text-text-secondary hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-text-secondary"
            }`}
          >
            <span className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[3px]">
              <CalendarDaysIcon className="size-5 shrink-0" />
              {t("contactPage.meetingOption")}
            </span>
            <span className="mt-4 block max-w-[24rem] text-[15px] leading-7 text-text-secondary dark:text-text-secondary">
              {t("contactPage.meetingOptionDescription")}
            </span>
          </button>
        </div>

        <div
          ref={contentPanelRef}
          id="contact-panel"
          className={`mt-16 ${PAGE_SCROLL_MARGIN} rounded-[28px] border border-border-subtle/90 bg-surface-panel p-5 shadow-[0_34px_96px_rgba(28,27,27,0.09)] dark:border-white/10 sm:p-8`}
        >
          <div
            className="t-page-slide min-h-[800px] rounded-[20px] border border-border-subtle/85 bg-surface-panel p-4 dark:border-white/10 sm:p-6"
            data-page={mode === "form" ? "1" : "2"}
          >
              <ContactForm
                variant="page"
                showTitle
                className="t-page t-panel-slide mx-auto grid max-w-[780px] gap-5 py-4 sm:py-8"
                formProps={{
                  "data-page-id": "1",
                  "data-open": mode === "form" ? "true" : "false",
                }}
              />
            <div
              className="t-page t-panel-slide w-full overflow-y-auto"
              data-page-id="2"
              data-open={mode === "meeting" ? "true" : "false"}
            >
              <div className="mx-auto w-full max-w-[1100px] py-1 sm:py-2">
                <Suspense
                  fallback={
                    <div className="mx-auto min-h-[760px] w-full max-w-[1080px] rounded-2xl border border-border-subtle/80 bg-white dark:border-white/10 dark:bg-surface-panel" />
                  }
                >
                  <CalMeetingEmbed />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
