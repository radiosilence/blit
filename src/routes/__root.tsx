import { i18n } from "@lingui/core";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import logo from "#/assets/logo.png";
import { LanguageSelector } from "#/components/language-selector";
import { isRtl } from "#/i18n/config";
import appCss from "#/styles/app.css?url";
import { useLingui } from "@lingui/react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { title: i18n._("james cleveland : senior full stack engineer") },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
      { name: "application-name", content: "blit.cc" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "blit.cc" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "og:title", content: i18n._("james cleveland : senior full stack engineer") },
      { name: "og:url", content: "https://blit.cc" },
      { name: "og:image", content: logo },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { i18n } = useLingui();
  const locale = i18n.locale;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <section className="flex flex-col items-center m-12 space-y-4 text-center">
          <LanguageSelector />
        </section>
        <TanStackDevtools
          config={{
            position: isRtl(locale) ? "bottom-right" : "bottom-left",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
