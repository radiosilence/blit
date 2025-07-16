import { Divider, Link, SimpleList, Text } from "@surgeventures/design-system";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
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
      <Text font="body-m-regular" as="em" unsafeClassName="italic">
        {children}
      </Text>
    ),
    code: ({ children }) => (
      <Text
        font="body-s-medium"
        as="span"
        unsafeClassName="font-mono bg-gray-100 px-1 rounded"
      >
        {children}
      </Text>
    ),
    pre: ({ children }) => (
      <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
        <Text
          font="body-s-regular"
          as="div"
          unsafeClassName="font-mono whitespace-pre"
        >
          {children}
        </Text>
      </div>
    ),
    blockquote: ({ children }) => (
      <div className="border-l-4 border-gray-300 pl-4 italic">
        <Text font="body-m-regular" as="div">
          {children}
        </Text>
      </div>
    ),
    ul: ({ children }) => (
      <SimpleList listStyle="bullet" unsafeClassName="ml-4">
        {children}
      </SimpleList>
    ),
    ol: ({ children }) => (
      <SimpleList listStyle="decimal" unsafeClassName="ml-4">
        {children}
      </SimpleList>
    ),
    li: ({ children }) => <SimpleList.Item>{children}</SimpleList.Item>,
    hr: () => <Divider />,
    ...components,
  };
}
