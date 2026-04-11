import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/start-server-core";
import type { PageData } from "../components/ssr-debug";

export const getPageData = createServerFn({ method: "GET" }).handler(async (): Promise<PageData> => {
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
