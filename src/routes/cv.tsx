import { MDXProvider } from "@mdx-js/react";
import { createFileRoute } from "@tanstack/react-router";
import CV from "~/components/cv.mdx";
import { useDSComponents } from "~/components/DSMarkdown";
import { Logo } from "~/components/logo";

export const Route = createFileRoute("/cv")({
  component: RouteComponent,
});

function RouteComponent() {
  const components = useDSComponents();
  return (
    <MDXProvider components={components}>
      <section className="flex items-center flex-col mb-24 px-4 lg:px-0">
        <article className="w-full md:max-w-4xl md:mx-auto">
          <a href="/">
            <Logo width={128} className="mt-12 mb-16" />
          </a>

          <div className="flex flex-col gap-6">
            <CV />
          </div>
        </article>
      </section>
    </MDXProvider>
  );
}
