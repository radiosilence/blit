import { createHash } from "node:crypto";
import { glob, mkdir, readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import MarkdownIt from "markdown-it";
import { parse } from "parse5";
import { render } from "./template.ts";

import { loadCatalogs, translator } from "#/i18n/catalogs.ts";
import { describeLocale, isRtl, locales } from "#/i18n/config.ts";
import { pages, url } from "#/i18n/routes.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

const read = (...path: string[]) => readFile(join(root, ...path), "utf8");

const markdown = MarkdownIt({ html: true });

/*
 * nano-web serves CSS as `immutable, max-age=1y`, so a stable /style.css would
 * strand returning visitors on old styles after a deploy. The digest changes the
 * URL whenever the CSS does, which is what makes that caching safe.
 */
const styleHref = await readFile(join(dist, "style.css")).then(
  (css) => `/style.css?v=${createHash("sha256").update(css).digest("hex").slice(0, 8)}`,
);

const [catalogs, cv] = await Promise.all([
  loadCatalogs(),
  read("src/content/cv.md").then((source) => markdown.render(source)),
]);

const written = await Promise.all(
  locales.flatMap((locale) =>
    pages.map(async (page) => {
      const view = {
        locale,
        dir: isRtl(locale) ? "rtl" : "ltr",
        __: translator(catalogs[locale] ?? {}),
        cv,
        styleHref,
        path: url(locale, page.slug),
        urls: Object.fromEntries(pages.map(({ slug }) => [slug || "home", url(locale, slug)])),
        localeLinks: locales.map((code) => ({
          code,
          href: url(code, page.slug),
          current: code === locale,
          // Templates read paths, never expressions, so the choice is made here.
          linkClass: code === locale ? "text-brand" : "text-inherit",
          ...describeLocale(code),
        })),
      };

      const html = render(page.template, view);

      const file = join(dist, view.path, "index.html");
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html);
      return file;
    }),
  ),
);

/*
 * Drop pages from earlier builds. Without this a removed locale keeps its
 * directory in dist/ and carries on being served. Only index.html files are
 * touched, which is exactly the set this script owns.
 */
const current = new Set(written);
const stale: string[] = [];
for await (const page of glob("*/**/index.html", { cwd: dist })) {
  if (!current.has(join(dist, page))) stale.push(join(dist, page));
}
await Promise.all(stale.map((page) => rm(page)));

// Depth-first: children have to be gone before a directory can be judged empty.
const prune = async (dir: string) => {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => prune(join(dir, entry.name))),
  );
  if (dir !== dist && (await readdir(dir)).length === 0) await rmdir(dir);
};

await prune(dist);

/*
 * Every internal link, resolved against what was actually written. Pages are
 * directory indexes and the templates build hrefs from routes.ts, so a link that
 * misses is a routing bug that would otherwise ship as a 404 nobody clicks.
 */
const pageFiles = new Set(written);
const broken: string[] = [];

for (const file of written) {
  const html = await readFile(file, "utf8");
  const walkLinks = (node: { childNodes?: unknown[] }) => {
    for (const child of (node.childNodes ?? []) as {
      tagName?: string;
      attrs?: { name: string; value: string }[];
      childNodes?: unknown[];
    }[]) {
      const href = child.attrs?.find((a) => a.name === "href")?.value;
      if (child.tagName === "a" && href?.startsWith("/")) {
        const target = join(dist, href.split(/[?#]/)[0] ?? "", "index.html");
        if (!pageFiles.has(target)) broken.push(`${relative(dist, file)} -> ${href}`);
      }
      walkLinks(child);
    }
  };
  walkLinks(parse(html));
}

if (broken.length) {
  throw new Error(`Links with no page behind them:\n  ${[...new Set(broken)].join("\n  ")}`);
}

console.log(`Checked internal links across ${written.length} pages`);

console.log(`Generated ${locales.length * pages.length} pages in ${dist}`);
