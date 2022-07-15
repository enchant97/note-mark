"use strict";

/**
 * delay to wait before removing a flashed message
 */
const FLASH_EXPIRE_TIME_MS = 4000;

/**
 * the message types that will be sent by websocket
 */
const WS_MESSAGE_CATEGORY = {
    NOTEBOOK_CREATE: 10,
    NOTEBOOK_REMOVE: 11,
    NOTEBOOK_PREFIX_CHANGE: 12,

    NOTE_CREATE: 20,
    NOTE_REMOVE: 21,
    NOTE_PREFIX_CHANGE: 22,
    NOTE_CONTENT_CHANGE: 23
}

/**
 * the css classes for the flashed message categories
 */
const FLASH_MESS_CATEGORY = {
    OK: "ok",
    WARNING: "warning",
    ERROR: "error"
}

/**
 * markdown strings to insert
 * and wrap around selected text
 */
const MARKDOWN_SYNTAX = {
    INDENT: "    ",
    HEADING: "#",
    EMPHASIS: {
        ITALIC: "*",
        BOLD: "**",
        STRIKE: "~~"
    },
    BLOCKQUOTE: "> ",
    CODE: "`",
    LINK: "[]()",
    IMAGE: "![]()",
    TASK: "- [ ] ",
    HORIZ_RULE: "---"
}

const SAVE_ERROR = {
    UNHANDLED: 0,
    CONFLICT: 1,
}

/**
 * create a message flash
 * @param {string} message - the message content
 * @param {string} category - the category of message
 * @param {number} expire_time_ms - time until the message
 * auto deletes, if null will not expire
 */
function add_flash(message, category = FLASH_MESS_CATEGORY.OK, expire_time_ms = FLASH_EXPIRE_TIME_MS) {
    const flashes_elem = document.getElementById("flashes");
    const flash_elem = document.createElement("div");
    flash_elem.classList.add(category);
    const flash_mess = document.createElement("strong");
    flash_mess.innerText = message;
    const flash_close = document.createElement("span");
    flash_close.addEventListener("click", _evnt => { flash_elem.remove() });
    flash_close.innerText = "×";
    flash_elem.append(flash_mess);
    flash_elem.append(flash_close);
    flashes_elem.append(flash_elem);
    if (expire_time_ms !== null) {
        setTimeout(() => { flash_elem.remove() }, expire_time_ms);
    }
}

/**
 * copy some data to the clipboard
 * @param {string} data - the data to copy to clipboard
 */
function copy_to_clipboard(data) {
    navigator.clipboard.writeText(data);
    add_flash("copied to clipboard!", "ok");
}

/**
 * resize an element based on its current content
 * @param {Element} elem - the element to resize
 */
function auto_resize_elem(elem) {
    const window_pos = window.pageYOffset;
    elem.style.height = "auto";
    elem.style.height = elem.scrollHeight + "px";
    window.scroll(window.pageYOffset, window_pos);
}

/**
 * ask if the user really wants to go to the url
 * @param {string} url - the url to navigate to on success
 * @param {string} msg - the message to show the user
 */
function ask_before_get(url, msg = "are you sure you want to delete that?") {
    if (confirm(msg)) {
        window.location.replace(url);
    }
}

function show_saved_status() {
    const save_bnt = document.getElementById("note-save-bnt");
    save_bnt.removeAttribute("disabled");
    save_bnt.classList.remove("error", "warning");
}

function handle_saved(updated_at) {
    show_saved_status();
    document.getElementById("edit-note-updated_at").value = updated_at;
}

function handle_auto_saved(updated_at) {
    show_saved_status();
    document.getElementById("edit-note-updated_at").value = updated_at;
}

function handle_saved_conflict(updated_at) {
    show_saved_status();
    document.getElementById("edit-note-updated_at").value = updated_at;
    add_flash("note has been saved, but conflict was detected so made a backup file");
}

function handle_auto_save_failed(reason) {
    handle_unsaved();
    switch (reason) {
        case SAVE_ERROR.CONFLICT:
            add_flash("note could not be auto-saved as conflict was detected", "error");
            break;
        default:
            add_flash("note could not be auto-saved", "error");
            break;
    }
}

function handle_unsaved() {
    const save_bnt = document.getElementById("note-save-bnt");
    save_bnt.classList.remove("warning");
    save_bnt.classList.add("error");
    save_bnt.removeAttribute("disabled");
}

function handle_saving() {
    const save_bnt = document.getElementById("note-save-bnt");
    save_bnt.classList.remove("error");
    save_bnt.classList.add("warning");
    save_bnt.setAttribute("disabled", true);
}

/**
 * fetch and then reload current page on response
 * @param {string} url - url to send get request to
 */
function do_fetch_get_reload(url) {
    fetch(url, {
        method: "GET",
    })
        .then(resp => { resp.text(); })
        .then(_ => { location.reload(); })
        .catch(err => {
            console.error(err);
            add_flash("failed", "error");
        })
}

/**
 * called to update a note in the background
 * @param {string} api_url - api url to send
 * the new note content to
 */
function do_note_autosave(api_url) {
    handle_saving();
    const form_data = new FormData(document.getElementById("form-edit-note"));
    fetch(api_url, {
        body: form_data,
        method: "post"
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("auto-save error!");
        })
        .then(json_data => {
            if (json_data.conflict === true) {
                handle_auto_save_failed(SAVE_ERROR.CONFLICT);
            }
            else {
                handle_auto_saved(json_data.updated_at);
            }
        })
        .catch((error) => {
            console.error(error);
            handle_auto_save_failed(SAVE_ERROR.UNHANDLED);
        });
}

