import { HomeContent } from "@/components/home-content";
import { createFileRoute } from "@tanstack/react-router";
import { localeLoader } from "./-shared";

export const Route = createFileRoute("/")({
  loader: () => localeLoader(),
  component: HomeContent,
});
