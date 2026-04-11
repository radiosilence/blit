import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    const file = Bun.file(`./dist/client${path}`);
    if (await file.exists() && !path.endsWith("/")) return new Response(file);
    return server.fetch(req);
  },
});

console.log(`SSR server listening on http://localhost:${port}`);
