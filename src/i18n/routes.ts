import { sourceLocale } from "#/i18n/config.ts";

export const pages = [
  { key: "home", slug: "" },
  { key: "cv", slug: "cv" },
] as const;

/**
 * The source locale lives at the root (`/`, `/cv`); everything else is prefixed
 * (`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes, which
 * nano-web resolves for both `/cv` and `/cv/`.
 */
export const url = (locale: string, slug: string) =>
  `/${[locale === sourceLocale ? "" : locale, slug].filter(Boolean).join("/")}`;
