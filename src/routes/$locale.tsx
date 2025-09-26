import { createFileRoute, Outlet } from "@tanstack/react-router";
import * as z from "zod";
import { supportedLocales } from "~/i18n";
import { setLocale } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  locale: z.enum(supportedLocales),
});

export const Route = createFileRoute("/$locale")({
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

  // Ensure language tag is set for CSR
  setLocale(locale);

  return <Outlet />;
}
