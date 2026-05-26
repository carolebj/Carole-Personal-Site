import {
  CalendarDaysIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

type ContactMode = "form" | "meeting";

const CalMeetingEmbed = lazy(() => import("../components/CalMeetingEmbed"));

function getTransitionDurationMs(name: string, fallback: number) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
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

  const clearError = (name: string) => {
    setInvalidFields((current) => current.filter((field) => field !== name));
    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;

    if (form.checkValidity()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const invalidElements = Array.from(form.elements)
      .filter(
        (element): element is HTMLInputElement | HTMLTextAreaElement =>
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      )
      .filter((element) => !element.validity.valid);
    const invalidNames = invalidElements.map((element) => element.name).filter(Boolean);
    const firstInvalid = invalidElements[0];

    setInvalidFields(invalidNames);
    setFormError(firstInvalid?.validationMessage ?? "");

    window.setTimeout(() => {
      const shakeMs =
        getTransitionDurationMs("--shake-dur-a", 80) * 2 +
        getTransitionDurationMs("--shake-dur-b", 60) * 2;
      firstInvalid?.classList.remove("is-shaking");
      void firstInvalid?.offsetWidth;
      firstInvalid?.classList.add("is-shaking");
      window.setTimeout(() => firstInvalid?.classList.remove("is-shaking"), shakeMs + 20);
      firstInvalid?.focus();
    });
  };

  return (
    <main className="bg-[#fcf9f8] px-5 pb-28 pt-32 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1160px]">
        <div className="max-w-[860px]">
          <p className="text-[12px] font-semibold uppercase tracking-[4px] text-[#854d63] dark:text-[#f0adc4]">
            {t("contactPage.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-[820px] font-serif text-[clamp(3.15rem,6.2vw,5.85rem)] leading-[0.92] lg:max-w-[760px]">
            {t("contactPage.titleStart")}{" "}
            <span className="block italic text-[#854d63] dark:text-[#f0adc4]">{t("contactPage.titleAccent")}</span>
          </h1>
          <p className="mt-8 max-w-[850px] text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
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
                ? "border-[#854d63]/55 bg-[#ffd9e4]/60 text-[#854d63] dark:border-[#f0adc4]/55 dark:bg-[#854d63]/28 dark:text-[#f0adc4]"
                : "border-[#e5e2e1] bg-white text-[#5b4137] hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-[#dbc9c0]"
            }`}
          >
            <span className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[3px]">
              <PaperAirplaneIcon className="size-5 shrink-0" />
              {t("contactPage.formOption")}
            </span>
            <span className="mt-4 block max-w-[24rem] text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactPage.formOptionDescription")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => selectMode("meeting")}
            aria-pressed={mode === "meeting"}
            className={`min-h-[124px] rounded-[16px] border p-5 text-left transition ${
              mode === "meeting"
                ? "border-[#854d63]/55 bg-[#ffd9e4]/60 text-[#854d63] dark:border-[#f0adc4]/55 dark:bg-[#854d63]/28 dark:text-[#f0adc4]"
                : "border-[#e5e2e1] bg-white text-[#5b4137] hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-[#dbc9c0]"
            }`}
          >
            <span className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[3px]">
              <CalendarDaysIcon className="size-5 shrink-0" />
              {t("contactPage.meetingOption")}
            </span>
            <span className="mt-4 block max-w-[24rem] text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactPage.meetingOptionDescription")}
            </span>
          </button>
        </div>

        <div
          ref={contentPanelRef}
          id="contact-panel"
          className="mt-16 scroll-mt-28 rounded-[28px] border border-[#e5e2e1]/90 bg-white p-5 shadow-[0_34px_96px_rgba(28,27,27,0.09)] dark:border-white/10 dark:bg-[#171312] sm:scroll-mt-36 sm:p-8"
        >
          <div
            className="t-page-slide min-h-[800px] rounded-[20px] border border-[#e5e2e1]/85 bg-white p-4 dark:border-white/10 dark:bg-[#171312] sm:p-6"
            data-page={mode === "form" ? "1" : "2"}
          >
              <form
                noValidate
                onSubmit={handleSubmit}
                className={`t-input-wrap t-page t-panel-slide mx-auto grid max-w-[780px] gap-5 py-4 sm:py-8 ${formError ? "is-error" : ""}`}
                data-page-id="1"
                data-open={mode === "form" ? "true" : "false"}
              >
                <h2 className="font-serif text-[32px] leading-none">{t("contactPage.formTitle")}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={`t-input-wrap grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0] ${invalidFields.includes("name") ? "is-error" : ""}`}>
                    {t("contactSection.name")}
                    <input
                      name="name"
                      required
                      onInput={() => clearError("name")}
                      className={`t-input h-12 rounded-xl border bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:bg-white/5 dark:text-[#f8f1ec] ${invalidFields.includes("name") ? "is-error border-[#d4183d] dark:border-[#ff8aa1]" : "border-[#e5e2e1] dark:border-white/10"}`}
                    />
                  </label>
                  <label className={`t-input-wrap grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0] ${invalidFields.includes("email") ? "is-error" : ""}`}>
                    {t("contactSection.email")}
                    <input
                      type="email"
                      name="email"
                      required
                      onInput={() => clearError("email")}
                      className={`t-input h-12 rounded-xl border bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:bg-white/5 dark:text-[#f8f1ec] ${invalidFields.includes("email") ? "is-error border-[#d4183d] dark:border-[#ff8aa1]" : "border-[#e5e2e1] dark:border-white/10"}`}
                    />
                  </label>
                </div>
                <label className={`t-input-wrap grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0] ${invalidFields.includes("subject") ? "is-error" : ""}`}>
                  {t("contactSection.subject")}
                  <input
                    name="subject"
                    onInput={() => clearError("subject")}
                    className={`t-input h-12 rounded-xl border bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:bg-white/5 dark:text-[#f8f1ec] ${invalidFields.includes("subject") ? "is-error border-[#d4183d] dark:border-[#ff8aa1]" : "border-[#e5e2e1] dark:border-white/10"}`}
                  />
                </label>
                <label className={`t-input-wrap grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0] ${invalidFields.includes("message") ? "is-error" : ""}`}>
                  {t("contactSection.message")}
                  <textarea
                    name="message"
                    required
                    onInput={() => clearError("message")}
                    className={`t-input min-h-44 resize-y rounded-xl border bg-[#fcf9f8] px-4 py-3 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:bg-white/5 dark:text-[#f8f1ec] ${invalidFields.includes("message") ? "is-error border-[#d4183d] dark:border-[#ff8aa1]" : "border-[#e5e2e1] dark:border-white/10"}`}
                  />
                </label>
                <p className="t-error-msg text-sm font-medium text-[#d4183d] dark:text-[#ff8aa1]">
                  {formError}
                </p>
                <button
                  type="submit"
                  className="inline-flex h-12 w-fit items-center gap-3 whitespace-nowrap rounded-full bg-[#1c1b1b] px-7 text-[12px] font-semibold uppercase tracking-[1px] text-white transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
                >
                  <PaperAirplaneIcon className="size-4" />
                  {t("contactSection.submit")}
                </button>
              </form>
            <div
              className="t-page t-panel-slide w-full overflow-y-auto"
              data-page-id="2"
              data-open={mode === "meeting" ? "true" : "false"}
            >
              <div className="mx-auto w-full max-w-[780px] py-1 sm:py-2">
                <Suspense
                  fallback={
                    <div className="mx-auto min-h-[680px] w-full max-w-[760px] rounded-2xl border border-[#e5e2e1]/80 bg-white dark:border-white/10 dark:bg-[#171312]" />
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
