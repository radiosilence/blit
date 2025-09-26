import { createFileRoute, Outlet } from "@tanstack/react-router";
import * as z from "zod";
import { supportedLocales } from "~/i18n";
import { setLanguageTag } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  languageTag: z.enum(supportedLocales),
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
