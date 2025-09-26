import type { ComponentType } from "react";
import { Logo } from "~/components/logo";
import { supportedLocales } from "~/i18n";
import * as m from "~/paraglide/messages";

export const HomePage: ComponentType<{
  locale?: string;
}> = ({ locale }) => {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{m.home_name()}</h1>
      <p className="text-sm">{m.home_role()}</p>
      <p>
        <a href={`${locale ? `/${locale}` : ""}/cv`}>{m.nav_cv()}</a> /{" "}
        <a href="https://github.com/radiosilence">{m.nav_github()}</a>
      </p>

      {/* Hidden links for prerender crawler to discover locale routes */}
      <div className="hidden">
        {supportedLocales.map((locale) => (
          <div key={locale}>
            <a href={`/${locale}`}>{locale}</a>
            <a href={`/${locale}/cv`}>{locale} CV</a>
          </div>
        ))}
      </div>
    </section>
  );
};
