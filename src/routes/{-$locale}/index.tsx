import { HomeContent } from "@/components/home-content";
import { localeLoader } from "@/routes/-shared";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$locale}/")({
  loader: ({ params }) => {
    localeLoader(params.locale ?? "en-GB");
  },
  component: HomeContent,
});
