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

export async function initI18n(locale: string = "en-GB") {
  const validLocale = supportedLocales.includes(locale as Locale)
    ? (locale as Locale)
    : "en-GB";

  try {
    const { messages } = await import(`./locales/${validLocale}/messages.mjs`);
    i18n.loadAndActivate({ locale: validLocale, messages });
  } catch (error) {
    console.warn(`Failed to load locale ${validLocale}`);
    i18n.activate("en-GB");
  }
}

export function t(id: string): string {
  return i18n._(id);
}

export function getCurrentLocale(): Locale {
  return (i18n.locale as Locale) || "en-GB";
}

export { i18n };
