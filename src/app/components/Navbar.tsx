import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { langLabels, useLang, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "FR" },
  { code: "en", flag: "EN" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { lang, setLang } = useLang();

  const navLinks = [
    { name: t("nav.services"), href: "#services" },
    { name: t("nav.manifesto"), href: "#manifesto" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.testimonials"), href: "#testimonials" },
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

  const scrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    event.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const selectLanguage = (code: Lang) => {
    setLang(code);
    setIsLangOpen(false);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#e5e2e1]/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-serif text-[1.35rem] italic text-[#1c1b1b]"
        >
          Carole T.
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => scrollToSection(event, link.href)}
              className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#5b4137] transition hover:text-[#854d63]"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setIsLangOpen((current) => !current)}
              className="flex h-10 items-center gap-2 rounded-full border border-[#e5e2e1] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5b4137] transition hover:border-[#854d63]/40 hover:text-[#854d63]"
              aria-label={t("nav.language")}
            >
              <GlobeAltIcon className="size-4" />
              {lang.toUpperCase()}
              <ChevronDownIcon className={`size-3 transition ${isLangOpen ? "rotate-180" : ""}`} />
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
            className="inline-flex h-10 items-center rounded-full bg-[#854d63] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-white shadow-sm transition hover:bg-[#6a364b]"
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
                  className="rounded-2xl bg-[#fcf9f8] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#5b4137]"
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
                className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-[#854d63] text-sm font-semibold uppercase tracking-[0.16em] text-white"
              >
                {t("nav.contact")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
