import { createFileRoute } from "@tanstack/react-router";
import { isValidLocale } from "~/lib/i18n";

export const Route = createFileRoute("/$locale/cv")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
  },
  component: () => <div>CV page for locale</div>,
});
