import { useTranslation } from "react-i18next";

export default function Cv() {
  const { t } = useTranslation();

  return (
    <section className="min-h-[70vh] bg-[#fcf9f8] px-5 pb-20 pt-32 dark:bg-[#13100f] sm:px-8 lg:px-8">
      <div className="mx-auto max-w-[920px]">
        <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
          {t("cv.eyebrow")}
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,5rem)] leading-none text-[#1c1b1b] dark:text-[#f8f1ec]">
          Curriculum Vitæ
        </h1>
        <p className="mt-6 max-w-[42rem] text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0] sm:text-[18px] sm:leading-8">
          {t("cv.description")}
        </p>
      </div>
    </section>
  );
}
