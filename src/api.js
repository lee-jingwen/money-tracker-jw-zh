import { APPS_SCRIPT_URL } from './config'

export async function getEntries() {
  const res = await fetch(APPS_SCRIPT_URL)
  if (!res.ok) throw new Error('Failed to load entries')
  const data = await res.json()
  return data.entries
}

// Sent as text/plain (not application/json) so the browser treats these as
// "simple requests" and skips the CORS preflight OPTIONS call, which Apps
// Script Web Apps don't handle.
async function postAction(body, fallbackError) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(fallbackError)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || fallbackError)
  return data
}

export function addEntry({ date, description, amount, paidBy, category, owedAmount }) {
  return postAction(
    { action: 'add', date, description, amount, paidBy, category, owedAmount },
    'Failed to add entry',
  )
}

export function updateEntry({ id, date, description, amount, paidBy, category, owedAmount }) {
  return postAction(
    { action: 'update', id, date, description, amount, paidBy, category, owedAmount },
    'Failed to update entry',
  )
}

export function deleteEntry(id) {
  return postAction({ action: 'delete', id }, 'Failed to delete entry')
}
