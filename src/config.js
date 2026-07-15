// Paste your deployed Google Apps Script Web App URL here (ends in /exec).
// See apps-script/README.md for how to get this.
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxvrlxIWgwZz6RG_DE14PmunrF56QhJZTDF_7RUO15XOvuj1IPdpvc9VBWPrQyHA78H/exec'

// Display names for the two people. The underlying stored value for each
// entry is always the key ('A' or 'B'), so relabeling here never requires
// touching existing data in the Sheet.
export const PEOPLE = {
  A: 'JW',
  B: 'ZH',
}

// Currencies the app can log entries in. The stored value is always `key`,
// so relabeling `symbol`/`gradient` here never requires touching existing
// data. `gradient` is a Tailwind `from-* to-*` pair used for the balance
// summary card in that currency.
export const CURRENCIES = [
  { key: 'JPY', symbol: '¥', gradient: 'from-orange-400 to-amber-500', shadow: 'shadow-orange-200/50' },
  { key: 'SGD', symbol: '$', gradient: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-200/50' },
]

export const DEFAULT_CURRENCY = 'JPY'

export function currencySymbol(key) {
  return CURRENCIES.find((c) => c.key === key)?.symbol ?? key
}

// Formats an amount with thousands separators, e.g. 11111 -> "11,111.00".
export function formatAmount(amount) {
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Formats a "yyyy-mm-dd" entry date as "15 July 2026". Parses the string
// directly (rather than via `Date`) to avoid timezone-shift bugs.
export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const [, year, month, day] = match
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1]} ${year}`
}

// Special paidBy value meaning the cost was split evenly between both
// people (e.g. paid from a joint account) — half the amount is credited
// to each person's total, with no effect on who owes whom.
export const BOTH = 'BOTH'

export function paidByLabel(key) {
  return key === BOTH ? 'Both' : (PEOPLE[key] ?? key)
}

// Expense categories. The stored value is always `key`, so reordering,
// relabeling, or re-emoji-ing here never requires touching existing data.
// `color` is a Tailwind bg-* class used for legend dots; `hex` is the same
// color as a raw CSS value, needed for the donut chart's conic-gradient
// (which can't use Tailwind classes).
export const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍔', color: 'bg-orange-400', hex: '#fb923c' },
  { key: 'souvenirs', label: 'Souvenirs', emoji: '🎁', color: 'bg-pink-400', hex: '#f472b6' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: 'bg-sky-400', hex: '#38bdf8' },
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: 'bg-violet-400', hex: '#a78bfa' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒', color: 'bg-emerald-400', hex: '#34d399' },
  { key: 'entertainment', label: 'Fun', emoji: '🎉', color: 'bg-fuchsia-400', hex: '#e879f9' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-amber-400', hex: '#fbbf24' },
  { key: 'other', label: 'Other', emoji: '🧾', color: 'bg-slate-400', hex: '#94a3b8' },
]
