import { createFileRoute } from "@tanstack/react-router";

import CV from "#/assets/cv.mdx";
import { localeLoader } from "./-shared.ts";
import { useLingui } from "@lingui/react";
import { sourceLocale } from "#/i18n/config.ts";
import logo from "#/assets/logo.png";

export const Route = createFileRoute("/{-$locale}/cv")({
  loader: ({ params }) => {
    localeLoader(params.locale);
  },
  component: CVContent,
});

function CVContent() {
  const { i18n } = useLingui();

  return (
    <div className="flex flex-col mli-4 lg:mli-0 items-center">
      <section className="mb-12 max-w-screen-lg">
        <a href={i18n.locale !== sourceLocale ? `/${i18n.locale}/` : "/"}>
          <img
            src={logo}
            alt="blit.cc logo"
            width={128}
            height={128}
            className="mbs-16 lg:mbs-32 mbe-8"
          />
        </a>
        <article className="prose prose-sm">
          <CV />
        </article>
      </section>
    </div>
  );
}
