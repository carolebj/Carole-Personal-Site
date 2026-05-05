import {
  CalendarDaysIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

type ContactMode = "form" | "meeting";

const CalMeetingEmbed = lazy(() => import("../components/CalMeetingEmbed"));

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: ContactMode = searchParams.get("mode") === "meeting" ? "meeting" : "form";
  const setMode = (nextMode: ContactMode) => {
    setSearchParams(nextMode === "meeting" ? { mode: "meeting" } : {});
  };

  return (
    <main className="bg-[#fcf9f8] px-5 pb-20 pt-28 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,820px)] lg:items-start lg:justify-between xl:grid-cols-[380px_minmax(0,840px)] xl:gap-14">
          <div className="pt-3">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
              {t("contactPage.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-[430px] font-serif text-[clamp(2.6rem,5vw,4.75rem)] leading-[0.98]">
              {t("contactPage.titleStart")}{" "}
              <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("contactPage.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactPage.description")}
            </p>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={() => setMode("form")}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "form"
                    ? "border-[#854d63]/50 bg-[#ffd9e4]/55 text-[#854d63] dark:border-[#f0adc4]/50 dark:bg-[#854d63]/28 dark:text-[#f0adc4]"
                    : "border-[#e5e2e1] bg-white text-[#5b4137] hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-[#dbc9c0]"
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[2px]">
                  <PaperAirplaneIcon className="size-5" />
                  {t("contactPage.formOption")}
                </span>
                <span className="mt-3 block text-sm leading-6 text-[#5b4137] dark:text-[#dbc9c0]">
                  {t("contactPage.formOptionDescription")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("meeting")}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "meeting"
                    ? "border-[#854d63]/50 bg-[#ffd9e4]/55 text-[#854d63] dark:border-[#f0adc4]/50 dark:bg-[#854d63]/28 dark:text-[#f0adc4]"
                    : "border-[#e5e2e1] bg-white text-[#5b4137] hover:border-[#854d63]/35 dark:border-white/10 dark:bg-white/5 dark:text-[#dbc9c0]"
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[2px]">
                  <CalendarDaysIcon className="size-5" />
                  {t("contactPage.meetingOption")}
                </span>
                <span className="mt-3 block text-sm leading-6 text-[#5b4137] dark:text-[#dbc9c0]">
                  {t("contactPage.meetingOptionDescription")}
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e5e2e1]/80 bg-white p-4 shadow-[0_24px_80px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-[#171312] sm:p-5">
            {mode === "form" ? (
              <form className="grid gap-5">
                <h2 className="font-serif text-[32px] leading-none">{t("contactPage.formTitle")}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                    {t("contactSection.name")}
                    <input className="h-12 rounded-xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec]" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                    {t("contactSection.email")}
                    <input
                      type="email"
                      className="h-12 rounded-xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec]"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                  {t("contactSection.subject")}
                  <input className="h-12 rounded-xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec]" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                  {t("contactSection.message")}
                  <textarea className="min-h-44 resize-y rounded-xl border border-[#e5e2e1] bg-[#fcf9f8] px-4 py-3 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec]" />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-12 w-fit items-center gap-3 rounded-full bg-[#1c1b1b] px-7 text-[12px] font-semibold uppercase tracking-[1px] text-white transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
                >
                  <PaperAirplaneIcon className="size-4" />
                  {t("contactSection.submit")}
                </button>
              </form>
            ) : (
              <Suspense
                fallback={
                  <div className="min-h-[760px] rounded-2xl border border-[#e5e2e1]/80 bg-white dark:border-white/10 dark:bg-[#171312]" />
                }
              >
                <CalMeetingEmbed />
              </Suspense>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
