import { Linkedin, Twitter } from "lucide-react";
import { GlobeAltIcon, CheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLang, langLabels, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
];

export default function Footer() {
  const { t } = useTranslation();
  const { lang, setLang } = useLang();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLang = (code: Lang) => {
    setLang(code);
    setIsLangOpen(false);
  };

  return (
    <footer className="bg-emerald-950 text-stone-300 py-12 border-t border-emerald-900">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-2xl font-serif font-bold text-amber-400 mb-2">
              Carole Tonoukouen
            </h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={lang + "-footer-role"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm opacity-80"
              >
                {t("footer.role")}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-6">
            {/* Language Switcher */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-amber-400 transition-colors border border-stone-700 hover:border-amber-400/50 rounded-full px-3.5 py-1.5"
                aria-label="Select language"
              >
                <GlobeAltIcon className="w-3.5 h-3.5" />
                <span>{lang.toUpperCase()}</span>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 bg-emerald-900 border border-emerald-700 rounded-xl shadow-2xl overflow-hidden z-[60]"
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

            <div className="w-px h-6 bg-emerald-800"></div>

            <a
              href="#"
              className="hover:text-amber-400 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="#"
              className="hover:text-amber-400 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={24} />
            </a>
            <a
              href="mailto:contact@carole.com"
              className="hover:text-amber-400 transition-colors"
              aria-label="Email"
            >
              <EnvelopeIcon className="w-6 h-6" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-emerald-900/50 text-center text-xs opacity-60">
          <p>
            &copy; {new Date().getFullYear()} Carole Tonoukouen.{" "}
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}