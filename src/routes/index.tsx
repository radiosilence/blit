import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "~/components/logo";
import { defaultLocale } from "~/lib/i18n";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t, i18n } = useTranslation();

  // Set default locale for root route
  if (i18n.language !== defaultLocale) {
    i18n.changeLanguage(defaultLocale);
  }

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{t("home.name")}</h1>
      <p className="text-sm">{t("home.role")}</p>
      <p>
        <a href="/cv">{t("nav.cv")}</a> /{" "}
        <a href="https://github.com/radiosilence">{t("nav.github")}</a>
      </p>

      {/* Hidden locale links for prerender crawler */}
      <div style={{ display: "none" }}>
        <a href="/fr-FR/">Français</a>
        <a href="/fr-FR/cv">CV Français</a>
        <a href="/ar/">العربية</a>
        <a href="/ar/cv">السيرة الذاتية</a>
        <a href="/ja-JP/">日本語</a>
        <a href="/ja-JP/cv">履歴書</a>
        <a href="/zh-CN/">中文</a>
        <a href="/zh-CN/cv">简历</a>
      </div>
    </section>
  );
}
