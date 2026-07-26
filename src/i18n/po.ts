/**
 * Minimal gettext PO reader/writer.
 *
 * Catalogues here are flat key/value pairs, so plurals, contexts and fuzzy
 * flags are deliberately unsupported — add them the day a catalogue needs one.
 * PO string escaping matches JSON's, which is why both directions delegate to it.
 */

const decode = (line: string) => JSON.parse(line.slice(line.indexOf('"'))) as string;

export function parse(source: string) {
  const messages: Record<string, string> = {};
  let id = "";
  let value = "";
  let field: "id" | "value" | undefined;

  // The header is a msgid "" entry, so a blank id means "nothing to commit".
  const commit = () => {
    if (id) messages[id] = value;
    id = value = "";
    field = undefined;
  };

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("msgid ")) {
      commit();
      field = "id";
      id = decode(line);
    } else if (line.startsWith("msgstr ")) {
      field = "value";
      value = decode(line);
    } else if (line.startsWith('"')) {
      if (field === "id") id += decode(line);
      if (field === "value") value += decode(line);
    }
  }
  commit();

  return messages;
}

export function format(
  locale: string,
  messages: Record<string, string>,
  references: Record<string, string[]> = {},
) {
  const header = [
    'msgid ""',
    'msgstr ""',
    `"Language: ${locale}\\n"`,
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=utf-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
  ].join("\n");

  const entries = Object.entries(messages).map(([id, value]) =>
    [
      ...(references[id] ?? []).map((where) => `#: ${where}`),
      `msgid ${JSON.stringify(id)}`,
      `msgstr ${JSON.stringify(value)}`,
    ].join("\n"),
  );

  return `${[header, ...entries].join("\n\n")}\n`;
}
