/**
 * Teaches `lingui extract` to read the templates.
 *
 * A template is valid HTML and every dynamic value in it is a JavaScript
 * expression in an attribute, so this collects those expressions and hands them
 * to Lingui's own Babel extractor. Nothing here knows what a message looks like:
 * `i18n._()`, plurals, explicit ids and comments are all Lingui's to recognise,
 * and stay recognised when Lingui's rules change.
 *
 * Expressions go out one per line so a message's origin maps back to the line it
 * was written on. Multi-line expressions are tracked rather than joined, because
 * a reference that points at the wrong line is worse than no reference.
 */
import { extractFromFileWithBabel } from "@lingui/cli/api";
import type { ExtractorType } from "@lingui/conf";
import { generateMessageId } from "@lingui/message-utils/generateMessageId";
import { type DefaultTreeAdapterMap, parse } from "parse5";

/** Attributes WebC evaluates as JavaScript, beyond the `:` prefix it uses for bindings. */
const EVALUATED = new Set(["@text", "@html", "@raw", "webc:if", "webc:elseif"]);

/*
 * `webc:for` is deliberately absent: `item of items` is a loop header rather than
 * an expression, and a message in one would have nowhere to be rendered.
 */
const isEvaluated = (name: string) => name.startsWith(":") || EVALUATED.has(name);

export const webcExtractor: ExtractorType = {
  match: (filename) => filename.endsWith(".html"),

  async extract(filename, code, onMessageExtracted, ctx) {
    const script: string[] = [];
    // Synthetic line (0-based) to the template line it came from.
    const origins: number[] = [];

    const collect = (node: DefaultTreeAdapterMap["parentNode"]) => {
      for (const child of node.childNodes ?? []) {
        if (!("tagName" in child)) continue;

        for (const { name, value } of child.attrs) {
          if (!isEvaluated(name)) continue;

          // Parenthesised so an object literal is an expression, not a block.
          const lines = `(${value});`.split("\n");
          const at = child.sourceCodeLocation?.attrs?.[name]?.startLine ?? 1;

          script.push(...lines);
          origins.push(...lines.map(() => at));
        }

        collect(child);
      }
    };

    collect(parse(code, { sourceCodeLocationInfo: true }));
    if (!script.length) return;

    await extractFromFileWithBabel(
      filename,
      script.join("\n"),
      (message) => {
        const [file, line, column] = message.origin ?? [filename, 1, 0];
        const origin: [string, number, number?] = [file, origins[line - 1] ?? 1, column];

        /*
         * `i18n._('text')` reads to Babel as an id with no message, which makes it an
         * explicit id — and gettext plurals are only written for generated ones, so a
         * plural would land as `msgid_plural "<the whole ICU string>_plural"`. In this
         * dialect the string is the source text, so it is re-stated as the message and
         * keyed by Lingui's hash of it, which is what `isGeneratedId` compares against.
         */
        if (message.message === undefined) {
          const text = message.id;
          onMessageExtracted({
            ...message,
            id: generateMessageId(text, message.context),
            message: text,
            origin,
          });
          return;
        }

        onMessageExtracted({ ...message, origin });
      },
      ctx,
      { plugins: [] },
    );
  },
};

export default webcExtractor;
