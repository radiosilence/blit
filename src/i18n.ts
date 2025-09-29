import { i18n } from "@lingui/core";
import { z } from "zod";
import { supportedLocales } from "../lingui.config";

export { supportedLocales };
export type Locale = (typeof supportedLocales)[number];

// Zod schema for locale validation
const LocaleSchema = z.enum(supportedLocales);

export async function initI18n(locale: string = "en-GB") {
  const validLocale = LocaleSchema.safeParse(locale).success
    ? LocaleSchema.parse(locale)
    : "en-GB";

  try {
    const { messages } = await import(`./locales/${validLocale}/messages.mjs`);
    i18n.loadAndActivate({ locale: validLocale, messages });
  } catch (_error) {
    console.warn(`Failed to load messages for locale ${validLocale}`);
    i18n.activate("en-GB");
  }

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
