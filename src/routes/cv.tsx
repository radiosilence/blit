import { CvContent } from "@/components/cv-content";
import { createFileRoute } from "@tanstack/react-router";
import { localeLoader } from "./-shared";

export const Route = createFileRoute("/cv")({
  loader: () => localeLoader(),
  component: CvContent,
});
