// How the CV looks. src/content/cv.typ says what each piece is through `cv`,
// `job` and `project`; this sets it for paper and for the /cv page.
//
// Paper gets the site's voice: Geist Mono, lowercase thin headings, brand red,
// the logo. The page gets plain elements, because Tailwind's prose styles them
// there and an inline style or an embedded image would bypass the stylesheet and
// the asset pipeline. Everything `html.*` sits behind `target()`, so the file
// still compiles where HTML export isn't enabled.
//
// Decoration on paper is drawn rather than written, because an applicant
// tracking system reads it before a person does. The band, the rules and the
// second-page logo are shapes and images, so the extracted text is one column in
// reading order, with no header or footer text to land in the middle of it.

#let mono = "Geist Mono"
#let brand = rgb("#e65e5e")
#let ink = rgb("#2b2b2b")
#let mid = rgb("#666666")
#let faint = rgb("#9a9a9a")
#let hair = rgb("#e4e4e4")
#let logo = "../static/logo.png"

#let html-or(html, paged) = context if target() == "html" { html() } else { paged }

#let small(body) = html-or(
  () => html.elem("small", body),
  text(size: 0.92em, fill: mid, body),
)

// "2025–Present", "2024", "2010–2013". `to: none` is a role still held, and a
// role inside one year leaves `to` out.
#let span(from, to) = {
  if to == none [#from–Present] else if to == auto or to == from [#from] else [#from–#to]
}

// On the role's own line, at the right margin: where the eye and a parser both
// look for it.
#let dates(body) = html-or(
  () => [ #html.elem("small", body)],
  {
    h(1fr)
    text(size: 7.5pt, weight: "regular", fill: faint, tracking: 0.03em, body)
  },
)

// One role. The heading carries the label, so a link to it lands on the role in
// the PDF and on the `<h3>` on the page.
#let job(
  role: none,
  org: none,
  from: none,
  to: auto,
  label: none,
  about: none,
  note: none,
  skills: (),
  body,
) = {
  let head = heading(level: 2, [#role#if org != none [, #org]#if from != none { dates(span(from, to)) }])
  if label == none { head } else [#head#label]
  if about != none { par(small(about)) }
  if note != none { par(small(note)) }
  if skills.len() > 0 { par(emph[Key Skills: #skills.join(", ")]) }
  body
}

// The font has no star, so paper spells it out; "240+ stars" is what a parser
// reads anyway.
#let stars-of(n) = [#n+#html-or(() => [★], [ stars])]

// One thing made, for a list item.
#let project(name: none, url: none, lang: none, stars: none, source: none, body) = {
  let count = stars
  let meta = (
    lang,
    if count != none { stars-of(count) },
    if source != none { link(source)[source] },
  ).filter(it => it != none)
  strong(if url == none { name } else { link(url, name) })
  if meta.len() > 0 [ #small(meta.join[ · ])]
  [: #body]
}

// The logo is as tall as the text beside it, from the top of the name to the
// last contact line. Its width depends on that height and the text's wrapping on
// its width, so the height is measured twice. The page has its own logo.
#let masthead(name, role, contact) = html-or(
  () => {
    title(name)
    par(role)
    par(contact)
  },
  block(below: 10mm, layout(size => {
    let gutter = 8mm
    let lines(width) = block(width: width, {
      title(name)
      v(2.6mm)
      text(size: 10pt, fill: brand, role)
      v(3mm)
      text(size: 7.8pt, fill: mid, contact)
    })
    let height = measure(lines(size.width - 40mm)).height
    let height = measure(lines(size.width - height - gutter)).height

    grid(
      columns: (height, 1fr),
      column-gutter: gutter,
      image(logo, height: height, alt: "blit.cc logo"),
      lines(100%),
    )
  })),
)

#let paper(body) = {
  set text(font: mono, size: 8.6pt, fill: ink, hyphenate: false)
  set par(leading: 0.8em, spacing: 1.25em, justify: false)

  set page(
    paper: "a4",
    margin: (x: 22mm, top: 22mm, bottom: 20mm),
    // A band of the brand along the top edge of every page.
    background: place(top, rect(width: 100%, height: 2.4mm, fill: brand)),
    // The logo again from the second page, small, in the top corner.
    header: context if here().page() > 1 {
      align(right, image(logo, width: 6mm, alt: "blit.cc logo"))
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
  set terms(separator: [: ], hanging-indent: 0pt, spacing: 1.25em)

  // Only links that leave the CV look like links. One to a role reads as the
  // phrase it is on paper and still jumps there on screen.
  show link: it => if type(it.dest) == str {
    set text(fill: brand)
    underline(stroke: 0.45pt + brand.lighten(35%), offset: 1.8pt, it)
  } else { it }
  show strong: set text(fill: rgb("#1a1a1a"))
  show emph: set text(fill: mid)
  show raw: set text(font: mono, size: 8.6pt)

  show title: it => block(
    text(size: 30pt, weight: "extralight", tracking: -0.02em, lower(it.body)),
  )

  show heading: set text(weight: "regular")

  // The title, then a hairline running out from it to the margin, starting in
  // brand red: one row, no space spent beside it.
  show heading.where(level: 1): it => block(
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

  show heading.where(level: 2): it => block(
    above: 2.3em,
    below: 1em,
    sticky: true,
    width: 100%,
    text(size: 9pt, weight: "semibold", it.body),
  )

  body
}

#let cv(name: none, role: none, email: none, github: none, location: none, keywords: (), body) = {
  set document(title: name + " – CV", author: name, keywords: keywords, date: none)
  set text(lang: "en", region: "gb")

  let contact = {
    [*e-mail:* #link("mailto:" + email, email)]
    linebreak()
    [*github:* #link("https://github.com/" + github, "@" + github)]
    linebreak()
    [*location:* #location]
  }
  let content = {
    masthead(name, role, contact)
    body
  }
  context if target() == "html" { content } else { paper(content) }
}