function do_note_save(api_url) {
    handle_saving();
    if (typeof auto_save_timeout === "number") {
        // clear the auto-save timeout
        window.clearTimeout(auto_save_timeout);
    }
    const form_data = new FormData(document.getElementById("form-edit-note"));
    fetch(api_url, {
        body: form_data,
        method: "post"
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("save error!");
        })
        .then(json_data => {
            if (json_data.conflict === true) {
                handle_saved_conflict(json_data.updated_at);
            }
            else {
                handle_saved(json_data.updated_at);
            }
        })
        .catch((error) => {
            console.error(error);
            handle_auto_save_failed(SAVE_ERROR.UNHANDLED);
        });
}

/**
 * replace old element content with new
 * from requested html fragment
 * @param {Element} elem - the element to update with fragment
 * @param {string} api_url - the url to send the request to
 */
async function load_fragment_to_elem(elem, api_url) {
    const resp = await fetch(api_url, { method: "GET" });
    const html_text = await resp.text();
    // remove the elements children
    elem.innerHTML = "";
    // add updated element to page
    const new_content = document.createRange().createContextualFragment(html_text);
    elem.appendChild(new_content);
}

/**
 * replace old note prefix element content with new from request
 * @param {Element} elem - the element to update with fragment
 * @param {string} api_url - the url to send the request to
 */
async function load_new_note_prefix(elem, api_url) {
    const resp = await fetch(api_url, { method: "GET" });
    const resp_json = await resp.json();
    elem.innerText = resp_json.prefix;
}

/**
 * create a ws event type name from category id
 * @param {number} category_id - the message category id
 * @returns the event type name
 */
function get_ws_event_type(category_id) {
    return `ws_update_${category_id}`
}

/**
 * connect the update websocket,
 * and dispatch message category events
 * @param {string} url - the url to connect to
 */
function listen_for_ws_updates(url) {
    if (window.location.protocol == "https:") {
        url = url.replace("ws:", "wss:")
    }
    const ws = new WebSocket(url);
    ws.onmessage = evnt => {
        // parse the message
        const message = JSON.parse(evnt.data);
        // create and dispatch the event with payload attached
        const event = new CustomEvent(
            get_ws_event_type(message.category),
            { detail: message.payload });
        window.dispatchEvent(event);
    }
}

/**
 * handles updating the view page with new note content
 * @param {string} api_url - the api url to get the note html
 */
function handle_note_content_change(api_url) {
    const note_elem = document.getElementById("note-content");
    load_fragment_to_elem(note_elem, api_url).catch(console.error);
}

/**
 * handles updating the note prefix on a notes page
 * @param {string} api_url - api url the get the new note prefix
 */
function handle_note_prefix_change(api_url) {
    const elem = document.getElementById("note-prefix");
    load_new_note_prefix(elem, api_url).catch(console.error);
}

/**
 * handle a note being deleted
 * @param {string} redirect_url - the url to navigate to
 */
function handle_note_remove(redirect_url) {
    add_flash("Note has been deleted!");
    window.location.replace(redirect_url);
}

/**
 * handle a notebook being deleted
 * @param {string} redirect_url - the url to navigate to
 */
function handle_notebook_remove(redirect_url) {
    add_flash("Notebook and notes have been deleted!");
    window.location.replace(redirect_url);
}

/**
 * handle new notes being modified to a
 * notebook and updating the list
 * @param {string} api_url - url to get new notes list
 */
function handle_notebook_notes_change(api_url) {
    const notes_elem = document.getElementById("notes");
    load_fragment_to_elem(notes_elem, api_url).catch(console.error);
}

// setup themes
ThemeChanger.theme_meta.light[1] = [
    ["--font-dark", "black"],
    ["--font-light", "#f0f0f0"],
    ["--bg-bnt", "#adadad"],
    ["--bg-body", "#9299a5"],
    ["--bg-body2", "#9096a1"],
    ["--bg-body3", "#767d8a"],
    ["--border-col", "#777777"],
    ["--link-fg", "#00048c"],
];
ThemeChanger.theme_meta.dark[1] = [
    ["--font-dark", "var(--font-light)"],
    ["--font-light", "#bcbcbc"],
    ["--bg-bnt", "#003d4b"],
    ["--bg-body", "#002b36"],
    ["--bg-body2", "#073540"],
    ["--bg-body3", "#083b47"],
    ["--border-col", "#005163"],
    ["--link-fg", "#4e9df8"],
];
ThemeChanger.selected_theme_css_class = "ok";

window.addEventListener("load", _evnt => {
    // load theme change stuff
    ThemeChanger.theme_picker_parent = document.querySelector("main");
    document.getElementById("themeToggleBnt").addEventListener("click", _ => {
        ThemeChanger.toggle_theme_picker(true);
    });
    ThemeChanger.on_load();

    // add timeouts on flashed messages
    const elements = document.querySelectorAll("[data-dismiss='flash']");
    elements.forEach(elem => {
        setTimeout(() => { elem.remove() }, FLASH_EXPIRE_TIME_MS);
    });
}, { once: true });
