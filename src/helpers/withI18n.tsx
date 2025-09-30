import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { type ComponentType, useRef } from "react";

export function withI18n<P extends object>(C: ComponentType<P>) {
  return (props: P & { locale: string }) => {
    const activated = useRef(false);
    if (!activated.current) {
      import(`../locales/${props.locale}/messages.mjs`).then(({ messages }) => {
        activated.current = true;
        i18n.loadAndActivate({
          locale: props.locale,
          messages,
        });
      });
    }
    return (
      <I18nProvider i18n={i18n}>
        <C {...props} />
      </I18nProvider>
    );
  };
}
