import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Bars3Icon, XMarkIcon, GlobeAltIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLang, langLabels, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const desktopLangRef = useRef<HTMLDivElement>(null);
  const mobileLangRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { lang, setLang } = useLang();

  const navLinks = [
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.skills"), href: "#skills" },
    { name: t("nav.experience"), href: "#experience" },
    { name: t("nav.projects"), href: "#projects" },
    { name: t("nav.contact"), href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideDesktop =
        desktopLangRef.current && desktopLangRef.current.contains(target);
      const isInsideMobile =
        mobileLangRef.current && mobileLangRef.current.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const handleSelectLang = (code: Lang) => {
    setLang(code);
    setIsLangOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-emerald-950/95 backdrop-blur-sm shadow-lg py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`text-2xl font-serif font-bold tracking-wider ${
            isScrolled ? "text-amber-400" : "text-stone-100"
          }`}
        >
          CT
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleScrollToSection(e, link.href)}
              className="text-sm font-medium tracking-wide text-stone-200 hover:text-amber-400 transition-colors"
            >
              {link.name}
            </a>
          ))}

          {/* Desktop Language Dropdown */}
          <div ref={desktopLangRef} className="relative">
            <button
              onClick={() => setIsLangOpen((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-stone-200 hover:text-amber-400 transition-colors border border-stone-200/30 hover:border-amber-400/50 rounded-full px-3.5 py-1.5"
              aria-label="Select language"
            >
              <GlobeAltIcon className="w-3.5 h-3.5" />
              <span>{lang.toUpperCase()}</span>
              <ChevronDownIcon
                className={`w-3 h-3 transition-transform duration-200 ${
                  isLangOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 bg-emerald-900 border border-emerald-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleSelectLang(l.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        lang === l.code
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-stone-200 hover:bg-emerald-800 hover:text-stone-100"
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span className="flex-1 text-left">
                        {langLabels[l.code]}
                      </span>
                      {lang === l.code && (
                        <CheckIcon className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: Language + Burger */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Language Dropdown */}
          <div ref={mobileLangRef} className="relative">
            <button
              onClick={() => setIsLangOpen((prev) => !prev)}
              className="text-stone-100 flex items-center gap-1.5 text-sm border border-stone-100/30 rounded-full px-2.5 py-1"
              aria-label="Select language"
            >
              <GlobeAltIcon className="w-3.5 h-3.5" />
              <span>{lang.toUpperCase()}</span>
              <ChevronDownIcon
                className={`w-3 h-3 transition-transform duration-200 ${
                  isLangOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 bg-emerald-900 border border-emerald-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleSelectLang(l.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        lang === l.code
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-stone-200 hover:bg-emerald-800 hover:text-stone-100"
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span className="flex-1 text-left">
                        {langLabels[l.code]}
                      </span>
                      {lang === l.code && (
                        <CheckIcon className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="text-stone-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-emerald-950 border-t border-emerald-900 md:hidden p-6 shadow-xl"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScrollToSection(e, link.href)}
                  className="text-stone-100 hover:text-amber-400 font-medium text-lg"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}