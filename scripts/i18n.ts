/**
 * Extracts translatable text from the templates into messages.pot, then merges
 * the ids into every catalogue.
 *
 * Templates are valid HTML, so this is a tree walk rather than a bridge into a
 * JavaScript parser: parse5 for structure, gettext-parser for the PO files. The
 * templates are the source of truth for which strings exist — en-GB is an output
 * of this script, not an input to it.
 */
import { glob, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { po } from "gettext-parser";
import { type DefaultTreeAdapterMap, parse } from "parse5";

import { catalogPath } from "#/i18n/catalogs.ts";
import { locales, sourceLocale } from "#/i18n/config.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const messages = new Map<string, string[]>();

const text = (node: DefaultTreeAdapterMap["element"]) =>
  (node.childNodes ?? [])
    .map((child) => (child.nodeName === "#text" ? (child as { value: string }).value : ""))
    .join("")
    .trim();

const add = (id: string, where: string) => messages.set(id, [...(messages.get(id) ?? []), where]);

for await (const file of glob("src/templates/**/*.html", { cwd: root })) {
  const source = await readFile(new URL(file, new URL(root, "file:")), "utf8");
  (function walk(node: DefaultTreeAdapterMap["parentNode"]) {
    for (const child of node.childNodes ?? []) {
      if (!("tagName" in child)) continue;
      const at = `${file}:${child.sourceCodeLocation?.startLine ?? 1}`;

      // <i18n-t>text</i18n-t> and <title i18n>text</title>
      if (child.tagName === "i18n-t" || child.attrs.some((a) => a.name === "i18n"))
        add(text(child), at);

      // <meta i18n-content="text"> — an element can't live in an attribute value.
      for (const { name, value } of child.attrs) {
        if (name.startsWith("i18n-")) add(value, at);
      }

      walk(child);
    }
  })(parse(source, { sourceCodeLocationInfo: true }));
}

const ids = [...messages.keys()].toSorted();
if (!ids.length)
  throw new Error("No translatable text found — that is almost certainly a bug here.");

const compile = (
  locale: string,
  translate: (id: string) => string,
  existing: Record<string, { comments?: object }> = {},
) =>
  po.compile({
    charset: "utf-8",
    headers: {
      Language: locale,
      "MIME-Version": "1.0",
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Transfer-Encoding": "8bit",
    },
    translations: {
      "": Object.fromEntries(
        ids.map((id) => [
          id,
          {
            // Spread both levels: only the references are ours to rewrite, and a
            // translator's flags and notes survive.
            ...existing[id],
            msgid: id,
            msgstr: [translate(id)],
            comments: { ...existing[id]?.comments, reference: (messages.get(id) ?? []).join("\n") },
          },
        ]),
      ),
    },
  });

await writeFile(
  new URL("../src/locales/messages.pot", import.meta.url),
  compile("", () => ""),
);

await writeFile(
  new URL("../src/i18n/keys.ts", import.meta.url),
  `// Generated from the templates by \`task i18n:sync\`. Do not edit.\n` +
    `export type MessageKey =\n${ids.map((id) => `  | ${JSON.stringify(id)}`).join("\n")};\n`,
);

const untranslated = await Promise.all(
  locales.map(async (locale) => {
    const existing = (po.parse(await readFile(catalogPath(locale))).translations[""] ??
      {}) as Record<string, { comments?: object; msgstr?: string[] }>;

    // The source locale is the ids themselves, so it is written rather than kept.
    const translate =
      locale === sourceLocale
        ? (id: string) => id
        : (id: string) => existing[id]?.msgstr?.[0] ?? "";

    await writeFile(catalogPath(locale), compile(locale, translate, existing));
    return [locale, ids.filter((id) => !translate(id)).length] as const;
  }),
);

console.log(`${ids.length} messages across ${locales.length} locales`);
for (const [locale, missing] of untranslated) {
  if (missing) console.log(`  ${locale}: ${missing} untranslated`);
}
