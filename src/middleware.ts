import { defineMiddleware } from "astro/middleware";
import { initI18n } from "./i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  // Extract locale from URL: /fr-FR/page -> "fr-FR"
  const url = new URL(context.request.url);
  const locale = url.pathname.split("/").filter(Boolean)[0] || "en-GB";

  await initI18n(locale);

  return next();
});
