import { createFileRoute } from "@tanstack/react-router";
import { i18n, isValidLocale } from "~/lib/i18n";

export const Route = createFileRoute("/$locale/cv")({
  beforeLoad: async ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
    // Set language for SSR - wait for it to complete
    await i18n.changeLanguage(params.locale);
  },
  component: () => <div>CV page for locale</div>,
});
