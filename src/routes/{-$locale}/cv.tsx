import { createFileRoute, Link } from "@tanstack/react-router";

import CVmd from "#/assets/cv.mdx";
import logo from "#/assets/logo.png";
import { loadCatalog } from "#/i18n/catalogs.ts";
import { sourceLocale } from "#/i18n/config.ts";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";

function CVComponent({ locale }: { locale: string }) {
  loadCatalog(locale);

  return (
    <div className="flex flex-col mli-4 lg:mli-0 items-center">
      <section className="mb-12 max-w-screen-lg">
        <Link to="..">
          <img
            src={logo}
            alt="blit.cc logo"
            width={128}
            height={128}
            className="mbs-16 lg:mbs-32 mbe-8"
          />
        </Link>
        <article className="prose prose-sm">
          <CVmd />
        </article>
      </section>
    </div>
  );
}

const getCV = createServerFn()
  .inputValidator((data: { locale: string }) => data)
  .handler(async ({ data }) => {
    loadCatalog(data.locale);
    const Renderable = await renderServerComponent(<CVComponent locale={data.locale} />);
    return { Renderable };
  });

export const Route = createFileRoute("/{-$locale}/cv")({
  loader: async ({ params: { locale = sourceLocale } }) => {
    const { Renderable } = await getCV({
      data: { locale },
    });
    return { CV: Renderable };
  },
  component: CVContent,
});

function CVContent() {
  const { CV } = Route.useLoaderData();
  return <>{CV}</>;
}
