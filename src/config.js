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

// Special paidBy value meaning the cost was split evenly between both
// people (e.g. paid from a joint account) — half the amount is credited
// to each person's total, with no effect on who owes whom.
export const BOTH = 'BOTH'

export function paidByLabel(key) {
  return key === BOTH ? 'Both' : (PEOPLE[key] ?? key)
}

// Expense categories. The stored value is always `key`, so reordering,
// relabeling, or re-emoji-ing here never requires touching existing data.
// `color` is a Tailwind bg-* class used for the category breakdown bar.
export const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍔', color: 'bg-orange-400' },
  { key: 'souvenirs', label: 'Souvenirs', emoji: '🎁', color: 'bg-pink-400' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: 'bg-sky-400' },
  { key: 'accommodation', label: 'Stay', emoji: '🏨', color: 'bg-violet-400' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒', color: 'bg-emerald-400' },
  { key: 'entertainment', label: 'Fun', emoji: '🎉', color: 'bg-fuchsia-400' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-amber-400' },
  { key: 'other', label: 'Other', emoji: '🧾', color: 'bg-slate-400' },
]
