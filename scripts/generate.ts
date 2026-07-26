import { createHash } from "node:crypto";
import { glob, mkdir, readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { WebC } from "@11ty/webc";
import { setupI18n } from "@lingui/core";
import MarkdownIt from "markdown-it";
import { parse } from "parse5";

import { loadCatalogs } from "#/i18n/catalogs.ts";
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

/*
 * Message ids are the source text, so Lingui's default of falling back to the id
 * would ship a typo as itself — `i18n._('githubb')` rendering "githubb". Every
 * extracted id reaches every catalogue, so a missing one is a typo or a string
 * that was never extracted, and both should stop the build.
 */
const translator = (locale: string) => {
  const i18n = setupI18n({
    missing: (where, id) => {
      throw new Error(`No message \`${id}\` in ${where}. If it is new, run \`task i18n:sync\`.`);
    },
  });

  // One instance per locale rather than one activated in turn, so pages render
  // in parallel without sharing which locale is currently switched on.
  i18n.load(locale, catalogs[locale] ?? {});
  i18n.activate(locale);
  return i18n;
};

/**
 * WebC resolves an unknown path to undefined and renders nothing, so a typo in a
 * template would ship as a silently missing value. Reading a key the view lacks
 * throws instead, naming the keys it does have.
 *
 * Nested objects are wrapped on the way out, so `$data.urls.typo` fails as loudly
 * as `$data.typo`.
 *
 * Three things are deliberately not guarded: symbols, because iterating a wrapped
 * array goes through `Symbol.iterator`; `then`, because WebC awaits every
 * expression and a throwing `then` makes the view look like a rejected promise;
 * and array indexes, which are positions rather than names a typo can miss.
 */
const strict = <T extends object>(view: T): T =>
  new Proxy(view, {
    get(target, key, receiver) {
      const guarded = typeof key === "string" && key !== "then" && !Array.isArray(target);
      if (guarded && !(key in target)) {
        throw new Error(`No \`${key}\` in the view. Available: ${Object.keys(target).join(", ")}`);
      }
      const value = Reflect.get(target, key, receiver);
      return value !== null && typeof value === "object" ? strict(value) : value;
    },
  });

const written = await Promise.all(
  locales.flatMap((locale) => {
    const i18n = translator(locale);

    return pages.map(async (page) => {
      const path = url(locale, page.slug);

      const template = new WebC();
      template.setInputPath(join(root, "src/templates", `${page.template}.webc`));
      template.defineComponents(join(root, "src/templates/*.webc"));
      // A helper is unscoped, so it reaches nested components; page data does not.
      template.setHelper("i18n", i18n);

      const { html } = await template.compile({
        data: strict({
          locale,
          dir: isRtl(locale) ? "rtl" : "ltr",
          cv,
          styleHref,
          canonicalUrl: `https://blit.cc${path}`,
          urls: Object.fromEntries(pages.map(({ slug }) => [slug || "home", url(locale, slug)])),
          localeLinks: locales.map((code) => ({
            code,
            href: url(code, page.slug),
            current: code === locale,
            ...describeLocale(code),
          })),
        }),
      });

      const file = join(dist, path, "index.html");
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html);
      return file;
    });
  }),
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
const broken: string[] = [];

const rendered = await Promise.all(
  written.map(async (file) => [file, await readFile(file, "utf8")] as const),
);

for (const [file, html] of rendered) {
  const walkLinks = (node: { childNodes?: unknown[] }) => {
    for (const child of (node.childNodes ?? []) as {
      tagName?: string;
      attrs?: { name: string; value: string }[];
      childNodes?: unknown[];
    }[]) {
      const href = child.attrs?.find((a) => a.name === "href")?.value;
      if (child.tagName === "a" && href?.startsWith("/")) {
        const [path] = href.split("?");
        const target = join(dist, path?.split("#")[0] ?? "", "index.html");
        if (!current.has(target)) broken.push(`${relative(dist, file)} -> ${href}`);
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
