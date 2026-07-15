import { APPS_SCRIPT_URL } from './config'
import { getStoredPasscode } from './auth'

function unauthorizedError() {
  const err = new Error('Incorrect passcode')
  err.unauthorized = true
  return err
}

export async function getEntries() {
  const url = `${APPS_SCRIPT_URL}?passcode=${encodeURIComponent(getStoredPasscode())}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load entries')
  const data = await res.json()
  if (data.error === 'unauthorized') throw unauthorizedError()
  return data.entries
}

// Sent as text/plain (not application/json) so the browser treats these as
// "simple requests" and skips the CORS preflight OPTIONS call, which Apps
// Script Web Apps don't handle.
async function postAction(body, fallbackError) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, passcode: getStoredPasscode() }),
  })
  if (!res.ok) throw new Error(fallbackError)
  const data = await res.json()
  if (data.error === 'unauthorized') throw unauthorizedError()
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
