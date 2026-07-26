import { Eta } from "eta";
import { fileURLToPath } from "node:url";

/*
 * Eta embeds real JS expressions, so instead of parsing templates we hand them a
 * view that refuses to answer for keys it doesn't have. Generation time is the
 * only runtime here, so a typo stops the build rather than rendering "undefined".
 */

const eta = new Eta({
  views: fileURLToPath(new URL("../src/templates", import.meta.url)),
  defaultExtension: ".html",
  autoEscape: true,
  /*
   * Templates read `locale` and `__('…')` rather than `it.locale`. An identifier
   * the view doesn't have falls through to module scope and dies as a plain
   * ReferenceError instead of the Proxy's message — still a failed build, just a
   * blunter one. Anything nested still reports the full path.
   */
  useWith: true,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

class MissingKeyError extends Error {
  constructor(path: string, available: string[]) {
    super(
      `Template asked for \`${path}\`, which does not exist.\n` +
        `  Available here: ${available.join(", ") || "(nothing)"}`,
    );
    this.name = "MissingKeyError";
  }
}

function strict<T>(value: T, path: string): T {
  if (!isRecord(value)) return value;

  return new Proxy(value, {
    get(target, key, receiver) {
      // Symbols and inherited members are engine plumbing (iteration, array methods).
      if (typeof key === "symbol" || key in target) {
        return strict(Reflect.get(target, key, receiver), `${path}.${String(key)}`);
      }
      throw new MissingKeyError(`${path}.${key}`, Object.keys(target));
    },
  }) as T;
}

/*
 * Eta reaches a layout by spreading the view into a fresh object to add `body`,
 * and spreading a Proxy yields a plain one. Both `layout()` and `include()` route
 * through this.render, so re-wrapping here is what keeps a mistyped key throwing
 * across the boundary instead of rendering "undefined".
 */
const inner = eta.render.bind(eta);
eta.render = ((template, view, meta) =>
  inner(template, strict(view, "it"), meta)) as typeof eta.render;

export function render(template: string, view: Record<string, unknown>) {
  return eta.render(template, view);
}
