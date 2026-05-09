import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    // Only serve static assets (not HTML pages — those go through SSR)
    if (path.startsWith("/assets/") || path.match(/\.(png|ico|json|woff2|webmanifest)$/)) {
      const file = Bun.file(`./dist/client${path}`);
      if (await file.exists()) return new Response(file);
    }
    return server.fetch(req);
  },
});

console.log(`SSR server listening on http://localhost:${port}`);
