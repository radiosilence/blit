import { defineMiddleware } from "astro:middleware";
import { i18n } from "@lingui/core";
import * as z from "zod";
import { locales } from "@/../lingui.config";

const zLocale = z.enum(locales);

export const localeMiddleware = defineMiddleware(async (context, next) => {
  const parts = context.request.url.split("/");

  const locale =
    parts.find((part) => zLocale.safeParse(part).success) ?? "en-GB";

  const { messages } = await import(`../locales/${locale}/messages.mjs`);
  i18n.loadAndActivate({ locale: locale, messages });

  context.locals.isRtl = ["ar-PS"].includes(locale);
  context.locals.locale = locale;
  context.locals.locales = locales;

  return next();
});
