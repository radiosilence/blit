import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const [dir = "dist", port = "3000"] = process.argv.slice(2);

const types: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const isFile = (path: string) =>
  stat(path).then(
    (s) => s.isFile(),
    () => false,
  );

// Mirrors nano-web: try the path itself, then fall back to the directory index.
async function resolve(pathname: string) {
  for (const candidate of [pathname, join(pathname, "index.html")]) {
    const file = join(dir, normalize(candidate));
    // oxlint-disable-next-line no-await-in-loop -- ordered fallback; the second probe only runs if the first misses
    if (await isFile(file)) return file;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = await resolve(pathname);

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not Found");
    return;
  }

  res.writeHead(200, {
    "cache-control": "no-store",
    "content-type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(Number(port), () => console.log(`Serving ${dir} on http://localhost:${port}`));
