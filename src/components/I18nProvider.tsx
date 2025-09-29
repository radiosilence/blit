import { i18n } from "@lingui/core";
import { I18nProvider as LinguiI18nProvider } from "@lingui/react";
import { type ReactNode, useEffect, useState } from "react";

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
  messages?: any;
}

/**
 * Client-side i18n provider that works with Astro hydration
 * This component handles loading messages and activating the locale on the client
 */
export const I18nProvider = ({
  children,
  locale: initialLocale,
  messages: initialMessages,
}: I18nProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadI18n() {
      // Get locale from various sources
      const locale =
        initialLocale ||
        document.documentElement.lang ||
        getLocaleFromURL() ||
        "en-GB";

      try {
        let messages = initialMessages;

        // If no messages provided, try to load them
        if (!messages) {
          try {
            const messagesModule = await import(
              `../locales/${locale}/messages.mjs`
            );
            messages = messagesModule.messages;
          } catch (error) {
            console.warn(
              `Failed to load messages for locale ${locale}, falling back to en-GB`,
            );
            try {
              const messagesModule = await import(
                `../locales/en-GB/messages.mjs`
              );
              messages = messagesModule.messages;
            } catch (fallbackError) {
              console.error("Failed to load fallback messages:", fallbackError);
              messages = {};
            }
          }
        }

        // Load and activate the locale
        i18n.loadAndActivate({ locale, messages });
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to initialize i18n:", error);
        // Fallback to default
        i18n.activate("en-GB");
        setIsLoaded(true);
      }
    }

    loadI18n();
  }, [initialLocale, initialMessages]);

  // Don't render until i18n is loaded to avoid hydration mismatches
  if (!isLoaded) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <LinguiI18nProvider i18n={i18n}>{children}</LinguiI18nProvider>;
};

/**
 * Extract locale from URL path
 */
function getLocaleFromURL(): string | null {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);
  const possibleLocale = segments[0];

  const supportedLocales = [
    "en-GB",
    "fr-FR",
    "ja-JP",
    "zh-CN",
    "ka-GE",
    "uk-UA",
    "ar-PS",
    "it-IT",
    "de-DE",
    "nl-BE",
    "nl-NL",
    "pl-PL",
    "ar",
  ];

  return supportedLocales.includes(possibleLocale) ? possibleLocale : null;
}

export default I18nProvider;
