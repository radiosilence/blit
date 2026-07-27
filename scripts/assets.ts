/**
 * Every published asset carries its content hash in its filename, so a URL only
 * ever maps to one set of bytes.
 *
 * nano-web decides caching from the MIME type alone — CSS, images and fonts are all
 * served `max-age=31536000, immutable` — so a stable URL is a promise the build
 * cannot keep: replace a file and a returning visitor holds the old bytes for a
 * year. A hashed name makes the promise true rather than giving up the caching.
 *
 * Publishing what was referenced, rather than copying the directory, means a file
 * nothing points at stops shipping and a name nothing provides fails the build.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

/*
 * These URLs are a convention rather than ours to choose: a browser asks for
 * /favicon.ico when a page links no icon, and a crawler asks for /robots.txt.
 * Nothing links them, so they publish unhashed and unconditionally.
 *
 * This is where nano-web's MIME-based caching bites — /favicon.ico is an image and
 * so served immutable for a year, while needing a fixed path. Replacing it means
 * waiting the cache out.
 */
const FIXED = new Set(["favicon.ico", "robots.txt"]);

const digest = (body: Buffer) => createHash("sha256").update(body).digest("hex").slice(0, 8);

/** `logo.png` becomes `logo.a1b2c3d4.png`; a name with no extension gets one appended. */
function fingerprint(name: string, body: Buffer) {
  const dot = name.lastIndexOf(".");
  const hash = digest(body);
  return dot === -1 ? `${name}.${hash}` : `${name.slice(0, dot)}.${hash}${name.slice(dot)}`;
}

export async function loadAssets(dir: string) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const bodies: Map<string, Buffer> = new Map(
    await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const path = join(entry.parentPath, entry.name);
          return [relative(dir, path), await readFile(path)] as const;
        }),
    ),
  );

  const used = new Set(FIXED);
  const nameOf = (name: string, body: Buffer) => (FIXED.has(name) ? name : fingerprint(name, body));

  /**
   * Supplies or replaces an asset's bytes before anything asks for its URL. The
   * stylesheet and the manifest are built rather than copied, because both name
   * other assets and so have to be rewritten before they can be hashed themselves.
   */
  const derive = (name: string, body: Buffer) => {
    bodies.set(name, body);
  };

  /** The URL for an asset, recording that something wanted it. */
  const href = (name: string) => {
    const body = bodies.get(name);
    if (!body) {
      const available = [...bodies.keys()].toSorted().join(", ");
      throw new Error(`No asset \`${name}\`. Available: ${available}`);
    }

    used.add(name);
    return `/${nameOf(name, body)}`;
  };

  /** Writes what was referenced, and returns it so a dead link differs from a dead file. */
  const publish = async (dist: string) => {
    const written = await Promise.all(
      [...used].map(async (name) => {
        const body = bodies.get(name);
        if (!body) throw new Error(`Referenced but not present: ${name}`);

        const file = join(dist, nameOf(name, body));
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, body);
        return file;
      }),
    );

    return new Set(written);
  };

  return { href, derive, publish };
}
