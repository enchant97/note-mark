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
function auto_resize_elem(elem){
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
function ask_before_get(url, msg ="are you sure you want to delete that?"){
    if (confirm(msg)){
        window.location.replace(url);
    }
}

/**
 * connect the update websocket
 * @param {string} url - the url to connect to
 */
function listen_for_ws_updates(url){
    const ws = new WebSocket(url);
    ws.onmessage = evnt => {
        // TODO implement
        const message = JSON.parse(evnt.data);
        console.log(message);
    }
}
