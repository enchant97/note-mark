const THEME_NAMES = {
    LIGHT: "light",
    DARK: "dark",
    OS: "os"
}
const THEME_KEY = "theme";
var theme_color = THEME_NAMES.OS;

function change_theme() {
    switch (theme_color) {
        case THEME_NAMES.LIGHT:
            document.documentElement.style.setProperty("--font-dark", "black");
            document.documentElement.style.setProperty("--font-light", "#f0f0f0");
            document.documentElement.style.setProperty("--bg-bnt", "#adadad");
            document.documentElement.style.setProperty("--bg-body", "#9299a5");
            document.documentElement.style.setProperty("--bg-body2", "#9096a1");
            document.documentElement.style.setProperty("--bg-body3", "#767d8a");
            document.documentElement.style.setProperty("--border-col", "#777777");
            document.documentElement.style.setProperty("--link-fg", "#00048c");
            break;
        case THEME_NAMES.DARK:
            document.documentElement.style.setProperty("--font-dark", "var(--font-light)");
            document.documentElement.style.setProperty("--font-light", "#bcbcbc");
            document.documentElement.style.setProperty("--bg-bnt", "#003d4b");
            document.documentElement.style.setProperty("--bg-body", "#002b36");
            document.documentElement.style.setProperty("--bg-body2", "#073540");
            document.documentElement.style.setProperty("--bg-body3", "#083b47");
            document.documentElement.style.setProperty("--border-col", "#005163");
            document.documentElement.style.setProperty("--link-fg", "#4e9df8");
            break;
    }
}

function load_theme_name() {
    theme_color = localStorage.getItem(THEME_KEY, THEME_NAMES.OS);
}

function window_change_theme(new_theme) {
    localStorage.setItem(THEME_KEY, new_theme);
    load_theme_name();
    switch (theme_color) {
        case THEME_NAMES.OS:
            window.location.reload();
            break;
        default:
            toggle_theme_picker();
            change_theme();
            break;
    }
}

/**
 *
 * @param {string} theme_name - the name of the theme
 * @param {string} bnt_text - the text for the button
 * @returns {Element} the created button element
 */
function create_theme_picker_button(theme_name, bnt_text) {
    const elem = document.createElement('button');
    elem.addEventListener('click', _event => { window_change_theme(theme_name) });
    elem.innerText = bnt_text;
    if (theme_color === theme_name) {
        elem.classList.add('ok');
    }
    return elem;
}

/**
 * opens(creates) or closes(removes) the site theme picker
 */
function toggle_theme_picker() {
    var the_box = document.getElementById('theme-selection');
    if (the_box) {
        the_box.remove();
    }
    else {
        const main = document.getElementsByTagName('main')[0];
        the_box = document.createElement('div');
        the_box.id = 'theme-selection';

        the_box.appendChild(create_theme_picker_button(THEME_NAMES.LIGHT, "Light"));
        the_box.appendChild(create_theme_picker_button(THEME_NAMES.DARK, "Dark"));
        the_box.appendChild(create_theme_picker_button(THEME_NAMES.OS, "OS Theme"));

        main.insertBefore(the_box, main.firstChild);
    }
}

window.addEventListener("load", _ => {
    load_theme_name();
    change_theme();
}, { once: true });
