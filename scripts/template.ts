/**
 * A template is valid HTML. Components are custom elements resolved to a file of
 * the same name, children arrive through `<slot>`, and `{dotted.path}` reads the
 * view. Everything is expanded at build time, so the browser gets plain HTML.
 *
 * Expressions are paths and nothing else — no calls, no operators, no ternaries.
 * That is what lets `scripts/i18n.ts` and `checkPaths` below read a template
 * statically instead of executing it, and it keeps computation in generate.ts
 * where it can be typed.
 *
 * parse5 gives structure; the output is spliced from the original source rather
 * than serialised from the tree, because serialising rewrites `<!doctype html>`,
 * drops self-closing slashes and reflows whitespace.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { type DefaultTreeAdapterMap, parse, parseFragment } from "parse5";

type Node = DefaultTreeAdapterMap["childNode"];
type Element = DefaultTreeAdapterMap["element"];
type View = Record<string, unknown>;

const dir = fileURLToPath(new URL("../src/templates/", import.meta.url));
const PATH = /\{([\w.]+)\}/g;

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string,
  );

class TemplateError extends Error {
  constructor(where: string, message: string) {
    super(`${where}: ${message}`);
    this.name = "TemplateError";
  }
}

/** Resolves `a.b.c`, refusing anything the view doesn't have — a typo is a build failure. */
function resolve(path: string, view: View, where: string): unknown {
  let value: unknown = view;

  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object" || !(key in value)) {
      const available = Object.keys((value as object) ?? {}).join(", ");
      throw new TemplateError(
        where,
        `\`${path}\` — nothing at \`${key}\`. Available: ${available}`,
      );
    }
    value = (value as View)[key];
  }

  return value;
}

const isElement = (node: Node): node is Element => "tagName" in node;
const attr = (node: Element, name: string) => node.attrs.find((a) => a.name === name)?.value;

/** `{path}` inside text or an attribute value. */
const interpolate = (text: string, view: View, where: string) =>
  text.replace(PATH, (_, path: string) => escape(String(resolve(path, view, where))));

export function render(name: string, view: View): string {
  return expand(readFileSync(`${dir}${name}.html`, "utf8"), view, `${name}.html`);
}

function expand(source: string, view: View, where: string): string {
  const edits: { start: number; end: number; text: string }[] = [];
  const inner = (node: Element) => {
    const at = node.sourceCodeLocation;
    return at?.startTag && at.endTag
      ? source.slice(at.startTag.endOffset, at.endTag.startOffset)
      : "";
  };

  function walk(node: Node) {
    if (node.nodeName === "#text") {
      const at = node.sourceCodeLocation;
      const text = (node as { value: string }).value;
      if (at && PATH.test(text)) {
        edits.push({
          start: at.startOffset,
          end: at.endOffset,
          text: interpolate(text, view, where),
        });
      }
      return;
    }

    if (!isElement(node)) return;
    const at = node.sourceCodeLocation;
    if (!at) return;

    const tag = node.tagName;

    // `<i18n-t>text</i18n-t>` — the message id is the source text.
    if (tag === "i18n-t") {
      const translate = view["__"] as ((id: string) => string) | undefined;
      if (!translate) throw new TemplateError(where, "no `__` in the view for <i18n-t>");
      edits.push({
        start: at.startOffset,
        end: at.endOffset,
        text: escape(translate(inner(node).trim())),
      });
      return;
    }

    // `<x-raw of="cv" />` — markdown that is already HTML.
    if (tag === "x-raw") {
      const of = attr(node, "of");
      if (!of) throw new TemplateError(where, "<x-raw> needs `of`");
      edits.push({
        start: at.startOffset,
        end: at.endOffset,
        text: String(resolve(of, view, where)),
      });
      return;
    }

    // `<x-each of="localeLinks" as="option">`
    if (tag === "x-each") {
      const of = attr(node, "of");
      const as = attr(node, "as");
      if (!of || !as) throw new TemplateError(where, "<x-each> needs `of` and `as`");
      const items = resolve(of, view, where);
      if (!Array.isArray(items)) throw new TemplateError(where, `\`${of}\` is not an array`);
      const body = inner(node);
      edits.push({
        start: at.startOffset,
        end: at.endOffset,
        text: items.map((item) => expand(body, { ...view, [as]: item }, where)).join(""),
      });
      return;
    }

    // Any other hyphenated element is a component: <page-base>children</page-base>
    if (tag.includes("-")) {
      const props: View = { ...view };
      for (const { name, value } of node.attrs) props[name] = interpolate(value, view, where);
      props["slot"] = expand(inner(node), view, where).trim();
      edits.push({ start: at.startOffset, end: at.endOffset, text: render(tag, props) });
      return;
    }

    /*
     * `<title i18n>` and `<meta i18n-content="…">`. Both exist because an element
     * cannot appear in an attribute value, nor inside RAWTEXT like <title>, so
     * <i18n-t> has nowhere to go in either position.
     */
    const translate = view["__"] as ((id: string) => string) | undefined;

    if (attr(node, "i18n") !== undefined && at.startTag && at.endTag) {
      if (!translate) throw new TemplateError(where, "no `__` in the view for i18n");
      edits.push({
        start: at.startTag.endOffset,
        end: at.endTag.startOffset,
        text: escape(translate(inner(node).trim())),
      });
      const location = at.attrs?.["i18n"];
      if (location) {
        // Back over the separating whitespace, or the tag keeps a stray gap.
        let start = location.startOffset;
        while (start > 0 && /\s/.test(source[start - 1] ?? "")) start--;
        edits.push({ start, end: location.endOffset, text: "" });
      }
    }

    for (const { name, value } of node.attrs) {
      const location = at.attrs?.[name.toLowerCase()];
      if (!location) continue;

      if (name === "i18n") continue;

      if (name.startsWith("i18n-")) {
        if (!translate) throw new TemplateError(where, "no `__` in the view for i18n");
        edits.push({
          start: location.startOffset,
          end: location.endOffset,
          text: `${name.slice(5)}="${escape(translate(value))}"`,
        });
        continue;
      }

      // `autofocus?="option.current"` emits a bare `autofocus` when truthy.
      if (name.endsWith("?")) {
        const bare = name.slice(0, -1);
        edits.push({
          start: location.startOffset,
          end: location.endOffset,
          text: resolve(value, view, where) ? bare : "",
        });
        continue;
      }

      if (PATH.test(value)) {
        edits.push({
          start: location.startOffset,
          end: location.endOffset,
          text: `${name}="${interpolate(value, view, where)}"`,
        });
      }
    }

    for (const child of node.childNodes ?? []) walk(child);
  }

  // A document keeps <html>/<head>; a fragment would restructure them away.
  const root = /^\s*<!doctype/i.test(source)
    ? parse(source, { sourceCodeLocationInfo: true })
    : parseFragment(source, { sourceCodeLocationInfo: true });
  for (const child of root.childNodes) walk(child);

  // Descending, so earlier offsets stay valid as later text is replaced.
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }

  // `<slot>` is filled last: its content is already expanded and must not be rescanned.
  return out.replace(/<slot\s*\/?>(?:<\/slot>)?/g, () => String(view["slot"] ?? ""));
}
