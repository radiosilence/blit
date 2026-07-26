/**
 * A template is valid HTML, so an HTML parser reads it. Components are custom
 * elements resolved to a file of the same name, children arrive through `<slot>`,
 * and every dynamic value is an element or an attribute — there is nothing to
 * scan for, and no regular expression anywhere in this file.
 *
 *   <page-base>…</page-base>        a component; children land in its <slot>
 *   :href="urls.cv"                 bind an attribute to a path
 *   :class="option.linkClass"       append to the static class already there
 *   autofocus?="option.current"     emit a bare attribute when truthy
 *   <x-text of="locale" />          a path as text
 *   <x-raw of="cv" />               a path as markup, already HTML
 *   <x-each of="items" as="item">   repeat the children
 *   <i18n-t>source text</i18n-t>    translate; the id is the text itself
 *   <title i18n>…</title>           translate an element's text in place
 *   i18n-content="source text"      translate into an attribute
 *
 * A value is a dotted path and nothing else. That is what lets scripts/i18n.ts
 * read a template statically rather than executing it, and a wrong path fail the
 * build naming what the view does have.
 *
 * Output is spliced into the original source by offset rather than serialised
 * from the tree: serialising uppercases `<!doctype html>`, drops self-closing
 * slashes and reflows whitespace.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import escapeHtml from "escape-html";
import { type DefaultTreeAdapterMap, parse, parseFragment } from "parse5";

type Node = DefaultTreeAdapterMap["childNode"];
type Element = DefaultTreeAdapterMap["element"];
type View = Record<string, unknown>;
type Edit = { start: number; end: number; text: string };

const dir = fileURLToPath(new URL("../src/templates/", import.meta.url));
const I18N = "i18n-";

class TemplateError extends Error {
  constructor(where: string, message: string) {
    super(`${where}: ${message}`);
    this.name = "TemplateError";
  }
}

/** Resolves `a.b.c`. A path the view lacks is a build failure, not an empty string. */
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
const attrOf = (node: Element, name: string) => node.attrs.find((a) => a.name === name)?.value;
const isDocument = (source: string) => source.trimStart().toLowerCase().startsWith("<!doctype");

export function render(name: string, view: View): string {
  return expand(readFileSync(`${dir}${name}.html`, "utf8"), view, `${name}.html`);
}

function expand(source: string, view: View, where: string): string {
  const edits: Edit[] = [];

  const translate = (id: string) => {
    const fn = view["__"];
    if (typeof fn !== "function") throw new TemplateError(where, "no `__` in the view");
    return String((fn as (id: string) => string)(id));
  };

  /** The source between a node's tags — what gets re-expanded, or replaced wholesale. */
  const inner = (node: Element) => {
    const at = node.sourceCodeLocation;
    return at?.startTag && at.endTag
      ? source.slice(at.startTag.endOffset, at.endTag.startOffset)
      : "";
  };

  const replace = (node: Element, text: string) => {
    const at = node.sourceCodeLocation;
    if (at) edits.push({ start: at.startOffset, end: at.endOffset, text });
  };

  const text = (of: string | undefined, tag: string, escape: boolean) => {
    if (!of) throw new TemplateError(where, `<${tag}> needs \`of\``);
    const value = String(resolve(of, view, where));
    return escape ? escapeHtml(value) : value;
  };

  function walk(node: Node) {
    if (!isElement(node)) return;
    const at = node.sourceCodeLocation;
    if (!at) return;

    switch (node.tagName) {
      // Already expanded against the caller's view; re-expanding would use this one.
      case "slot":
        return replace(node, String(view["slot"] ?? ""));
      case "i18n-t":
        return replace(node, escapeHtml(translate(inner(node).trim())));
      case "x-text":
        return replace(node, text(attrOf(node, "of"), "x-text", true));
      case "x-raw":
        return replace(node, text(attrOf(node, "of"), "x-raw", false));
      case "x-each": {
        const of = attrOf(node, "of");
        const as = attrOf(node, "as");
        if (!of || !as) throw new TemplateError(where, "<x-each> needs `of` and `as`");
        const items = resolve(of, view, where);
        if (!Array.isArray(items)) throw new TemplateError(where, `\`${of}\` is not an array`);
        const body = inner(node);
        return replace(node, items.map((i) => expand(body, { ...view, [as]: i }, where)).join(""));
      }
    }

    // A hyphenated element is a component; its children fill the component's slot.
    if (node.tagName.includes("-")) {
      const props: View = { ...view, slot: expand(inner(node), view, where).trim() };
      for (const { name, value } of node.attrs) props[name] = value;
      return replace(node, render(node.tagName, props));
    }

    // `<title i18n>` exists because an element cannot appear inside RAWTEXT.
    if (attrOf(node, "i18n") !== undefined && at.startTag && at.endTag) {
      edits.push({
        start: at.startTag.endOffset,
        end: at.endTag.startOffset,
        text: escapeHtml(translate(inner(node).trim())),
      });
    }

    const staticClass = attrOf(node, "class");

    for (const { name, value } of node.attrs) {
      const location = at.attrs?.[name.toLowerCase()];
      if (!location) continue;
      const edit = (replacement: string) =>
        edits.push({ start: location.startOffset, end: location.endOffset, text: replacement });

      // The marker is dropped along with the space that separated it from the tag.
      if (name === "i18n") {
        let start = location.startOffset;
        while (start > 0 && " \t\n\r".includes(source[start - 1] ?? "")) start--;
        edits.push({ start, end: location.endOffset, text: "" });
        continue;
      }

      // `i18n-content="…"` exists because an element cannot appear in an attribute.
      if (name.startsWith(I18N)) {
        edit(`${name.slice(I18N.length)}="${escapeHtml(translate(value))}"`);
        continue;
      }

      // `autofocus?="path"` — for a boolean attribute, presence is the value.
      if (name.endsWith("?")) {
        edit(resolve(value, view, where) ? name.slice(0, -1) : "");
        continue;
      }

      if (!name.startsWith(":")) continue;
      const bound = escapeHtml(String(resolve(value, view, where)));
      const bare = name.slice(1);

      /*
       * `:class` merges into the static class rather than replacing it, so the
       * literal utilities stay written in the template — which is the only place
       * Tailwind looks for them.
       */
      const classLocation = bare === "class" && staticClass ? at.attrs?.["class"] : undefined;
      if (!classLocation) {
        edit(`${bare}="${bound}"`);
        continue;
      }

      edit("");
      edits.push({
        start: classLocation.startOffset,
        end: classLocation.endOffset,
        text: `class="${staticClass} ${bound}"`,
      });
    }

    for (const child of node.childNodes ?? []) walk(child);
  }

  // A document keeps <html> and <head>; a fragment would restructure them away.
  const root = isDocument(source)
    ? parse(source, { sourceCodeLocationInfo: true })
    : parseFragment(source, { sourceCodeLocationInfo: true });

  for (const child of root.childNodes) walk(child);

  // Descending, so earlier offsets stay valid as later text is replaced.
  let out = source;
  for (const edit of edits.toSorted((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }

  return out;
}
