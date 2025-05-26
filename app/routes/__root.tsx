import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appleTouchIcon from "@/assets/apple-touch-icon.png";
import favicon16 from "@/assets/favicon-16x16.png";
import favicon32 from "@/assets/favicon-32x32.png";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "james cleveland : full stack / react native / devops",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: appleTouchIcon,
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: favicon32,
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: favicon16,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  lang = "en_GB",
}: Readonly<{ children: ReactNode; lang?: string }>) {
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
