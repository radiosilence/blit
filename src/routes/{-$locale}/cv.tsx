import { createFileRoute, Link } from "@tanstack/react-router";

import CV from "#/assets/cv.mdx";
import logo from "#/assets/logo.png";

export const Route = createFileRoute("/{-$locale}/cv")({
  component: CVContent,
});

function CVContent() {
  return (
    <div className="flex flex-col mli-4 lg:mli-0 items-center">
      <section className="mb-12 max-w-screen-lg">
        <Link to="..">
          <img
            src={logo}
            alt="blit.cc logo"
            width={128}
            height={128}
            className="mbs-16 lg:mbs-32 mbe-8"
          />
        </Link>
        <article className="prose prose-sm">
          <CV />
        </article>
      </section>
    </div>
  );
}
