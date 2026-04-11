import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  fetch: server.fetch,
  static: {
    // Serve prerendered static assets from dist/client
    ...Object.fromEntries(
      new Bun.Glob("**/*")
        .scanSync({ cwd: "./dist/client", absolute: false })
        .filter((f) => !f.endsWith(".html"))
        .map((f) => [`/${f}`, new Response(Bun.file(`./dist/client/${f}`))]),
    ),
  },
});

console.log(`SSR server listening on http://localhost:${port}`);
