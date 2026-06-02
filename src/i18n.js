import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const supportedLanguages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export const supportedLngs = supportedLanguages.map(({ code }) => code);

const STORAGE_KEY = "smith-chart-lang";

const localeLoaders = {
  en: () => import("./locales/en.json"),
  es: () => import("./locales/es.json"),
  fr: () => import("./locales/fr.json"),
  tr: () => import("./locales/tr.json"),
  zh: () => import("./locales/zh.json"),
  hi: () => import("./locales/hi.json"),
  ja: () => import("./locales/ja.json"),
};

export function normalizeLanguage(lng) {
  if (!lng) return "en";
  if (lng.startsWith("zh")) return "zh";
  if (lng.startsWith("ja")) return "ja";
  const base = lng.split("-")[0];
  if (supportedLngs.includes(lng)) return lng;
  if (supportedLngs.includes(base)) return base;
  return "en";
}

export function detectLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // localStorage unavailable
  }
  return normalizeLanguage(navigator.language);
}

export async function loadLocale(lng) {
  const code = normalizeLanguage(lng);
  if (i18n.hasResourceBundle(code, "translation")) return code;
  const loader = localeLoaders[code];
  if (!loader) return "en";
  const mod = await loader();
  i18n.addResourceBundle(code, "translation", mod.default ?? mod, true, true);
  return code;
}

let initPromise;

export function initI18n() {
  if (!initPromise) {
    initPromise = (async () => {
      const detected = detectLanguage();

      await i18n.use(initReactI18next).init({
        lng: detected,
        fallbackLng: "en",
        supportedLngs,
        interpolation: { escapeValue: false },
        partialBundledLanguages: true,
      });

      const initialLocales = new Set(["en", detected]);
      await Promise.all([...initialLocales].map(loadLocale));

      if (typeof document !== "undefined") {
        document.documentElement.lang = i18n.language;
        i18n.on("languageChanged", (lng) => {
          document.documentElement.lang = lng;
          try {
            localStorage.setItem(STORAGE_KEY, normalizeLanguage(lng));
          } catch {
            // localStorage unavailable
          }
        });
      }

      return i18n;
    })();
  }
  return initPromise;
}

export async function changeLanguage(lng) {
  await loadLocale(lng);
  return i18n.changeLanguage(normalizeLanguage(lng));
}

export default i18n;
