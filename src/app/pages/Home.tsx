import { ChevronLeftIcon, ChevronRightIcon, EnvelopeIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { ContactForm } from "../components/ContactForm";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toServiceViewModel, toTestimonialViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection, useCmsSingleton } from "../../cms/cmsContent";
import { localized, type CmsHomePage, type CmsService, type CmsTestimonial } from "../../cms/types";
import { bodyToParagraphs } from "./BlogArticleContent";
import portraitImage from "../../assets/carole-redesign-portrait.webp";
import aboutSectionImage from "../../assets/carole-shape-static.png";
import aboutShapeVideoMp4 from "../../assets/caole-shape-motion-g.mp4";
import aboutShapeVideoMov from "../../assets/caole-shape-motion.mov";
import brandFlagIcon from "../../assets/icons/brand-flag.svg?raw";
import coffeeCupIcon from "../../assets/icons/coffee-cup.svg?raw";
import decorativeArc from "../../assets/icons/decorative-arc.svg";
import documentEditIcon from "../../assets/icons/document-edit.svg?raw";
import { homeServiceAccents, serviceIcons } from "../components/serviceStyle";
import testimonialCynthiaImage from "../../assets/testimonials/testimonial-cynthia.svg";
import testimonialJulianImage from "../../assets/testimonials/testimonial-julian.svg";
import testimonialUzomaImage from "../../assets/testimonials/testimonial-uzoma.svg";

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
  portrait?: CmsTestimonial["portrait"];
};

type CircularTestimonial = Testimonial & {
  src: string;
};

type InlineIconProps = {
  src: string;
  className: string;
};

type VisualTuning = {
  heroScale: number;
  heroY: number;
  heroObjectY: number;
};

type VisualTuningKey = keyof VisualTuning;

const VISUAL_TUNING_STORAGE_KEY = "carole-visual-tuning";
const SHOW_VISUAL_TUNING_PANEL = false;
const DEFAULT_VISUAL_TUNING: VisualTuning = {
  heroScale: 1.24,
  heroY: -10,
  heroObjectY: 100,
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
];

const traitIcons = [documentEditIcon, brandFlagIcon, coffeeCupIcon];
const traitAccents = [
  { icon: "bg-[#ffd9e4]", glyph: "text-text-accent" },
  { icon: "bg-[#ffdcbd]", glyph: "text-[#8a5100]" },
  { icon: "bg-[#ffdbcf]", glyph: "text-[#a83900]" },
];
const testimonialImages = [testimonialUzomaImage, testimonialCynthiaImage, testimonialJulianImage];

