import { createFileRoute } from "@tanstack/react-router";
import CV from "~/assets/cv.mdx";
import { Logo } from "~/components/logo";

export const Route = createFileRoute("/cv")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex items-center flex-col mb-24 px-4 lg:px-0">
      <article className="prose prose-sm">
        <a href="/">
          <Logo width={128} className="mt-12 mb-16" />
        </a>
        <CV />
      </article>
    </section>
  );
}
