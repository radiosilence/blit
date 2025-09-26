/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import appleTouchIcon from "~/assets/apple-touch-icon.png";
import favicon16 from "~/assets/favicon-16x16.png";
import favicon32 from "~/assets/favicon-32x32.png";
import * as m from "~/paraglide/messages";
import appCss from "~/styles/app.css?url";

const rtlLocales = ["ar", "ar-PS"];
const supportedLocales = [
  "en-GB",
  "fr-FR",
  "ar",
  "ja-JP",
  "zh-CN",
  "ka-GE",
  "uk-UA",
  "ar-PS",
  "it-IT",
  "de-DE",
  "nl-BE",
  "nl-NL",
  "pl-PL",
] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const isRtlLocale = (locale: string): boolean => {
  return rtlLocales.includes(locale);
};

const getLocaleFromPath = (pathname: string): SupportedLocale | null => {
  const segments = pathname.split("/");
  const potentialLocale = segments[1];
  return (supportedLocales as readonly string[]).includes(potentialLocale)
    ? (potentialLocale as SupportedLocale)
    : null;
};

export const Route = createRootRoute({
  notFoundComponent: () => "💀",
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const currentLocale = getLocaleFromPath(location.pathname) || "en-GB";
  const isRtl = isRtlLocale(currentLocale);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed, but app still works
      });
    }
  }, []);

  return (
    <RootDocument
      title={m.site_title({ languageTag: currentLocale })}
      appName={m.site_appName({ languageTag: currentLocale })}
      lang={currentLocale}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  lang = "en-GB",
  title = "james cleveland : senior full stack engineer",
  appName = "blit.cc",
  dir = "ltr",
}: Readonly<{
  children: ReactNode;
  lang?: string;
  title?: string;
  appName?: string;
  dir?: "ltr" | "rtl";
}>) {
  return (
    <html lang={lang} dir={dir}>
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
