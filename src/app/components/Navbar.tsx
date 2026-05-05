import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowUpRightIcon,
  Bars3Icon,
  BriefcaseIcon,
  ChartBarIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  MoonIcon,
  PencilSquareIcon,
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

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isCompact, setIsCompact] = useState(false);
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { enabled: hapticsEnabled, toggleEnabled: toggleHaptics } = useHaptics();
  const location = useLocation();
  const services = t("services.items", { returnObjects: true }) as ServicePreview[];
  const serviceIcons = [DocumentTextIcon, MegaphoneIcon, PencilSquareIcon, ChartBarIcon];

  const navLinks = [
    { name: t("nav.home"), href: "#home" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.services"), href: "#services", hasMenu: true },
    { name: t("nav.testimonials"), href: "#testimonials" },
    { name: t("nav.blog"), href: "/blog" },
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
      setActiveSection(location.pathname.startsWith("/blog") ? "blog" : "");
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
        <AnimatePresence>
          {isLogoMenuOpen ? (
            <motion.div
              ref={logoMenuRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="fixed left-[max(1.25rem,calc((100vw-1200px)/2+1.25rem))] top-[76px] z-[70] w-72 overflow-hidden rounded-lg border border-[#e5e2e1]/80 bg-white/94 p-2 shadow-[0_24px_70px_rgba(28,27,27,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171312]/94"
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
                {hapticsEnabled ? <SpeakerWaveIcon className="size-5" /> : <SpeakerXMarkIcon className="size-5" />}
                <span className="flex-1">{t("nav.haptics")}</span>
                <span className={`relative h-6 w-10 rounded-full transition ${hapticsEnabled ? "bg-[#854d63] dark:bg-[#f0adc4]" : "bg-[#e5e2e1] dark:bg-white/20"}`}>
                  <span className={`absolute top-1 size-4 rounded-full bg-white transition ${hapticsEnabled ? "left-5 dark:bg-[#1c1415]" : "left-1"}`} />
                </span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const sectionId = link.href.replace("#", "");
            const isActive =
              link.href.startsWith("#") ? activeSection === sectionId : activeSection === "blog";
            const linkClass = `relative text-[16px] font-medium capitalize leading-4 tracking-[2px] transition ${
              isActive
                ? "text-[#854d63] dark:text-[#f0adc4]"
                : "text-[#5b4137] hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:text-[#f0adc4]"
            }`;

            if (link.hasMenu) {
              return (
                <div
                  key={link.href}
                  ref={servicesMenuRef}
                  className="relative"
                  onMouseEnter={() => setIsServicesOpen(true)}
                  onMouseLeave={() => setIsServicesOpen(false)}
                >
                  <a
                    href={link.href}
                    onClick={(event) => scrollToSection(event, link.href)}
                    className={linkClass}
                  >
                    {link.name}
                  </a>
                  <AnimatePresence>
                    {isServicesOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="fixed left-1/2 top-[98px] z-[75] grid w-[min(1040px,calc(100vw-3rem))] -translate-x-1/2 grid-cols-[0.96fr_1.04fr] overflow-hidden rounded-[24px] border border-[#e5e2e1]/80 bg-white/96 shadow-[0_24px_72px_rgba(28,27,27,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171312]/96"
                      >
                        <div className="space-y-1.5 p-6">
                          {services.map((service, index) => {
                            const ServiceIcon = serviceIcons[index % serviceIcons.length];

                            return (
                              <Link
                                key={service.slug}
                                to={`/services/${service.slug}`}
                                onClick={() => setIsServicesOpen(false)}
                                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[#5b4137] transition hover:bg-[#fcf9f8] hover:text-[#854d63] dark:text-[#dbc9c0] dark:hover:bg-white/8 dark:hover:text-[#f0adc4]"
                              >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#f2b3c8] bg-[#2f2f32] text-white shadow-[inset_2px_0_0_#d79caf,inset_0_-2px_0_#f0adc4] transition group-hover:bg-[#854d63] dark:border-[#f0adc4]/40 dark:bg-[#24201f]">
                                  <ServiceIcon className="size-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] font-semibold leading-5 text-[#1c1b1b] dark:text-[#f8f1ec]">
                                    {service.title} <span className="italic text-[#854d63] dark:text-[#f0adc4]">{service.accent}</span>
                                  </span>
                                  <span className="mt-0.5 line-clamp-2 block text-[13px] leading-[18px] text-[#6d625d] dark:text-[#cdb9ae]">
                                    {service.menuDescription}
                                  </span>
                                </span>
                                <ChevronRightIcon className="size-4 opacity-0 transition group-hover:opacity-60" />
                              </Link>
                            );
                          })}
                        </div>
                        <Link
                          to="/services/direction-social-media"
                          onClick={() => setIsServicesOpen(false)}
                          className="group m-6 ml-0 flex min-h-[218px] flex-col justify-between rounded-2xl bg-[#f7f6f4] p-6 text-[#1c1b1b] transition hover:bg-[#f3ecec] dark:bg-white/6 dark:text-[#f8f1ec] dark:hover:bg-white/10"
                        >
                          <span className="flex items-start justify-between gap-6">
                            <span className="text-[12px] font-semibold uppercase leading-5 tracking-[2px] text-[#6d625d] dark:text-[#cdb9ae]">
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
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => scrollToSection(event, link.href)}
                className={linkClass}
              >
                {link.name}
              </a>
            );
          })}
        </div>

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
          <a
            href="#contact"
            onClick={(event) => scrollToSection(event, "#contact")}
            className="inline-flex h-[52px] items-center rounded-full bg-[#854d63] px-6 text-[14px] font-semibold uppercase leading-4 tracking-[2px] text-white shadow-sm transition hover:bg-[#6a364b] dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]"
          >
            {t("nav.contact")}
          </a>
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-full border border-[#e5e2e1] text-[#1c1b1b] dark:border-white/15 dark:text-[#f8f1ec] md:hidden"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-label={t("nav.menu")}
        >
          {isMobileMenuOpen ? <XMarkIcon className="size-5" /> : <Bars3Icon className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="border-t border-[#e5e2e1]/70 bg-white px-6 py-6 shadow-xl dark:border-white/10 dark:bg-[#171312] md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => scrollToSection(event, link.href)}
                  className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-medium capitalize leading-5 tracking-[1px] text-[#5b4137] dark:bg-white/5 dark:text-[#dbc9c0]"
                >
                  {link.name}
                </a>
              ))}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e5e2e1] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#5b4137] dark:border-white/15 dark:text-[#f8f1ec]"
              >
                {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                {theme === "dark" ? t("nav.lightTheme") : t("nav.darkTheme")}
              </button>
              <a
                href="#contact"
                onClick={(event) => scrollToSection(event, "#contact")}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[#854d63] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-white dark:bg-[#d79caf] dark:text-[#1c1415]"
              >
                {t("nav.contact")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
    </>
  );
}
