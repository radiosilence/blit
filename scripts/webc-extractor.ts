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
        onMessageExtracted({ ...message, origin: [file, origins[line - 1] ?? 1, column] });
      },
      ctx,
      { plugins: [] },
    );
  },
};

export default webcExtractor;
