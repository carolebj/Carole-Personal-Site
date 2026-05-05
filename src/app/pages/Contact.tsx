import {
  CalendarDaysIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

type ContactMode = "form" | "meeting";

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: ContactMode = searchParams.get("mode") === "meeting" ? "meeting" : "form";
  const setMode = (nextMode: ContactMode) => {
    setSearchParams(nextMode === "meeting" ? { mode: "meeting" } : {});
  };

  return (
    <main className="bg-[#fcf9f8] px-5 pb-20 pt-28 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1120px]">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="pt-3">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
              {t("contactPage.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-[620px] font-serif text-[clamp(2.8rem,6vw,5.7rem)] leading-[0.98]">
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

          <div className="rounded-[28px] border border-[#e5e2e1]/80 bg-white p-5 shadow-[0_24px_80px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-[#171312] sm:p-7">
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
              <div className="min-h-[420px] rounded-2xl border border-dashed border-[#854d63]/35 bg-[#ffd9e4]/18 p-8 dark:border-[#f0adc4]/35 dark:bg-[#854d63]/16">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#1c1b1b] text-white dark:bg-[#f8f1ec] dark:text-[#1c1415]">
                  <ClockIcon className="size-6" />
                </div>
                <h2 className="mt-8 font-serif text-[36px] leading-none">{t("contactPage.meetingTitle")}</h2>
                <p className="mt-5 max-w-[34rem] text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                  {t("contactPage.meetingDescription")}
                </p>
                <a
                  href="mailto:caroletonoukouen@gmail.com?subject=Demande%20de%20rendez-vous"
                  className="mt-8 inline-flex h-12 items-center rounded-full bg-[#854d63] px-7 text-[12px] font-semibold uppercase tracking-[1px] text-white transition hover:bg-[#6a364b] dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
                >
                  {t("contactPage.meetingCta")}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
