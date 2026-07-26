/**
 * Extracts `__('…')` calls into messages.pot, then propagates the ids to every
 * catalogue — new ones with an empty msgstr, ones no longer in the source
 * dropped. Rendering falls back to the id, so this exists to give translators a
 * visible list of what still needs doing rather than to make the site work.
 *
 * Also regenerates the MessageKey union, which is what makes a mistyped id a
 * type error in TypeScript. Templates aren't typechecked, so there it is the
 * fallback-to-English that keeps a typo from rendering blank.
 */
import { glob, readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

import { catalogPath, readCatalog } from "#/i18n/catalogs.ts";
import { locales, sourceLocale } from "#/i18n/config.ts";
import { format } from "#/i18n/po.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

/*
 * A regex rather than a parser, which only holds because a call has to be `__(`
 * followed by one plain string literal. Anything else — a variable, a template
 * literal, concatenation — is rejected below rather than skipped, so a string
 * that can't be extracted fails the build instead of silently never reaching a
 * translator.
 */
const CALL = /__\(\s*(['"])((?:[^\\]|\\.)*?)\1\s*\)/y;

const unquote = (raw: string, quote: string) =>
  JSON.parse(
    quote === '"' ? `"${raw}"` : `"${raw.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`,
  ) as string;

const messages = new Map<string, string[]>();

// Only templates: `__` is a view function, so it exists nowhere else by construction.
for await (const file of glob("src/templates/**/*.html", { cwd: root })) {
  const source = await readFile(new URL(file, new URL(root, "file:")), "utf8");

  for (let at = source.indexOf("__("); at !== -1; at = source.indexOf("__(", at + 1)) {
    // The definition and its own callers in this file are not call sites.
    if (/[.\w$]/.test(source[at - 1] ?? "")) continue;

    CALL.lastIndex = at;
    const match = CALL.exec(source);
    const line = source.slice(0, at).split("\n").length;
    const where = `${relative(root, file) || file}:${line}`;

    if (!match?.[1] || match[2] === undefined) {
      throw new Error(
        `${where}: __() takes one plain string literal, so this call can't be extracted.\n` +
          `  ${source.slice(at, source.indexOf(")", at) + 1)}`,
      );
    }

    const id = unquote(match[2], match[1]);
    messages.set(id, [...(messages.get(id) ?? []), where]);
  }
}

const ids = [...messages.keys()];
if (!ids.length) throw new Error("No __() calls found — that is almost certainly a bug here.");

const references = Object.fromEntries(messages);

await writeFile(
  new URL("../src/locales/messages.pot", import.meta.url),
  format("", Object.fromEntries(ids.map((id) => [id, ""])), references),
);

await writeFile(
  new URL("../src/i18n/keys.ts", import.meta.url),
  `// Generated from the __() calls by \`task i18n:sync\`. Do not edit.\n` +
    `export type MessageKey =\n${ids.map((id) => `  | ${JSON.stringify(id)}`).join("\n")};\n`,
);

const untranslated = await Promise.all(
  locales.map(async (locale) => {
    const existing = await readCatalog(locale);
    const merged = Object.fromEntries(
      ids.map((id) => [id, locale === sourceLocale ? id : (existing[id] ?? "")]),
    );

    await writeFile(catalogPath(locale), format(locale, merged));

    return [locale, Object.values(merged).filter((value) => !value).length] as const;
  }),
);

console.log(`${ids.length} messages across ${locales.length} locales`);
for (const [locale, missing] of untranslated) {
  if (missing) console.log(`  ${locale}: ${missing} untranslated`);
}
