import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import caroleLogoSymbol from "../../assets/logos/carole-CT-logo.svg";
import { langLabels, useLang, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "FR" },
  { code: "en", flag: "EN" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const { t } = useTranslation();
  const { lang, setLang } = useLang();
  const location = useLocation();

  const navLinks = [
    { name: t("nav.services"), href: "#services" },
    { name: t("nav.manifesto"), href: "#manifesto" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.testimonials"), href: "#testimonials" },
    { name: t("nav.blog"), href: "/blog" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;

      if (currentY < 96 || !isScrollingDown) {
        setIsCompact(false);
        setIsForcedOpen(false);
      } else if (!isForcedOpen) {
        setIsCompact(true);
        setIsMobileMenuOpen(false);
        setIsLangOpen(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isForcedOpen]);

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

    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const selectLanguage = (code: Lang) => {
    setLang(code);
    setIsLangOpen(false);
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
          className="fixed left-1/2 top-3 z-[60] flex h-14 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-[#1c1b1b] shadow-[0_18px_48px_rgba(28,27,27,0.18)]"
          aria-label={t("nav.openHeader")}
        >
          <img src={caroleLogoSymbol} alt="" aria-hidden="true" className="size-9 invert" />
        </motion.button>
      ) : null}
    </AnimatePresence>

    <motion.nav
      initial={false}
      animate={isCompact && !isForcedOpen ? { y: -112, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-[#e5e2e1]/70 bg-white/82 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8 md:h-[88px] lg:px-8">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 text-[#1c1b1b]"
          aria-label="Carole Tonoukouen"
        >
          <img
            src={caroleLogoSymbol}
            alt=""
            aria-hidden="true"
            className="size-10 md:size-12"
          />
          <span className="hidden h-10 w-px bg-[#854d63] sm:block" />
          <span className="hidden w-[124px] font-serif text-[20px] italic leading-5 sm:block">
            Carole
            <br />
            Tonoukouen
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => scrollToSection(event, link.href)}
              className="text-[16px] font-normal capitalize leading-4 tracking-[2px] text-[#5b4137] transition hover:text-[#854d63]"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setIsLangOpen((current) => !current)}
              className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#e5e2e1] px-6 text-[#5b4137] transition hover:border-[#854d63]/40 hover:text-[#854d63]"
              aria-label={t("nav.language")}
            >
              <GlobeAltIcon className="size-6" />
              <span className="flex items-center gap-4">
                <span className="text-[14px] font-semibold uppercase leading-4 tracking-[1px]">
                  {lang.toUpperCase()}
                </span>
                <ChevronDownIcon className={`size-4 transition ${isLangOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-[0_22px_55px_rgba(28,27,27,0.12)]"
                >
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => selectLanguage(language.code)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition ${
                        lang === language.code
                          ? "bg-[#ffd9e4]/60 text-[#854d63]"
                          : "text-[#5b4137] hover:bg-[#fcf9f8]"
                      }`}
                    >
                      <span className="text-xs font-semibold">{language.flag}</span>
                      <span className="flex-1 text-left">{langLabels[language.code]}</span>
                      {lang === language.code && <CheckIcon className="size-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <a
            href="#contact"
            onClick={(event) => scrollToSection(event, "#contact")}
            className="inline-flex h-[52px] items-center rounded-full bg-[#854d63] px-6 text-[14px] font-semibold uppercase leading-4 tracking-[2px] text-white shadow-sm transition hover:bg-[#6a364b]"
          >
            {t("nav.contact")}
          </a>
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-full border border-[#e5e2e1] text-[#1c1b1b] md:hidden"
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
            className="border-t border-[#e5e2e1]/70 bg-white px-6 py-6 shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => scrollToSection(event, link.href)}
                  className="rounded-lg bg-[#fcf9f8] px-4 py-4 text-[16px] font-normal capitalize leading-5 tracking-[1px] text-[#5b4137]"
                >
                  {link.name}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => selectLanguage(language.code)}
                    className={`rounded-full border px-4 py-3 text-sm font-semibold ${
                      lang === language.code
                        ? "border-[#854d63] bg-[#ffd9e4]/60 text-[#854d63]"
                        : "border-[#e5e2e1] text-[#5b4137]"
                    }`}
                  >
                    {language.flag}
                  </button>
                ))}
              </div>
              <a
                href="#contact"
                onClick={(event) => scrollToSection(event, "#contact")}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[#854d63] text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-white"
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
