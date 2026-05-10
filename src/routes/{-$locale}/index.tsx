import { useLingui } from "@lingui/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import logo from "#/assets/logo.png";

import { localeLoader, maybeStripSourceLocale } from "./-shared.ts";

export const Route = createFileRoute("/{-$locale}/")({
  beforeLoad: ({ params }) => {
    maybeStripSourceLocale(params.locale);
  },
  loader: ({ params }) => {
    localeLoader(params.locale);
  },
  component: HomeContent,
});

function HomeContent() {
  const { i18n } = useLingui();

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <img src={logo} alt="blit.cc logo" width={256} height={256} className="mbs-12 mbe-8" />
      <h1>{i18n._("james cleveland")}</h1>
      <p className="text-sm">{i18n._("james cleveland : senior full stack engineer")}</p>
      <p>
        <Link to="/{-$locale}/cv">{i18n._("cv-2025.01")}</Link>
        {" / "}
        <a href="https://github.com/radiosilence" target="_blank" rel="noopener">
          {i18n._("github")}
        </a>
      </p>
    </section>
  );
}
