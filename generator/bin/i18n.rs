fn main() -> anyhow::Result<()> {
    let syntax = askama_parser::Syntax::default();
    for f in ["src/templates/page-base.html", "src/templates/index.html", "src/templates/cv.html"] {
        for m in askama_gettext::extract::from_file(std::path::Path::new(f), &syntax)? {
            println!("{}:{}  {:?}{}", m.file, m.line, m.id,
                m.context.map(|c| format!("   [ctx: {c}]")).unwrap_or_default());
        }
    }
    Ok(())
}
