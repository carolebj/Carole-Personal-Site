import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Bars3Icon,
  CalculatorIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  MoonIcon,
  PencilSquareIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import caroleLogoSymbol from "../../assets/logos/carole-CT-logo.svg";
import blogAbstractEditorial from "../../assets/blog/blog-abstract-editorial.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useHaptics } from "../interactions/HapticContext";
import { useTheme, type ThemePreference } from "../theme/ThemeContext";
import { toBlogPostViewModel, toServiceViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection } from "../../cms/cmsContent";
import { isPublishedPost, type CmsBlogPost, type CmsImage, type CmsService } from "../../cms/types";

type ServicePreview = {
  slug: string;
  title: string;
  accent: string;
  description: string;
  menuDescription: string;
  metricValue: string;
  metricLabel: string;
  bullets: string[];
};

type MenuHighlight = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  featured?: boolean;
  coverImage?: CmsImage;
};

const EMPTY_BLOG_POSTS: CmsBlogPost[] = [];

type DropdownPhase = "closed" | "open" | "closing";
type MobileAccordion = "services" | "carnet" | null;
type ServiceMenuKey = "editorial" | "audit" | "communication" | "content" | "identity" | "other";

const getServiceMenuKey = (slug: string, index: number): ServiceMenuKey => {
  const normalizedSlug = slug.toLowerCase();

  if (normalizedSlug.includes("audit")) return "audit";
  if (normalizedSlug.includes("identite") || normalizedSlug.includes("visual-identity")) return "identity";
  if (normalizedSlug.includes("communication")) return "communication";
  if (normalizedSlug.includes("creation") || normalizedSlug.includes("content-creation")) return "content";
  if (normalizedSlug.includes("strategie") || normalizedSlug.includes("editorial-strategy")) return "editorial";

  return (["editorial", "communication", "content", "audit", "identity"] as const)[index] ?? "other";
};

const themeOptions: Array<{
  value: ThemePreference;
  labelKey: "systemTheme" | "lightTheme" | "darkTheme";
  descriptionKey: "systemThemeDescription" | "lightThemeDescription" | "darkThemeDescription";
  Icon: typeof ComputerDesktopIcon;
}> = [
  {
    value: "system",
    labelKey: "systemTheme",
    descriptionKey: "systemThemeDescription",
    Icon: ComputerDesktopIcon,
  },
  {
    value: "light",
    labelKey: "lightTheme",
    descriptionKey: "lightThemeDescription",
    Icon: SunIcon,
  },
  {
    value: "dark",
    labelKey: "darkTheme",
    descriptionKey: "darkThemeDescription",
    Icon: MoonIcon,
  },
];

const getDropdownCloseDuration = () => {
  const closeDuration = getComputedStyle(document.documentElement)
    .getPropertyValue("--dropdown-close-dur")
    .trim();

  return Number.parseFloat(closeDuration) || 150;
};

