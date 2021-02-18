/**
 * resize an element based on its current content
 * @param {Element} elem - the element to resize
 */
function auto_resize_elem(elem){
    elem.style.height = "auto";
    elem.style.height = elem.scrollHeight + "px";
}
