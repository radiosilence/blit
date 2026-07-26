/**
 * Extracts `__('…')` from the templates into messages.pot, then merges the ids
 * into every catalogue. Rendering falls back to the id, so this exists to give
 * translators a list of what still needs doing rather than to make the site work.
 *
 * Nothing here pattern-matches source. Eta parses the template into tokens and
 * hands over the JavaScript inside each tag; gettext-extractor runs TypeScript's
 * parser over that to find the calls; gettext-parser reads and writes the PO.
 * The templates are the source of truth for which strings exist — en-GB is an
 * output of this script, not an input to it.
 */
import { glob, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Eta } from "eta";
import { GettextExtractor, JsExtractors } from "gettext-extractor";
import { po } from "gettext-parser";

import { catalogPath } from "#/i18n/catalogs.ts";
import { locales, sourceLocale } from "#/i18n/config.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const eta = new Eta({ debug: true }); // debug carries lineNo on every token
const extractor = new GettextExtractor();
const parser = extractor.createJsParser([
  JsExtractors.callExpression("__", { arguments: { text: 0 } }),
]);

for await (const file of glob("src/templates/**/*.html", { cwd: root })) {
  const tokens = eta.parse(await readFile(new URL(file, new URL(root, "file:")), "utf8"));

  /*
   * Reassemble the embedded JavaScript with each expression on the line it came
   * from, so the positions TypeScript reports are the template's own and the
   * `#:` references point at something a translator can open.
   */
  const lines: string[] = [];
  for (const token of tokens) {
    if (typeof token === "string") continue;
    const at = (token as { lineNo?: number }).lineNo ?? 1;
    while (lines.length < at) lines.push("");
    lines[at - 1] = `${lines[at - 1] ?? ""}${token.val};`;
  }

  parser.parseString(lines.join("\n"), file);
}

// getMessages types text as nullable for the plural-only case, which can't arise here.
const messages = extractor
  .getMessages()
  .filter((message): message is typeof message & { text: string } => Boolean(message.text));

if (!messages.length) throw new Error("No __() calls found — that is almost certainly a bug here.");

const header = (locale: string) => ({
  Language: locale,
  "MIME-Version": "1.0",
  "Content-Type": "text/plain; charset=utf-8",
  "Content-Transfer-Encoding": "8bit",
});

const compile = (
  locale: string,
  translate: (id: string) => string,
  existing: Record<string, { comments?: object }> = {},
) =>
  po.compile({
    charset: "utf-8",
    headers: header(locale),
    translations: {
      "": Object.fromEntries(
        messages.map((message) => [
          message.text,
          {
            // Spread both levels: a translator's flags and notes are theirs, and
            // only the references are ours to rewrite.
            ...existing[message.text],
            msgid: message.text,
            msgstr: [translate(message.text)],
            comments: {
              ...existing[message.text]?.comments,
              reference: message.references.join("\n"),
            },
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
  `// Generated from the __() calls by \`task i18n:sync\`. Do not edit.\n` +
    `export type MessageKey =\n` +
    `${messages.map((m) => `  | ${JSON.stringify(m.text)}`).join("\n")};\n`,
);

const untranslated = await Promise.all(
  locales.map(async (locale) => {
    const existing = (po.parse(await readFile(catalogPath(locale))).translations[""] ??
      {}) as Record<string, { comments?: object; msgstr?: string[] }>;
    const previous = (id: string) => existing[id]?.msgstr?.[0] ?? "";

    // The source locale is the ids themselves, so it is written rather than kept.
    const translate = locale === sourceLocale ? (id: string) => id : previous;
    await writeFile(catalogPath(locale), compile(locale, translate, existing));

    return [locale, messages.filter((m) => !translate(m.text)).length] as const;
  }),
);

console.log(`${messages.length} messages across ${locales.length} locales`);
for (const [locale, missing] of untranslated) {
  if (missing) console.log(`  ${locale}: ${missing} untranslated`);
}