function useDropdownTransition(isOpen: boolean) {
  const [phase, setPhase] = useState<DropdownPhase>(isOpen ? "open" : "closed");

  useEffect(() => {
    let timeoutId: number | undefined;

    if (isOpen) {
      setPhase("open");
      return undefined;
    }

    setPhase((current) => (current === "closed" ? "closed" : "closing"));
    timeoutId = window.setTimeout(() => setPhase("closed"), getDropdownCloseDuration());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  return phase;
}

function ThemeSwitcher({
  compact = false,
  onSelect,
}: {
  compact?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ActiveIcon = themeOptions.find((option) => option.value === theme)?.Icon ?? ComputerDesktopIcon;
  const orderedThemeOptions = [
    ...themeOptions.filter((option) => option.value !== theme),
    ...themeOptions.filter((option) => option.value === theme),
  ];

  const chooseTheme = (value: ThemePreference) => {
    setTheme(value);
    setIsOpen(false);
    onSelect?.();
  };

  if (compact) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-full border border-[#e5e2e1] bg-white/72 p-1 dark:border-white/15 dark:bg-white/5"
        role="radiogroup"
        aria-label={t("nav.theme")}
      >
        {themeOptions.map(({ value, labelKey, descriptionKey, Icon }) => {
          const isActive = theme === value;

          return (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={t(`nav.${labelKey}`)}
                  onClick={() => chooseTheme(value)}
                  className={`relative flex size-12 items-center justify-center rounded-full transition ${
                    isActive
                      ? "text-[#854d63] dark:text-[#f0adc4]"
                      : "text-[#6d625d] hover:text-[#854d63] dark:text-[#cdb9ae] dark:hover:text-[#f0adc4]"
                  }`}
                >
                  <Icon className="relative z-10 size-4" />
                  {isActive ? (
                    <motion.span
                      layoutId="mobile-theme-option"
                      className="absolute inset-0 rounded-full bg-[#ffd9e4]/70 dark:bg-[#854d63]/30"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  ) : null}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="max-w-[210px] rounded-lg border border-[#e4bfb2]/70 bg-white px-3 py-2 text-left text-[#5b4137] shadow-[0_16px_44px_rgba(28,27,27,0.14)] dark:border-white/12 dark:bg-[#171312] dark:text-[#dbc9c0]"
              >
                <p className="text-[12px] font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                  {t(`nav.${labelKey}`)}
                </p>
                <p className="mt-1 text-[11px] leading-4">{t(`nav.${descriptionKey}`)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 156 : 52 }}
      transition={{ type: "spring", stiffness: 430, damping: 32 }}
      className="relative flex h-[52px] items-center justify-end overflow-hidden rounded-full border border-[#e5e2e1] bg-white/74 text-[#5b4137] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl dark:border-white/15 dark:bg-white/5 dark:text-[#f8f1ec]"
      role="radiogroup"
      aria-label={t("nav.theme")}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="theme-options"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-2 right-2 flex items-center justify-between"
          >
            {orderedThemeOptions.map(({ value, labelKey, descriptionKey, Icon }) => {
              const isActive = theme === value;

              return (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={t(`nav.${labelKey}`)}
                      onClick={() => chooseTheme(value)}
                      className={`relative flex size-12 items-center justify-center rounded-full transition ${
                        isActive
                          ? "text-[#854d63] dark:text-[#f0adc4]"
                          : "text-[#8d7b72] hover:text-[#854d63] dark:text-[#cdb9ae] dark:hover:text-[#f0adc4]"
                      }`}
                    >
                      <Icon className="relative z-10 size-[18px]" />
                      {isActive ? (
                        <motion.span
                          layoutId="theme-option"
                          className="absolute inset-0 rounded-full border border-[#e4bfb2]/80 bg-[#ffd9e4]/52 dark:border-[#f0adc4]/30 dark:bg-[#854d63]/24"
                          transition={{ type: "spring", stiffness: 420, damping: 30 }}
                        />
                      ) : null}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={8}
                    className="max-w-[220px] rounded-lg border border-[#e4bfb2]/70 bg-white px-3 py-2 text-left text-[#5b4137] shadow-[0_16px_44px_rgba(28,27,27,0.14)] dark:border-white/12 dark:bg-[#171312] dark:text-[#dbc9c0]"
                  >
                    <p className="text-[12px] font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                      {t(`nav.${labelKey}`)}
                    </p>
                    <p className="mt-1 text-[11px] leading-4">{t(`nav.${descriptionKey}`)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!isOpen ? (
          <motion.button
            key="theme-current"
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.86 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full transition hover:bg-[#ffd9e4]/44 hover:text-[#854d63] active:scale-[0.96] dark:hover:bg-[#854d63]/30 dark:hover:text-[#f0adc4]"
            aria-label={t("nav.openTheme")}
            aria-expanded={isOpen}
          >
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -18, scale: 0.82 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ActiveIcon className="size-5" />
            </motion.span>
          </motion.button>
        ) : (
          <span
            aria-hidden="true"
            className="relative z-0 h-[52px] w-[52px] shrink-0"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<MobileAccordion>(null);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isCarnetOpen, setIsCarnetOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement>(null);
  const servicesMenuRef = useRef<HTMLLIElement>(null);
  const carnetMenuRef = useRef<HTMLLIElement>(null);
  const desktopDropdownCloseTimeoutRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const { enabled: hapticsEnabled, toggleEnabled: toggleHaptics } = useHaptics();
  const location = useLocation();
  const { data: cmsServices, usingCms: usingCmsServices } = useCmsCollection<CmsService>("service", []);
  const { data: cmsBlogPosts, usingCms: usingCmsBlogPosts } = useCmsCollection<CmsBlogPost>("blogPost", EMPTY_BLOG_POSTS);
  const locale = i18n.language;
  const services = useMemo(() => {
    if (usingCmsServices) {
      return cmsServices.map((s) => toServiceViewModel(s, locale));
    }
    return t("services.items", { returnObjects: true }) as ServicePreview[];
  }, [cmsServices, usingCmsServices, locale, t]);
  const legacyBlogPosts = useMemo(
    () => t("blog.posts", { returnObjects: true }) as MenuHighlight[],
    [t],
  );
  const menuHighlights = useMemo(
    () => usingCmsBlogPosts
      ? cmsBlogPosts.filter(isPublishedPost).map((post) => toBlogPostViewModel(post, locale))
      : legacyBlogPosts,
    [cmsBlogPosts, legacyBlogPosts, locale, usingCmsBlogPosts],
  );
  const menuHighlight = menuHighlights.find((post) => post.featured) ?? menuHighlights[0];
  const menuHighlightImage = cmsImageUrl(menuHighlight?.coverImage) || blogAbstractEditorial;
  const menuHighlightIsCaseStudy = menuHighlight?.category.toLowerCase().includes("case")
    || menuHighlight?.category.toLowerCase().includes("étude");
  const serviceMenuGroups = useMemo(() => {
    const normalizedServices = services.map((service, index) => ({
      ...service,
      menuKey: getServiceMenuKey(service.slug, index),
      menuIndex: index + 1,
    }));
    const groups: Array<{
      key: string;
      label: string;
      serviceKeys: ServiceMenuKey[];
    }> = [
      {
        key: "strategy",
        label: t("nav.serviceCategoryStrategy"),
        serviceKeys: ["editorial", "audit"],
      },
      {
        key: "content",
        label: t("nav.serviceCategoryContent"),
        serviceKeys: ["communication", "content"],
      },
      {
        key: "brand",
        label: t("nav.serviceCategoryBrand"),
        serviceKeys: ["identity"],
      },
      {
        key: "other",
        label: t("nav.serviceCategoryOther"),
        serviceKeys: ["other"],
      },
    ];

    return groups
      .map((group) => ({
        ...group,
        services: normalizedServices.filter((service) => group.serviceKeys.includes(service.menuKey)),
      }))
      .filter((group) => group.services.length > 0);
  }, [services, t]);
  const logoDropdownPhase = useDropdownTransition(isLogoMenuOpen);

  const cancelDesktopDropdownClose = () => {
    if (desktopDropdownCloseTimeoutRef.current === null) return;

    window.clearTimeout(desktopDropdownCloseTimeoutRef.current);
    desktopDropdownCloseTimeoutRef.current = null;
  };

  const scheduleDesktopDropdownClose = () => {
    cancelDesktopDropdownClose();
    desktopDropdownCloseTimeoutRef.current = window.setTimeout(() => {
      setIsServicesOpen(false);
      setIsCarnetOpen(false);
      setHoveredNavId((current) =>
        current === "services" || current === "carnet" ? null : current,
      );
      desktopDropdownCloseTimeoutRef.current = null;
    }, 120);
  };

  const activateDesktopNavLink = (id: string) => {
    cancelDesktopDropdownClose();
    setIsServicesOpen(false);
    setIsCarnetOpen(false);
    setHoveredNavId(id);
  };

  const clearDesktopNavLink = (id: string) => {
    setHoveredNavId((current) => (current === id ? null : current));
  };
  const primaryDropdownLayoutTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.155, ease: [0.23, 1, 0.32, 1] as const };
  const primaryDropdownOpacityTransition = {
    duration: shouldReduceMotion ? 0.08 : 0.09,
    ease: [0.23, 1, 0.32, 1] as const,
  };

  const navLinks = [
    { id: "home", name: t("nav.home"), href: "#home" },
    { id: "about", name: t("nav.about"), href: "/about", isPageLink: true },
    { id: "services", name: t("nav.services"), href: "/services", hasMenu: true, isPageLink: true },
    {
      id: "carnet",
      name: t("nav.carnet"),
      href: "/carnet/outils-inspirations",
      hasCarnetMenu: true,
      isPageLink: true,
    },
    { id: "blog", name: t("nav.blog"), href: "/blog", isPageLink: true },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;

      if (currentY < 96 || !isScrollingDown) {
        setIsCompact(false);
        setIsForcedOpen(false);
      } else {
        setIsCompact(true);
        setIsForcedOpen(false);
        setIsMobileMenuOpen(false);
        setOpenMobileAccordion(null);
        setIsServicesOpen(false);
        setIsCarnetOpen(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isForcedOpen]);

  useEffect(() => () => {
    if (desktopDropdownCloseTimeoutRef.current !== null) {
      window.clearTimeout(desktopDropdownCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (servicesMenuRef.current && !servicesMenuRef.current.contains(target)) {
        setIsServicesOpen(false);
      }

      if (carnetMenuRef.current && !carnetMenuRef.current.contains(target)) {
        setIsCarnetOpen(false);
      }

      if (
        logoRef.current &&
        logoMenuRef.current &&
        !logoRef.current.contains(target) &&
        !logoMenuRef.current.contains(target)
      ) {
        setIsLogoMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isServicesOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsServicesOpen(false);
      setHoveredNavId(null);
      servicesTriggerRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isServicesOpen]);

  useEffect(() => {
    setIsServicesOpen(false);
    setIsCarnetOpen(false);
    setIsMobileMenuOpen(false);
    setOpenMobileAccordion(null);
  }, [location.pathname]);


  const scrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) {
      setIsMobileMenuOpen(false);
      setIsCompact(false);
      return;
    }

    event.preventDefault();
    if (location.pathname !== "/") {
      window.location.href = `/${href}`;
      return;
    }

    const target = href === "#home" ? document.querySelector("main section") : document.querySelector(href);
    target?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
    setIsMobileMenuOpen(false);
    setIsServicesOpen(false);
    setHoveredNavId(null);
  };

  const handleLogoContextMenu = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsLogoMenuOpen(true);
  };

  return (
    <>
    <AnimatePresence>
      {isCompact && !isForcedOpen ? (
        <motion.button
          type="button"
          onClick={() => {
            setIsForcedOpen(true);
            setIsCompact(false);
          }}
          initial={{ opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed left-1/2 top-3 z-[60] flex h-14 w-28 -translate-x-1/2 items-center justify-center rounded-full border border-white/35 bg-[#1c1b1b]/56 shadow-[0_18px_48px_rgba(28,27,27,0.18)] backdrop-blur-xl transition-colors hover:bg-[#1c1b1b] dark:border-white/18 dark:bg-[#f8f1ec]/72 dark:shadow-[0_18px_48px_rgba(0,0,0,0.34)] dark:hover:bg-[#f8f1ec]"
          aria-label={t("nav.openHeader")}
        >
          <img src={caroleLogoSymbol} alt="" aria-hidden="true" className="size-9 invert dark:invert-0" />
        </motion.button>
      ) : null}
    </AnimatePresence>

    <motion.nav
      initial={false}
      animate={isCompact && !isForcedOpen ? { y: -112, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-[#e5e2e1]/70 bg-white/82 backdrop-blur-xl dark:border-white/10 dark:bg-[#171312]/82"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8 md:h-[88px] lg:px-8">
        <Link
          ref={logoRef}
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" })}
          onContextMenu={handleLogoContextMenu}
          className="flex min-h-12 min-w-12 items-center gap-2 text-[#1c1b1b] dark:text-[#f8f1ec]"
          aria-label="Carole Tonoukouen"
        >
          <img
            src={caroleLogoSymbol}
            alt=""
            aria-hidden="true"
            className="size-10 dark:invert md:size-12"
          />
          <span className="hidden h-10 w-px bg-[#854d63] dark:bg-[#d79caf] sm:block" />
          <span className="hidden w-[124px] font-serif text-[20px] italic leading-5 sm:block">
            Carole
            <br />
            Tonoukouen
          </span>
        </Link>
        {logoDropdownPhase !== "closed" ? (
          <div
            ref={logoMenuRef}
            data-origin="top-left"
            className={`t-dropdown fixed left-[max(1.25rem,calc((100vw-1200px)/2+1.25rem))] top-[76px] z-[70] w-72 overflow-hidden rounded-lg border border-[#e5e2e1]/80 bg-white p-2 shadow-[0_24px_70px_rgba(28,27,27,0.16)] dark:border-white/10 dark:bg-[#171312] ${logoDropdownPhase === "open" ? "is-open" : "is-closing"}`}
          >
            <Link
              to="/cv"
              onClick={() => setIsLogoMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#5b4137] transition hover:bg-[#ffd9e4]/35 hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
            >
              <DocumentTextIcon className="size-5" />
              <span className="flex-1">{t("nav.cv")}</span>
              <ChevronRightIcon className="size-4 opacity-50" />
            </Link>
            <Link
              to="/services/brief-design"
              onClick={() => setIsLogoMenuOpen(false)}
              className="mt-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#5b4137] transition hover:bg-[#ffd9e4]/35 hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
            >
              <PencilSquareIcon className="size-5" />
              <span className="flex-1">{t("nav.designBrief")}</span>
              <ChevronRightIcon className="size-4 opacity-50" />
            </Link>
            <button
              type="button"
              onClick={toggleHaptics}
              className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-[#5b4137] transition hover:bg-[#ffd9e4]/35 hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
            >
              <span
                className="t-icon-swap size-5"
                data-state={hapticsEnabled ? "a" : "b"}
                aria-hidden="true"
              >
                <SpeakerWaveIcon className="t-icon size-5" data-icon="a" />
                <SpeakerXMarkIcon className="t-icon size-5" data-icon="b" />
              </span>
              <span className="flex-1">{t("nav.haptics")}</span>
              <span className={`relative h-6 w-10 rounded-full transition ${hapticsEnabled ? "bg-[#854d63] dark:bg-[#f0adc4]" : "bg-[#e5e2e1] dark:bg-white/20"}`}>
                <span className={`absolute top-1 size-4 rounded-full bg-white transition ${hapticsEnabled ? "left-5 dark:bg-[#1c1415]" : "left-1"}`} />
              </span>
            </button>
          </div>
        ) : null}

        <LayoutGroup id="portfolio-primary-nav-dropdowns">
        <ul className="relative hidden items-center gap-0 lg:flex">
          {navLinks.map((link) => {
            const isActive = link.href.startsWith("#")
              ? location.pathname.startsWith("/" + link.href.slice(1))
              : link.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.href);
            const isHighlighted = hoveredNavId === link.id || isActive || (link.hasMenu && isServicesOpen) || (link.hasCarnetMenu && isCarnetOpen);
            const linkClass = `portfolio-nav-link group relative z-10 inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold capitalize leading-4 tracking-[1.4px] transition-colors duration-300 xl:px-4 xl:tracking-[1.8px] ${
              isHighlighted
                ? "text-[#854d63] dark:text-[#f0adc4]"
                : "text-[#5b4137] dark:text-[#dbc9c0]"
            }`;

            const hoverBackground = isHighlighted ? (
              <motion.span
                layoutId="portfolio-nav-hover-bg"
                className="absolute inset-0 rounded-full bg-[#ffd9e4]/50 dark:bg-white/8"
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null;

            if (link.hasMenu) {
              return (
                <li
                  key={link.href}
                  ref={servicesMenuRef}
                  className="relative"
                  onMouseEnter={() => {
                    cancelDesktopDropdownClose();
                    setHoveredNavId(link.id);
                    setIsServicesOpen(true);
                    setIsCarnetOpen(false);
                  }}
                  onMouseLeave={scheduleDesktopDropdownClose}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setHoveredNavId(null);
                      setIsServicesOpen(false);
                    }
                  }}
                >
                  <button
                    ref={servicesTriggerRef}
                    type="button"
                    id="services-menu-trigger"
                    aria-expanded={isServicesOpen}
                    aria-controls="services-mega-menu"
                    onClick={(event) => {
                      cancelDesktopDropdownClose();
                      setIsCarnetOpen(false);
                      setIsServicesOpen((current) => event.detail === 0 ? !current : true);
                      setHoveredNavId(link.id);
                    }}
                    className={linkClass}
                  >
                    {hoverBackground}
                    <span className="relative z-10">{link.name}</span>
                    <ChevronDownIcon
                      className={`relative z-10 size-4 transition-transform duration-300 ${
                        isServicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isServicesOpen ? (
                      <div className="absolute left-1/2 top-full z-[75] w-max -translate-x-1/2 pt-4">
                        <motion.div
                          id="services-mega-menu"
                          role="region"
                          aria-labelledby="services-menu-trigger"
                          layout
                          layoutId="portfolio-primary-dropdown"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            layout: primaryDropdownLayoutTransition,
                            opacity: primaryDropdownOpacityTransition,
                          }}
                          style={{ transformOrigin: "top center" }}
                          onMouseEnter={cancelDesktopDropdownClose}
                          className="w-[min(1080px,calc(100vw-3rem))] overflow-hidden rounded-[22px] border border-border-subtle bg-surface-panel p-4 text-text-primary shadow-[0_28px_90px_rgba(28,27,27,0.16)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)]"
                      >
                        <motion.div
                          layout="position"
                          transition={{ layout: primaryDropdownLayoutTransition }}
                          className="grid min-h-[280px] grid-cols-[minmax(0,1fr)_272px] gap-5"
                        >
                          <div className="flex min-w-0 flex-col py-1">
                            <div className="flex items-center justify-between gap-5 border-b border-border-subtle pb-4">
                              <h3 className="text-[12px] font-semibold uppercase tracking-[2.4px] text-text-accent">
                                {t("nav.ourServices")}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-full border border-border-accent/35 bg-surface-accent-muted px-3.5 text-[11px] font-semibold text-text-accent"
                                >
                                  <CalculatorIcon className="size-4" />
                                  {t("nav.projectEstimator")}
                                  <span
                                    className="rounded-full bg-surface-panel px-2 py-0.5 text-[9px] uppercase tracking-[1px] text-text-secondary"
                                  >
                                    {t("nav.comingSoon")}
                                  </span>
                                </button>
                                <Link
                                  to="/services"
                                  onClick={() => setIsServicesOpen(false)}
                                  className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-border-subtle px-3.5 text-[11px] font-semibold text-text-primary transition hover:border-border-accent hover:text-text-accent"
                                >
                                  {t("nav.allServices")}
                                </Link>
                              </div>
                            </div>
                            <div className="grid flex-1 grid-cols-3 gap-6 pt-5">
                              {serviceMenuGroups.map((group) => (
                                <section key={group.key} aria-labelledby={`service-group-${group.key}`}>
                                  <h4
                                    id={`service-group-${group.key}`}
                                    className="text-[11px] font-medium uppercase tracking-[1.8px] text-text-muted"
                                  >
                                    {group.label}
                                  </h4>
                                  <ul className="mt-3 grid gap-1.5">
                                    {group.services.map((service) => (
                                      <li key={service.slug}>
                                        <Link
                                          to={`/services/${service.slug}`}
                                          onClick={() => setIsServicesOpen(false)}
                                          className="group flex gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-page-muted"
                                        >
                                          <span className="mt-0.5 text-[10px] font-semibold tracking-[1px] text-text-accent">
                                            {String(service.menuIndex).padStart(2, "0")}
                                          </span>
                                          <span className="min-w-0">
                                            <span className="block text-[14px] font-semibold leading-5 text-text-primary group-hover:text-text-accent">
                                              {service.title} {service.accent}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] leading-4 text-text-secondary">
                                              {t(`nav.serviceDescription${service.menuKey[0].toUpperCase()}${service.menuKey.slice(1)}`)}
                                            </span>
                                          </span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              ))}
                            </div>
                          </div>
                          {menuHighlight ? (
                            <aside className="flex min-h-[280px] flex-col border-l border-border-subtle pl-5" aria-label={t("nav.highlight")}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] font-semibold uppercase tracking-[1.8px] text-text-muted">
                                  {t("nav.highlight")}
                                </span>
                                <span className="text-[10px] text-text-accent">{menuHighlight.category}</span>
                              </div>
                              <div className="mt-3 flex h-[112px] items-center justify-center overflow-hidden rounded-xl bg-surface-accent-muted p-3">
                                <img
                                  src={menuHighlightImage}
                                  alt=""
                                  aria-hidden="true"
                                  className="h-full w-full rounded-lg object-cover"
                                />
                              </div>
                              <h4 className="mt-3 line-clamp-2 text-[17px] font-semibold leading-[1.25] text-text-primary">
                                {menuHighlight.title}
                              </h4>
                              <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-text-secondary">
                                {menuHighlight.excerpt}
                              </p>
                              <Link
                                to={`/blog/${menuHighlight.slug}`}
                                onClick={() => setIsServicesOpen(false)}
                                className="group mt-auto inline-flex items-center gap-2 pt-3 text-[11px] font-semibold text-text-accent transition hover:text-text-primary"
                              >
                                {t(menuHighlightIsCaseStudy ? "nav.readCaseStudy" : "nav.readArticle")}
                                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                              </Link>
                            </aside>
                          ) : null}
                      </motion.div>
                        </motion.div>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            }

            if (link.hasCarnetMenu) {
              return (
                <li
                  key={link.href}
                  ref={carnetMenuRef}
                  className="relative"
                  onMouseEnter={() => {
                    cancelDesktopDropdownClose();
                    setHoveredNavId(link.id);
                    setIsCarnetOpen(true);
                    setIsServicesOpen(false);
                  }}
                  onMouseLeave={scheduleDesktopDropdownClose}
                  onFocusCapture={() => {
                    cancelDesktopDropdownClose();
                    setHoveredNavId(link.id);
                    setIsCarnetOpen(true);
                    setIsServicesOpen(false);
                  }}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setHoveredNavId(null);
                      setIsCarnetOpen(false);
                    }
                  }}
                >
                  <a
                    href={link.href}
                    aria-expanded={isCarnetOpen}
                    onClick={(event) => {
                      event.preventDefault();
                      cancelDesktopDropdownClose();
                      setIsServicesOpen(false);
                      setHoveredNavId(link.id);
                      setIsCarnetOpen((current) => !current);
                    }}
                    className={linkClass}
                  >
                    {hoverBackground}
                    <span className="relative z-10">{link.name}</span>
                    <ChevronDownIcon
                      className={`relative z-10 size-4 transition-transform duration-300 ${
                        isCarnetOpen ? "rotate-180" : ""
                      }`}
                    />
                  </a>
                  <AnimatePresence>
                    {isCarnetOpen ? (
                      <div className="absolute left-1/2 top-full z-[75] w-max -translate-x-1/2 pt-4">
                        <motion.div
                          layout
                          layoutId="portfolio-primary-dropdown"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            layout: primaryDropdownLayoutTransition,
                            opacity: primaryDropdownOpacityTransition,
                          }}
                          style={{ transformOrigin: "top center" }}
                          onMouseEnter={cancelDesktopDropdownClose}
                          className="w-[392px] overflow-hidden rounded-[22px] border border-border-subtle bg-surface-panel p-4 text-text-primary shadow-[0_28px_90px_rgba(28,27,27,0.16)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)]"
                        >
                          <motion.div
                            layout="position"
                            transition={{ layout: primaryDropdownLayoutTransition }}
                          >
                            <h3 className="border-b border-border-subtle pb-4 text-[12px] font-semibold uppercase tracking-[2.4px] text-text-accent">
                              {t("nav.carnet")}
                            </h3>
                            <ul className="mt-3 flex flex-col gap-1">
                            <li>
                              <Link
                                to="/carnet/outils-inspirations"
                                onClick={() => setIsCarnetOpen(false)}
                                className="group flex items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-300 hover:bg-surface-page-muted"
                              >
                                <span className="mt-0.5 text-[10px] font-semibold tracking-[1px] text-text-accent">
                                  01
                                </span>
                                <span className="min-w-0 leading-5">
                                  <span className="block text-[14px] font-semibold text-text-primary group-hover:text-text-accent">
                                    {t("nav.toolsAndInspirations")}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-4 text-text-secondary">
                                    {i18n.language === "fr" ? "Plateformes, groupes & veille créative" : "Platforms, groups & creative research"}
                                  </span>
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/carnet/lectures-references"
                                onClick={() => setIsCarnetOpen(false)}
                                className="group flex items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-300 hover:bg-surface-page-muted"
                              >
                                <span className="mt-0.5 text-[10px] font-semibold tracking-[1px] text-text-accent">
                                  02
                                </span>
                                <span className="min-w-0 leading-5">
                                  <span className="block text-[14px] font-semibold text-text-primary group-hover:text-text-accent">
                                    {t("nav.readingsAndReferences")}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-4 text-text-secondary">
                                    {i18n.language === "fr" ? "Livres, articles & newsletters" : "Books, articles & newsletters"}
                                  </span>
                                </span>
                              </Link>
                            </li>
                            </ul>
                          </motion.div>
                        </motion.div>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            }

            if (link.isPageLink) {
              return (
                <li
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => activateDesktopNavLink(link.id)}
                  onMouseLeave={() => clearDesktopNavLink(link.id)}
                >
                  <Link
                    to={link.href}
                    className={linkClass}
                  >
                    {hoverBackground}
                    <span className="relative z-10">{link.name}</span>
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={link.href}
                className="relative"
                onMouseEnter={() => activateDesktopNavLink(link.id)}
                onMouseLeave={() => clearDesktopNavLink(link.id)}
              >
              <a
                href={link.href}
                onClick={(event) => scrollToSection(event, link.href)}
                className={linkClass}
              >
                  {hoverBackground}
                  <span className="relative z-10">{link.name}</span>
              </a>
              </li>
            );
          })}
        </ul>
        </LayoutGroup>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />
          <Link
            to="/contact"
            className="inline-flex h-[52px] items-center whitespace-nowrap rounded-full bg-[#854d63] px-5 text-[13px] font-semibold uppercase leading-4 tracking-[1.6px] text-white shadow-sm transition hover:bg-[#6a364b] dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4] xl:px-6 xl:text-[14px] xl:tracking-[2px]"
          >
            {t("nav.contact")}
          </Link>
        </div>

        <button
          type="button"
          aria-label={t("nav.menu")}
          className="flex size-12 items-center justify-center rounded-full border border-[#e5e2e1] text-[#1c1b1b] dark:border-white/15 dark:text-[#f8f1ec] lg:hidden"
          onClick={() => {
            setIsMobileMenuOpen((current) => {
              if (current) {
                setOpenMobileAccordion(null);
              }

              return !current;
            });
          }}
        >
          <span
            className="t-icon-swap size-5"
            data-state={isMobileMenuOpen ? "b" : "a"}
            aria-hidden="true"
          >
            <Bars3Icon className="t-icon size-5" data-icon="a" />
            <XMarkIcon className="t-icon size-5" data-icon="b" />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[#e5e2e1]/70 bg-white px-5 py-6 shadow-xl dark:border-white/10 dark:bg-[#171312] sm:px-6 lg:hidden"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => {
                if (link.hasMenu) {
                  const isAccordionOpen = openMobileAccordion === "services";

                  return (
                    <div key={link.id} className="overflow-hidden rounded-lg bg-[#fcf9f8] dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => setOpenMobileAccordion((current) => (current === "services" ? null : "services"))}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-[1.6px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8f1ec]"
                        aria-expanded={isAccordionOpen}
                        aria-controls="mobile-services-panel"
                      >
                        <span>{link.name}</span>
                        <ChevronDownIcon className={`size-4 transition-transform duration-300 ${isAccordionOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isAccordionOpen ? (
                          <motion.div
                            key="mobile-services"
                            id="mobile-services-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="grid gap-4 px-5 pb-5">
                              <Link
                                to="/services"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenMobileAccordion(null);
                                }}
                                  className="rounded-md py-2 text-[14px] font-semibold leading-5 text-[#854d63] dark:text-[#f0adc4]"
                              >
                                {t("nav.allServices")}
                              </Link>
                              <button
                                type="button"
                                disabled
                                className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-border-accent/30 bg-surface-accent-muted px-3 py-3 text-left text-text-accent"
                              >
                                <CalculatorIcon className="size-5 shrink-0" />
                                <span className="min-w-0 flex-1 text-[13px] font-semibold">{t("nav.projectEstimator")}</span>
                                <span className="text-[9px] font-semibold uppercase tracking-[1px] text-text-secondary">{t("nav.comingSoon")}</span>
                              </button>
                              {serviceMenuGroups.map((group) => (
                                <section key={group.key}>
                                  <h4 className="text-[10px] font-semibold uppercase tracking-[1.6px] text-[#99857c] dark:text-[#aa9b94]">
                                    {group.label}
                                  </h4>
                                  <div className="mt-1.5 grid gap-0.5">
                                    {group.services.map((service) => (
                                      <Link
                                        key={service.slug}
                                        to={`/services/${service.slug}`}
                                        onClick={() => {
                                          setIsMobileMenuOpen(false);
                                          setOpenMobileAccordion(null);
                                        }}
                                        className="rounded-md py-2 text-[14px] font-medium leading-5 text-[#5b4137] dark:text-[#dbc9c0]"
                                      >
                                        {service.title} {service.accent}
                                      </Link>
                                    ))}
                                  </div>
                                </section>
                              ))}
                              {menuHighlight ? (
                                <Link
                                to={`/blog/${menuHighlight.slug}`}
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenMobileAccordion(null);
                                }}
                                className="mt-2 rounded-md border border-[#854d63]/15 bg-white/70 px-3 py-3 text-[13px] font-semibold leading-5 text-[#854d63] dark:border-[#f0adc4]/20 dark:bg-white/5 dark:text-[#f0adc4]"
                              >
                                {t("nav.highlight")} · {menuHighlight.title}
                              </Link>
                              ) : null}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (link.hasCarnetMenu) {
                  const isAccordionOpen = openMobileAccordion === "carnet";

                  return (
                    <div key={link.id} className="overflow-hidden rounded-lg bg-[#fcf9f8] dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => setOpenMobileAccordion((current) => (current === "carnet" ? null : "carnet"))}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-[1.6px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8f1ec]"
                        aria-expanded={isAccordionOpen}
                      >
                        <span>{link.name}</span>
                        <ChevronDownIcon className={`size-4 transition-transform duration-300 ${isAccordionOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isAccordionOpen ? (
                          <motion.div
                            key="mobile-carnet"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="grid gap-1 px-5 pb-4">
                              <Link
                                to="/carnet/outils-inspirations"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenMobileAccordion(null);
                                }}
                                className="rounded-md py-2 text-[14px] font-medium leading-5 text-[#5b4137] dark:text-[#dbc9c0]"
                              >
                                {t("nav.toolsAndInspirations")}
                              </Link>
                              <Link
                                to="/carnet/lectures-references"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setOpenMobileAccordion(null);
                                }}
                                className="rounded-md py-2 text-[14px] font-medium leading-5 text-[#5b4137] dark:text-[#dbc9c0]"
                              >
                                {t("nav.readingsAndReferences")}
                              </Link>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (link.isPageLink) {
                  return (
                    <Link
                      key={link.id}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-medium capitalize leading-5 tracking-[0.6px] text-[#5b4137] dark:bg-white/5 dark:text-[#dbc9c0]"
                    >
                      {link.name}
                    </Link>
                  );
                }

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(event) => scrollToSection(event, link.href)}
                    className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-medium capitalize leading-5 tracking-[0.6px] text-[#5b4137] dark:bg-white/5 dark:text-[#dbc9c0]"
                  >
                    {link.name}
                  </a>
                );
              })}
              <ThemeSwitcher compact />
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[#854d63] px-5 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-white dark:bg-[#d79caf] dark:text-[#1c1415]"
              >
                {t("nav.contact")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
    </>
  );
}
