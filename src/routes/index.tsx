import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "~/components/logo";
import * as m from "~/paraglide/messages";

const defaultLanguageTag = "en-GB";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{m.home_name({ languageTag: defaultLanguageTag })}</h1>
      <p className="text-sm">
        {m.home_role({ languageTag: defaultLanguageTag })}
      </p>
      <p>
        <a href="/cv">{m.nav_cv({ languageTag: defaultLanguageTag })}</a> /{" "}
        <a href="https://github.com/radiosilence">
          {m.nav_github({ languageTag: defaultLanguageTag })}
        </a>
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
