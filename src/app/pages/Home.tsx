import { EnvelopeIcon, PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import portraitImage from "../../assets/carole-redesign-portrait.png";
import workingImage from "../../assets/carole-redesign-working.png";
import clientOneImage from "../../assets/carole-redesign-client-1.png";
import clientTwoImage from "../../assets/carole-redesign-client-2.png";
import clientThreeImage from "../../assets/carole-redesign-client-3.png";
import announcementMegaphoneIcon from "../../assets/icons/announcement-megaphone.svg?raw";
import brandFlagIcon from "../../assets/icons/brand-flag.svg?raw";
import coffeeCupIcon from "../../assets/icons/coffee-cup.svg?raw";
import contentBriefEditIcon from "../../assets/icons/content-brief-edit.svg?raw";
import decorativeArc from "../../assets/icons/decorative-arc.svg";
import documentEditIcon from "../../assets/icons/document-edit.svg?raw";
import growthArrowIcon from "../../assets/icons/growth-arrow.svg?raw";

type Service = {
  slug: string;
  title: string;
  accent: string;
  description: string;
};

type Trait = {
  label: string;
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

type InlineIconProps = {
  src: string;
  className: string;
};

type VisualTuning = {
  heroScale: number;
  heroY: number;
  heroObjectY: number;
  aboutScale: number;
  aboutY: number;
  aboutObjectY: number;
  aboutBrightness: number;
};

type VisualTuningKey = keyof VisualTuning;

const VISUAL_TUNING_STORAGE_KEY = "carole-visual-tuning";
const SHOW_VISUAL_TUNING_PANEL = false;
const DEFAULT_VISUAL_TUNING: VisualTuning = {
  heroScale: 1.24,
  heroY: -10,
  heroObjectY: 100,
  aboutScale: 1.3,
  aboutY: 12,
  aboutObjectY: 28,
  aboutBrightness: 0.94,
};

const visualTuningControls: Array<{
  key: VisualTuningKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "heroScale", label: "Hero zoom", min: 0.95, max: 1.25, step: 0.01 },
  { key: "heroY", label: "Hero Y", min: -12, max: 12, step: 1 },
  { key: "heroObjectY", label: "Hero crop Y", min: 0, max: 100, step: 1 },
  { key: "aboutScale", label: "About zoom", min: 1, max: 1.35, step: 0.01 },
  { key: "aboutY", label: "About Y", min: -12, max: 12, step: 1 },
  { key: "aboutObjectY", label: "About crop Y", min: 0, max: 100, step: 1 },
  { key: "aboutBrightness", label: "About exposure", min: 0.75, max: 1.05, step: 0.01 },
];

const serviceIcons = [
  brandFlagIcon,
  announcementMegaphoneIcon,
  contentBriefEditIcon,
  growthArrowIcon,
];
const serviceAccents = [
  {
    icon: "bg-[#ffd9e4]",
    corner: "bg-[#ffd9e4]/55",
    glyph: "text-[#854d63]",
    title: "text-[#854d63] dark:text-[#d8a4c7]",
  },
  {
    icon: "bg-[#ffdcbd]",
    corner: "bg-[#ffdcbd]/55",
    glyph: "text-[#8a5100]",
    title: "text-[#8a5100] dark:text-[#ffbf8c]",
  },
  {
    icon: "bg-[#ffdbcf]",
    corner: "bg-[#ffdbcf]/55",
    glyph: "text-[#a83900]",
    title: "text-[#a83900] dark:text-[#ff9a66]",
  },
  {
    icon: "bg-[#e5e2e1]",
    corner: "bg-[#e5e2e1]/70",
    glyph: "text-[#5b4137]",
    title: "text-[#5b4137] dark:text-[#ded7d2]",
  },
];
const traitIcons = [documentEditIcon, brandFlagIcon, coffeeCupIcon];
const traitAccents = [
  { icon: "bg-[#ffd9e4]", glyph: "text-[#854d63]" },
  { icon: "bg-[#ffdcbd]", glyph: "text-[#8a5100]" },
  { icon: "bg-[#ffdbcf]", glyph: "text-[#a83900]" },
];
const testimonialImages = [clientOneImage, clientTwoImage, clientThreeImage];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
      {children}
    </p>
  );
}

