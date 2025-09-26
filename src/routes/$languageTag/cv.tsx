import { createFileRoute } from "@tanstack/react-router";
import CV from "~/components/cv.mdx";
import { Logo } from "~/components/logo";

export const Route = createFileRoute("/$languageTag/cv")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex items-center flex-col mbe-24 px-4 lg:px-0">
      <article className="prose prose-sm">
        <a href="/">
          <Logo width={128} className="mbs-12 mbe-16" />
        </a>
        <CV />
      </article>
    </section>
  );
}
