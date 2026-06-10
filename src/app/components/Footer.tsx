import {
  ArrowUpIcon,
  CheckIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { animate, motion, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { langLabels, useLang, type Lang } from "../i18n/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { useCmsCollection, useCmsSingleton } from "../../cms/cmsContent";
import type { CmsService, CmsSiteSettings } from "../../cms/types";
import { toServiceViewModel } from "../../cms/adapters";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "FR" },
  { code: "en", flag: "EN" },
];
const FOOTER_REVEAL_DELAY_MS = 1800;
const FOOTER_REVEAL_FAST_DELAY_MS = 1200;
const SHADER_LONG_PRESS_MS = 320;

type ServiceItem = {
  slug: string;
  title: string;
  accent: string;
};

type SocialLink = {
  label: string;
  href: string;
  external: boolean;
};

function FooterColumn({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <h2 className="border-b border-[#e5e2e1]/90 pb-3 text-[11px] font-semibold uppercase tracking-[3px] text-[#1c1b1b] dark:border-white/12 dark:text-[#f8f1ec]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function FooterLink({
  to,
  href,
  external,
  children,
}: {
  to?: string;
  href?: string;
  external?: boolean;
  children: ReactNode;
}) {
  const className =
    "block break-words text-[15px] leading-7 text-[#5b4137] transition hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:text-[#f0adc4]";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {children}
    </a>
  );
}

function SocialRow({
  href,
  to,
  external,
  icon,
  label,
}: {
  href?: string;
  to?: string;
  external?: boolean;
  icon: ReactNode;
  label: string;
}) {
  const className =
    "group flex min-w-0 items-center gap-3 text-[15px] leading-7 text-[#5b4137] transition hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:text-[#f0adc4]";

  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#854d63]/25 bg-[#ffd9e4]/35 text-[#854d63] transition group-hover:border-[#854d63]/45 group-hover:bg-[#ffd9e4]/55 dark:border-[#f0adc4]/30 dark:bg-[#854d63]/22 dark:text-[#f0adc4]">
        {icon}
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {content}
    </a>
  );
}

function socialIconForLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("behance")) {
    return <BehanceMark />;
  }
  if (normalized.includes("linkedin")) {
    return <LinkedInMark />;
  }
  return <EnvelopeIcon className="size-4" />;
}

function BehanceMark() {
  return <span className="text-[11px] font-bold tracking-[0.08em]">Bē</span>;
}

