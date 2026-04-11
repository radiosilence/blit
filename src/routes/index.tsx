import { i18n } from "@lingui/core";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/start-server-core";
import { HomeContent } from "../components/home-content";
import { loadCatalog } from "../i18n/catalogs";
import { sourceLocale } from "../i18n/config";

const getPageData = createServerFn({ method: "GET" }).handler(async () => {
  const formData = JSON.parse(getRequestHeader("x-form-data") || "null") as Record<
    string,
    string
  > | null;
  return {
    formData,
    userAgent: getRequestHeader("user-agent") || "unknown",
    acceptLanguage: getRequestHeader("accept-language") || "unknown",
    host: getRequestHeader("host") || "unknown",
    url: getRequest().url,
    time: new Date().toISOString(),
  };
});

export const Route = createFileRoute("/")({
  loader: async () => {
    loadCatalog(sourceLocale);
    return await getPageData();
  },
  head: () => ({
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  }),
  component: HomePage,
});

function HomePage() {
  const { formData, ...info } = Route.useLoaderData();

  return (
    <>
      <HomeContent />
      <section className="m-12 max-w-screen-sm mx-auto space-y-6">
        <div className="text-center space-y-4">
          {formData?.name && (
            <p className="text-xl">
              hey, <strong>{formData.name}</strong>
            </p>
          )}
          <form method="POST" className="flex gap-2 justify-center">
            <input
              name="name"
              placeholder="your name, choom"
              defaultValue={formData?.name || ""}
              className="border border-brand-mid px-3 py-1 bg-transparent text-sm"
            />
            <button type="submit" className="border border-brand px-3 py-1 text-sm text-brand">
              go
            </button>
          </form>
        </div>

        <div className="text-xs opacity-40">
          <h3>ssr debug</h3>
          <table className="w-full">
            <tbody>
              {formData && (
                <tr>
                  <td className="font-semibold pis-0">POST body</td>
                  <td className="break-all">{JSON.stringify(formData)}</td>
                </tr>
              )}
              {Object.entries(info).map(([k, v]) => (
                <tr key={k}>
                  <td className="font-semibold pis-0">{k}</td>
                  <td className="break-all">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
