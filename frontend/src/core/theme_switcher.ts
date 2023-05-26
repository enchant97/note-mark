export const THEMES = [
    {
        name: "dark",
        title: "Dark",
    },
    {
        name: "light",
        title: "Light",
    },
]
const DEFAULT_THEME = THEMES[0].name
const CURRENT_THEME_KEY = "note_mark__theme"

export function setTheme(newTheme: string) {
    window.localStorage.setItem(CURRENT_THEME_KEY, newTheme)
    document.body.dataset.theme = newTheme
}

export function getTheme(): string {
    return window.localStorage.getItem(CURRENT_THEME_KEY) || DEFAULT_THEME
}
