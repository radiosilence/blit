import { defineMiddleware } from "astro:middleware";
import { i18n } from "@lingui/core";
import { locales, sourceLocale } from "@/../lingui.config";

export const localeMiddleware = defineMiddleware(async (context, next) => {
  const { locale = "en-GB" } = context.params;

  i18n.loadAndActivate({
    locale,
    ...(await import(`../locales/${locale}/messages.mjs`)),
  });

  context.locals.isRtl = ["ar-PS"].includes(locale);
  context.locals.locales = locales;
  context.locals.sourceLocale = sourceLocale;

  return next();
});
