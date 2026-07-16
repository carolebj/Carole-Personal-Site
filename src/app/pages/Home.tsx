import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, EnvelopeIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { ContactForm } from "../components/ContactForm";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  layoutWithLines,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toServiceViewModel, toTestimonialViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection, useCmsSingleton } from "../../cms/cmsContent";
import { localized, type CmsHomePage, type CmsService, type CmsTestimonial } from "../../cms/types";
import { bodyToParagraphs } from "./BlogArticleContent";
import portraitImage from "../../assets/carole-redesign-portrait.webp";
import aboutSectionImage from "../../assets/carole-shape-static.png";
import aboutShapeVideoMp4 from "../../assets/caole-shape-motion-g.mp4";
import brandFlagIcon from "../../assets/icons/brand-flag.svg?raw";
import coffeeCupIcon from "../../assets/icons/coffee-cup.svg?raw";
import decorativeArc from "../../assets/icons/decorative-arc.svg";
import documentEditIcon from "../../assets/icons/document-edit.svg?raw";
import testimonialBachiratouImage from "../../assets/testimonials/testimonial-bachiratou-issiako-toure.webp";
import { homeServiceAccents, serviceIcons } from "../components/serviceStyle";

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
  mediaFit?: TestimonialMediaFit;
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

type ServiceBentoTuning = {
  spans: number[];
  order: number[];
  hoverFocus: boolean;
  hoverSpan: number;
  compactSpan: number;
  hoverLift: number;
  transitionMs: number;
  minHeight: number;
  gap: number;
};

type ServiceBentoNumberKey = Exclude<keyof ServiceBentoTuning, "spans" | "order" | "hoverFocus">;

type TestimonialMediaFit = {
  scale: number;
  x: number;
  y: number;
};

type TestimonialMediaFitKey = keyof TestimonialMediaFit;

type PanelPosition = {
  x: number;
  y: number;
};

const VISUAL_TUNING_STORAGE_KEY = "carole-visual-tuning";
const SERVICE_BENTO_TUNING_STORAGE_KEY = "carole-service-bento-tuning-v2";
const SERVICE_BENTO_TUNING_PANEL_POSITION_KEY = "carole-service-bento-tuning-panel-position";
const TESTIMONIAL_TUNING_STORAGE_KEY = "carole-testimonial-media-tuning";
const TESTIMONIAL_TUNING_PANEL_POSITION_KEY = "carole-testimonial-media-tuning-panel-position";
const SHOW_VISUAL_TUNING_PANEL = false;
const SHOW_SERVICE_BENTO_TUNING_PANEL = false;
const SHOW_TESTIMONIAL_TUNING_PANEL = false;
const DEFAULT_VISUAL_TUNING: VisualTuning = {
  heroScale: 1.24,
  heroY: -10,
  heroObjectY: 100,
};
const DEFAULT_SERVICE_BENTO_TUNING: ServiceBentoTuning = {
  spans: [6, 6, 3, 5, 4],
  order: [0, 1, 2, 3, 4],
  hoverFocus: false,
  hoverSpan: 8,
  compactSpan: 4,
  hoverLift: 4,
  transitionMs: 420,
  minHeight: 272,
  gap: 16,
};
const SERVICE_BENTO_HOVER_SPANS: Record<number, number[]> = {
  0: [8, 4, 4, 4, 4],
  1: [4, 8, 4, 4, 4],
  2: [6, 6, 6, 3, 3],
  3: [6, 6, 3, 6, 3],
  4: [6, 6, 3, 3, 6],
};
const SERVICE_BENTO_ROWS = [
  [0, 1],
  [2, 3, 4],
] as const;
const SERVICE_BENTO_DESKTOP_BREAKPOINT = 1024;
const SERVICE_CARD_DESKTOP_PADDING_X = 56;
const SERVICE_DESCRIPTION_FONT = '400 14px "Inter"';
const SERVICE_DESCRIPTION_LINE_HEIGHT = 24;
const serviceDescriptionPretextCache = new Map<string, PreparedTextWithSegments>();
const DEFAULT_TESTIMONIAL_MEDIA_FIT: TestimonialMediaFit = {
  scale: 1,
  x: 50,
  y: 50,
};
const DEFAULT_SERVICE_BENTO_TUNING_PANEL_POSITION: PanelPosition = {
  x: 16,
  y: 160,
};
const DEFAULT_TESTIMONIAL_TUNING_PANEL_POSITION: PanelPosition = {
  x: 16,
  y: 160,
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
  { icon: "bg-[#ffd9e4]", glyph: "text-[#854d63]" },
  { icon: "bg-[#ffdcbd]", glyph: "text-[#8a5100]" },
  { icon: "bg-[#ffdbcf]", glyph: "text-[#a83900]" },
];
const testimonialBachiratouFallback = testimonialBachiratouImage;
const testimonialUzomaImage =
  "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=1200&q=80";
const testimonialCynthiaImage =
  "https://images.unsplash.com/photo-1590649880765-91b1956b8276?auto=format&fit=crop&w=1200&q=80";
const testimonialJulianImage =
  "https://images.unsplash.com/photo-1642257859842-c95f9fa8121d?auto=format&fit=crop&w=1200&q=80";
const testimonialImages = [testimonialBachiratouFallback, testimonialCynthiaImage, testimonialJulianImage];

const testimonialPortraitByName: Record<string, string> = {
  "Bachiratou ISSIAKO TOURE": testimonialBachiratouFallback,
  "Uzoma Obidike": testimonialUzomaImage,
  "Cynthia S.": testimonialCynthiaImage,
  "Julian F.": testimonialJulianImage,
};