function InlineIcon({ src, className }: InlineIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`block [&_path]:fill-current [&_svg]:h-full [&_svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: src }}
    />
  );
}

function readStoredVisualTuning() {
  if (typeof window === "undefined") {
    return DEFAULT_VISUAL_TUNING;
  }

  try {
    const stored = window.localStorage.getItem(VISUAL_TUNING_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_VISUAL_TUNING;
    }

    return {
      ...DEFAULT_VISUAL_TUNING,
      ...(JSON.parse(stored) as Partial<VisualTuning>),
    };
  } catch {
    return DEFAULT_VISUAL_TUNING;
  }
}

function VisualTuningPanel({
  tuning,
  onChange,
  onReset,
}: {
  tuning: VisualTuning;
  onChange: (key: VisualTuningKey, value: number) => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const exportedValues = JSON.stringify(tuning, null, 2);

  return (
    <div className="fixed bottom-4 right-4 z-[80] font-sans text-[#1c1b1b] print:hidden">
      {isOpen ? (
        <div className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#e4bfb2]/40 bg-white/95 p-4 shadow-[0_24px_80px_rgba(28,27,27,0.16)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#854d63]">Visual tuning</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-[#e5e2e1] px-3 py-1 text-xs font-semibold uppercase tracking-[1px]"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {visualTuningControls.map((control) => (
              <label key={control.key} className="block">
                <span className="mb-1 flex items-center justify-between text-xs font-medium">
                  <span>{control.label}</span>
                  <span className="tabular-nums text-[#854d63]">{tuning[control.key]}</span>
                </span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={tuning[control.key]}
                  onChange={(event) => onChange(control.key, Number(event.target.value))}
                  className="w-full accent-[#854d63]"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(exportedValues)}
              className="flex-1 rounded-full bg-[#1c1b1b] px-3 py-2 text-xs font-semibold uppercase tracking-[1px] text-white"
            >
              Copy values
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[#e5e2e1] px-3 py-2 text-xs font-semibold uppercase tracking-[1px]"
            >
              Reset
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#5b4137]">
            Saved locally in this browser. Send me the copied values when you want them baked into the code.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[#854d63] px-4 py-3 text-xs font-semibold uppercase tracking-[1px] text-white shadow-[0_16px_44px_rgba(133,77,99,0.3)]"
        >
          Tune
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const services = t("services.items", { returnObjects: true }) as Service[];
  const traits = t("about.traits", { returnObjects: true }) as Trait[];
  const testimonials = t("testimonials.items", { returnObjects: true }) as Testimonial[];
  const [visualTuning, setVisualTuning] = useState(DEFAULT_VISUAL_TUNING);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    setVisualTuning(readStoredVisualTuning());
  }, []);

  useEffect(() => {
    if (!isDev || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(VISUAL_TUNING_STORAGE_KEY, JSON.stringify(visualTuning));
  }, [isDev, visualTuning]);

  const handleVisualTuningChange = (key: VisualTuningKey, value: number) => {
    setVisualTuning((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="overflow-hidden bg-[#fcf9f8] text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec]">
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center bg-[linear-gradient(160deg,#fffafa_0%,#fcf9f8_42%,#fbf8f7_100%)] px-5 pb-12 pt-24 dark:bg-[linear-gradient(160deg,#1b1515_0%,#13100f_54%,#21171a_100%)] sm:px-8 sm:pt-28 md:min-h-[755px] lg:px-8 lg:pb-16 lg:pt-28">
        <div className="pointer-events-none absolute right-[-14rem] top-[-13rem] size-[38rem] rounded-full bg-[#ffd9e4]/35 blur-[90px] dark:bg-[#854d63]/18" />
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-[672px]"
          >
            <h1 className="max-w-[672px] font-serif text-[40px] leading-[44px] text-[#1c1b1b] dark:text-[#f8f1ec] sm:text-[48px] sm:leading-[52px] lg:text-[56px] lg:leading-[60px] 2xl:text-[64px] 2xl:leading-[68px]">
              {t("hero.titleStart")}{" "}
              <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("hero.titleAccent")}</span>{" "}
              {t("hero.titleEnd")}
            </h1>
            <p className="mt-6 max-w-[528px] text-[16px] leading-7 text-[#5b4137] dark:text-[#dbc9c0] md:text-[18px] md:leading-8">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex h-10 min-w-[144px] items-center justify-center rounded-full bg-[#1c1b1b] px-6 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#fcf9f8] shadow-[0_14px_32px_rgba(28,27,27,0.13)] transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4] md:h-[52px] md:min-w-[176px] md:px-8 md:tracking-[1px]"
              >
                {t("hero.primaryCta")}
              </a>
              <a
                href="#services"
                className="inline-flex h-10 min-w-[144px] items-center justify-center rounded-full border border-[#1c1b1b]/20 px-6 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#1c1b1b] transition hover:border-[#854d63] hover:text-[#854d63] dark:border-white/20 dark:text-[#f8f1ec] dark:hover:border-[#f0adc4] dark:hover:text-[#f0adc4] md:h-[52px] md:min-w-[172px] md:px-8 md:tracking-[1px]"
              >
                {t("hero.secondaryCta")}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6 }}
            transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
            className="group relative mx-auto flex min-h-[300px] w-full max-w-[350px] items-center justify-center sm:min-h-[360px] sm:max-w-[390px] lg:min-h-[460px] lg:max-w-[430px]"
          >
            <div className="organic-shape absolute inset-x-4 inset-y-7 rotate-[-4deg] bg-[#f9b3cc]/42 transition duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[-6deg]" />
            <div className="organic-shape-alt absolute inset-x-7 inset-y-5 rotate-6 border border-[#854d63]/28 transition duration-500 ease-out group-hover:translate-y-2 group-hover:rotate-[8deg]" />
            <div className="organic-shape relative z-10 aspect-[4/5] w-[74%] max-w-[330px] overflow-hidden bg-[#fbaa51] shadow-[0_24px_60px_rgba(28,27,27,0.18)] transition duration-500 ease-out group-hover:shadow-[0_32px_74px_rgba(28,27,27,0.2)] sm:max-w-[350px] lg:max-w-[360px]">
              <img
                src={portraitImage}
                alt={t("hero.imageAlt")}
                className="h-full w-full object-contain object-bottom"
                style={{
                  objectPosition: `50% ${visualTuning.heroObjectY}%`,
                  transform: `translateY(${visualTuning.heroY}%) scale(${visualTuning.heroScale})`,
                }}
              />
            </div>
            <div className="absolute bottom-7 left-6 z-20 flex rotate-[-3deg] items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_16px_38px_rgba(28,27,27,0.14)] backdrop-blur-md transition duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[-5deg] dark:border-white/10 dark:bg-[#201817]/90">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#ffd9e4] text-[#854d63]">
                <SparklesIcon className="size-4" />
              </span>
              <p className="font-serif text-[16px] leading-4 text-[#1c1b1b] dark:text-[#f8f1ec]">
                {t("hero.badgeTop")}
                <br />
                <span className="italic text-[#854d63]">{t("hero.badgeBottom")}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        id="manifesto"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-[#fcf9f8] px-5 py-16 dark:bg-[#13100f] sm:px-8 lg:py-24"
      >
        <div className="relative mx-auto max-w-[48rem] text-center">
          <h2 className="font-serif text-[clamp(2rem,4vw,3.45rem)] leading-[1.04] dark:text-[#f8f1ec]">
            {t("manifesto.titleTop")}
            <br />
            <span className="relative isolate inline-block font-liberation-serif italic text-[#854d63] dark:text-[#f0adc4]">
              {t("manifesto.titleAccent")}
              <img
                src={decorativeArc}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[70%] z-[-1] h-auto w-[104%] -translate-x-1/2"
              />
            </span>
          </h2>
          <div className="mx-auto mt-8 max-w-[42rem] space-y-5 text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0] sm:text-[18px] sm:leading-8">
            <p>{t("manifesto.p1")}</p>
            <p>{t("manifesto.p2")}</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="about"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white px-5 py-16 dark:bg-[#181312] sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-[350px] sm:max-w-[380px]">
            <div className="organic-shape absolute -inset-4 rotate-12 bg-[#ffdcbd]/55" />
            <div className="organic-shape-third relative aspect-[4/5] overflow-hidden bg-[#ffafcd] shadow-[0_18px_52px_rgba(28,27,27,0.15)]">
              <img
                src={workingImage}
                alt={t("about.imageAlt")}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `50% ${visualTuning.aboutObjectY}%`,
                  transform: `translateY(${visualTuning.aboutY}%) scale(${visualTuning.aboutScale})`,
                  filter: `brightness(${visualTuning.aboutBrightness}) contrast(1.06) saturate(0.95)`,
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="font-serif text-[clamp(2rem,3.7vw,3.2rem)] leading-[1.06] dark:text-[#f8f1ec]">
              {t("about.titleTop")}
              <br />
              <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("about.titleAccent")}</span>
            </h2>
            <div className="mt-5 max-w-[42rem] space-y-4 text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0] sm:text-[16px] sm:leading-8">
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-4 border-t border-[#e5e2e1]/80 pt-7 dark:border-white/10 sm:flex sm:flex-wrap sm:gap-7">
              {traits.map((trait, index) => {
                const icon = traitIcons[index] ?? documentEditIcon;
                const accent = traitAccents[index] ?? traitAccents[0];
                return (
                  <div key={trait.label} className="flex min-w-0 flex-col items-center gap-3 text-center sm:min-w-24">
                    <span className={`flex size-10 items-center justify-center rounded-full ${accent.icon}`}>
                      <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                    </span>
                    <span className="text-[12px] font-semibold uppercase tracking-[1px] text-[#5b4137] dark:text-[#cdb9ae] sm:tracking-[2px]">
                      {trait.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="services"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-[#f6f3f2]/80 px-5 py-16 dark:bg-[#1f1716] sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-10 max-w-[40rem] text-center">
            <h2 className="font-serif text-[clamp(2.1rem,3.7vw,3.1rem)] leading-none">
              <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("services.titleAccent")}</span>{" "}
              {t("services.titleRest")}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5b4137] dark:text-[#ded7d2] sm:text-[18px]">{t("services.subtitle")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
            {services.map((service, index) => {
              const icon = serviceIcons[index] ?? brandFlagIcon;
              const accent = serviceAccents[index] ?? serviceAccents[0];
              const isWide = index === 1 || index === 2;
              return (
                <Link
                  to={`/services/${service.slug}`}
                  key={`${service.title}-${service.accent}`}
                  className={`group relative overflow-hidden rounded-lg border border-[#e4bfb2]/25 bg-white p-6 text-left no-underline shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] dark:border-[#d8a4c7]/16 dark:bg-[#171111] dark:hover:border-[#d8a4c7]/28 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-7 ${
                    isWide ? "md:col-span-2" : ""
                  }`}
                >
                  <div className={`absolute right-0 top-0 size-28 -translate-y-24 translate-x-24 rounded-bl-full ${accent.corner} opacity-0 transition duration-500 ease-out group-hover:-translate-y-9 group-hover:translate-x-9 group-hover:opacity-100`} />
                  <span className={`relative flex size-11 items-center justify-center rounded-full ${accent.icon}`}>
                    <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                  </span>
                  <h3 className="relative mt-6 font-serif text-[24px] leading-7 text-[#1c1b1b] dark:text-[#f8f1ec]">
                    {service.title}
                    <br />
                    <span className={`italic ${accent.title}`}>{service.accent}</span>
                  </h3>
                  <p className="relative mt-4 max-w-2xl text-sm leading-6 text-[#5b4137] dark:text-[#ded7d2]">{service.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="testimonials"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white px-5 py-16 dark:bg-[#13100f] sm:px-8 lg:px-8 lg:py-24"
      >
        <div className="mx-auto mb-10 max-w-[40rem] text-center">
          <SectionEyebrow>{t("testimonials.eyebrow")}</SectionEyebrow>
          <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.2vw,2.75rem)] leading-tight dark:text-[#f8f1ec]">
            {t("testimonials.titleStart")}{" "}
            <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("testimonials.titleAccent")}</span>
          </h2>
        </div>
        <div className="mx-auto grid max-w-[1200px] gap-9 pt-7 md:grid-cols-3 md:gap-5 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className={`relative flex min-h-[290px] flex-col justify-between rounded-lg border p-6 pt-11 text-center shadow-[0_1px_2px_rgba(28,27,27,0.04)] ${
                index === 1
                  ? "border-[#854d63]/10 bg-[#ffd9e4]/40 dark:border-[#f0adc4]/24 dark:bg-[#3a2028]/72 md:-mt-6"
                  : "border-[#e4bfb2]/25 bg-white dark:border-[#d8a4c7]/14 dark:bg-[#171111]"
              }`}
            >
              <img
                src={testimonialImages[index]}
                alt={testimonial.name}
                className="absolute left-1/2 top-0 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#fcf9f8] object-cover shadow-sm dark:border-[#13100f]"
              />
              <p className="text-sm italic leading-6 text-[#5b4137] dark:text-[#ded7d2]">"{testimonial.quote}"</p>
              <div className="mt-7 border-t border-[#e5e2e1]/70 pt-5 dark:border-white/10">
                <p className="font-serif text-lg text-[#1c1b1b] dark:text-[#f8f1ec]">{testimonial.name}</p>
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                  {testimonial.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-[#fcf9f8] px-5 py-16 dark:bg-[#1a1413] sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <SectionEyebrow>{t("contactSection.eyebrow")}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] dark:text-[#f8f1ec]">
              {t("contactSection.titleStart")}{" "}
              <span className="italic text-[#854d63] dark:text-[#f0adc4]">{t("contactSection.titleAccent")}</span>
            </h2>
            <p className="mt-5 max-w-[32rem] text-base leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactSection.description")}
            </p>
            <a
              href="mailto:hello@carole.com"
              className="mt-7 inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[2px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8d7e3]"
            >
              <EnvelopeIcon className="size-5" />
              hello@carole.com
            </a>
          </div>

          <form
            action="mailto:hello@carole.com"
            method="post"
            encType="text/plain"
            className="rounded-lg border border-[#e4bfb2]/30 bg-white p-5 shadow-[0_18px_48px_rgba(28,27,27,0.06)] dark:border-white/10 dark:bg-[#13100f] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                {t("contactSection.name")}
                <input
                  name="name"
                  required
                  className="mt-2 h-12 w-full rounded-md border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-base font-normal text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec] dark:focus:border-[#f0adc4]"
                />
              </label>
              <label className="block text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
                {t("contactSection.email")}
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-2 h-12 w-full rounded-md border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-base font-normal text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec] dark:focus:border-[#f0adc4]"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactSection.subject")}
              <input
                name="subject"
                className="mt-2 h-12 w-full rounded-md border border-[#e5e2e1] bg-[#fcf9f8] px-4 text-base font-normal text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec] dark:focus:border-[#f0adc4]"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#5b4137] dark:text-[#dbc9c0]">
              {t("contactSection.message")}
              <textarea
                name="message"
                required
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-[#e5e2e1] bg-[#fcf9f8] px-4 py-3 text-base font-normal leading-7 text-[#1c1b1b] outline-none transition focus:border-[#854d63] dark:border-white/10 dark:bg-white/5 dark:text-[#f8f1ec] dark:focus:border-[#f0adc4]"
              />
            </label>
            <button
              type="submit"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-6 text-[12px] font-semibold uppercase tracking-[1px] text-white transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4] sm:w-auto"
            >
              <PaperAirplaneIcon className="size-4" />
              {t("contactSection.submit")}
            </button>
          </form>
        </div>
      </motion.section>
      {isDev && SHOW_VISUAL_TUNING_PANEL ? (
        <VisualTuningPanel
          tuning={visualTuning}
          onChange={handleVisualTuningChange}
          onReset={() => setVisualTuning(DEFAULT_VISUAL_TUNING)}
        />
      ) : null}
    </div>
  );
}
