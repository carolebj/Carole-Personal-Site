import { CheckIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { langLabels, useLang, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "FR" },
  { code: "en", flag: "EN" },
];

export default function Footer() {
  const { t } = useTranslation();
  const { lang, setLang } = useLang();
  const year = new Date().getFullYear();

  const links = [
    { label: t("footer.behance"), href: "https://www.behance.net/caroletonoukouen", external: true },
    { label: t("footer.linkedin"), href: "https://www.linkedin.com/in/caroletonoukouen/", external: true },
    { label: t("footer.contact"), href: "/contact", external: false },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-[#e5e2e1]/70 bg-white dark:border-white/10 dark:bg-[#13100f]">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(255,217,228,0.28),rgba(255,217,228,0))] dark:bg-[linear-gradient(to_top,rgba(133,77,99,0.16),rgba(133,77,99,0))]" />
      <div className="relative mx-auto grid max-w-[1200px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-8 lg:py-12">
        <div className="text-center lg:text-left">
          <p className="font-serif text-xl italic text-[#1c1b1b] dark:text-[#f8f1ec]">Carole T.</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137] dark:text-[#cdb9ae]">
            © {year} {t("footer.signature")}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => setLang(language.code)}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold uppercase tracking-[1px] transition ${
                lang === language.code
                  ? "border-[#854d63] bg-[#ffd9e4]/70 text-[#854d63] dark:border-[#f0adc4]/60 dark:bg-[#854d63]/30 dark:text-[#f8d7e3]"
                  : "border-[#e5e2e1] text-[#5b4137] hover:border-[#854d63]/40 hover:text-[#854d63] dark:border-white/15 dark:text-[#cdb9ae] dark:hover:border-[#f0adc4]/50 dark:hover:text-[#f0adc4]"
              }`}
              aria-label={`${t("footer.language")} ${langLabels[language.code]}`}
            >
              {language.flag}
              <span className="hidden sm:inline">{langLabels[language.code]}</span>
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

        <div className="flex flex-nowrap justify-center gap-6 whitespace-nowrap lg:justify-end">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137] transition hover:text-[#854d63] dark:text-[#cdb9ae] dark:hover:text-[#f0adc4]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
