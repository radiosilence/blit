// How /cv.pdf looks. The generator turns src/content/cv.md into Typst markup and
// shows it through `cv`; the markup calls `small` and `dates` for the HTML it carries.
//
// Kept plain on purpose, because an applicant tracking system reads this before a
// person does: one column, no tables or text boxes, no header or footer (a page
// number is noise in the middle of extracted text), headings that read as the words
// they are rather than as small caps, and bullets an extractor recognises.

#let sans = "Geist"
#let mono = "Geist Mono"
#let ink = luma(8%)
#let muted = luma(38%)
#let rule = luma(80%)

#let small(body) = text(size: 0.9em, fill: muted, body)

// Right-aligned, on the role's own line.
#let dates(body) = {
  h(1fr)
  text(font: mono, size: 8pt, weight: "regular", fill: muted, body)
}

#let cv(name: none, body) = {
  set document(title: name + " – CV", author: name, date: none)
  set text(font: sans, size: 9.5pt, fill: ink, lang: "en", region: "gb")
  set par(leading: 0.62em, spacing: 0.95em, justify: false)

  set page(paper: "a4", margin: (x: 18mm, y: 16mm))

  set strong(delta: 200)
  set list(
    marker: ([•], [◦]),
    indent: 0.15em,
    body-indent: 0.65em,
    spacing: 0.6em,
  )

  // Geist has no star, and "240+ stars" is what a parser can read anyway.
  show "★": [ stars]

  show link: it => underline(stroke: 0.4pt + rule, offset: 2pt, it)
  show raw: set text(font: mono, size: 8.5pt)

  show heading: set text(font: mono, weight: "medium")
  show heading.where(level: 1): it => block(below: 0.5em, text(size: 20pt, it.body))
  show heading.where(level: 2): it => block(
    above: 1.7em,
    below: 0.8em,
    sticky: true,
    width: 100%,
    inset: (bottom: 0.35em),
    stroke: (bottom: 0.6pt + rule),
    text(size: 10.5pt, it.body),
  )
  show heading.where(level: 3): it => block(
    above: 1.3em,
    below: 0.6em,
    sticky: true,
    width: 100%,
    text(font: sans, size: 10pt, weight: "semibold", it.body),
  )

  body
}
