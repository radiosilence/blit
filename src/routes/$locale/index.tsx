import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { supportedLocales } from "~/i18n";
import { HomePage } from "~/pages/home";
import { setLocale } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  locale: z.enum(supportedLocales),
});

export const Route = createFileRoute("/$locale/")({
  loader: ({ params }) => {
    const { data } = ParamsSchema.safeParse(params);

    return {
      locale: data?.locale ?? "en-GB",
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { locale } = Route.useLoaderData();

  // Set language tag for both SSR and CSR
  setLocale(locale);

  return <HomePage locale={locale} />;
}
