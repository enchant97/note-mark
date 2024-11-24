use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteContext {
    pub name: String,
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BookContext {
    pub name: String,
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Serialize, Deserialize)]
pub struct Context {
    pub note: NoteContext,
    pub book: BookContext,
}

#[wasm_bindgen]
impl Context {
    #[wasm_bindgen(constructor)]
    pub fn new(note_name: &str, book_name: &str) -> Self {
        Self {
            note: NoteContext {
                name: note_name.to_owned(),
            },
            book: BookContext {
                name: book_name.to_owned(),
            },
        }
    }
}

#[wasm_bindgen]
pub struct Renderer {
    template_parser: liquid::Parser,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let template_parser = liquid::ParserBuilder::new().build().unwrap();
        Self { template_parser }
    }

    #[wasm_bindgen]
    pub fn markdown_to_html(&self, raw: &str) -> String {
        let mut buf = String::new();
        let parser = Parser::new_ext(raw, Options::all());
        html::push_html(&mut buf, parser);
        buf
    }

    #[wasm_bindgen]
    pub fn parse_templated_markdown(&self, raw: &str, context: Context) -> Option<String> {
        let template = self.template_parser.parse(raw).unwrap();
        let globals = liquid::to_object(&context).ok()?;
        template.render(&globals).ok()
    }

    #[wasm_bindgen]
    pub fn render(&self, raw: &str, context: Context) -> Option<String> {
        if let Some(out) = self.parse_templated_markdown(raw, context) {
            return Some(self.markdown_to_html(&out));
        }
        None
    }
}
