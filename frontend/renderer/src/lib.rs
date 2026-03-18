use pulldown_cmark::{CowStr, Event, Options, Parser, Tag, html};
use serde::{Deserialize, Serialize};
use serde_value::Value;
use std::{collections::HashMap, path::PathBuf};
use url::Url;
use wasm_bindgen::prelude::*;
use web_sys::window;

fn resolve_path(api_base_url: &Url, unresolved_path: &str) -> String {
    if unresolved_path.starts_with("https://") || unresolved_path.starts_with("http://") {
        // don't touch absolute URLs
        unresolved_path.to_owned()
    } else if PathBuf::from(unresolved_path).extension().is_none() {
        // don't resolve non asset paths
        unresolved_path.to_owned()
    } else {
        let abs_path = if unresolved_path.starts_with("/") {
            // don't do relative to absolute path conversion
            unresolved_path.to_owned()
        } else {
            // convert relative path to absolute, using browser current path
            let base_path = window()
                .expect("failed to acquire window")
                .location()
                .pathname()
                .expect("failed to get window location pathname");
            format!("{base_path}/{unresolved_path}")
        };
        // join absolute path with api content url
        api_base_url
            .join(&format!("tree/content/u{abs_path}"))
            .expect("failed to join path")
            .to_string()
    }
}

/// The note frontmatter, allowing for extra fields.
#[derive(Serialize, Deserialize, Default, Clone)]
pub struct Frontmatter {
    #[serde(default)]
    title: Option<String>,
    #[serde(flatten)]
    extra: HashMap<String, Value>,
}

/// The Note Engine options.
#[derive(Serialize, Deserialize, Clone)]
pub struct NoteEngineOptions {
    #[serde(rename = "apiBaseUrl")]
    pub api_base_url: Url,
}

/// Handle processing of a note.
/// Designed to be long lived, to reduce translation between JS and WASM.
#[wasm_bindgen]
pub struct NoteEngine {
    options: NoteEngineOptions,
    frontmatter: Frontmatter,
    content: String,
}

#[wasm_bindgen]
impl NoteEngine {
    /// Create a new note engine, with an empty note
    #[wasm_bindgen(constructor)]
    pub fn new(options: JsValue) -> Result<Self, String> {
        Ok(Self {
            options: serde_wasm_bindgen::from_value(options)
                .map_err(|e| format!("invalid options field, {e}"))?,
            frontmatter: Default::default(),
            content: "".to_owned(),
        })
    }

    /// Try and create a new engine from a raw note,
    /// containing note content and frontmatter.
    #[wasm_bindgen]
    pub fn try_from_raw(raw: &str, options: JsValue) -> Result<Self, String> {
        let raw = raw.replace("\r\n", "\n").to_owned();
        // bypass parsing, if not exists
        if !raw.starts_with("---\n") {
            return Ok(Self {
                options: serde_wasm_bindgen::from_value(options)
                    .map_err(|e| format!("invalid options field, {e}"))?,
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
            options: serde_wasm_bindgen::from_value(options)
                .map_err(|e| format!("invalid options field, {e}"))?,
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
        raw.push_str("\n---\n");
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
    pub fn frontmatter(&self) -> Result<JsValue, String> {
        let s = serde_wasm_bindgen::Serializer::json_compatible();
        self.frontmatter
            .serialize(&s)
            .map_err(|err| err.to_string())
    }

    #[wasm_bindgen(setter)]
    pub fn set_frontmatter(&mut self, frontmatter: JsValue) -> Result<(), String> {
        self.frontmatter =
            serde_wasm_bindgen::from_value(frontmatter).map_err(|err| err.to_string())?;
        Ok(())
    }

    /// Render the note content into HTML. Requires sanitization.
    pub fn render_to_html(&self) -> String {
        let mut buf = String::new();
        let parser = Parser::new_ext(&self.content, Options::all());
        let parser = parser.map(|event| match event {
            Event::Start(Tag::Link {
                link_type,
                dest_url,
                title,
                id,
            }) => {
                let new_dest_url = resolve_path(&self.options.api_base_url, &dest_url);
                Event::Start(Tag::Link {
                    link_type,
                    dest_url: CowStr::from(new_dest_url),
                    title,
                    id,
                })
            }
            Event::Start(Tag::Image {
                link_type,
                dest_url,
                title,
                id,
            }) => {
                let new_dest_url = resolve_path(&self.options.api_base_url, &dest_url);
                Event::Start(Tag::Image {
                    link_type,
                    dest_url: CowStr::from(new_dest_url),
                    title,
                    id,
                })
            }
            _ => event,
        });
        html::push_html(&mut buf, parser);
        buf
    }
}
