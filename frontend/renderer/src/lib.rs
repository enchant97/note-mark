use pulldown_cmark::{Options, Parser, html};
use serde::{Deserialize, Serialize};
use serde_value::Value;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// The note frontmatter, allowing for extra fields.
#[derive(Serialize, Deserialize, Default, Clone)]
#[wasm_bindgen]
pub struct Frontmatter {
    #[serde(default)]
    title: Option<String>,
    #[serde(flatten)]
    extra: HashMap<String, Value>,
}

/// Handle processing of a note.
/// Designed to be long lived, to reduce translation between JS and WASM.
#[wasm_bindgen]
pub struct NoteEngine {
    frontmatter: Frontmatter,
    content: String,
}

#[wasm_bindgen]
impl NoteEngine {
    /// Create a new note engine, with an empty note
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            frontmatter: Default::default(),
            content: "".to_owned(),
        }
    }

    /// Try and create a new engine from a raw note,
    /// containing note content and frontmatter.
    #[wasm_bindgen]
    pub fn try_from_raw(raw: &str) -> Result<Self, String> {
        let raw = raw.replace("\r\n", "\n").to_owned();
        // bypass parsing, if not exists
        if !raw.starts_with("---\n") {
            return Ok(Self {
                frontmatter: Default::default(),
                content: raw,
            });
        }
        // parse possible frontmatter
        let mut lines = raw.lines();
        let _ = lines.next().expect("this should never happen :(");
        let mut found_frontmatter = false;
        let mut raw_frontmatter = String::new();
        let mut content = String::new();
        for line in lines.by_ref() {
            if line == "---" {
                found_frontmatter = true;
                break;
            }
            raw_frontmatter.push_str(&format!("{line}\n"));
        }
        let frontmatter: Frontmatter = if found_frontmatter {
            // found frontmatter
            serde_yaml2::from_str(&raw_frontmatter).map_err(|err| err.to_string())?
        } else {
            // no frontmatter was found
            content.push_str("---\n");
            content.push_str(&raw_frontmatter);
            Default::default()
        };
        // extract any further content
        for line in lines.by_ref() {
            content.push_str(&format!("{line}\n"));
        }
        Ok(Self {
            frontmatter,
            content,
        })
    }

    /// Try and process into a valid raw note,
    /// containing note content and frontmatter.
    #[wasm_bindgen]
    pub fn try_into_raw(&self) -> Result<String, String> {
        let mut raw = String::new();
        raw.push_str("---\n");
        raw.push_str(&serde_yaml2::to_string(&self.frontmatter).map_err(|err| err.to_string())?);
        raw.push_str("\n---\n\n");
        raw.push_str(&self.content);
        Ok(raw)
    }

    #[wasm_bindgen(getter)]
    pub fn content(&self) -> String {
        self.content.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_content(&mut self, content: &str) {
        self.content = content.replace("\r\n", "\n").to_owned()
    }

    #[wasm_bindgen(getter)]
    pub fn frontmatter(&self) -> Frontmatter {
        self.frontmatter.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_frontmatter(&mut self, frontmatter: Frontmatter) {
        self.frontmatter = frontmatter
    }

    /// Render the note content into HTML. Requires sanitization.
    pub fn render_to_html(&self) -> String {
        let mut buf = String::new();
        let parser = Parser::new_ext(&self.content, Options::all());
        html::push_html(&mut buf, parser);
        buf
    }
}
