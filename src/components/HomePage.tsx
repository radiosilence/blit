import { i18n } from "@lingui/core";
import Logo from "@/components/Logo.tsx";
import { supportedLocales } from "@/i18n";

const { locale } = i18n;

export const HomePage = () => {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{i18n._("james cleveland")}</h1>
      <p className="text-sm">
        {i18n._("james cleveland : senior full stack engineer")}
      </p>
      <p>
        <a href={`${locale !== "en-GB" ? `/${locale}` : ""}/cv`}>
          {i18n._("cv-2025.01")}
        </a>
        {" / "}
        <a href="https://github.com/radiosilence">{i18n._("github")}</a>
        <div className="hidden">
          {supportedLocales.map((locale) => (
            <div key={locale}>
              <a href={`/${locale}`}>{locale}</a>
              <a href={`/${locale}/cv`}>{locale} CV</a>
            </div>
          ))}
        </div>
        <div className="picker">
          <select
            onChange={(e) => {
              window.location.href = `/${e.target.value !== "en-GB" ? e.target.value : ""}`;
            }}
            className="bg-transparent text-xs cursor-pointer"
          >
            {supportedLocales.map((l) => (
              <option key={l} value={l} selected={l === locale}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </p>
    </section>
  );
};
