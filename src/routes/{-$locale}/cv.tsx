import { CvContent } from "#/components/cv-content";
import { localeLoader } from "./-shared.ts";
import { createFileRoute } from "@tanstack/react-router";
import { sourceLocale } from "#/i18n/config.ts";

export const Route = createFileRoute("/{-$locale}/cv")({
  loader: ({ params }) => {
    localeLoader(params.locale ?? sourceLocale);
  },
  component: CvContent,
});
