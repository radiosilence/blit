import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    Wrap: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
  });
}
