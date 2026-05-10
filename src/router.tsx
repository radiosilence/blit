import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "#/routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
  });
}
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
