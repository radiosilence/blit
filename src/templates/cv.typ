// How /cv.pdf looks: the CV page, set for paper. The generator turns
// src/content/cv.md into Typst markup and shows it through `cv`; the markup calls
// `masthead` for the name, title and contact lines, and `small` and `dates` for
// the HTML it carries. The voice is the site's: Geist Mono, lowercase thin
// headings, brand red, the logo.
//
// Decoration is drawn rather than written, because an applicant tracking system
// reads this before a person does. The band, the rules and the second-page logo
// are shapes and images, so the extracted text is one column in reading order,
// with no header or footer text to land in the middle of it.

#let mono = "Geist Mono"
#let brand = rgb("#e65e5e")
#let ink = rgb("#2b2b2b")
#let mid = rgb("#666666")
#let faint = rgb("#9a9a9a")
#let hair = rgb("#e4e4e4")

#let small(body) = text(size: 0.92em, fill: mid, body)

// On the role's own line, at the right margin: where the eye and a parser both
// look for it.
#let dates(body) = {
  h(1fr)
  text(size: 7.5pt, weight: "regular", fill: faint, tracking: 0.03em, body)
}

// The logo is as tall as the text beside it, from the top of the name to the
// last contact line, whatever the Markdown puts there. Its width depends on that
// height and the text's wrapping on its width, so the height is measured twice.
#let masthead(name, title, contact) = block(below: 10mm, layout(size => {
  let gutter = 8mm
  let lines(width) = block(width: width, {
    name
    v(2.6mm)
    text(size: 10pt, fill: brand, title)
    v(3mm)
    text(size: 7.8pt, fill: mid, contact)
  })
  let height = measure(lines(size.width - 40mm)).height
  let height = measure(lines(size.width - height - gutter)).height

  grid(
    columns: (height, 1fr),
    column-gutter: gutter,
    image("logo.png", height: height, alt: "blit.cc logo"),
    lines(100%),
  )
}))

#let cv(name: none, body) = {
  set document(title: name + " – CV", author: name, date: none)
  set text(
    font: mono,
    size: 8.6pt,
    fill: ink,
    lang: "en",
    region: "gb",
    hyphenate: false,
  )
  set par(leading: 0.8em, spacing: 1.25em, justify: false)

  set page(
    paper: "a4",
    margin: (x: 22mm, top: 22mm, bottom: 20mm),
    // A band of the brand along the top edge of every page.
    background: place(top, rect(width: 100%, height: 2.4mm, fill: brand)),
    // The logo again from the second page, small, in the top corner.
    header: context if here().page() > 1 {
      align(right, image("logo.png", width: 6mm, alt: "blit.cc logo"))
    },
    header-ascent: 35%,
  )

  set strong(delta: 200)
  set list(
    marker: text(fill: brand, [•]),
    indent: 0pt,
    body-indent: 0.9em,
    spacing: 1em,
  )

  // Geist Mono has no star, and "240+ stars" is what a parser can read anyway.
  show "★": [ stars]

  show link: set text(fill: brand)
  show link: underline.with(stroke: 0.45pt + brand.lighten(35%), offset: 1.8pt)
  show strong: set text(fill: rgb("#1a1a1a"))
  show emph: set text(fill: mid)
  show raw: set text(font: mono, size: 8.6pt)

  show heading: set text(weight: "regular")
  show heading.where(level: 1): it => block(
    text(size: 30pt, weight: "extralight", tracking: -0.02em, lower(it.body)),
  )

  // The title, then a hairline running out from it to the margin, starting in
  // brand red: one row, no space spent beside it.
  show heading.where(level: 2): it => block(
    above: 3em,
    below: 1.5em,
    sticky: true,
    width: 100%,
    grid(
      columns: (auto, 1fr),
      column-gutter: 4mm,
      align: horizon,
      text(size: 15pt, weight: "thin", tracking: -0.01em, lower(it.body)),
      box(width: 100%, {
        line(length: 100%, stroke: 0.5pt + hair)
        place(top + left, line(length: 12mm, stroke: 1pt + brand))
      }),
    ),
  )

  show heading.where(level: 3): it => block(
    above: 2.3em,
    below: 1em,
    sticky: true,
    width: 100%,
    text(size: 9pt, weight: "semibold", it.body),
  )

  body
}
