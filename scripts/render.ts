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

export function render(template: string, view: Record<string, unknown>) {
  return eta.render(template, strict(view, "it"));
}
