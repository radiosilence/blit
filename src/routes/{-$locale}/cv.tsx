import { CvContent } from "@/components/cv-content";
import { localeLoader } from "@/routes/-shared";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$locale}/cv")({
  loader: ({ params }) => {
    localeLoader(params.locale ?? "en-GB");
  },
  component: CvContent,
});
