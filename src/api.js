import { APPS_SCRIPT_URL } from './config'
import { getStoredPasscode } from './auth'

function unauthorizedError() {
  const err = new Error('Incorrect passcode')
  err.unauthorized = true
  return err
}

export async function fetchAll() {
  const url = `${APPS_SCRIPT_URL}?passcode=${encodeURIComponent(getStoredPasscode())}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load data')
  const data = await res.json()
  if (data.error === 'unauthorized') throw unauthorizedError()
  return { entries: data.entries, conversions: data.conversions || [] }
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

export function addEntry({ date, description, amount, currency, rate, paidBy, category, owedAmount }) {
  return postAction(
    { action: 'add', date, description, amount, currency, rate, paidBy, category, owedAmount },
    'Failed to add entry',
  )
}

export function updateEntry({ id, date, description, amount, currency, rate, paidBy, category, owedAmount }) {
  return postAction(
    { action: 'update', id, date, description, amount, currency, rate, paidBy, category, owedAmount },
    'Failed to update entry',
  )
}

export function deleteEntry(id) {
  return postAction({ action: 'delete', id }, 'Failed to delete entry')
}

export function addConversion({ date, fromCurrency, fromAmount, toCurrency, toAmount, rate, paidBy, owedAmount }) {
  return postAction(
    { action: 'addConversion', date, fromCurrency, fromAmount, toCurrency, toAmount, rate, paidBy, owedAmount },
    'Failed to add conversion',
  )
}

export function updateConversion({ id, date, fromCurrency, fromAmount, toCurrency, toAmount, rate, paidBy, owedAmount }) {
  return postAction(
    { action: 'updateConversion', id, date, fromCurrency, fromAmount, toCurrency, toAmount, rate, paidBy, owedAmount },
    'Failed to update conversion',
  )
}

export function deleteConversion(id) {
  return postAction({ action: 'deleteConversion', id }, 'Failed to delete conversion')
}
