import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr";
import en from "./locales/en";

const STORAGE_KEY = "portfolio-lang";

function detectLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    // localStorage unavailable
  }

  const browserLang =
    navigator.language || (navigator as any).userLanguage || "";
  return browserLang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

// Persist language changes to localStorage
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

export default i18n;
