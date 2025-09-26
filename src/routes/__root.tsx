/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import appleTouchIcon from "~/assets/apple-touch-icon.png";
import favicon16 from "~/assets/favicon-16x16.png";
import favicon32 from "~/assets/favicon-32x32.png";
import appCss from "~/styles/app.css?url";
import "~/lib/i18n";

export const Route = createRootRoute({
  notFoundComponent: () => "💀",
  component: RootComponent,
});

function RootComponent() {
  const { t } = useTranslation();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed, but app still works
      });
    }
  }, []);

  return (
    <RootDocument title={t("site.title")} appName={t("site.appName")}>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  lang = "en-GB",
  title = "james cleveland : senior full stack engineer",
  appName = "blit.cc",
}: Readonly<{
  children: ReactNode;
  lang?: string;
  title?: string;
  appName?: string;
}>) {
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="theme-color" content="#ffffff" />
        <meta name="application-name" content={appName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appName} />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="stylesheet" href={appCss} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
        <link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
        <link rel="icon" type="image/png" sizes="16x16" href={favicon16} />
        <link rel="manifest" href="/manifest.json" />

        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
