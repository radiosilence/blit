import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
  createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
