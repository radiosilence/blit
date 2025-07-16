import {
  CalloutBanner,
  Divider,
  Link,
  SimpleList,
  Text,
} from "@surgeventures/design-system";
import type { MDXComponents } from "mdx/types";

export function useDSComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h1: ({ children }) => (
      <Text font="header-2xl-bold" as="h1">
        {children}
      </Text>
    ),
    h2: ({ children }) => (
      <Text font="header-xl-bold" as="h2">
        {children}
      </Text>
    ),
    h3: ({ children }) => (
      <Text font="header-l-semibold" as="h3">
        {children}
      </Text>
    ),
    h4: ({ children }) => (
      <Text font="header-m-semibold" as="h4">
        {children}
      </Text>
    ),
    h5: ({ children }) => (
      <Text font="header-s-semibold" as="h4">
        {children}
      </Text>
    ),
    h6: ({ children }) => (
      <Text font="header-xs-semibold" as="h4">
        {children}
      </Text>
    ),
    p: ({ children }) => (
      <Text font="body-m-regular" as="p">
        {children}
      </Text>
    ),
    a: ({ href, children }) => (
      <Link
        text={children}
        linkTo={href}
        isExternal={href?.startsWith("http")}
        target={href?.startsWith("http") ? "_blank" : undefined}
      />
    ),
    strong: ({ children }) => (
      <Text font="body-m-semibold" as="strong">
        {children}
      </Text>
    ),
    em: ({ children }) => (
      <Text font="body-m-regular" as="em">
        {children}
      </Text>
    ),
    code: ({ children }) => (
      <Text font="body-s-medium" as="span">
        {children}
      </Text>
    ),
    pre: ({ children }) => (
      <pre>
        <Text font="body-s-regular" as="div">
          {children}
        </Text>
      </pre>
    ),
    blockquote: ({ children }) => (
      <CalloutBanner description={children} hasIcon={false} />
    ),
    ul: ({ children }) => (
      <SimpleList listStyle="bullet">{children}</SimpleList>
    ),
    ol: ({ children }) => (
      <SimpleList listStyle="decimal">{children}</SimpleList>
    ),
    li: ({ children }) => <SimpleList.Item>{children}</SimpleList.Item>,
    hr: () => <Divider />,
    ...components,
  };
}
