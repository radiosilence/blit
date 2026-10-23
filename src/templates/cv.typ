// How /cv.pdf looks: the CV page, set for paper. The generator turns
// src/content/cv.md into Typst markup and shows it through `cv`; the markup calls
// `masthead` for the name, title and contact lines, and `small` and `dates` for
// the HTML it carries. The voice is the site's: Geist Mono, lowercase thin
// headings, brand red, the logo.
//
// The page is a body column with a wide margin beside it, and the margin holds
// what you scan for: the logo, the section titles and the dates. The body column
// is narrow enough for a comfortable line of monospace, about 77 characters.
//
// Everything in the margin is placed from the flow it belongs to, so the
// extracted text is still one column in reading order: a role's dates come out
// on its line. The band, the rules and the second-page logo are shapes and
// images, with no header or footer text to land in the middle of anything.

#let mono = "Geist Mono"
#let brand = rgb("#e65e5e")
#let ink = rgb("#2b2b2b")
#let mid = rgb("#666666")
#let faint = rgb("#9a9a9a")
#let hair = rgb("#e4e4e4")

// The margin column sits this far left of the body, and is this wide.
#let reach = 40mm
#let aside-width = 32mm

/// Sets `body` in the margin, `dy` below the top of the block it is called in.
#let aside(body, dy: 0pt) = place(
  top + left,
  dx: -reach,
  dy: dy,
  box(width: aside-width, body),
)

#let small(body) = text(size: 0.92em, fill: mid, body)

// Dates travel inside the role's heading as metadata; the heading's show rule
// takes them out and sets them in the margin beside it.
#let dates(body) = metadata((dates: body))

#let masthead(name, title, contact) = {
  aside(image("logo.png", width: 21mm, alt: "blit.cc logo"))
  block(below: 11mm, {
    name
    v(2.6mm)
    text(size: 10pt, fill: brand, title)
    v(3mm)
    text(size: 7.8pt, fill: mid, contact)
  })
}

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
    margin: (left: 18mm + reach, right: 18mm, top: 24mm, bottom: 22mm),
    // A band of the brand along the top edge of every page.
    background: place(top, rect(width: 100%, height: 2.4mm, fill: brand)),
    // The logo again from the second page, small, at the head of the margin.
    header: context if here().page() > 1 {
      move(dx: -reach, image("logo.png", width: 6mm, alt: "blit.cc logo"))
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

  // A row of its own: the title in the margin, and beside it a hairline across
  // the body that starts in brand red. Below it, the body column carries on.
  show heading.where(level: 2): it => block(
    above: 3.2em,
    below: 1.7em,
    sticky: true,
    width: 100%,
    move(dx: -reach, box(width: 100% + reach, grid(
      columns: (reach, 1fr),
      align: horizon,
      text(size: 11pt, weight: "thin", fill: ink, lower(it.body)),
      box(width: 100%, {
        line(length: 100%, stroke: 0.5pt + hair)
        place(top + left, line(length: 12mm, stroke: 1pt + brand))
      }),
    ))),
  )

  // The role in the body; its dates, if it has any, level with it in the margin.
  show heading.where(level: 3): it => {
    let parts = if it.body.has("children") { it.body.children } else { (it.body,) }
    let dated = parts.filter(p => p.func() == metadata)
    let role = parts.filter(p => p.func() != metadata).join()
    block(above: 2.4em, below: 1em, sticky: true, width: 100%, {
      for d in dated {
        aside(align(right, text(size: 7.5pt, weight: "regular", fill: faint, d.value.dates)))
      }
      text(size: 9pt, weight: "semibold", role)
    })
  }

  body
}
