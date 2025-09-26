import { createFileRoute, Outlet } from "@tanstack/react-router";
import * as z from "zod";
import { setLanguageTag } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  languageTag: z.enum([
    "en-GB",
    "fr-FR",
    "ar",
    "ja-JP",
    "zh-CN",
    "ka-GE",
    "uk-UA",
    "ar-PS",
    "it-IT",
    "de-DE",
    "nl-BE",
    "nl-NL",
    "pl-PL",
  ]),
});

export const Route = createFileRoute("/$languageTag")({
  loader: ({ params }) => {
    const { data } = ParamsSchema.safeParse(params);

    return {
      languageTag: data?.languageTag ?? "en-GB",
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { languageTag } = Route.useLoaderData();

  // Ensure language tag is set for CSR
  setLanguageTag(languageTag);

  return <Outlet />;
}
