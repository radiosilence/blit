import { createFileRoute, Link } from "@tanstack/react-router";

import logo from "#/assets/logo.png";
import { i18n } from "@lingui/core";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { sourceLocale } from "#/i18n/config";
import { loadCatalog } from "#/i18n/catalogs";

function HomeComponent({ locale }: { locale: string }) {
  loadCatalog(locale);

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

const getHome = createServerFn()
  .inputValidator((data: { locale: string }) => data)
  .handler(async ({ data }) => {
    const Renderable = await renderServerComponent(<HomeComponent locale={data.locale} />);
    return { Renderable };
  });

export const Route = createFileRoute("/{-$locale}/")({
  loader: async ({ params: { locale = sourceLocale } }) => {
    const { Renderable } = await getHome({ data: { locale } });
    return { Home: Renderable };
  },
  component: HomeContent,
});

function HomeContent() {
  const { Home } = Route.useLoaderData();
  return Home;
}
