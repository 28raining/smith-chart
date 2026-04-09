import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import tr from "./locales/tr.json";
import zh from "./locales/zh.json";
import hi from "./locales/hi.json";
import ja from "./locales/ja.json";

export const supportedLanguages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      tr: { translation: tr },
      zh: { translation: zh },
      hi: { translation: hi },
      ja: { translation: ja },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "tr", "zh", "hi", "ja"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "smith-chart-lang",
      convertDetectedLanguage: (lng) => {
        if (lng.startsWith("zh")) return "zh";
        if (lng.startsWith("ja")) return "ja";
        return lng;
      },
    },
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language;
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
