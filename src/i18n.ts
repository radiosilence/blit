import { i18n } from "@lingui/core";
import { z } from "zod";
import { locales } from "../lingui.config";

export { locales as supportedLocales };

// Zod schema for locale validation
const LocaleSchema = z.enum(locales);

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

export { i18n };
