import { createFileRoute } from "@tanstack/react-router";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Logo } from "~/components/logo";
import cv from "../assets/cv.md";

export const Route = createFileRoute("/cv")({
  component: RouteComponent,
  loader: () => ({
    cv: <Markdown rehypePlugins={[rehypeRaw]}>{cv}</Markdown>,
  }),
  staleTime: Infinity,
});

function RouteComponent() {
  const { cv } = Route.useLoaderData();
  return (
    <section className="flex items-center flex-col mb-24 px-4 lg:px-0">
      <article className="prose prose-sm">
        <a href="/">
          <Logo width={128} className="mt-12 mb-16" />
        </a>
        {cv}
      </article>
    </section>
  );
}