function InlineIcon({ src, className }: InlineIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`block [&_path]:fill-current [&_svg]:h-full [&_svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: src }}
    />
  );
}

function calculateTestimonialGap(width: number) {
  const minWidth = 320;
  const maxWidth = 620;
  const minGap = 42;
  const maxGap = 82;

  if (width <= minWidth) {
    return minGap;
  }

  if (width >= maxWidth) {
    return maxGap;
  }

  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

function CircularTestimonials({
  testimonials,
  previousLabel,
  nextLabel,
}: {
  testimonials: CircularTestimonial[];
  previousLabel: string;
  nextLabel: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredControl, setHoveredControl] = useState<"previous" | "next" | null>(null);
  const [containerWidth, setContainerWidth] = useState(520);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const testimonialsLength = testimonials.length;
  const activeTestimonial = testimonials[activeIndex];

  const stopAutoplay = useCallback(() => {
    if (autoplayIntervalRef.current) {
      window.clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    stopAutoplay();
    setActiveIndex((current) => (current + 1) % testimonialsLength);
  }, [stopAutoplay, testimonialsLength]);

  const handlePrevious = useCallback(() => {
    stopAutoplay();
    setActiveIndex((current) => (current - 1 + testimonialsLength) % testimonialsLength);
  }, [stopAutoplay, testimonialsLength]);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);

    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  useEffect(() => {
    autoplayIntervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonialsLength);
    }, 5200);

    return stopAutoplay;
  }, [stopAutoplay, testimonialsLength]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        handlePrevious();
      }

      if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleNext, handlePrevious]);

  const getImageStyle = (index: number): CSSProperties => {
    const gap = calculateTestimonialGap(containerWidth);
    const lift = gap * 0.72;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + testimonialsLength) % testimonialsLength === index;
    const isRight = (activeIndex + 1) % testimonialsLength === index;

    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: "translateX(0) translateY(0) scale(1) rotateY(0deg)",
      };
    }

    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 0.9,
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(-${lift}px) scale(0.84) rotateY(15deg)`,
      };
    }

    if (isRight) {
      return {
        zIndex: 2,
        opacity: 0.9,
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(-${lift}px) scale(0.84) rotateY(-15deg)`,
      };
    }

    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: "none",
      transform: "translateY(18px) scale(0.74)",
    };
  };

  return (
    <div className="mx-auto grid max-w-[1050px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
      <div
        ref={imageContainerRef}
        className="relative mx-auto h-[22rem] w-full max-w-[520px] [perspective:1000px] sm:h-[24rem]"
      >
        <div className="absolute inset-x-8 bottom-2 top-14 rounded-lg bg-[#ffdcbd]/36 blur-2xl dark:bg-[#854d63]/24" />
        {testimonials.map((testimonial, index) => (
          <button
            type="button"
            key={testimonial.name}
            onClick={() => {
              stopAutoplay();
              setActiveIndex(index);
            }}
            aria-label={testimonial.name}
            className="absolute inset-x-8 bottom-0 top-6 overflow-hidden rounded-lg border border-[#fcf9f8] bg-[#fff3ee] shadow-[0_22px_50px_rgba(91,65,55,0.14)] transition-[opacity,transform] duration-[780ms] ease-[cubic-bezier(.4,1.7,.3,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854d63] dark:border-white/10 dark:bg-[#2b1b20] sm:inset-x-10"
            style={getImageStyle(index)}
          >
            <img
              src={testimonial.src}
              alt={testimonial.name}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,27,27,0)_46%,rgba(28,27,27,0.48)_100%)]" />
            <span className="absolute bottom-4 left-4 right-4 text-left">
              <span className="block font-serif text-xl leading-6 text-white">{testimonial.name}</span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[2px] text-white/78">
                {testimonial.role}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid min-h-[27rem] grid-rows-[1fr_auto] overflow-hidden rounded-lg border border-border-accent/28 bg-surface-page p-6 pb-7 shadow-[0_18px_48px_rgba(91,65,55,0.06)] dark:border-white/10 dark:bg-surface-panel sm:min-h-[25rem] sm:p-8 sm:pb-7 lg:min-h-[26rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -20 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
          >
            <p className="font-serif text-[28px] leading-8 text-text-primary dark:text-text-primary sm:text-[32px] sm:leading-9">
              {activeTestimonial.name}
            </p>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[2.4px] text-text-accent dark:text-text-accent">
              {activeTestimonial.role}
            </p>
            <p className="mt-6 min-h-[9.75rem] text-[17px] italic leading-8 text-text-secondary dark:text-[#ded7d2] sm:text-[18px] sm:leading-8 lg:min-h-[10.5rem]">
              {activeTestimonial.quote}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-4 pb-1">
          <button
            type="button"
            onClick={handlePrevious}
            onMouseEnter={() => setHoveredControl("previous")}
            onMouseLeave={() => setHoveredControl(null)}
            className={`flex size-12 items-center justify-center rounded-full transition duration-300 ${
              hoveredControl === "previous"
                ? "bg-[#854d63] text-white"
                : "bg-[#1c1b1b] text-[#fcf9f8] dark:bg-[#f8f1ec] dark:text-[#1c1415]"
            }`}
            aria-label={previousLabel}
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            onMouseEnter={() => setHoveredControl("next")}
            onMouseLeave={() => setHoveredControl(null)}
            className={`flex size-12 items-center justify-center rounded-full transition duration-300 ${
              hoveredControl === "next"
                ? "bg-[#854d63] text-white"
                : "bg-[#1c1b1b] text-[#fcf9f8] dark:bg-[#f8f1ec] dark:text-[#1c1415]"
            }`}
            aria-label={nextLabel}
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <div className="ml-2 flex items-center gap-1">
            {testimonials.map((testimonial, index) => (
              <button
                type="button"
                key={testimonial.name}
                onClick={() => {
                  stopAutoplay();
                  setActiveIndex(index);
                }}
                aria-current={index === activeIndex ? "true" : undefined}
                aria-label={`${testimonial.name} (${index + 1}/${testimonialsLength})`}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
              >
                <span
                  className={`block rounded-full transition-[width,background-color] duration-300 ${
                    index === activeIndex ? "h-2 w-8 bg-[#854d63]" : "size-2 bg-[#e4bfb2] dark:bg-white/20"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
    <div className="fixed bottom-4 right-4 z-[80] font-sans text-text-primary print:hidden">
      {isOpen ? (
        <div
          className="t-panel-slide w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border-accent/40 bg-white/95 p-4 shadow-[0_24px_80px_rgba(28,27,27,0.16)] backdrop-blur"
          data-open="true"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[2px] text-text-accent">Visual tuning</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[1px]"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {visualTuningControls.map((control) => (
              <label key={control.key} className="block">
                <span className="mb-1 flex items-center justify-between text-xs font-medium">
                  <span>{control.label}</span>
                  <span className="tabular-nums text-text-accent">{tuning[control.key]}</span>
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
              className="rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-[1px]"
            >
              Reset
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-text-secondary">
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const reduceMotion = useReducedMotion() ?? false;
  const { data: cmsHome, usingCms: usingCmsHome } = useCmsSingleton<CmsHomePage | null>("homePage", null);
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const { data: cmsTestimonials, usingCms: usingCmsTestimonials } =
    useCmsCollection<CmsTestimonial>("testimonial", []);
  const usingCms = usingCmsHome;

  const heroData = cmsHome?.hero;
  const manifestoData = cmsHome?.manifesto;
  const aboutData = cmsHome?.about;
  const servicesSectionData = cmsHome?.servicesSection;
  const testimonialsSectionData = cmsHome?.testimonialsSection;
  const contactSectionData = cmsHome?.contactSection;
  const heroPortraitSrc = cmsImageUrl(heroData?.portrait) ?? portraitImage;
  const aboutImageSrc = cmsImageUrl(aboutData?.image) ?? aboutSectionImage;

  const heroTitle = usingCms && heroData?.title ? localized(heroData.title, locale) : t("hero.titleStart");
  const heroAccent = usingCms && heroData?.accent ? localized(heroData.accent, locale) : t("hero.titleAccent");
  const heroTitleEnd = usingCms && heroData?.titleEnd ? localized(heroData.titleEnd, locale) : t("hero.titleEnd");
  const heroAccentIndex =
    usingCms && heroTitle && heroAccent
      ? heroTitle.toLocaleLowerCase().indexOf(heroAccent.toLocaleLowerCase())
      : -1;

  const servicesTitleAccent =
    usingCms && servicesSectionData?.titleAccent
      ? localized(servicesSectionData.titleAccent, locale)
      : t("services.titleAccent");
  const servicesTitleRest =
    usingCms && servicesSectionData?.titleRest
      ? localized(servicesSectionData.titleRest, locale)
      : t("services.titleRest");
  const servicesSubtitle =
    usingCms && servicesSectionData?.subtitle
      ? localized(servicesSectionData.subtitle, locale)
      : t("services.subtitle");
  const testimonialsEyebrow =
    usingCms && testimonialsSectionData?.eyebrow
      ? localized(testimonialsSectionData.eyebrow, locale)
      : t("testimonials.eyebrow");
  const testimonialsTitleStart =
    usingCms && testimonialsSectionData?.titleStart
      ? localized(testimonialsSectionData.titleStart, locale)
      : t("testimonials.titleStart");
  const testimonialsTitleAccent =
    usingCms && testimonialsSectionData?.titleAccent
      ? localized(testimonialsSectionData.titleAccent, locale)
      : t("testimonials.titleAccent");
  const contactEyebrow =
    usingCms && contactSectionData?.eyebrow
      ? localized(contactSectionData.eyebrow, locale)
      : t("contactSection.eyebrow");
  const contactTitleStart =
    usingCms && contactSectionData?.titleStart
      ? localized(contactSectionData.titleStart, locale)
      : t("contactSection.titleStart");
  const contactTitleAccent =
    usingCms && contactSectionData?.titleAccent
      ? localized(contactSectionData.titleAccent, locale)
      : t("contactSection.titleAccent");
  const contactDescription =
    usingCms && contactSectionData?.description
      ? localized(contactSectionData.description, locale)
      : t("contactSection.description");
  const contactMeetingLink =
    usingCms && contactSectionData?.meetingLink
      ? localized(contactSectionData.meetingLink, locale)
      : t("contactSection.meetingLink");

  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((s) => toServiceViewModel(s, locale));
    }
    return t("services.items", { returnObjects: true }) as Service[];
  }, [cmsServices, usingCmsServices, locale, t]);

  const traits = t("about.traits", { returnObjects: true }) as Trait[];

  const testimonials = useMemo(() => {
    if (usingCmsTestimonials) {
      return cmsTestimonials.map((t) => toTestimonialViewModel(t, locale));
    }
    return t("testimonials.items", { returnObjects: true }) as Testimonial[];
  }, [cmsTestimonials, usingCmsTestimonials, locale, t]);

  const circularTestimonials = useMemo(
    () =>
      testimonials.map((testimonial, index) => {
        let imgSrc = testimonialImages[index] ?? testimonialImages[0];
        const portraitUrl = cmsImageUrl(testimonial.portrait);
        if (portraitUrl) imgSrc = portraitUrl;
        return { ...testimonial, src: imgSrc };
      }),
    [testimonials]
  );
  const [visualTuning, setVisualTuning] = useState(DEFAULT_VISUAL_TUNING);
  const [aboutVideoCanPlayThrough, setAboutVideoCanPlayThrough] = useState(false);
  const [aboutVideoPlaying, setAboutVideoPlaying] = useState(false);
  const isDev = import.meta.env.DEV;
  const enableAboutVideo = !reduceMotion;
  const showAboutVideo = enableAboutVideo && aboutVideoCanPlayThrough && aboutVideoPlaying;

  useEffect(() => {
    setVisualTuning(readStoredVisualTuning());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#services") {
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "auto" });
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
    <div className="overflow-hidden bg-surface-page text-text-primary dark:bg-surface-page dark:text-text-primary">
      <section id="home" className="relative flex min-h-[calc(100dvh-4rem)] items-start bg-[linear-gradient(160deg,#fffafa_0%,#fcf9f8_42%,#fbf8f7_100%)] px-5 pb-12 pt-24 dark:bg-[linear-gradient(160deg,#1b1515_0%,#13100f_54%,#21171a_100%)] sm:px-8 sm:pt-28 md:min-h-[755px] lg:items-center lg:px-8 lg:pb-16 lg:pt-28">
        <div className="pointer-events-none absolute right-[-14rem] top-[-13rem] size-[38rem] rounded-full bg-[#ffd9e4]/35 blur-[90px] dark:bg-[#854d63]/18" />
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-[672px]"
          >
            <h1 className="max-w-[672px] font-serif text-[40px] leading-[44px] text-text-primary dark:text-text-primary sm:text-[48px] sm:leading-[52px] lg:text-[56px] lg:leading-[60px] 2xl:text-[64px] 2xl:leading-[68px]">
              {usingCms && heroAccentIndex >= 0 ? (
                <>
                  {heroTitle.slice(0, heroAccentIndex)}
                  <span className="italic text-text-accent dark:text-text-accent">
                    {heroTitle.slice(heroAccentIndex, heroAccentIndex + heroAccent.length)}
                  </span>
                  {heroTitle.slice(heroAccentIndex + heroAccent.length)}
                  {heroData?.titleEnd && <> {heroTitleEnd}</>}
                </>
              ) : (
                <>
                  {heroTitle}
                  {usingCms && heroData?.accent && (
                    <>{" "}<span className="italic text-text-accent dark:text-text-accent">{heroAccent}</span></>
                  )}
                  {usingCms && heroData?.titleEnd && <> {heroTitleEnd}</>}
                  {!usingCms && (
                    <>{" "}<span className="italic text-text-accent dark:text-text-accent">{heroAccent}</span>{" "}{heroTitleEnd}</>
                  )}
                </>
              )}
            </h1>
            <p className="mt-6 max-w-[528px] text-[16px] leading-7 text-text-secondary dark:text-text-secondary md:text-[18px] md:leading-8">
              {usingCms && heroData?.description
                ? localized(heroData.description, locale)
                : t("hero.description")}
            </p>
            <div className="mt-8 grid w-full max-w-[25rem] grid-cols-1 gap-3 min-[460px]:flex min-[460px]:max-w-none min-[460px]:flex-wrap">
              <Link
                to="/contact"
                className="inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1c1b1b] px-6 text-center text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#fcf9f8] shadow-[0_14px_32px_rgba(28,27,27,0.13)] transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4] min-[460px]:min-w-[144px] md:h-[52px] md:min-w-[176px] md:px-8 md:tracking-[1px]"
              >
                {usingCms && heroData?.primaryCta
                  ? localized(heroData.primaryCta, locale)
                  : t("hero.primaryCta")}
              </Link>
              <Link
                to="/services"
                className="inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-full border border-[#1c1b1b]/20 px-6 text-center text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-text-primary transition hover:border-[#854d63] hover:bg-[#ffd9e4]/44 hover:text-text-accent dark:border-white/20 dark:text-text-primary dark:hover:border-[#f0adc4] dark:hover:bg-[#854d63]/30 dark:hover:text-[#f0adc4] min-[460px]:min-w-[144px] md:h-[52px] md:min-w-[172px] md:px-8 md:tracking-[1px]"
              >
                {usingCms && heroData?.secondaryCta
                  ? localized(heroData.secondaryCta, locale)
                  : t("hero.secondaryCta")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, scale: 1, y: [0, -8, 0] }
            }
            transition={
              reduceMotion
                ? {
                    opacity: { delay: 0.15, duration: 0.55, ease: "easeOut" },
                    scale: { delay: 0.15, duration: 0.55, ease: "easeOut" },
                  }
                : {
                    opacity: { delay: 0.15, duration: 0.55, ease: "easeOut" },
                    scale: { delay: 0.15, duration: 0.55, ease: "easeOut" },
                    y: { delay: 0.3, duration: 5.8, repeat: Infinity, ease: "easeInOut" },
                  }
            }
            className="relative mx-auto flex min-h-[300px] w-full max-w-[350px] items-center justify-center sm:min-h-[360px] sm:max-w-[390px] lg:min-h-[460px] lg:max-w-[430px]"
          >
            <motion.div
              aria-hidden="true"
              animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-4, -6, -4] }}
              transition={
                reduceMotion ? undefined : { duration: 6.4, repeat: Infinity, ease: "easeInOut" }
              }
              className="organic-shape absolute inset-x-4 inset-y-7 bg-[#f9b3cc]/42"
            />
            <motion.div
              aria-hidden="true"
              animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [6, 8, 6] }}
              transition={
                reduceMotion ? undefined : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }
              }
              className="organic-shape-alt absolute inset-x-7 inset-y-5 border border-[#854d63]/28"
            />
            <div className="organic-shape relative z-10 aspect-[4/5] w-[74%] max-w-[330px] overflow-hidden bg-[#fbaa51] shadow-[0_24px_60px_rgba(28,27,27,0.18)] sm:max-w-[350px] lg:max-w-[360px]">
              <img
                src={heroPortraitSrc}
                alt={t("hero.imageAlt")}
                className="h-full w-full object-contain object-bottom"
                style={{
                  objectPosition: `50% ${visualTuning.heroObjectY}%`,
                  transform: `translateY(${visualTuning.heroY}%) scale(${visualTuning.heroScale})`,
                }}
              />
            </div>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [-3, -5, -3] }}
              transition={
                reduceMotion ? undefined : { duration: 5.4, repeat: Infinity, ease: "easeInOut" }
              }
              className="absolute bottom-7 left-6 z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_16px_38px_rgba(28,27,27,0.14)] backdrop-blur-md dark:border-white/10 dark:bg-[#201817]/90"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[#ffd9e4] text-text-accent">
                <SparklesIcon className="size-4" />
              </span>
              <p className="font-serif text-[16px] leading-4 text-text-primary dark:text-text-primary">
                {t("hero.badgeTop")}
                <br />
                <span className="italic text-text-accent">{t("hero.badgeBottom")}</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        id="manifesto"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-surface-page px-5 py-16 dark:bg-surface-page sm:px-8 lg:py-24"
      >
        <div className="relative mx-auto max-w-[48rem] text-center">
          <h2 className="font-serif text-[clamp(2rem,4vw,3.45rem)] leading-[1.04] dark:text-text-primary">
            {usingCms && manifestoData?.title
              ? localized(manifestoData.title, locale)
              : t("manifesto.titleTop")}
            <br />
            <span className="relative isolate inline-block font-liberation-serif italic text-text-accent dark:text-text-accent">
              {usingCms && manifestoData?.accent
                ? localized(manifestoData.accent, locale)
                : !usingCms ? t("manifesto.titleAccent") : null}
              <img
                src={decorativeArc}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[70%] z-[-1] h-auto w-[104%] -translate-x-1/2"
              />
            </span>
          </h2>
          <div className="mx-auto mt-8 max-w-[42rem] space-y-5 text-base leading-7 text-text-secondary dark:text-text-secondary sm:text-[18px] sm:leading-8">
            {(() => {
              const paragraphs = usingCms
                ? bodyToParagraphs(localized(manifestoData?.body, locale))
                : [];
              return paragraphs.length > 0
                ? paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
                : <><p>{t("manifesto.p1")}</p><p>{t("manifesto.p2")}</p></>;
            })()}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="about"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white px-5 py-16 dark:bg-[#181312] sm:px-8 lg:px-[min(8vw,112px)] lg:py-24"
      >
        <div className="mx-auto grid max-w-[1152px] items-center gap-12 lg:grid-cols-[minmax(0,350px)_minmax(0,1fr)] lg:gap-28 xl:grid-cols-[minmax(0,368px)_minmax(0,1fr)]">
          <div className="relative mx-auto aspect-[418.08/522.59] w-full max-w-[292px] sm:max-w-[330px] lg:mx-0 lg:w-[350px] lg:max-w-none xl:w-[368px]">
            <div
              className="absolute rotate-12 bg-[rgba(255,220,189,0.50)]"
              style={{
                inset: "-11.7% -13.8%",
                borderRadius: "36% 64% 62% 48% / 34% 52% 60% 54%",
              }}
            />
            <div
              className="absolute inset-0 overflow-hidden shadow-[0_20px_30px_rgba(28,27,27,0.16)]"
              style={{ borderRadius: "47% 38% 48% 43% / 42% 34% 48% 46%" }}
            >
              <div
                className="absolute transition-opacity duration-700 ease-out"
                style={{ width: "178%", height: "178%", left: "-38.5%", top: "-38%" }}
              >
                <img
                  src={aboutImageSrc}
                  alt={t("about.imageAlt")}
                  loading="lazy"
                  decoding="async"
                  className="public-media-outline h-full w-full object-cover [clip-path:inset(0.75%)]"
                  style={{ opacity: showAboutVideo ? 0 : 1 }}
                  aria-hidden={showAboutVideo}
                />
              </div>
              {enableAboutVideo ? (
              <div
                className="absolute transition-opacity duration-700 ease-out"
                style={{ width: "178%", height: "178%", left: "-38.5%", top: "-38%", opacity: showAboutVideo ? 1 : 0 }}
                aria-hidden={!showAboutVideo}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={aboutImageSrc}
                  className="h-full w-full object-cover [clip-path:inset(0.75%)]"
                  onCanPlayThrough={() => setAboutVideoCanPlayThrough(true)}
                  onPlaying={() => setAboutVideoPlaying(true)}
                  onWaiting={() => setAboutVideoPlaying(false)}
                  onError={() => {
                    setAboutVideoCanPlayThrough(false);
                    setAboutVideoPlaying(false);
                  }}
                >
                  <source src={aboutShapeVideoMp4} type="video/mp4" />
                  <source src={aboutShapeVideoMov} type="video/quicktime" />
                </video>
              </div>
              ) : null}
            </div>
          </div>
          <div className="lg:self-center">
            <h2 className="text-balance font-serif text-[clamp(2rem,3.7vw,3.55rem)] leading-[1.06] dark:text-text-primary">
              {usingCms && aboutData?.title
                ? localized(aboutData.title, locale)
                : t("about.titleTop")}
              {usingCms && aboutData?.accent && (
                <><br /><span className="italic text-text-accent dark:text-text-accent">
                  {localized(aboutData.accent, locale)}
                </span></>
              )}
              {!usingCms && (
                <><br /><span className="italic text-text-accent dark:text-text-accent">
                  {t("about.titleAccent")}
                </span></>
              )}
            </h2>
            <div className="mt-5 max-w-[42rem] space-y-4 text-base leading-7 text-text-secondary dark:text-text-secondary sm:text-[16px] sm:leading-8">
              {(() => {
                const paragraphs = usingCms
                  ? bodyToParagraphs(localized(aboutData?.body, locale))
                  : [];
                return paragraphs.length > 0
                  ? paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
                  : <><p>{t("about.p1")}</p><p>{t("about.p2")}</p></>;
              })()}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border-subtle/80 pt-8 dark:border-white/10 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-7">
              {traits.map((trait, index) => {
                const icon = traitIcons[index] ?? documentEditIcon;
                const accent = traitAccents[index] ?? traitAccents[0];
                return (
                  <div key={trait.label} className="flex min-w-0 flex-col items-center gap-3 text-center sm:min-w-24">
                    <span className={`flex size-11 items-center justify-center rounded-full ${accent.icon}`}>
                      <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                    </span>
                    <span className="max-w-[10rem] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-text-secondary dark:text-text-muted sm:tracking-[2px]">
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
              <span className="italic text-text-accent dark:text-text-accent">{servicesTitleAccent}</span>{" "}
              {servicesTitleRest}
            </h2>
            <p className="mt-4 text-base leading-7 text-text-secondary dark:text-[#ded7d2] sm:text-[18px]">{servicesSubtitle}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {services.map((service, index) => {
              const icon = serviceIcons[index] ?? brandFlagIcon;
              const accent = homeServiceAccents[index] ?? homeServiceAccents[0];
              const isWide = index === 1 || index === 2;
              return (
                <Link
                  to={`/services/${service.slug}`}
                  key={`${service.title}-${service.accent}`}
                  className={`t-resize group relative overflow-hidden rounded-lg border border-border-accent/25 bg-white p-6 text-left no-underline shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] dark:border-[#d8a4c7]/16 dark:bg-surface-panel dark:hover:border-[#d8a4c7]/28 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-7 ${
                    isWide ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className={`absolute right-0 top-0 size-28 -translate-y-24 translate-x-24 rounded-bl-full ${accent.corner} opacity-0 transition duration-500 ease-out group-hover:-translate-y-9 group-hover:translate-x-9 group-hover:opacity-100`} />
                  <span className={`relative flex size-11 items-center justify-center rounded-full ${accent.icon}`}>
                    <InlineIcon src={icon} className={`size-5 ${accent.glyph}`} />
                  </span>
                  <h3 className="relative mt-6 font-serif text-[24px] leading-7 text-text-primary dark:text-text-primary">
                    {service.title}
                    <br />
                    <span className={`italic ${accent.title}`}>{service.accent}</span>
                  </h3>
                  <p className="relative mt-4 max-w-2xl text-sm leading-6 text-text-secondary dark:text-[#ded7d2]">{service.description}</p>
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
        className="bg-white px-5 py-16 dark:bg-surface-page sm:px-8 lg:px-8 lg:py-24"
      >
        <div className="mx-auto mb-10 max-w-[40rem] text-center">
          <SectionEyebrow>{testimonialsEyebrow}</SectionEyebrow>
          <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.2vw,2.75rem)] leading-tight dark:text-text-primary">
            {testimonialsTitleStart}{" "}
            <span className="italic text-text-accent dark:text-text-accent">{testimonialsTitleAccent}</span>
          </h2>
        </div>
        <CircularTestimonials
          testimonials={circularTestimonials}
          previousLabel={t("testimonials.previous")}
          nextLabel={t("testimonials.next")}
        />
      </motion.section>

      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-surface-page px-5 py-16 dark:bg-[#1a1413] sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <SectionEyebrow>{contactEyebrow}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] dark:text-text-primary">
              {contactTitleStart}{" "}
              <span className="italic text-text-accent dark:text-text-accent">{contactTitleAccent}</span>
            </h2>
            <p className="mt-5 max-w-[32rem] text-base leading-7 text-text-secondary dark:text-text-secondary">
              {contactDescription}
            </p>
            <Link
              to="/contact?mode=meeting"
              className="mt-7 inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[2px] text-text-accent transition hover:text-[#6a364b] dark:text-text-accent dark:hover:text-[#f8d7e3]"
            >
              <EnvelopeIcon className="size-5" />
              {contactMeetingLink}
            </Link>
          </div>

          <ContactForm
            variant="embedded"
            className="rounded-lg border border-border-accent/30 bg-surface-panel p-5 shadow-[0_18px_48px_rgba(28,27,27,0.06)] dark:border-white/10 dark:bg-surface-page dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-7"
          />
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