function LinkedInMark() {
  return <span className="text-[11px] font-bold tracking-[0.04em]">in</span>;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function FooterShaderCanvas({
  reducedMotion,
  speedMultiplier,
  darkMode,
}: {
  reducedMotion: boolean | null;
  speedMultiplier: number;
  darkMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedMultiplierRef = useRef(speedMultiplier);
  const darkModeRef = useRef(darkMode);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    darkModeRef.current = darkMode;
  }, [darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!canvas || !gl) {
      return;
    }

    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      `
        attribute vec2 aPosition;
        varying vec2 vUv;

        void main() {
          vUv = aPosition * 0.5 + 0.5;
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `,
    );

    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
        precision highp float;

        uniform vec2 iResolution;
        uniform float iTime;
        uniform float uDarkMode;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);

          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.02;
            amplitude *= 0.5;
          }
          return value;
        }

        vec3 palette(float t) {
          vec3 cream = vec3(1.0, 0.93, 0.92);
          vec3 blush = vec3(1.0, 0.78, 0.84);
          vec3 coral = vec3(1.0, 0.52, 0.55);
          vec3 peach = vec3(1.0, 0.82, 0.68);
          vec3 violet = vec3(0.58, 0.45, 0.92);
          vec3 lavender = vec3(0.88, 0.80, 1.0);

          vec3 lightColor = mix(cream, blush, smoothstep(0.0, 0.32, t));
          lightColor = mix(lightColor, peach, smoothstep(0.18, 0.52, t) * 0.34);
          lightColor = mix(lightColor, coral, smoothstep(0.36, 0.62, t) * (1.0 - smoothstep(0.58, 0.78, vUv.x)) * 0.72);
          lightColor = mix(lightColor, violet, smoothstep(0.58, 0.96, vUv.x) * smoothstep(0.24, 0.88, t) * 0.68);
          lightColor = mix(lightColor, lavender, smoothstep(0.65, 1.0, vUv.y) * 0.18);

          vec3 darkBg = vec3(0.08, 0.06, 0.05);
          vec3 deepPlum = vec3(0.22, 0.08, 0.15);
          vec3 burgundy = vec3(0.30, 0.08, 0.12);
          vec3 darkWarm = vec3(0.18, 0.10, 0.08);
          vec3 deepViolet = vec3(0.20, 0.12, 0.35);
          vec3 mutedLavender = vec3(0.30, 0.25, 0.40);

          vec3 darkColor = mix(darkBg, deepPlum, smoothstep(0.0, 0.32, t));
          darkColor = mix(darkColor, darkWarm, smoothstep(0.18, 0.52, t) * 0.34);
          darkColor = mix(darkColor, burgundy, smoothstep(0.36, 0.62, t) * (1.0 - smoothstep(0.58, 0.78, vUv.x)) * 0.72);
          darkColor = mix(darkColor, deepViolet, smoothstep(0.58, 0.96, vUv.x) * smoothstep(0.24, 0.88, t) * 0.68);
          darkColor = mix(darkColor, mutedLavender, smoothstep(0.65, 1.0, vUv.y) * 0.18);

          return mix(lightColor, darkColor, uDarkMode);
        }

        void main() {
          vec2 uv = vUv;
          float aspect = iResolution.x / max(iResolution.y, 1.0);
          vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);

          float time = iTime * 0.11;
          vec2 q = vec2(
            fbm(p * 1.22 + vec2(time, -time * 0.28)),
            fbm(p * 1.08 + vec2(-time * 0.34, time * 0.92))
          );
          vec2 r = vec2(
            fbm(p * 1.55 + 2.0 * q + vec2(time * 0.62, 0.0)),
            fbm(p * 1.35 + 1.7 * q + vec2(0.0, -time * 0.48))
          );

          float wave = sin((p.x + r.x * 0.42) * 4.8 + time * 2.4) * 0.11;
          wave += sin((p.x - r.y * 0.32) * 8.2 - time * 1.7) * 0.045;
          float arch = -pow(p.x * 0.42, 2.0) + 0.22;
          float field = smoothstep(0.08, 1.02, uv.y + wave + arch + (r.x - 0.5) * 0.42);

          vec3 color = palette(field);
          float topLight = smoothstep(0.18, 0.92, uv.y);
          vec3 topTint = mix(vec3(1.0, 0.94, 0.93), vec3(0.06, 0.04, 0.03), uDarkMode);
          color = mix(topTint, color, topLight * 0.86);

          vec3 glowColor = mix(vec3(1.0, 0.92, 0.88), vec3(0.15, 0.08, 0.12), uDarkMode);
          float glow = 0.14 * exp(-3.6 * abs(uv.y - (0.42 + wave * 0.9)));
          color += glowColor * glow;

          float grain = hash(uv * iResolution.xy + iTime * 14.0) - 0.5;
          float grainStrength = mix(0.014, 0.006, uDarkMode);
          color += grain * grainStrength;

          vec3 finalTint = mix(vec3(1.0, 0.91, 0.92), vec3(0.10, 0.06, 0.08), uDarkMode);
          float tintStrength = mix(0.14, 0.08, uDarkMode);
          color = mix(color, finalTint, tintStrength);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const resolutionLocation = gl.getUniformLocation(program, "iResolution");
    const timeLocation = gl.getUniformLocation(program, "iTime");
    const darkModeLocation = gl.getUniformLocation(program, "uDarkMode");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    let animationFrame = 0;
    let lastFrameAt = performance.now();
    let shaderTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = () => {
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastFrameAt) / 1000);
      lastFrameAt = now;
      shaderTime += reducedMotion ? 0 : delta * speedMultiplierRef.current;

      resize();
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, shaderTime);
      gl.uniform1f(darkModeLocation, darkModeRef.current ? 1.0 : 0.0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", resize);
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { lang, setLang } = useLang();
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { data: siteData } = useCmsSingleton<CmsSiteSettings | null>("siteSettings", null);
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const shaderSectionRef = useRef<HTMLElement>(null);
  const returnTimeoutRef = useRef<number | undefined>(undefined);
  const returnAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const scheduleReturnRef = useRef<(delay?: number) => void>(() => undefined);
  const longPressTimeoutRef = useRef<number | undefined>(undefined);
  const isShaderPressingRef = useRef(false);
  const isReturningRef = useRef(false);
  const [isShaderHovered, setIsShaderHovered] = useState(false);
  const [isShaderAccelerated, setIsShaderAccelerated] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const socialLinks = useMemo((): SocialLink[] => {
    const contactLink: SocialLink = siteData?.contactEmail
      ? { label: t("footer.contactEmail"), href: `mailto:${siteData.contactEmail}`, external: true }
      : { label: t("footer.contactEmail"), href: "/contact", external: false };

    const cmsLinks: SocialLink[] =
      siteData?.socialLinks
        ?.filter((link) => link.label && link.url)
        .map((link) => ({
          label: link.label!,
          href: link.url!,
          external: true,
        })) ?? [];

    if (cmsLinks.length > 0) {
      return cmsLinks.concat([contactLink]);
    }

    const flatLinks: SocialLink[] = [
      siteData?.linkedin
        ? { label: t("footer.linkedin"), href: siteData.linkedin, external: true }
        : null,
      siteData?.instagram
        ? { label: "Instagram", href: siteData.instagram, external: true }
        : null,
    ].filter((link): link is SocialLink => link !== null);

    if (flatLinks.length > 0) {
      return flatLinks.concat([contactLink]);
    }

    return [
      { label: t("footer.behance"), href: "https://www.behance.net/caroletonoukouen", external: true },
      { label: t("footer.linkedin"), href: "https://www.linkedin.com/in/caroletonoukouen/", external: true },
      contactLink,
    ];
  }, [siteData, t]);

  const serviceLinks = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((service) => {
        const view = toServiceViewModel(service, i18n.language);
        return {
          label: `${view.title} ${view.accent}`.trim(),
          href: `/services/${view.slug}`,
        };
      });
    }

    const items = t("services.items", { returnObjects: true }) as ServiceItem[];
    return items.map((item) => ({
      label: `${item.title} ${item.accent}`.trim(),
      href: `/services/${item.slug}`,
    }));
  }, [cmsServices, usingCmsServices, i18n.language, t]);

  useEffect(() => {
    const getFooterRestY = () => {
      const footer = footerRef.current;
      if (!footer) {
        return null;
      }

      const footerBottom = footer.offsetTop + footer.offsetHeight;
      return Math.max(0, footerBottom - window.innerHeight);
    };

    const returnToFooter = () => {
      const restY = getFooterRestY();
      if (restY === null || window.scrollY <= restY + 2) {
        return;
      }

      returnAnimationRef.current?.stop();
      isReturningRef.current = true;
      if (shouldReduceMotion) {
        window.scrollTo(0, restY);
        isReturningRef.current = false;
        return;
      }

      returnAnimationRef.current = animate(window.scrollY, restY, {
        type: "spring",
        stiffness: 920,
        damping: 20,
        mass: 0.24,
        velocity: -1250,
        restDelta: 0.22,
        restSpeed: 18,
        onUpdate: (latest) => window.scrollTo(0, latest),
        onComplete: () => {
          isReturningRef.current = false;
        },
      });
    };

    const scheduleReturn = (delay = FOOTER_REVEAL_DELAY_MS) => {
      window.clearTimeout(returnTimeoutRef.current);
      if (isReturningRef.current || isShaderPressingRef.current) {
        return;
      }

      returnTimeoutRef.current = window.setTimeout(returnToFooter, delay);
    };
    scheduleReturnRef.current = scheduleReturn;

    const handleScroll = () => {
      if (isReturningRef.current) {
        return;
      }

      const restY = getFooterRestY();
      if (restY !== null && window.scrollY > restY + 2) {
        const revealDepth = window.scrollY - restY;
        scheduleReturn(revealDepth > window.innerHeight * 0.18 ? FOOTER_REVEAL_FAST_DELAY_MS : FOOTER_REVEAL_DELAY_MS);
      }
    };

    const handleWheelIntent = (event: WheelEvent) => {
      const restY = getFooterRestY();
      if (restY !== null && window.scrollY > restY + 2) {
        if (isShaderPressingRef.current) {
          window.clearTimeout(returnTimeoutRef.current);
          return;
        }

        if (event.deltaY < 0) {
          window.clearTimeout(returnTimeoutRef.current);
          returnToFooter();
          return;
        }

        scheduleReturn(event.deltaY > 28 ? FOOTER_REVEAL_FAST_DELAY_MS : FOOTER_REVEAL_DELAY_MS);
        return;
      }
    };

    const cancelReturn = () => {
      window.clearTimeout(returnTimeoutRef.current);
      if (isReturningRef.current) {
        returnAnimationRef.current?.stop();
        isReturningRef.current = false;
      }
    };

    const handleTouchEnd = () => scheduleReturn(FOOTER_REVEAL_DELAY_MS);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheelIntent, { passive: true });
    window.addEventListener("touchmove", cancelReturn, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.clearTimeout(returnTimeoutRef.current);
      returnAnimationRef.current?.stop();
      scheduleReturnRef.current = () => undefined;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheelIntent);
      window.removeEventListener("touchmove", cancelReturn);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [shouldReduceMotion]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetShaderReturnTimer = () => {
    if (isShaderPressingRef.current) {
      window.clearTimeout(returnTimeoutRef.current);
      return;
    }

    scheduleReturnRef.current(FOOTER_REVEAL_DELAY_MS);
  };

  const handleShaderPointerMove = (event: PointerEvent<HTMLElement>) => {
    const section = shaderSectionRef.current;
    if (!section) {
      return;
    }

    const rect = section.getBoundingClientRect();
    setTooltipPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setIsShaderHovered(true);
    resetShaderReturnTimer();
  };

  const handleShaderPointerDown = () => {
    isShaderPressingRef.current = true;
    window.clearTimeout(returnTimeoutRef.current);
    window.clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = window.setTimeout(() => {
      setIsShaderAccelerated(true);
    }, SHADER_LONG_PRESS_MS);
  };

  const endShaderLongPress = () => {
    isShaderPressingRef.current = false;
    window.clearTimeout(longPressTimeoutRef.current);
    setIsShaderAccelerated(false);
    resetShaderReturnTimer();
  };

  const handleShaderPointerLeave = () => {
    isShaderPressingRef.current = false;
    window.clearTimeout(longPressTimeoutRef.current);
    setIsShaderHovered(false);
    setIsShaderAccelerated(false);
    scheduleReturnRef.current(FOOTER_REVEAL_FAST_DELAY_MS);
  };

  return (
    <div>
      <footer
        ref={footerRef}
        className="relative border-t border-[#e5e2e1]/80 bg-[#fcf9f8] dark:border-white/10 dark:bg-[#13100f]"
      >
        <div className="mx-auto max-w-[1680px] px-6 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-12 lg:pt-20 xl:px-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-12 xl:gap-x-12">
            <div className="min-w-0 md:col-span-2 lg:col-span-12 xl:col-span-4">
              <p className="font-serif text-[clamp(2.35rem,3.2vw,3.35rem)] italic leading-none tracking-[-0.01em] text-[#1c1b1b] dark:text-[#f8f1ec]">
                Carole T.
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
                {t("footer.role")}
              </p>
              <p className="mt-5 max-w-[22rem] text-[15px] leading-7 text-[#5b4137] dark:text-[#dbc9c0]">
                {t("footer.tagline")}
              </p>
              <span className="mt-8 block h-px w-14 bg-[#f0adc4] dark:bg-[#f0adc4]/60" />
              <div className="mt-7 flex flex-wrap gap-3">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLang(language.code)}
                    className={`inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[1.5px] transition sm:min-w-[8.25rem] ${
                      lang === language.code
                        ? "border-[#854d63]/45 bg-[#ffd9e4]/70 text-[#854d63] dark:border-[#f0adc4]/50 dark:bg-[#854d63]/30 dark:text-[#f0adc4]"
                        : "border-[#e5e2e1] bg-transparent text-[#5b4137] hover:border-[#854d63]/35 hover:text-[#854d63] dark:border-white/14 dark:text-[#cdb9ae] dark:hover:border-[#f0adc4]/40 dark:hover:text-[#f0adc4]"
                    }`}
                    aria-pressed={lang === language.code}
                  >
                    {language.flag}
                    <span>{langLabels[language.code].toUpperCase()}</span>
                    <span
                      className="t-icon-swap size-4"
                      data-state={lang === language.code ? "b" : "a"}
                      aria-hidden="true"
                    >
                      <span className="t-icon size-4" data-icon="a" />
                      <CheckIcon className="t-icon size-4" data-icon="b" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <FooterColumn
              title={t("footer.navTitle")}
              className="md:col-span-1 lg:col-span-6 xl:col-span-2"
            >
              <ul className="space-y-2">
                <li>
                  <FooterLink to="/">{t("nav.home")}</FooterLink>
                </li>
                <li>
                  <FooterLink to="/about">{t("nav.about")}</FooterLink>
                </li>
                <li>
                  <FooterLink to="/services">{t("nav.services")}</FooterLink>
                </li>
                <li>
                  <FooterLink to="/carnet/outils-inspirations">{t("nav.carnet")}</FooterLink>
                </li>
                <li>
                  <FooterLink to="/contact">{t("nav.contact")}</FooterLink>
                </li>
              </ul>
            </FooterColumn>

            <FooterColumn
              title={t("footer.servicesTitle")}
              className="md:col-span-1 lg:col-span-6 xl:col-span-2"
            >
              <ul className="space-y-2">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink to={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn
              title={t("footer.carnetTitle")}
              className="md:col-span-1 lg:col-span-6 xl:col-span-2"
            >
              <ul className="space-y-2">
                <li>
                  <FooterLink to="/carnet/outils-inspirations">
                    {t("nav.toolsAndInspirations")}
                  </FooterLink>
                </li>
                <li>
                  <FooterLink to="/carnet/lectures-references">
                    {t("nav.readingsAndReferences")}
                  </FooterLink>
                </li>
              </ul>
            </FooterColumn>

            <FooterColumn
              title={t("footer.socialTitle")}
              className="md:col-span-2 lg:col-span-6 xl:col-span-2"
            >
              <ul className="space-y-4">
                {socialLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <SocialRow
                      href={link.external ? link.href : undefined}
                      to={link.external ? undefined : link.href}
                      external={link.external}
                      icon={socialIconForLabel(link.label)}
                      label={link.label}
                    />
                  </li>
                ))}
              </ul>
            </FooterColumn>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-[#e5e2e1]/90 pt-7 sm:flex-row sm:items-center sm:justify-between dark:border-white/12">
            <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[#5b4137] dark:text-[#cdb9ae]">
              © {year} {t("footer.copyright")}
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2.5px] text-[#5b4137] transition hover:text-[#854d63] dark:text-[#cdb9ae] dark:hover:text-[#f0adc4]"
            >
              {t("footer.backToTop")}
              <ArrowUpIcon className="size-4" />
            </button>
          </div>
        </div>
      </footer>

      <section
        ref={shaderSectionRef}
        aria-hidden="true"
        className="relative h-[clamp(16rem,32vh,22rem)] overflow-hidden border-t border-[#f3cfda]/85"
        onPointerEnter={(event) => {
          setIsShaderHovered(true);
          handleShaderPointerMove(event);
        }}
        onPointerMove={handleShaderPointerMove}
        onPointerDown={handleShaderPointerDown}
        onPointerUp={endShaderLongPress}
        onPointerCancel={endShaderLongPress}
        onPointerLeave={handleShaderPointerLeave}
      >
        <FooterShaderCanvas
          reducedMotion={shouldReduceMotion}
          speedMultiplier={isShaderAccelerated ? 3.25 : 0.72}
          darkMode={resolvedTheme === "dark"}
        />

        <svg
          className="pointer-events-none absolute inset-x-0 top-[32%] z-[2] h-[8rem] w-full opacity-70"
          viewBox="0 0 1200 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 60 C190 76, 300 58, 430 28 C530 -2, 620 88, 735 40 C850 -8, 940 8, 1040 46 C1108 72, 1154 54, 1200 38"
            fill="none"
            stroke="rgba(255,255,255,0.78)"
            strokeWidth="1.15"
          />
        </svg>

        <svg
          className="pointer-events-none absolute inset-x-0 top-[26%] z-[2] h-[7rem] w-full opacity-35"
          viewBox="0 0 1200 72"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 30 C165 82, 310 52, 468 20 C620 -10, 704 78, 860 44 C1000 14, 1084 38, 1200 20"
            fill="none"
            stroke="rgba(255,255,255,0.58)"
            strokeWidth="0.9"
          />
        </svg>

        <div className="relative z-[3] flex h-full items-center px-6 sm:px-10 lg:px-16">
          <div className="relative mx-auto w-full max-w-[1680px]">
            <svg
              className="absolute -top-7 left-[min(100%,20rem)] size-5 text-[#854d63]/35"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0l2.2 7.8L22 10l-7.8 2.2L12 20l-2.2-7.8L2 10l7.8-2.2L12 0z" />
            </svg>
            <p className="font-serif text-[clamp(1.45rem,2.5vw,2.25rem)] italic leading-[1.2] tracking-[-0.01em] text-[#1c1b1b] drop-shadow-[0_2px_18px_rgba(255,255,255,0.45)] dark:text-[#f8f1ec]">
              {t("footer.overscrollLine1")}
              <br />
              {t("footer.overscrollLine2")}
            </p>
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-[4] hidden rounded-md border border-white/70 bg-white/88 px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-[#1c1b1b] shadow-[0_16px_36px_rgba(28,27,27,0.16)] backdrop-blur-md md:block"
          animate={{
            opacity: isShaderHovered ? 1 : 0,
            scale: isShaderAccelerated ? 1.04 : 1,
            x: tooltipPosition.x + 28,
            y: tooltipPosition.y > 112 ? tooltipPosition.y - 62 : tooltipPosition.y + 24,
          }}
          transition={{
            opacity: { duration: 0.16 },
            scale: { type: "spring", stiffness: 420, damping: 30 },
            x: { type: "spring", stiffness: 520, damping: 38, mass: 0.35 },
            y: { type: "spring", stiffness: 520, damping: 38, mass: 0.35 },
          }}
        >
          {t("footer.holdToAccelerate")}
        </motion.div>
      </section>
    </div>
  );
}
