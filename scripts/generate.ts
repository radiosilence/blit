import { glob, mkdir, readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { WebC } from "@11ty/webc";
import { setupI18n } from "@lingui/core";
import { generateMessageId } from "@lingui/message-utils/generateMessageId";
import MarkdownIt from "markdown-it";
import { parse } from "parse5";

import { loadAssets } from "./assets.ts";

import { loadCatalogs } from "#/i18n/catalogs.ts";
import { describeLocale, isRtl, locales } from "#/i18n/config.ts";
import { pages, url } from "#/i18n/routes.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const build = join(root, ".build");

const read = (...path: string[]) => readFile(join(root, ...path), "utf8");

const markdown = MarkdownIt({ html: true });

const [assets, catalogs, cv] = await Promise.all([
  loadAssets(join(root, "src/static")),
  loadCatalogs(),
  read("src/content/cv.md").then((source) => markdown.render(source)),
]);

/*
 * The stylesheet and the manifest name other assets, so both are rewritten before
 * anything asks for their own URL — a hashed name inside them is what stops the
 * font and the icons being fetched at a second, unhashed URL that is cached just
 * as immutably.
 *
 * Tailwind compiles to .build rather than dist so that this rewrite has a fixed
 * input. Reading and rewriting in place would append a second hash on any run
 * where Tailwind's own output was up to date and therefore not regenerated.
 */
const fontUrl = assets.href("geist-mono.woff2");
assets.derive(
  "style.css",
  Buffer.from(
    (await readFile(join(build, "style.css"), "utf8")).replaceAll("/geist-mono.woff2", fontUrl),
  ),
);

const manifest = JSON.parse(await read("src/static/manifest.json")) as {
  icons?: { src: string }[];
};
for (const icon of manifest.icons ?? []) {
  icon.src = assets.href(icon.src.startsWith("/") ? icon.src.slice(1) : icon.src);
}
assets.derive("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2)));

/*
 * Message ids are the source text, so Lingui's default of falling back to the id
 * would ship a typo as itself — `i18n._('githubb')` rendering "githubb". Every
 * extracted id reaches every catalogue, so a missing one is a typo or a string
 * that was never extracted, and both should stop the build.
 */
const translator = (locale: string) => {
  const messages = catalogs[locale] ?? {};
  const i18n = setupI18n();

  // One instance per locale rather than one activated in turn, so pages render
  // in parallel without sharing which locale is currently switched on.
  i18n.load(locale, messages);
  i18n.activate(locale);

  return {
    /**
     * Templates pass the English source text. Catalogues are keyed by Lingui's hash
     * of it — which is what makes a plural serialise as gettext's `msgid_plural`
     * rather than an opaque id — so both sides derive the key the same way instead
     * of one of them assuming.
     *
     * An id no catalogue has stops the build: ids are source text, so Lingui's own
     * fallback would ship a mistyped `githubb` as itself.
     */
    _(message: string, values?: Record<string, unknown>) {
      const id = generateMessageId(message);
      if (!(id in messages)) {
        throw new Error(`No message \`${message}\`. If it is new, run \`task i18n:sync\`.`);
      }
      return i18n._(id, values);
    },
  };
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
      template.setInputPath(join(root, "src/templates", `${page.template}.html`));
      template.defineComponents(join(root, "src/templates/*.html"));
      // A helper is unscoped, so it reaches nested components; page data does not.
      template.setHelper("i18n", i18n);
      template.setHelper("asset", assets.href);

      const { html } = await template.compile({
        data: strict({
          locale,
          dir: isRtl(locale) ? "rtl" : "ltr",
          cv,
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

const publishedAssets = await assets.publish(dist);

/*
 * Drop everything from earlier builds. dist/ is written entirely by this script, so
 * anything in it that is not a page or a referenced asset is left over — a removed
 * locale's directory, or the previous hash of a file that has since changed, both
 * of which would otherwise carry on being served.
 */
const current = new Set([...written, ...publishedAssets]);
const stale: string[] = [];
for await (const entry of glob("**/*", { cwd: dist, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = join(entry.parentPath, entry.name);
  if (!current.has(file)) stale.push(file);
}
await Promise.all(stale.map((file) => rm(file)));

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
 * Every absolute reference a page makes, resolved against what was actually
 * written. A link that misses is a routing bug and an `src` that misses is an asset
 * written by hand instead of through `asset()`; both would ship as a 404 nobody
 * clicks. Pages are directory indexes, so a link resolves to that directory's
 * index.html while an asset resolves to the file itself.
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
      for (const { name, value } of child.attrs ?? []) {
        if ((name !== "href" && name !== "src") || !value.startsWith("/")) continue;

        const [withoutQuery] = value.split("?");
        const path = withoutQuery?.split("#")[0] ?? "";
        const target = join(dist, path);

        if (!current.has(target) && !current.has(join(target, "index.html"))) {
          broken.push(`${relative(dist, file)} -> ${value}`);
        }
      }
      walkLinks(child);
    }
  };
  walkLinks(parse(html));
}

if (broken.length) {
  throw new Error(`References with nothing behind them:\n  ${[...new Set(broken)].join("\n  ")}`);
}

console.log(
  `Checked links and assets across ${written.length} pages; published ${publishedAssets.size} assets`,
);
console.log(`Generated ${locales.length * pages.length} pages in ${dist}`);
