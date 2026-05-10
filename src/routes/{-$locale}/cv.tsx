import { createFileRoute } from "@tanstack/react-router";
import { sourceLocale } from "#/i18n/config.ts";
import CV from "#/components/cv.mdx";
import { localeLoader } from "./-shared.ts";

export const Route = createFileRoute("/{-$locale}/cv")({
  loader: ({ params }) => {
    localeLoader(params.locale ?? sourceLocale);
  },
  component: CV,
});
