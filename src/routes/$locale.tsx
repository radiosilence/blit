import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { defaultLocale, isValidLocale } from "~/lib/i18n";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw notFound();
    }
  },
  loader: ({ params }: { params: { locale: string } }) => {
    // Redirect root locale to default without locale prefix
    if (params.locale === defaultLocale) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
