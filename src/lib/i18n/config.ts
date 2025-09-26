import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { defaultLocale, type SupportedLocale, supportedLocales } from "./types";

const isServer = typeof window === "undefined";

// Initialize i18next
i18n
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      // Dynamically import translation files
      return import(`./locales/${language}/${namespace}.json`);
    }),
  )
  .use(initReactI18next)
  .init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: [...supportedLocales],

    // Disable interpolation escaping for React
    interpolation: {
      escapeValue: false,
    },

    // Default namespace
    defaultNS: "common",

    // React options
    react: {
      useSuspense: false, // Important for SSR
    },

    // Debug in development
    debug: process.env.NODE_ENV === "development" && !isServer,
  });

export default i18n;
export { supportedLocales, defaultLocale, type SupportedLocale };
