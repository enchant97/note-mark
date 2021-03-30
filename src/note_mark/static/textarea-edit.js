"use strict";

var auto_save_timeout = null;
const auto_save_delay_ms = 8000; // 8 seconds
const text_area = document.getElementById("edit-note-content");
text_area.style.height = (text_area.scrollHeight + "px");
text_area.addEventListener("input", _event => { auto_resize_elem(text_area); });

/**
 * adds a event listener for handling auto-save,
 * should only be called once
 * @param {string} api_url - api url to send
 */
function add_auto_save_handle(api_url){
    text_area.addEventListener("input", _event => {
        window.clearTimeout(auto_save_timeout);
        auto_save_timeout = window.setTimeout(do_note_autosave, auto_save_delay_ms, api_url);
    });
}
