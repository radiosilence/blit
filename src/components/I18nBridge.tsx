import { i18n } from "@lingui/core";
import { useLingui } from "@lingui/react";
import { type ReactNode, useEffect } from "react";

interface I18nBridgeProps {
  children: ReactNode;
  serverLocale?: string;
  serverMessages?: any;
}

/**
 * Bridge component that ensures i18n state is synchronized between server and client
 * This helps avoid hydration mismatches by ensuring consistent locale state
 */
export const I18nBridge = ({
  children,
  serverLocale,
  serverMessages,
}: I18nBridgeProps) => {
  const { i18n: clientI18n } = useLingui();

  useEffect(() => {
    // Ensure client i18n matches server state if provided
    if (serverLocale && serverMessages && clientI18n.locale !== serverLocale) {
      clientI18n.loadAndActivate({
        locale: serverLocale,
        messages: serverMessages,
      });
    }
  }, [serverLocale, serverMessages, clientI18n]);

  return <>{children}</>;
};

/**
 * Hook to get current i18n state for sharing between components
 */
export const useI18nState = () => {
  const locale = i18n.locale;
  const messages = i18n.messages;

  return { locale, messages };
};

/**
 * Higher-order component to wrap components that need i18n
 */
export function withI18n<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallbackLocale?: string;
    loadMessages?: boolean;
  } = {},
) {
  const { fallbackLocale = "en-GB", loadMessages = true } = options;

  return function WithI18nComponent(props: P) {
    const { locale, messages } = useI18nState();

    // Ensure i18n is active
    if (!locale && loadMessages) {
      i18n.activate(fallbackLocale);
    }

    return <Component {...props} />;
  };
}

export default I18nBridge;
