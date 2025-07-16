import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "~/components/logo";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mt-12 mb-8" />
      <h1>james cleveland</h1>
      <p className="text-sm">senior full stack engineer</p>
      <p>
        <Link to="/cv">cv-2025.01</Link> /{" "}
        <a
          href="https://github.com/radiosilence"
          target="_blank"
          rel="noopener"
        >
          github
        </a>
      </p>
    </section>
  );
}
