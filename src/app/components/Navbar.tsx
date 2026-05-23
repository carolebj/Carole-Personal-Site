import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowUpRightIcon,
  Bars3Icon,
  BookOpenIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  MoonIcon,
  PencilSquareIcon,
  SparklesIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import caroleLogoSymbol from "../../assets/logos/carole-CT-logo.svg";
import { useHaptics } from "../interactions/HapticContext";
import { useTheme } from "../theme/ThemeContext";

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

type DropdownPhase = "closed" | "open" | "closing";

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

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isCarnetOpen, setIsCarnetOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("home");
  const [isCompact, setIsCompact] = useState(false);
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLLIElement>(null);
  const carnetMenuRef = useRef<HTMLLIElement>(null);
  const lastScrollYRef = useRef(0);
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { enabled: hapticsEnabled, toggleEnabled: toggleHaptics } = useHaptics();
  const location = useLocation();
  const services = t("services.items", { returnObjects: true }) as ServicePreview[];
  const serviceIcons = [DocumentTextIcon, MegaphoneIcon, PencilSquareIcon, ChartBarIcon];
  const logoDropdownPhase = useDropdownTransition(isLogoMenuOpen);

  const navLinks = [
    { id: "home", name: t("nav.home"), href: "#home" },
    { id: "about", name: t("nav.about"), href: "/about", isPageLink: true },
    { id: "services", name: t("nav.services"), href: "/services", hasMenu: true, isPageLink: true },
    { id: "carnet", name: t("nav.carnet"), href: "#carnet", hasCarnetMenu: true },
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
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isForcedOpen]);

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
    if (location.pathname !== "/") {
      setActiveSection(
        location.pathname.startsWith("/blog")
          ? "blog"
          : location.pathname === "/about"
            ? "about"
            : location.pathname.startsWith("/services")
              ? "services"
              : location.pathname.startsWith("/carnet")
                ? "carnet"
                : ""
      );
      return;
    }

    const sections = ["home", "about", "services", "testimonials"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-32% 0px -48% 0px",
        threshold: [0.18, 0.32, 0.52],
      }
    );

    sections.forEach((id) => {
      const section = id === "home" ? document.querySelector("main section") : document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
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
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onContextMenu={handleLogoContextMenu}
          className="flex items-center gap-2 text-[#1c1b1b] dark:text-[#f8f1ec]"
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

        <ul className="relative hidden items-center gap-0 md:flex">
          {navLinks.map((link) => {
            const sectionId = link.href.replace("#", "");
            const isActive =
              link.href.startsWith("#")
                ? activeSection === sectionId
                : activeSection === link.id || location.pathname === link.href;
            const isHighlighted = hoveredNavId === link.id || isActive || (link.hasMenu && isServicesOpen) || (link.hasCarnetMenu && isCarnetOpen);
            const linkClass = `portfolio-nav-link group relative z-10 inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold capitalize leading-4 tracking-[1.8px] transition-colors duration-300 ${
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
                    setHoveredNavId(link.id);
                    setIsServicesOpen(true);
                  }}
                  onMouseLeave={() => {
                    setHoveredNavId(null);
                    setIsServicesOpen(false);
                  }}
                >
                  <Link
                    to={link.href}
                    onClick={() => {
                      setIsServicesOpen(false);
                      setHoveredNavId(null);
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
                  </Link>
                  <AnimatePresence>
                    {isServicesOpen ? (
                      <div className="absolute left-1/2 top-full z-[75] w-max -translate-x-1/2 pt-4">
                        <motion.div
                          layoutId="portfolio-services-menu"
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="w-[min(900px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-[#e5e2e1]/80 bg-white p-4 shadow-[0_24px_72px_rgba(28,27,27,0.14)] dark:border-white/10 dark:bg-[#171312]"
                      >
                        <div className="flex w-full gap-8 overflow-hidden">
                          <div className="w-[520px] shrink-0">
                            <h3 className="mb-4 px-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                              {t("nav.services")}
                            </h3>
                            <ul className="grid grid-cols-2 gap-x-5 gap-y-4">
                          {services.map((service, index) => {
                            const ServiceIcon = serviceIcons[index % serviceIcons.length];

                            return (
                                    <li key={service.slug}>
                                      <Link
                                key={service.slug}
                                to={`/services/${service.slug}`}
                                onClick={() => setIsServicesOpen(false)}
                                        className="group flex items-start gap-3 rounded-xl p-2 text-left text-[#5b4137] transition-colors duration-300 hover:bg-[#fcf9f8] hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
                              >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#854d63]/20 bg-[#2f2f32] text-white transition-colors duration-300 group-hover:border-[#854d63] group-hover:bg-[#854d63] dark:border-[#f0adc4]/30 dark:bg-[#24201f] dark:group-hover:bg-[#f0adc4] dark:group-hover:text-[#171312]">
                                   <ServiceIcon className="size-[18px]" />
                                </span>
                                        <span className="w-max min-w-0 leading-5">
                                          <span className="block text-[14px] font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                                    {service.title} <span className="italic text-[#854d63] dark:text-[#f0adc4]">{service.accent}</span>
                                  </span>
                                          <span className="mt-1 block max-w-[190px] text-[12px] text-[#6d625d] transition-colors duration-300 group-hover:text-[#1c1b1b] dark:text-[#cdb9ae] dark:group-hover:text-[#f8f1ec]">
                                    {service.menuDescription}
                                  </span>
                                </span>
                              </Link>
                                    </li>
                            );
                          })}
                            </ul>
                        </div>
                        <Link
                          to={i18n.language === "fr" ? "/services/communication-digitale" : "/services/digital-communication"}
                          onClick={() => setIsServicesOpen(false)}
                            className="group flex min-h-[230px] w-[280px] shrink-0 flex-col justify-between rounded-xl border border-[#e5e2e1]/70 bg-[#f7f6f4] p-5 text-[#1c1b1b] transition-colors duration-300 hover:bg-[#f3ecec] dark:border-white/10 dark:bg-[#211a19] dark:text-[#f8f1ec] dark:hover:bg-[#29201f]"
                        >
                          <span className="flex items-start justify-between gap-6">
                              <span className="text-[12px] font-semibold uppercase leading-5 tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                              {t("nav.caseStudies")}
                            </span>
                            <ArrowUpRightIcon className="size-5 text-[#6d625d] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#854d63] dark:text-[#cdb9ae] dark:group-hover:text-[#f0adc4]" />
                          </span>
                          <span>
                            <span className="block max-w-[420px] text-[22px] font-semibold leading-[1.18] tracking-[-0.01em] text-[#1c1b1b] dark:text-[#f8f1ec]">
                              {t("nav.caseStudyTitle")}
                            </span>
                            <span className="mt-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#6d625d] dark:text-[#cdb9ae]">
                              <BriefcaseIcon className="size-4" />
                              {t("nav.caseStudyMeta")}
                            </span>
                          </span>
                        </Link>
                      </div>
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
                    setHoveredNavId(link.id);
                    setIsCarnetOpen(true);
                  }}
                  onMouseLeave={() => {
                    setHoveredNavId(null);
                    setIsCarnetOpen(false);
                  }}
                >
                  <a
                    href={link.href}
                    onClick={(event) => event.preventDefault()}
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
                          layoutId="portfolio-carnet-menu"
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="w-80 overflow-hidden rounded-2xl border border-[#e5e2e1]/80 bg-white p-3 shadow-[0_24px_72px_rgba(28,27,27,0.14)] dark:border-white/10 dark:bg-[#171312]"
                        >
                          <ul className="flex flex-col gap-1">
                            <li>
                              <Link
                                to="/carnet/outils-inspirations"
                                onClick={() => setIsCarnetOpen(false)}
                                className="group flex items-start gap-3 rounded-xl p-3 text-left text-[#5b4137] transition-colors duration-300 hover:bg-[#fcf9f8] hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#854d63]/20 bg-[#2f2f32] text-white transition-colors duration-300 group-hover:border-[#854d63] group-hover:bg-[#854d63] dark:border-[#f0adc4]/30 dark:bg-[#24201f] dark:group-hover:bg-[#f0adc4] dark:group-hover:text-[#171312]">
                                  <SparklesIcon className="size-[18px]" />
                                </span>
                                <span className="leading-5">
                                  <span className="block text-[14px] font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                                    {t("nav.toolsAndInspirations")}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-[#6d625d] transition-colors duration-300 group-hover:text-[#1c1b1b] dark:text-[#cdb9ae] dark:group-hover:text-[#f8f1ec]">
                                    {i18n.language === "fr" ? "Outils & veille créative" : "Tools & creative research"}
                                  </span>
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/carnet/lectures-references"
                                onClick={() => setIsCarnetOpen(false)}
                                className="group flex items-start gap-3 rounded-xl p-3 text-left text-[#5b4137] transition-colors duration-300 hover:bg-[#fcf9f8] hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#854d63]/20 bg-[#2f2f32] text-white transition-colors duration-300 group-hover:border-[#854d63] group-hover:bg-[#854d63] dark:border-[#f0adc4]/30 dark:bg-[#24201f] dark:group-hover:bg-[#f0adc4] dark:group-hover:text-[#171312]">
                                  <BookOpenIcon className="size-[18px]" />
                                </span>
                                <span className="leading-5">
                                  <span className="block text-[14px] font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                                    {t("nav.readingsAndReferences")}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-[#6d625d] transition-colors duration-300 group-hover:text-[#1c1b1b] dark:text-[#cdb9ae] dark:group-hover:text-[#f8f1ec]">
                                    {i18n.language === "fr" ? "Livres, articles & newsletters" : "Books, articles & newsletters"}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          </ul>
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
                  onMouseEnter={() => setHoveredNavId(link.id)}
                  onMouseLeave={() => setHoveredNavId(null)}
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
                onMouseEnter={() => setHoveredNavId(link.id)}
                onMouseLeave={() => setHoveredNavId(null)}
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

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#e5e2e1] text-[#5b4137] transition hover:border-[#854d63]/40 hover:bg-[#ffd9e4]/44 hover:text-[#854d63] dark:border-white/15 dark:text-[#f8f1ec] dark:hover:border-[#f0adc4]/50 dark:hover:bg-[#854d63]/30 dark:hover:text-[#f0adc4]"
            aria-label={theme === "dark" ? t("nav.lightTheme") : t("nav.darkTheme")}
            title={theme === "dark" ? t("nav.lightTheme") : t("nav.darkTheme")}
          >
            {theme === "dark" ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </button>
          <Link
            to="/contact"
            className="inline-flex h-[52px] items-center rounded-full bg-[#854d63] px-6 text-[14px] font-semibold uppercase leading-4 tracking-[2px] text-white shadow-sm transition hover:bg-[#6a364b] dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            {t("nav.contact")}
          </Link>
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-full border border-[#e5e2e1] text-[#1c1b1b] dark:border-white/15 dark:text-[#f8f1ec] md:hidden"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-label={t("nav.menu")}
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
            className="max-h-[80vh] overflow-y-auto border-t border-[#e5e2e1]/70 bg-white px-6 py-6 shadow-xl dark:border-white/10 dark:bg-[#171312] md:hidden"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => {
                if (link.hasMenu) {
                  return (
                    <div key={link.id} className="flex flex-col gap-1.5 rounded-lg bg-[#fcf9f8] p-3 dark:bg-white/5">
                      <Link
                        to="/services"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-2 py-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8f1ec]"
                      >
                        {link.name}
                      </Link>
                      <div className="grid gap-1 pl-2">
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            to={`/services/${service.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-md py-2 text-[14px] font-medium text-[#5b4137] dark:text-[#dbc9c0]"
                          >
                            {service.title} <span className="italic text-[#854d63] dark:text-[#f0adc4]">{service.accent}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (link.hasCarnetMenu) {
                  return (
                    <div key={link.id} className="flex flex-col gap-1.5 rounded-lg bg-[#fcf9f8] p-3 dark:bg-white/5">
                      <span className="px-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                        {link.name}
                      </span>
                      <div className="grid gap-1 pl-2">
                        <Link
                          to="/carnet/outils-inspirations"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="rounded-md py-2 text-[14px] font-medium text-[#5b4137] dark:text-[#dbc9c0]"
                        >
                          {t("nav.toolsAndInspirations")}
                        </Link>
                        <Link
                          to="/carnet/lectures-references"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="rounded-md py-2 text-[14px] font-medium text-[#5b4137] dark:text-[#dbc9c0]"
                        >
                          {t("nav.readingsAndReferences")}
                        </Link>
                      </div>
                    </div>
                  );
                }

                if (link.isPageLink) {
                  return (
                    <Link
                      key={link.id}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-medium capitalize leading-5 tracking-[1px] text-[#5b4137] dark:bg-white/5 dark:text-[#dbc9c0]"
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
                    className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-medium capitalize leading-5 tracking-[1px] text-[#5b4137] dark:bg-white/5 dark:text-[#dbc9c0]"
                  >
                    {link.name}
                  </a>
                );
              })}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e5e2e1] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#5b4137] dark:border-white/15 dark:text-[#f8f1ec]"
              >
                {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                {theme === "dark" ? t("nav.lightTheme") : t("nav.darkTheme")}
              </button>
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[#854d63] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-white dark:bg-[#d79caf] dark:text-[#1c1415]"
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
