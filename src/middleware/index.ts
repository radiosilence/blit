import { sequence } from "astro:middleware";
import { localeMiddleware } from "./locale";
export const onRequest = sequence(localeMiddleware);
