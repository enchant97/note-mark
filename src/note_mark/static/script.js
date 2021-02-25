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
