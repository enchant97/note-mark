"use strict";

const text_area = document.getElementById("edit-note-content");
text_area.style.height = (text_area.scrollHeight + "px");
text_area.addEventListener("input", _event => { auto_resize_elem(text_area); });
