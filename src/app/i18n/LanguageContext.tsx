import { useTranslation } from "react-i18next";
import "./i18n";

export type Lang = "fr" | "en";

export const langLabels: Record<Lang, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Thin wrapper around react-i18next to keep a simple API
 * for language switching (Navbar, Footer) and animation keys.
 */
export function useLang() {
  const { i18n } = useTranslation();

  const lang = (i18n.language || "fr") as Lang;

  const setLang = (newLang: Lang) => {
    i18n.changeLanguage(newLang);
  };

  return { lang, setLang };
}
