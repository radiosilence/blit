import { sourceLocale } from "#/i18n/config.ts";
import { useLingui } from "@lingui/react";
import type { PropsWithChildren } from "react";

export function HomeLink({ children }: PropsWithChildren) {
  const { i18n } = useLingui();

  return <a href={i18n.locale !== sourceLocale ? `/${i18n.locale}/` : "/"}>{children}</a>;
}
