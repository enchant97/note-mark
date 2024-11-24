use pulldown_cmark::{html, Options, Parser};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Renderer {}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {}
    }

    #[wasm_bindgen]
    pub fn markdown_to_html(&self, raw: &str) -> String {
        let mut buf = String::new();
        let parser = Parser::new_ext(raw, Options::all());
        html::push_html(&mut buf, parser);
        buf
    }
}
