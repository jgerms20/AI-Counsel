const KEY = 'ep_settings'

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveSettings(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
