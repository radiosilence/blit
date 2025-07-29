import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "~/components/logo";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>james cleveland</h1>
      <p className="text-sm">senior full stack engineer</p>
      <p>
        <a href="/cv">cv-2025.01</a> /{" "}
        <a href="https://github.com/radiosilence">github</a>
      </p>
    </section>
  );
}
