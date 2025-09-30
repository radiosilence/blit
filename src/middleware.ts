import { defineMiddleware } from "astro/middleware";
import { initI18n } from "./i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  const [locale] = new URL(context.request.url).pathname
    .split("/")
    .filter((part) => !!part);

  await initI18n(locale ?? "en-GB");

  return next();
});
