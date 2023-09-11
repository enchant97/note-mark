use pulldown_cmark::{html, Options, Parser};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn markdown_to_html(raw: &str) -> String {
    let mut buf = String::new();
    let parser = Parser::new_ext(raw, Options::all());
    html::push_html(&mut buf, parser);
    buf
}
