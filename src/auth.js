const STORAGE_KEY = 'moneytracker_passcode'

export function getStoredPasscode() {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function setStoredPasscode(code) {
  localStorage.setItem(STORAGE_KEY, code)
}

export function clearStoredPasscode() {
  localStorage.removeItem(STORAGE_KEY)
}
