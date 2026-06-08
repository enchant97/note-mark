import StorageHandler from "~/core/storage"

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
const CURRENT_THEME_KEY = "theme"

export function setTheme(newTheme: string) {
  StorageHandler.writeSetting(CURRENT_THEME_KEY, newTheme)
  document.body.dataset.theme = newTheme
}

export function getTheme(): string {
  return StorageHandler.readSetting(CURRENT_THEME_KEY) || DEFAULT_THEME
}
