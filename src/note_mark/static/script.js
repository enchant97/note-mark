"use strict";

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
 * handle showing the user that
 * their edit page is out of date
*/
function handle_note_content_change_edit() {
    alert("note has been edited elsewhere!");
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
    alert("Note has been deleted!");
    window.location.replace(redirect_url);
}

/**
 * handle a notebook being deleted
 * @param {string} redirect_url - the url to navigate to
 */
function handle_notebook_remove(redirect_url) {
    alert("Notebook and notes have been deleted!");
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
