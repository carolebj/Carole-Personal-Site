import { SparklesIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
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
    title: "text-[#854d63]",
  },
  {
    icon: "bg-[#ffdcbd]",
    corner: "bg-[#ffdcbd]/55",
    glyph: "text-[#8a5100]",
    title: "text-[#8a5100]",
  },
  {
    icon: "bg-[#ffdbcf]",
    corner: "bg-[#ffdbcf]/55",
    glyph: "text-[#a83900]",
    title: "text-[#a83900]",
  },
  {
    icon: "bg-[#e5e2e1]",
    corner: "bg-[#e5e2e1]/70",
    glyph: "text-[#5b4137]",
    title: "text-[#5b4137]",
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
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#854d63]">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#854d63]">Visual tuning</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-[#e5e2e1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]"
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
              className="flex-1 rounded-full bg-[#1c1b1b] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white"
            >
              Copy values
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[#e5e2e1] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em]"
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
          className="rounded-full bg-[#854d63] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_44px_rgba(133,77,99,0.3)]"
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
    <div className="overflow-hidden bg-[#fcf9f8] text-[#1c1b1b]">
      <section className="relative flex min-h-[calc(100svh-6rem)] items-center bg-[linear-gradient(160deg,#fffafa_0%,#fcf9f8_42%,#fbf8f7_100%)] px-5 pb-12 pt-28 sm:px-8 lg:px-10 lg:pb-16 lg:pt-28">
        <div className="pointer-events-none absolute right-[-14rem] top-[-13rem] size-[38rem] rounded-full bg-[#ffd9e4]/35 blur-[90px]" />
        <div className="mx-auto grid w-full max-w-[68rem] items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="max-w-[11.8ch] font-serif text-[clamp(2.4rem,4.55vw,4.15rem)] leading-[1.02] text-[#1c1b1b]">
              {t("hero.titleStart")}{" "}
              <span className="italic text-[#854d63]">{t("hero.titleAccent")}</span>{" "}
              {t("hero.titleEnd")}
            </h1>
            <p className="mt-6 max-w-[33rem] text-[1rem] leading-7 text-[#5b4137] sm:text-[1.03rem] sm:leading-8">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#1c1b1b] px-7 text-xs font-semibold uppercase tracking-[0.12em] text-[#fcf9f8] shadow-[0_14px_32px_rgba(28,27,27,0.13)] transition hover:bg-[#854d63] sm:px-8"
              >
                {t("hero.primaryCta")}
              </a>
              <a
                href="#services"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#1c1b1b]/20 px-7 text-xs font-semibold uppercase tracking-[0.12em] text-[#1c1b1b] transition hover:border-[#854d63] hover:text-[#854d63] sm:px-8"
              >
                {t("hero.secondaryCta")}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
            className="relative mx-auto flex min-h-[340px] w-full max-w-[430px] items-center justify-center sm:min-h-[400px] lg:min-h-[460px]"
          >
            <div className="organic-shape absolute inset-x-4 inset-y-7 rotate-[-4deg] bg-[#f9b3cc]/42" />
            <div className="organic-shape-alt absolute inset-x-7 inset-y-5 rotate-6 border border-[#854d63]/28" />
            <div className="organic-shape relative z-10 aspect-[4/5] w-[76%] max-w-[360px] overflow-hidden bg-[#fbaa51] shadow-[0_28px_70px_rgba(28,27,27,0.2)]">
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
            <div className="absolute bottom-8 left-3 z-20 flex rotate-[-3deg] items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_44px_rgba(28,27,27,0.15)] backdrop-blur-md sm:left-7">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#ffd9e4] text-[#854d63]">
                <SparklesIcon className="size-4" />
              </span>
              <p className="font-serif text-base leading-[1.05] text-[#1c1b1b]">
                {t("hero.badgeTop")}
                <br />
                <span className="italic text-[#854d63]">{t("hero.badgeBottom")}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="manifesto" className="relative bg-[#fcf9f8] px-5 py-20 sm:px-8 lg:py-32">
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-[clamp(2.3rem,4.6vw,4rem)] leading-[1.04]">
            {t("manifesto.titleTop")}
            <br />
            <span className="relative isolate inline-block font-liberation-serif italic text-[#854d63]">
              {t("manifesto.titleAccent")}
              <img
                src={decorativeArc}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[70%] z-[-1] h-auto w-[104%] -translate-x-1/2"
              />
            </span>
          </h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6 text-base leading-7 text-[#5b4137] sm:text-lg sm:leading-8">
            <p>{t("manifesto.p1")}</p>
            <p>{t("manifesto.p2")}</p>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="organic-shape absolute -inset-5 rotate-12 bg-[#ffdcbd]/55" />
          <div className="organic-shape-third relative aspect-[4/5] overflow-hidden bg-[#ffafcd] shadow-[0_20px_60px_rgba(28,27,27,0.16)]">
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
          <h2 className="font-serif text-[clamp(2.25rem,4vw,3.55rem)] leading-[1.06]">
            {t("about.titleTop")}
            <br />
            <span className="italic text-[#854d63]">{t("about.titleAccent")}</span>
          </h2>
          <div className="mt-6 max-w-2xl space-y-5 text-base leading-7 text-[#5b4137] sm:text-[1.05rem] sm:leading-8">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-7 border-t border-[#e5e2e1]/80 pt-8">
            {traits.map((trait, index) => {
              const icon = traitIcons[index] ?? documentEditIcon;
              const accent = traitAccents[index] ?? traitAccents[0];
              return (
                <div key={trait.label} className="flex min-w-24 flex-col items-center gap-3">
                  <span className={`flex size-11 items-center justify-center rounded-full ${accent.icon}`}>
                    <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b4137]">
                    {trait.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </section>

      <section id="services" className="bg-[#f6f3f2]/80 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-serif text-[clamp(2.35rem,4vw,3.45rem)] leading-none">
              <span className="italic text-[#854d63]">{t("services.titleAccent")}</span>{" "}
              {t("services.titleRest")}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5b4137] sm:text-lg">{t("services.subtitle")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
            {services.map((service, index) => {
              const icon = serviceIcons[index] ?? brandFlagIcon;
              const accent = serviceAccents[index] ?? serviceAccents[0];
              const isWide = index === 1 || index === 2;
              return (
                <article
                  key={`${service.title}-${service.accent}`}
                  className={`group relative overflow-hidden rounded-[1.5rem] border border-[#e4bfb2]/25 bg-white p-7 shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] sm:p-8 ${
                    isWide ? "md:col-span-2" : ""
                  }`}
                >
                  <div className={`absolute right-0 top-0 size-28 -translate-y-24 translate-x-24 rounded-bl-full ${accent.corner} opacity-0 transition duration-500 ease-out group-hover:-translate-y-9 group-hover:translate-x-9 group-hover:opacity-100`} />
                  <span className={`relative flex size-12 items-center justify-center rounded-full ${accent.icon}`}>
                    <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                  </span>
                  <h3 className="relative mt-7 font-serif text-[1.55rem] leading-tight text-[#1c1b1b] sm:text-[1.7rem]">
                    {service.title}
                    <br />
                    <span className={`italic ${accent.title}`}>{service.accent}</span>
                  </h3>
                  <p className="relative mt-4 max-w-2xl text-sm leading-6 text-[#5b4137] sm:text-[0.95rem]">{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <SectionEyebrow>{t("testimonials.eyebrow")}</SectionEyebrow>
          <h2 className="mt-3 font-serif text-[clamp(2rem,3.6vw,3rem)] leading-tight">
            {t("testimonials.titleStart")}{" "}
            <span className="italic text-[#854d63]">{t("testimonials.titleAccent")}</span>
          </h2>
        </div>
        <div className="grid gap-9 pt-7 md:grid-cols-3 md:gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className={`relative flex min-h-[315px] flex-col justify-between rounded-[1.5rem] border p-7 pt-12 text-center shadow-[0_1px_2px_rgba(28,27,27,0.04)] ${
                index === 1
                  ? "border-[#854d63]/10 bg-[#ffd9e4]/40 md:-mt-6"
                  : "border-[#e4bfb2]/25 bg-white"
              }`}
            >
              <img
                src={testimonialImages[index]}
                alt={testimonial.name}
                className="absolute left-1/2 top-0 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#fcf9f8] object-cover shadow-sm"
              />
              <p className="text-sm italic leading-6 text-[#5b4137]">"{testimonial.quote}"</p>
              <div className="mt-7 border-t border-[#e5e2e1]/70 pt-5">
                <p className="font-serif text-lg text-[#1c1b1b]">{testimonial.name}</p>
                <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#854d63]">
                  {testimonial.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      {isDev ? (
        <VisualTuningPanel
          tuning={visualTuning}
          onChange={handleVisualTuningChange}
          onReset={() => setVisualTuning(DEFAULT_VISUAL_TUNING)}
        />
      ) : null}
    </div>
  );
}
