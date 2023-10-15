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
  static writeSetting(name: string, value: string, persistant = true) {
    let key = makeSettingKey(name)
    StorageHandler.clearSetting(name)
    if (persistant) {
      window.localStorage.setItem(key, value)
    } else {
      window.sessionStorage.setItem(key, value)
    }
  }
}

export default StorageHandler;
