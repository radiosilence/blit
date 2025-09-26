import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { supportedLocales } from "~/i18n";
import { HomePage } from "~/pages/home";
import { setLocale } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  languageTag: z.enum(supportedLocales),
});

export const Route = createFileRoute("/$languageTag/")({
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

  // Set language tag for both SSR and CSR
  setLocale(languageTag);

  return <HomePage languageTag={languageTag} />;
}
