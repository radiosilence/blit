import { useLingui } from "@lingui/react";
import { sourceLocale } from "../i18n/config";
import logo from "./logo.png";

export function HomeContent() {
  const { i18n } = useLingui();
  const locale = i18n.locale;
  const cvPath = locale !== sourceLocale ? `/${locale}/cv` : "/cv";

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <img
        src={logo}
        alt="blit.cc logo"
        width={256}
        height={256}
        className="mbs-12 mbe-8"
      />
      <h1>{i18n._("james cleveland")}</h1>
      <p className="text-sm">
        {i18n._("james cleveland : senior full stack engineer")}
      </p>
      <p>
        <a href={cvPath}>{i18n._("cv-2025.01")}</a>
        {" / "}
        <a href="https://github.com/radiosilence">{i18n._("github")}</a>
      </p>
    </section>
  );
}
