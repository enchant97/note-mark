"use strict";

var auto_save_timeout = null;
const auto_save_delay_ms = 8000; // 8 seconds
const text_area = document.getElementById("edit-note-content");
text_area.style.height = (text_area.scrollHeight + "px");
text_area.addEventListener("input", _event => {
    auto_resize_elem(text_area);
    handle_unsaved();
});

const toolbox = document.getElementById("edit-toolbox");
const toolbox_offset = toolbox.offsetTop;
window.addEventListener("scroll", toggle_sticky_toolbox);

/**
 * allow for the toolbox to stick to
 * top of page when it goes out of view
 */
function toggle_sticky_toolbox() {
    if (window.pageYOffset >= toolbox_offset) {
        toolbox.classList.add("sticky-control-bar")
    } else {
        toolbox.classList.remove("sticky-control-bar");
    }
}

/**
 * adds a event listener for handling auto-save,
 * should only be called once
 * @param {string} api_url - api url to send
 */
function add_auto_save_handle(api_url) {
    text_area.addEventListener("input", _event => {
        window.clearTimeout(auto_save_timeout);
        auto_save_timeout = window.setTimeout(do_note_autosave, auto_save_delay_ms, api_url);
    });
}

function edit_textarea_selection() {
    text_area.focus();
    const sel = [text_area.selectionStart, text_area.selectionEnd];
    return sel
}

function edit_textarea_indent() {
    const [sel_start, sel_end] = edit_textarea_selection();
    if (sel_start === sel_end) {
        text_area.setRangeText(MARKDOWN_SYNTAX.INDENT, sel_start, sel_end, "end");
    }
}

function edit_textarea_wrap_sel(chars_to_wrap) {
    const [sel_start, sel_end] = edit_textarea_selection();
    text_area.setRangeText(chars_to_wrap, sel_end, sel_end);
    text_area.setRangeText(chars_to_wrap, sel_start, sel_start, "end");
}

function edit_textarea_insert(chars_to_insert) {
    const [sel_start, sel_end] = edit_textarea_selection();
    text_area.setRangeText(chars_to_insert, sel_start, sel_start, "end");
    const new_sel = sel_end + chars_to_insert.length;
    text_area.setSelectionRange(new_sel, new_sel);
}
