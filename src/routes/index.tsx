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
        <a href="/ka-GE/">ქართული</a>
        <a href="/ka-GE/cv">რეზიუმე</a>
        <a href="/uk-UA/">Українська</a>
        <a href="/uk-UA/cv">Резюме</a>
        <a href="/ar-PS/">العربية الفلسطينية</a>
        <a href="/ar-PS/cv">السيرة الذاتية</a>
        <a href="/it-IT/">Italiano</a>
        <a href="/it-IT/cv">Curriculum</a>
        <a href="/de-DE/">Deutsch</a>
        <a href="/de-DE/cv">Lebenslauf</a>
        <a href="/nl-BE/">Nederlands (België)</a>
        <a href="/nl-BE/cv">Curriculum Vitae</a>
        <a href="/nl-NL/">Nederlands</a>
        <a href="/nl-NL/cv">CV</a>
        <a href="/pl-PL/">Polski</a>
        <a href="/pl-PL/cv">Życiorys</a>
      </div>
    </section>
  );
}