const testimonialMediaFitByName: Record<string, TestimonialMediaFit> = {
  "Bachiratou ISSIAKO TOURE": { scale: 1.21, x: 50, y: 45 },
};

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
  isDev,
}: {
  testimonials: CircularTestimonial[];
  previousLabel: string;
  nextLabel: string;
  isDev: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredControl, setHoveredControl] = useState<"previous" | "next" | null>(null);
  const [containerWidth, setContainerWidth] = useState(520);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const [testimonialMediaTuning, setTestimonialMediaTuning] = useState<Record<string, TestimonialMediaFit>>({});
  const testimonialsLength = testimonials.length;
  const activeTestimonial = testimonials[activeIndex];
  const activeMediaFit =
    testimonialMediaTuning[activeTestimonial.name] ??
    activeTestimonial.mediaFit ??
    DEFAULT_TESTIMONIAL_MEDIA_FIT;

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
    if (isAutoplayPaused) {
      stopAutoplay();
      return stopAutoplay;
    }

    autoplayIntervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonialsLength);
    }, 5200);

    return stopAutoplay;
  }, [isAutoplayPaused, stopAutoplay, testimonialsLength]);

  useEffect(() => {
    if (!isDev || typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(TESTIMONIAL_TUNING_STORAGE_KEY);
      if (!stored) {
        return;
      }

      setTestimonialMediaTuning(JSON.parse(stored) as Record<string, TestimonialMediaFit>);
    } catch {
      setTestimonialMediaTuning({});
    }
  }, [isDev]);

  useEffect(() => {
    if (!isDev || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TESTIMONIAL_TUNING_STORAGE_KEY, JSON.stringify(testimonialMediaTuning));
  }, [isDev, testimonialMediaTuning]);

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

  const getMediaStyle = (testimonial: CircularTestimonial): CSSProperties => {
    const fit = testimonialMediaTuning[testimonial.name] ?? testimonial.mediaFit ?? DEFAULT_TESTIMONIAL_MEDIA_FIT;
    return {
      objectPosition: `${fit.x}% ${fit.y}%`,
      transform: `scale(${fit.scale})`,
      transformOrigin: `${fit.x}% ${fit.y}%`,
    };
  };

  const handleMediaTuningChange = (key: TestimonialMediaFitKey, value: number) => {
    setTestimonialMediaTuning((current) => ({
      ...current,
      [activeTestimonial.name]: {
        ...activeMediaFit,
        [key]: value,
      },
    }));
  };

  const resetActiveMediaTuning = () => {
    setTestimonialMediaTuning((current) => {
      const next = { ...current };
      delete next[activeTestimonial.name];
      return next;
    });
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
              style={getMediaStyle(testimonial)}
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
      {isDev && SHOW_TESTIMONIAL_TUNING_PANEL ? (
        <TestimonialMediaTuningPanel
          testimonialName={activeTestimonial.name}
          tuning={activeMediaFit}
          isAutoplayPaused={isAutoplayPaused}
          onOpen={() => setIsAutoplayPaused(true)}
          onToggleAutoplay={() => setIsAutoplayPaused((current) => !current)}
          onChange={handleMediaTuningChange}
          onReset={resetActiveMediaTuning}
        />
      ) : null}
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampServiceSpan(value: number) {
  return Math.round(clampNumber(value, 2, 12));
}

function normalizeServiceBentoTuning(value: Partial<ServiceBentoTuning>, serviceCount: number): ServiceBentoTuning {
  const fallbackSpans = DEFAULT_SERVICE_BENTO_TUNING.spans;
  const nextSpans = Array.from({ length: serviceCount }, (_, index) => {
    const valueSpan = value.spans?.[index] ?? fallbackSpans[index % fallbackSpans.length] ?? 6;
    return clampServiceSpan(valueSpan);
  });
  const fallbackOrder = Array.from({ length: serviceCount }, (_, index) => index);
  const validStoredOrder = value.order?.filter(
    (item, index, order) => Number.isInteger(item) && item >= 0 && item < serviceCount && order.indexOf(item) === index
  );
  const nextOrder = [
    ...(validStoredOrder ?? []),
    ...fallbackOrder.filter((item) => !(validStoredOrder ?? []).includes(item)),
  ].slice(0, serviceCount);

  return {
    spans: nextSpans,
    order: nextOrder,
    hoverFocus: typeof value.hoverFocus === "boolean" ? value.hoverFocus : DEFAULT_SERVICE_BENTO_TUNING.hoverFocus,
    hoverSpan: clampServiceSpan(value.hoverSpan ?? DEFAULT_SERVICE_BENTO_TUNING.hoverSpan),
    compactSpan: clampServiceSpan(value.compactSpan ?? DEFAULT_SERVICE_BENTO_TUNING.compactSpan),
    hoverLift: clampNumber(value.hoverLift ?? DEFAULT_SERVICE_BENTO_TUNING.hoverLift, 0, 16),
    transitionMs: Math.round(clampNumber(value.transitionMs ?? DEFAULT_SERVICE_BENTO_TUNING.transitionMs, 80, 900)),
    minHeight: Math.round(clampNumber(value.minHeight ?? DEFAULT_SERVICE_BENTO_TUNING.minHeight, 180, 420)),
    gap: Math.round(clampNumber(value.gap ?? DEFAULT_SERVICE_BENTO_TUNING.gap, 12, 40)),
  };
}

function readStoredServiceBentoTuning(serviceCount: number) {
  if (typeof window === "undefined") {
    return normalizeServiceBentoTuning(DEFAULT_SERVICE_BENTO_TUNING, serviceCount);
  }

  try {
    const stored = window.localStorage.getItem(SERVICE_BENTO_TUNING_STORAGE_KEY);
    if (!stored) {
      return normalizeServiceBentoTuning(DEFAULT_SERVICE_BENTO_TUNING, serviceCount);
    }

    return normalizeServiceBentoTuning(JSON.parse(stored) as Partial<ServiceBentoTuning>, serviceCount);
  } catch {
    return normalizeServiceBentoTuning(DEFAULT_SERVICE_BENTO_TUNING, serviceCount);
  }
}

function buildServiceBentoPreset(serviceCount: number, rows: number): ServiceBentoTuning {
  const presetSpansByRows: Record<number, number[]> = {
    1: [2, 2, 3, 2, 3],
    2: [7, 5, 4, 4, 4],
    3: [7, 5, 5, 7, 12],
    4: [12, 6, 6, 12, 12],
  };

  return normalizeServiceBentoTuning(
    {
      ...DEFAULT_SERVICE_BENTO_TUNING,
      spans: presetSpansByRows[rows] ?? DEFAULT_SERVICE_BENTO_TUNING.spans,
      order: Array.from({ length: serviceCount }, (_, index) => index),
    },
    serviceCount
  );
}

function shuffleNumbers(values: number[]) {
  return values
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function randomizeServiceBentoTuning(current: ServiceBentoTuning, serviceCount: number): ServiceBentoTuning {
  const targetRows = Math.ceil(Math.random() * 4);
  const base = buildServiceBentoPreset(serviceCount, targetRows);
  const randomizedSpans = base.spans.map((span) => clampServiceSpan(span + Math.round(Math.random() * 4 - 2)));

  return normalizeServiceBentoTuning(
    {
      ...current,
      spans: randomizedSpans,
      order: shuffleNumbers(Array.from({ length: serviceCount }, (_, index) => index)),
    },
    serviceCount
  );
}

const findServiceBentoRow = (serviceIndex: number) =>
  SERVICE_BENTO_ROWS.find((row) => (row as readonly number[]).includes(serviceIndex));

function shouldApplyServiceBentoHoverToRow(
  row: readonly number[],
  focusedServiceIndex: number | null,
  baseSpans: number[]
) {
  if (focusedServiceIndex === null) {
    return false;
  }

  const hoverSpans = SERVICE_BENTO_HOVER_SPANS[focusedServiceIndex];

  if (!hoverSpans) {
    return false;
  }

  return row.some((serviceIndex) => {
    const baseSpan = baseSpans[serviceIndex] ?? 6;
    return (hoverSpans[serviceIndex] ?? baseSpan) !== baseSpan;
  });
}

function getServiceBentoContentWidth({
  containerWidth,
  gap,
  row,
  serviceIndex,
  spans,
}: {
  containerWidth: number;
  gap: number;
  row: readonly number[];
  serviceIndex: number;
  spans: number[];
}) {
  const visibleRow = row.filter((index) => typeof spans[index] === "number");
  const rowSpanTotal = visibleRow.reduce((total, index) => total + (spans[index] ?? 1), 0);
  const serviceSpan = spans[serviceIndex] ?? 1;
  const availableWidth = containerWidth - gap * Math.max(visibleRow.length - 1, 0);

  if (availableWidth <= 0 || rowSpanTotal <= 0) {
    return 0;
  }

  return Math.max(0, (availableWidth * serviceSpan) / rowSpanTotal - SERVICE_CARD_DESKTOP_PADDING_X);
}

function layoutServiceDescriptionLines(text: string, maxWidth: number) {
  const normalizedWidth = Math.floor(maxWidth);

  if (!text || normalizedWidth < 160) {
    return [text];
  }

  try {
    const cacheKey = `${SERVICE_DESCRIPTION_FONT}|${text}`;
    let prepared = serviceDescriptionPretextCache.get(cacheKey);

    if (!prepared) {
      prepared = prepareWithSegments(text, SERVICE_DESCRIPTION_FONT, {
        letterSpacing: 0,
        whiteSpace: "normal",
        wordBreak: "normal",
      });
      serviceDescriptionPretextCache.set(cacheKey, prepared);
    }

    const lines = layoutWithLines(prepared, normalizedWidth, SERVICE_DESCRIPTION_LINE_HEIGHT).lines
      .map((line) => line.text.trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [text];
  } catch {
    return [text];
  }
}

const testimonialMediaTuningControls: Array<{
  key: TestimonialMediaFitKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "scale", label: "Zoom", min: 1, max: 1.6, step: 0.01 },
  { key: "x", label: "X", min: 0, max: 100, step: 1 },
  { key: "y", label: "Y", min: 0, max: 100, step: 1 },
];

const serviceBentoTuningControls: Array<{
  key: ServiceBentoNumberKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "hoverSpan", label: "Focused span", min: 2, max: 12, step: 1 },
  { key: "compactSpan", label: "Other spans", min: 2, max: 12, step: 1 },
  { key: "hoverLift", label: "Hover lift", min: 0, max: 16, step: 1 },
  { key: "transitionMs", label: "Transition", min: 80, max: 900, step: 20 },
  { key: "minHeight", label: "Card height", min: 180, max: 420, step: 4 },
  { key: "gap", label: "Grid gap", min: 12, max: 40, step: 1 },
];

function ServiceBentoTuningPanel({
  serviceLabels,
  tuning,
  onSpanChange,
  onNumberChange,
  onHoverFocusChange,
  onMoveService,
  onPreset,
  onRandomize,
  onReset,
}: {
  serviceLabels: string[];
  tuning: ServiceBentoTuning;
  onSpanChange: (index: number, value: number) => void;
  onNumberChange: (key: ServiceBentoNumberKey, value: number) => void;
  onHoverFocusChange: (value: boolean) => void;
  onMoveService: (index: number, direction: -1 | 1) => void;
  onPreset: (rows: number) => void;
  onRandomize: () => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState(DEFAULT_SERVICE_BENTO_TUNING_PANEL_POSITION);
  const [dragOffset, setDragOffset] = useState<PanelPosition | null>(null);
  const dragOffsetRef = useRef<PanelPosition | null>(null);
  const exportedValues = JSON.stringify(tuning, null, 2);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(SERVICE_BENTO_TUNING_PANEL_POSITION_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PanelPosition>;
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPanelPosition({
          x: Math.max(8, Math.min(parsed.x, window.innerWidth - 380)),
          y: Math.max(8, Math.min(parsed.y, window.innerHeight - 420)),
        });
      }
    } catch {
      setPanelPosition(DEFAULT_SERVICE_BENTO_TUNING_PANEL_POSITION);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SERVICE_BENTO_TUNING_PANEL_POSITION_KEY, JSON.stringify(panelPosition));
  }, [panelPosition]);

  const movePanelToClientPosition = (clientX: number, clientY: number) => {
    const currentDragOffset = dragOffsetRef.current ?? dragOffset;
    if (!currentDragOffset || typeof window === "undefined") {
      return;
    }

    setPanelPosition({
      x: Math.max(8, Math.min(clientX - currentDragOffset.x, window.innerWidth - 380)),
      y: Math.max(8, Math.min(clientY - currentDragOffset.y, window.innerHeight - 420)),
    });
  };

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const nextDragOffset = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    dragOffsetRef.current = nextDragOffset;
    setDragOffset(nextDragOffset);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    movePanelToClientPosition(event.clientX, event.clientY);
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOffsetRef.current = null;
    setDragOffset(null);
  };

  const handleMouseDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextDragOffset = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    dragOffsetRef.current = nextDragOffset;
    setDragOffset(nextDragOffset);
  };

  useEffect(() => {
    if (!dragOffset) {
      return;
    }

    const handleWindowMouseMove = (event: MouseEvent) => {
      movePanelToClientPosition(event.clientX, event.clientY);
    };

    const handleWindowMouseUp = () => {
      dragOffsetRef.current = null;
      setDragOffset(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dragOffset]);

  return (
    <div
      className={`fixed z-[80] font-sans text-text-primary print:hidden ${isOpen ? "" : "bottom-4 right-4"}`}
      style={isOpen ? { left: panelPosition.x, top: panelPosition.y } : undefined}
    >
      {isOpen ? (
        <div className="max-h-[calc(100vh-2rem)] w-[min(23rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border-accent/40 bg-white/95 p-4 shadow-[0_24px_80px_rgba(28,27,27,0.16)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div
              className="min-w-0 flex-1 cursor-move select-none touch-none"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              onMouseDown={handleMouseDragStart}
            >
              <p className="text-xs font-semibold uppercase tracking-[2px] text-text-accent">Bento tuning</p>
              <p className="mt-1 text-xs text-text-secondary">Drag this panel, tune the grid, copy the values.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[1px]"
            >
              Close
            </button>
          </div>

          <div className="rounded-lg border border-border-subtle/80 p-3">
            <label className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[1px]">
              Hover focus
              <input
                type="checkbox"
                checked={tuning.hoverFocus}
                onChange={(event) => onHoverFocusChange(event.target.checked)}
                className="size-4 accent-[#854d63]"
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((rows) => (
              <button
                key={rows}
                type="button"
                onClick={() => onPreset(rows)}
                className="rounded-full border border-border-subtle px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.8px]"
              >
                {rows} row{rows > 1 ? "s" : ""}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRandomize}
            className="mt-2 w-full rounded-full bg-[#854d63] px-3 py-2 text-xs font-semibold uppercase tracking-[1px] text-white"
          >
            Randomize
          </button>

          <div className="mt-4 space-y-3">
            {tuning.order.map((serviceIndex, position) => (
              <div key={`${serviceLabels[serviceIndex]}-${serviceIndex}`} className="rounded-lg border border-border-subtle/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-medium">
                  <span className="min-w-0 truncate">
                    {position + 1}. {serviceLabels[serviceIndex]}
                  </span>
                  <span className="shrink-0 tabular-nums text-text-accent">{tuning.spans[serviceIndex] ?? 6}/12</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={1}
                  value={tuning.spans[serviceIndex] ?? 6}
                  onChange={(event) => onSpanChange(serviceIndex, Number(event.target.value))}
                  className="w-full accent-[#854d63]"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onMoveService(serviceIndex, -1)}
                    disabled={position === 0}
                    className="rounded-full border border-border-subtle px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveService(serviceIndex, 1)}
                    disabled={position === tuning.order.length - 1}
                    className="rounded-full border border-border-subtle px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-border-subtle/80 pt-4">
            {serviceBentoTuningControls.map((control) => (
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
                  onChange={(event) => onNumberChange(control.key, Number(event.target.value))}
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
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[#854d63] px-4 py-3 text-xs font-semibold uppercase tracking-[1px] text-white shadow-[0_16px_44px_rgba(133,77,99,0.3)]"
        >
          Bento tune
        </button>
      )}
    </div>
  );
}

function TestimonialMediaTuningPanel({
  testimonialName,
  tuning,
  isAutoplayPaused,
  onOpen,
  onToggleAutoplay,
  onChange,
  onReset,
}: {
  testimonialName: string;
  tuning: TestimonialMediaFit;
  isAutoplayPaused: boolean;
  onOpen: () => void;
  onToggleAutoplay: () => void;
  onChange: (key: TestimonialMediaFitKey, value: number) => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState(DEFAULT_TESTIMONIAL_TUNING_PANEL_POSITION);
  const [dragOffset, setDragOffset] = useState<PanelPosition | null>(null);
  const dragOffsetRef = useRef<PanelPosition | null>(null);
  const exportedValues = JSON.stringify({ [testimonialName]: tuning }, null, 2);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(TESTIMONIAL_TUNING_PANEL_POSITION_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PanelPosition>;
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPanelPosition({
          x: Math.max(8, Math.min(parsed.x, window.innerWidth - 340)),
          y: Math.max(8, Math.min(parsed.y, window.innerHeight - 340)),
        });
      }
    } catch {
      setPanelPosition(DEFAULT_TESTIMONIAL_TUNING_PANEL_POSITION);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TESTIMONIAL_TUNING_PANEL_POSITION_KEY, JSON.stringify(panelPosition));
  }, [panelPosition]);

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const nextDragOffset = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    dragOffsetRef.current = nextDragOffset;
    setDragOffset(nextDragOffset);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    movePanelToClientPosition(event.clientX, event.clientY);
  };

  const movePanelToClientPosition = (clientX: number, clientY: number) => {
    const currentDragOffset = dragOffsetRef.current ?? dragOffset;
    if (!currentDragOffset || typeof window === "undefined") {
      return;
    }

    setPanelPosition({
      x: Math.max(8, Math.min(clientX - currentDragOffset.x, window.innerWidth - 340)),
      y: Math.max(8, Math.min(clientY - currentDragOffset.y, window.innerHeight - 340)),
    });
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOffsetRef.current = null;
    setDragOffset(null);
  };

  const handleMouseDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextDragOffset = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
    dragOffsetRef.current = nextDragOffset;
    setDragOffset(nextDragOffset);
  };

  useEffect(() => {
    if (!dragOffset) {
      return;
    }

    const handleWindowMouseMove = (event: MouseEvent) => {
      movePanelToClientPosition(event.clientX, event.clientY);
    };

    const handleWindowMouseUp = () => {
      dragOffsetRef.current = null;
      setDragOffset(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dragOffset]);

  return (
    <div
      className={`fixed z-[80] font-sans text-text-primary print:hidden ${isOpen ? "" : "bottom-4 left-4"}`}
      style={isOpen ? { left: panelPosition.x, top: panelPosition.y } : undefined}
    >
      {isOpen ? (
        <div
          data-testid="testimonial-media-tuning-panel"
          className="w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border-accent/40 bg-white/95 p-4 shadow-[0_24px_80px_rgba(28,27,27,0.16)] backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div
              data-testid="testimonial-media-tuning-drag-handle"
              className="min-w-0 flex-1 cursor-move select-none touch-none"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              onMouseDown={handleMouseDragStart}
            >
              <p className="text-xs font-semibold uppercase tracking-[2px] text-text-accent">Portrait tuning</p>
              <p className="mt-1 truncate text-xs text-text-secondary">{testimonialName}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[1px]"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {testimonialMediaTuningControls.map((control) => (
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
          <button
            type="button"
            onClick={onToggleAutoplay}
            className="mt-2 w-full rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-[1px]"
          >
            {isAutoplayPaused ? "Paused" : "Running"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onOpen();
            setIsOpen(true);
          }}
          className="rounded-full bg-[#1c1b1b] px-4 py-3 text-xs font-semibold uppercase tracking-[1px] text-white shadow-[0_16px_44px_rgba(28,27,27,0.24)]"
        >
          Portrait tune
        </button>
      )}
    </div>
  );
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
  const useCmsTestimonials =
    usingCmsTestimonials && import.meta.env.VITE_ENABLE_CMS_TESTIMONIALS !== "false";
  const usingCms = usingCmsHome;

  const heroData = cmsHome?.hero;
  const manifestoData = cmsHome?.manifesto;
  const aboutData = cmsHome?.about;
  const servicesSectionData = cmsHome?.servicesSection;
  const testimonialsSectionData = cmsHome?.testimonialsSection;
  const contactSectionData = cmsHome?.contactSection;
  const heroPortraitSrc = usingCms ? cmsImageUrl(heroData?.portrait) : portraitImage;
  const heroPortraitAlt = usingCms
    ? localized(heroData?.portrait?.alt, locale)
    : t("hero.imageAlt");
  const aboutImageSrc = usingCms ? cmsImageUrl(aboutData?.image) : aboutSectionImage;
  const aboutImageAlt = usingCms
    ? localized(aboutData?.image?.alt, locale)
    : t("about.imageAlt");

  const heroEyebrow = usingCms ? localized(heroData?.eyebrow, locale) : t("hero.eyebrow");
  const heroTitle = usingCms ? localized(heroData?.title, locale) : t("hero.titleStart");
  const heroAccent = usingCms ? localized(heroData?.accent, locale) : t("hero.titleAccent");
  const heroTitleEnd = usingCms ? localized(heroData?.titleEnd, locale) : t("hero.titleEnd");
  const heroAccentIndex =
    usingCms && heroTitle && heroAccent
      ? heroTitle.toLocaleLowerCase().indexOf(heroAccent.toLocaleLowerCase())
      : -1;

  const servicesTitleAccent =
    usingCms
      ? localized(servicesSectionData?.titleAccent, locale)
      : t("services.titleAccent");
  const servicesTitleRest =
    usingCms
      ? localized(servicesSectionData?.titleRest, locale)
      : t("services.titleRest");
  const servicesSubtitle =
    usingCms
      ? localized(servicesSectionData?.subtitle, locale)
      : t("services.subtitle");
  const testimonialsEyebrow =
    usingCms
      ? localized(testimonialsSectionData?.eyebrow, locale)
      : t("testimonials.eyebrow");
  const testimonialsTitleStart =
    usingCms
      ? localized(testimonialsSectionData?.titleStart, locale)
      : t("testimonials.titleStart");
  const testimonialsTitleAccent =
    usingCms
      ? localized(testimonialsSectionData?.titleAccent, locale)
      : t("testimonials.titleAccent");
  const contactEyebrow =
    usingCms
      ? localized(contactSectionData?.eyebrow, locale)
      : t("contactSection.eyebrow");
  const contactTitleStart =
    usingCms
      ? localized(contactSectionData?.titleStart, locale)
      : t("contactSection.titleStart");
  const contactTitleAccent =
    usingCms
      ? localized(contactSectionData?.titleAccent, locale)
      : t("contactSection.titleAccent");
  const contactDescription =
    usingCms
      ? localized(contactSectionData?.description, locale)
      : t("contactSection.description");
  const contactMeetingLink =
    usingCms
      ? localized(contactSectionData?.meetingLink, locale)
      : t("contactSection.meetingLink");

  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((s) => toServiceViewModel(s, locale));
    }
    return t("services.items", { returnObjects: true }) as Service[];
  }, [cmsServices, usingCmsServices, locale, t]);

  const traits = t("about.traits", { returnObjects: true }) as Trait[];

  const testimonials = useMemo(() => {
    if (useCmsTestimonials) {
      return cmsTestimonials.map((t) => toTestimonialViewModel(t, locale));
    }
    return t("testimonials.items", { returnObjects: true }) as Testimonial[];
  }, [cmsTestimonials, useCmsTestimonials, locale, t]);

  const circularTestimonials = useMemo(
    () =>
      testimonials.map((testimonial, index) => {
        const imgSrc = useCmsTestimonials
          ? cmsImageUrl(testimonial.portrait) ??
            testimonialPortraitByName[testimonial.name] ??
            testimonialImages[index]
          : testimonialImages[index] ?? testimonialImages[0];
        return {
          ...testimonial,
          mediaFit: testimonialMediaFitByName[testimonial.name] ?? DEFAULT_TESTIMONIAL_MEDIA_FIT,
          src: imgSrc ?? testimonialImages[0],
        };
      }),
    [testimonials, useCmsTestimonials]
  );
  const [visualTuning, setVisualTuning] = useState(DEFAULT_VISUAL_TUNING);
  const [serviceBentoTuning, setServiceBentoTuning] = useState(() =>
    readStoredServiceBentoTuning(5)
  );
  const [aboutVideoCanPlayThrough, setAboutVideoCanPlayThrough] = useState(false);
  const [aboutVideoPlaying, setAboutVideoPlaying] = useState(false);
  const [focusedServiceIndex, setFocusedServiceIndex] = useState<number | null>(null);
  const [settledServiceFocusIndex, setSettledServiceFocusIndex] = useState<number | null>(null);
  const serviceBentoRef = useRef<HTMLDivElement>(null);
  const [serviceBentoWidth, setServiceBentoWidth] = useState(0);
  const [serviceFontsReady, setServiceFontsReady] = useState(false);
  const isDev = import.meta.env.DEV;
  const enableAboutVideo = !reduceMotion;
  const showAboutVideo = enableAboutVideo && aboutVideoCanPlayThrough && aboutVideoPlaying;

  useEffect(() => {
    setVisualTuning(readStoredVisualTuning());
  }, []);

  useEffect(() => {
    setServiceBentoTuning((current) => normalizeServiceBentoTuning(current, services.length));
  }, [services.length]);

  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) {
      setServiceFontsReady(true);
      return;
    }

    let isMounted = true;

    document.fonts.ready.then(() => {
      if (!isMounted) {
        return;
      }

      serviceDescriptionPretextCache.clear();
      setServiceFontsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined" || !serviceBentoRef.current) {
      return;
    }

    const element = serviceBentoRef.current;
    const updateWidth = () => setServiceBentoWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setServiceBentoWidth(Math.round(entry.contentRect.width));
    });

    updateWidth();
    observer.observe(element);

    return () => observer.disconnect();
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

  useEffect(() => {
    if (!isDev || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SERVICE_BENTO_TUNING_STORAGE_KEY, JSON.stringify(serviceBentoTuning));
  }, [isDev, serviceBentoTuning]);

  useEffect(() => {
    if (typeof window === "undefined" || reduceMotion) {
      setSettledServiceFocusIndex(focusedServiceIndex);
      return;
    }

    setSettledServiceFocusIndex(null);
    const timeout = window.setTimeout(
      () => setSettledServiceFocusIndex(focusedServiceIndex),
      serviceBentoTuning.transitionMs
    );

    return () => window.clearTimeout(timeout);
  }, [focusedServiceIndex, reduceMotion, serviceBentoTuning.transitionMs]);

  const handleVisualTuningChange = (key: VisualTuningKey, value: number) => {
    setVisualTuning((current) => ({ ...current, [key]: value }));
  };

  const handleServiceBentoSpanChange = (index: number, value: number) => {
    setServiceBentoTuning((current) => ({
      ...current,
      spans: current.spans.map((span, spanIndex) => (spanIndex === index ? clampServiceSpan(value) : span)),
    }));
  };

  const handleServiceBentoNumberChange = (key: ServiceBentoNumberKey, value: number) => {
    setServiceBentoTuning((current) => normalizeServiceBentoTuning({ ...current, [key]: value }, services.length));
  };

  const handleServiceBentoMove = (index: number, direction: -1 | 1) => {
    setServiceBentoTuning((current) => {
      const currentPosition = current.order.indexOf(index);
      const nextPosition = currentPosition + direction;
      if (currentPosition < 0 || nextPosition < 0 || nextPosition >= current.order.length) {
        return current;
      }

      const nextOrder = [...current.order];
      [nextOrder[currentPosition], nextOrder[nextPosition]] = [nextOrder[nextPosition], nextOrder[currentPosition]];
      return normalizeServiceBentoTuning({ ...current, order: nextOrder }, services.length);
    });
  };

  const handleServiceBentoPreset = (rows: number) => {
    setServiceBentoTuning((current) => ({
      ...buildServiceBentoPreset(services.length, rows),
      order: current.order,
      hoverFocus: current.hoverFocus,
      hoverSpan: current.hoverSpan,
      compactSpan: current.compactSpan,
      hoverLift: current.hoverLift,
      transitionMs: current.transitionMs,
      minHeight: current.minHeight,
      gap: current.gap,
    }));
  };

  const handleServiceBentoRandomize = () => {
    setServiceBentoTuning((current) => randomizeServiceBentoTuning(current, services.length));
  };

  const handleServiceBentoReset = () => {
    setServiceBentoTuning(normalizeServiceBentoTuning(DEFAULT_SERVICE_BENTO_TUNING, services.length));
  };

  const activeServiceBentoSpans = useMemo(
    () =>
      services.map((_, index) => {
        const row = findServiceBentoRow(index);
        const rowShouldApplyHover = row
          ? shouldApplyServiceBentoHoverToRow(row, focusedServiceIndex, serviceBentoTuning.spans)
          : false;
        const hoverSpan =
          rowShouldApplyHover && focusedServiceIndex !== null
            ? SERVICE_BENTO_HOVER_SPANS[focusedServiceIndex]?.[index]
            : undefined;
        return hoverSpan ?? serviceBentoTuning.spans[index] ?? 6;
      }),
    [focusedServiceIndex, serviceBentoTuning.spans, services]
  );

  const serviceDescriptionLines = useMemo(() => {
    if (!serviceFontsReady || serviceBentoWidth < SERVICE_BENTO_DESKTOP_BREAKPOINT) {
      return services.map((service) => [service.description]);
    }

    return services.map((service, index) => {
      const row = findServiceBentoRow(index);

      if (!row) {
        return [service.description];
      }

      const visibleRow = row.filter((serviceIndex) => serviceIndex < services.length);
      const rowShouldApplyHover = shouldApplyServiceBentoHoverToRow(
        visibleRow,
        focusedServiceIndex,
        serviceBentoTuning.spans
      );
      const activeWidth = getServiceBentoContentWidth({
        containerWidth: serviceBentoWidth,
        gap: serviceBentoTuning.gap,
        row: visibleRow,
        serviceIndex: index,
        spans: activeServiceBentoSpans,
      });
      const restWidth = getServiceBentoContentWidth({
        containerWidth: serviceBentoWidth,
        gap: serviceBentoTuning.gap,
        row: visibleRow,
        serviceIndex: index,
        spans: serviceBentoTuning.spans,
      });
      const isSettledLayout =
        !rowShouldApplyHover ||
        focusedServiceIndex === null ||
        settledServiceFocusIndex === focusedServiceIndex;
      const textWidth = isSettledLayout
        ? activeWidth
        : Math.min(activeWidth || restWidth, restWidth || activeWidth);

      return layoutServiceDescriptionLines(service.description, textWidth);
    });
  }, [
    activeServiceBentoSpans,
    focusedServiceIndex,
    settledServiceFocusIndex,
    serviceBentoTuning.gap,
    serviceBentoTuning.spans,
    serviceBentoWidth,
    serviceFontsReady,
    services,
  ]);

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
            {heroEyebrow && (
              <SectionEyebrow className="mb-5 tracking-[3px]">{heroEyebrow}</SectionEyebrow>
            )}
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
              {usingCms ? localized(heroData?.description, locale) : t("hero.description")}
            </p>
            <div className="mt-8 grid w-full max-w-[25rem] grid-cols-1 gap-3 min-[460px]:flex min-[460px]:max-w-none min-[460px]:flex-wrap">
              <Link
                to="/contact"
                className="inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1c1b1b] px-6 text-center text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#fcf9f8] shadow-[0_14px_32px_rgba(28,27,27,0.13)] transition hover:bg-[#854d63] dark:bg-[#f8f1ec] dark:text-[#1c1415] dark:hover:bg-[#f0adc4] min-[460px]:min-w-[144px] md:h-[52px] md:min-w-[176px] md:px-8 md:tracking-[1px]"
              >
                {usingCms ? localized(heroData?.primaryCta, locale) : t("hero.primaryCta")}
              </Link>
              <Link
                to="/services"
                className="inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-full border border-[#1c1b1b]/20 px-6 text-center text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-text-primary transition hover:border-[#854d63] hover:bg-[#ffd9e4]/44 hover:text-text-accent dark:border-white/20 dark:text-text-primary dark:hover:border-[#f0adc4] dark:hover:bg-[#854d63]/30 dark:hover:text-[#f0adc4] min-[460px]:min-w-[144px] md:h-[52px] md:min-w-[172px] md:px-8 md:tracking-[1px]"
              >
                {usingCms ? localized(heroData?.secondaryCta, locale) : t("hero.secondaryCta")}
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
                alt={heroPortraitAlt}
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
              <span className="flex size-10 items-center justify-center rounded-full bg-[#ffd9e4] text-[#854d63]">
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
            {usingCms ? localized(manifestoData?.title, locale) : t("manifesto.titleTop")}
            <br />
            <span className="relative isolate inline-block font-liberation-serif italic text-text-accent dark:text-text-accent">
              {usingCms ? localized(manifestoData?.accent, locale) : t("manifesto.titleAccent")}
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
              return usingCms
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
        className="bg-white px-5 pb-16 pt-24 dark:bg-[#181312] sm:px-8 lg:px-[min(8vw,112px)] lg:pb-24 lg:pt-32"
      >
        <div className="mx-auto grid max-w-[1152px] items-center gap-24 lg:grid-cols-[minmax(0,350px)_minmax(0,1fr)] lg:gap-28 xl:grid-cols-[minmax(0,368px)_minmax(0,1fr)]">
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
                  alt={aboutImageAlt}
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
                </video>
              </div>
              ) : null}
            </div>
          </div>
          <div className="lg:self-center">
            <h2 className="text-balance font-serif text-[clamp(2rem,3.7vw,3.55rem)] leading-[1.06] dark:text-text-primary">
              {usingCms ? localized(aboutData?.title, locale) : t("about.titleTop")}
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
                return usingCms
                  ? paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
                  : <><p>{t("about.p1")}</p><p>{t("about.p2")}</p></>;
              })()}
            </div>
            <Link
              to="/about"
              className="group mt-5 inline-flex items-center text-[13px] font-semibold uppercase tracking-[1.8px] text-text-accent transition hover:text-[#6a364b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854d63] dark:text-text-accent dark:hover:text-[#f8d7e3]"
            >
              {t("about.cta")}
              <ArrowRightIcon className="ml-2 size-4 transition group-hover:translate-x-1" />
            </Link>
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
          <div
            ref={serviceBentoRef}
            className="flex flex-col"
            style={{
              "--service-bento-hover-dur": reduceMotion ? "0ms" : `${serviceBentoTuning.transitionMs}ms`,
              "--service-bento-hover-ease": "cubic-bezier(0.22, 1, 0.36, 1)",
              gap: `${serviceBentoTuning.gap}px`,
            } as CSSProperties}
          >
            {SERVICE_BENTO_ROWS.map((row, rowIndex) => {
              const rowServices = row.filter((serviceIndex) => services[serviceIndex]);
              return (
                <div
                  key={`service-bento-row-${rowIndex}`}
                  className="service-bento-row grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-none"
                  style={{
                    "--service-bento-columns": rowServices
                      .map((serviceIndex) => `${activeServiceBentoSpans[serviceIndex] ?? 6}fr`)
                      .join(" "),
                    gap: `${serviceBentoTuning.gap}px`,
                  } as CSSProperties}
                >
                  {rowServices.map((index) => {
                    const service = services[index];
                    const icon = (serviceIcons as readonly string[])[index] ?? brandFlagIcon;
                    const accent = homeServiceAccents[index] ?? homeServiceAccents[0];
                    const isFocusedService = focusedServiceIndex === index;
                    const descriptionLines = serviceDescriptionLines[index] ?? [service.description];
                    return (
                      <Link
                        to={`/services/${service.slug}`}
                        key={`${service.title}-${service.accent}`}
                        onMouseEnter={() => setFocusedServiceIndex(index)}
                        onMouseLeave={() => setFocusedServiceIndex(null)}
                        onFocus={() => setFocusedServiceIndex(index)}
                        onBlur={() => setFocusedServiceIndex(null)}
                        className="group relative block h-full overflow-hidden rounded-lg border border-border-accent/25 bg-white p-6 text-left no-underline shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition-[transform,box-shadow,border-color] hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854d63] dark:border-[#d8a4c7]/16 dark:bg-surface-panel dark:hover:border-[#d8a4c7]/28 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-7"
                        style={{
                          minHeight: `${serviceBentoTuning.minHeight}px`,
                          transitionDuration: "var(--service-bento-hover-dur)",
                          transitionTimingFunction: "var(--service-bento-hover-ease)",
                          transform:
                            !reduceMotion && focusedServiceIndex !== null && isFocusedService
                              ? `translateY(-${serviceBentoTuning.hoverLift}px)`
                              : undefined,
                        }}
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
                        <p className="relative mt-4 max-w-2xl text-sm leading-6 text-text-secondary dark:text-[#ded7d2]">
                          {descriptionLines.length > 1
                            ? descriptionLines.map((line, lineIndex) => (
                                <span key={`${line}-${lineIndex}`} className="block whitespace-nowrap">
                                  {line}
                                </span>
                              ))
                            : service.description}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {isDev && SHOW_SERVICE_BENTO_TUNING_PANEL ? (
            <ServiceBentoTuningPanel
              serviceLabels={services.map((service) => `${service.title} ${service.accent}`)}
              tuning={serviceBentoTuning}
              onSpanChange={handleServiceBentoSpanChange}
              onNumberChange={handleServiceBentoNumberChange}
              onHoverFocusChange={(value) => setServiceBentoTuning((current) => ({ ...current, hoverFocus: value }))}
              onMoveService={handleServiceBentoMove}
              onPreset={handleServiceBentoPreset}
              onRandomize={handleServiceBentoRandomize}
              onReset={handleServiceBentoReset}
            />
          ) : null}
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
          isDev={isDev}
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
