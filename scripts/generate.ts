import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import MarkdownIt from "markdown-it";
import Mustache from "mustache";

import { loadCatalogs } from "#/i18n/catalogs.ts";
import { isRtl, locales } from "#/i18n/config.ts";
import { pages, url } from "#/i18n/routes.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

const read = (...path: string[]) => readFile(join(root, ...path), "utf8");

const markdown = MarkdownIt({ html: true });

// Mustache escapes `/` by default, which turns every href into `&#x2F;...`.
Mustache.escape = (value: string) =>
  String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const [catalogs, base, cv, templates] = await Promise.all([
  loadCatalogs(),
  read("src/templates/base.html"),
  read("src/content/cv.md").then((source) => markdown.render(source)),
  Promise.all(pages.map((page) => read("src/templates", page.template))),
]);

await Promise.all(
  locales.flatMap((locale) =>
    pages.map(async (page, index) => {
      const view = {
        locale,
        dir: isRtl(locale) ? "rtl" : "ltr",
        t: catalogs[locale],
        cv,
        path: url(locale, page.slug),
        urls: Object.fromEntries(pages.map(({ slug }) => [slug || "home", url(locale, slug)])),
        localeLinks: locales.map((code) => ({ code, href: url(code, page.slug) })),
      };

      const html = Mustache.render(base, view, { content: templates[index] ?? "" });

      const file = join(dist, view.path, "index.html");
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html);
    }),
  ),
);

console.log(`Generated ${locales.length * pages.length} pages in ${dist}`);
