// How /cv.pdf looks: the CV page, set for paper. The generator turns
// src/content/cv.md into Typst markup and shows it through `cv`; the markup calls
// `small` and `dates` for the HTML it carries. Colours, weights and the lowercase
// headings follow app.css, so the PDF reads as the same document as the page.
//
// Kept plain where it matters, because an applicant tracking system reads this
// before a person does: one column, no tables or text boxes, no header or footer
// (a page number is noise in the middle of extracted text), and bullets an
// extractor recognises.

#let mono = "Geist Mono"
#let brand = rgb("#e65e5e")
#let dark = rgb("#333333")
#let mid = rgb("#666666")

#let small(body) = text(size: 0.9em, fill: mid, body)

// The site puts the dates after the role; on paper they go to the right margin,
// still on the role's own line, which is where a parser looks for them.
#let dates(body) = {
  h(1fr)
  text(size: 7.5pt, weight: "regular", fill: mid, body)
}

#let cv(name: none, body) = {
  set document(title: name + " – CV", author: name, date: none)
  set text(font: mono, size: 8.5pt, fill: dark, lang: "en", region: "gb")
  set par(leading: 0.78em, spacing: 1.25em, justify: false)
  set page(paper: "a4", margin: (x: 16mm, y: 15mm))

  set strong(delta: 200)
  set list(
    marker: text(fill: mid, [•]),
    indent: 0.3em,
    body-indent: 0.8em,
    spacing: 0.95em,
  )

  // Geist Mono has no star, and "240+ stars" is what a parser can read anyway.
  show "★": [ stars]

  show link: set text(fill: brand)
  show link: underline.with(stroke: 0.5pt + brand, offset: 1.6pt)

  show heading: set text(weight: "regular")
  show heading.where(level: 1): it => block(
    below: 1.6em,
    text(size: 24pt, weight: "extralight", lower(it.body)),
  )
  show heading.where(level: 2): it => block(
    above: 2.4em,
    below: 1.3em,
    sticky: true,
    text(size: 15pt, weight: "thin", lower(it.body)),
  )
  show heading.where(level: 3): it => block(
    above: 2em,
    below: 1em,
    sticky: true,
    width: 100%,
    text(weight: "semibold", it.body),
  )

  image("logo.png", width: 17mm, alt: "blit.cc logo")
  v(4mm)
  body
}
