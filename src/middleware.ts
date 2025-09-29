import { defineMiddleware } from "astro/middleware";
import { setLocale } from "./i18n";

export const onRequest = defineMiddleware(async (context, next) => {
  // Extract locale from URL path
  const url = new URL(context.request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const potentialLocale = pathSegments[0];

  // setLocale handles validation internally
  await setLocale(potentialLocale || "en-GB");

  return next();
});
