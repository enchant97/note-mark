import { createSignal } from "solid-js"

function makeSettingKey(name: string): string {
  return `note_mark__${name}`
}

class StorageHandler {
  static readSetting(name: string): string | null {
    let key = makeSettingKey(name)
    let s = window.sessionStorage.getItem(key)
    if (s === null) {
      return window.localStorage.getItem(key)
    }
    return s
  }
  static clearSetting(name: string) {
    let key = makeSettingKey(name)
    window.sessionStorage.removeItem(key)
    window.localStorage.removeItem(key)
  }
  static clearSettings() {
    window.sessionStorage.clear()
    window.localStorage.clear()
  }
  static writeSetting(name: string, value: string, persistant = true) {
    let key = makeSettingKey(name)
    StorageHandler.clearSetting(name)
    if (persistant) {
      window.localStorage.setItem(key, value)
    } else {
      window.sessionStorage.setItem(key, value)
    }
  }
  static createSettingSignal(name: string, persistant = true) {
    const [setting, setSetting] = createSignal(StorageHandler.readSetting(name))
    return [
      setting,
      (value: string | null) => {
        if (value === null) StorageHandler.clearSetting(name)
        else StorageHandler.writeSetting(name, value, persistant)
        setSetting(value)
      }
    ] as const
  }
}

export default StorageHandler;
