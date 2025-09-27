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
import { getLocale } from "~/paraglide/runtime";
import appCss from "~/styles/app.css?url";

const rtlLocales = ["ar", "ar-PS"];

const isRtlLocale = (locale: string): boolean => {
  return rtlLocales.includes(locale);
};

export const Route = createRootRoute({
  notFoundComponent: () => "💀",
  component: RootComponent,
});

function RootComponent() {
  const locale = getLocale();
  const isRtl = isRtlLocale(locale);

  return (
    <RootDocument
      title={m.site_title({ locale })}
      appName={m.site_appName({ locale })}
      lang={locale}
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
