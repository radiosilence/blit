import { defineMiddleware } from "astro/middleware";
import { initI18n } from "./i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  console.log("GOT REQUEST", context, next);
  const [locale = "en-GB"] = new URL(context.request.url).pathname
    .split("/")
    .filter((part) => !!part && /^[a-z]{2}-[A-Z]{2}$/.test(part));

  await initI18n(locale);

  context.locals.isRtl = ["ar", "ar-PS"].includes(locale);
  context.locals.locale = locale;

  return next();
});
