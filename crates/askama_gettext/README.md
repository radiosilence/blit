# askama_gettext

gettext for [Askama](https://askama.rs) templates.

The English lives in the template. `__("Book now")` is both the thing rendered and
the `msgid` a translator sees — no key to invent, no indirection to follow, and a
string nobody has translated yet renders as English rather than as a blank or a name.

```jinja
{{ __("james cleveland") }}
{{ __p("Nav: language picker", "close") }}
{{ __n("%{count} locale", "%{count} locales", locales.len()) }}
{{ __("hello %{name}").with("name", user.name) }}
{{ __h("read my <cv>CV</cv>").link("cv", urls.cv)|safe }}
```

## Setup

Implement one method. Askama resolves a bare `__("…")` to a method on the template
struct, so the rest of the vocabulary comes with it:

```rust
use askama_gettext::{Catalogs, Translate, Translator};

impl Translate for Page<'_> {
    fn translator(&self) -> Translator<'_> {
        Translator::new(self.catalogs, self.locale)
    }
}
```

## The functions

| Template | gettext | For |
|---|---|---|
| `__("…")` | `gettext` | A sentence whose meaning is plain from the English |
| `__p("context", "…")` | `pgettext` | Short or ambiguous text — "Cancel" alone cannot be translated reliably |
| `__n("…", "…", n)` | `ngettext` | Anything countable |
| `__np("context", "…", "…", n)` | `npgettext` | Countable, needing context |
| `__h`, `__ph`, `__nh`, `__nph` | — | The same, where the English carries markup |

`%{name}` placeholders are filled with `.with("name", value)`, and a count is bound
to `%{count}` for you. Names rather than positions, so a translator can reorder a
sentence and the values follow.

## Markup

The tags inside a message are names, not HTML — code decides what each becomes:

```rust
__h("read my <cv>CV</cv>").link("cv", "/fr-FR/cv")
// read my <a href="/fr-FR/cv">CV</a>
```

A translator can move `<cv>…</cv>` to wherever the sentence needs it, rename the
text, or drop it. They cannot choose where it points, and they cannot introduce an
element nobody registered: everything unrecognised is escaped, including markup
typed into a catalogue by hand.

## Extraction

`extract` reads those calls back out with **Askama's own parser**, so it recognises
no template syntax of its own and cannot drift from what Askama accepts. `merge`
writes them into `.po` files, keeping translations, translator comments, flags and
header metadata — the templates are authoritative only about which messages exist
and where they are written.

```rust
let messages = extract::from_file(&path, &Syntax::default())?;
let summary = merge::into_catalog(&catalogue, "fr-FR", &messages)?;
```

A message that leaves the templates is flagged fuzzy rather than deleted, so its
translation is still there if the string comes back.

## Plurals

Which `msgstr[n]` a count selects comes from CLDR via `icu_plurals`, not from
evaluating the catalogue's `Plural-Forms` expression. CLDR is kept current in a way
a header copied between projects is not, and nothing here has to implement a C
expression parser.

The header is still checked. It decides how many forms a translator is offered;
CLDR decides which one a count picks. When they disagree, loading fails rather than
writing to a slot nobody will translate:

```
ar-EG: catalogue declares nplurals=2, CLDR gives 6 ([Zero, One, Two, Few, Many, Other])
```

Two things worth knowing:

- Categories are ordered as CLDR and gettext number them — zero, one, two, few,
  many, other. `PluralCategory::all()` yields *alphabetically*, which would file
  Arabic's `zero` under `msgstr[5]`.
- Only categories a whole number can reach are counted. CLDR gives Polish four, but
  an integer is only ever one, few or many, and gettext's three slots are those.

## Licence

MIT OR Apache-2.0
