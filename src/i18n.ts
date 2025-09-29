import { i18n } from "@lingui/core";

export const supportedLocales = [
  "en-GB",
  "fr-FR",
  "ar",
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
] as const;

export type Locale = (typeof supportedLocales)[number];

// Load and cache messages for all locales at startup
const messageCache = new Map<Locale, any>();

async function loadMessages(locale: Locale) {
  if (messageCache.has(locale)) {
    return messageCache.get(locale);
  }

  try {
    const { messages } = await import(`./locales/${locale}/messages.mjs`);
    messageCache.set(locale, messages);
    return messages;
  } catch (error) {
    console.warn(`Failed to load messages for locale ${locale}`);
    return {};
  }
}

export async function initI18n(locale: string = "en-GB") {
  const validLocale = supportedLocales.includes(locale as Locale)
    ? (locale as Locale)
    : "en-GB";

  const messages = await loadMessages(validLocale);
  i18n.loadAndActivate({ locale: validLocale, messages });

  return validLocale;
}

export function getCurrentLocale(): Locale {
  return (i18n.locale as Locale) || "en-GB";
}

// Use i18n._ directly for translations
export function t(messageId: string): string {
  return i18n._(messageId);
}

export { i18n };
