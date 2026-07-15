import { useEffect, useState } from 'react'
import { CATEGORIES, PEOPLE, BOTH, paidByLabel, CURRENCIES, DEFAULT_CURRENCY, currencySymbol, formatAmount } from '../config'

function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export default function EntryForm({ onAdd, onUpdate, editingEntry, onCancelEdit }) {
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [rate, setRate] = useState('')
  const [paidBy, setPaidBy] = useState(BOTH)
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [splitMode, setSplitMode] = useState(null)
  const [customOwed, setCustomOwed] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date)
      setDescription(editingEntry.description)
      setAmount(String(editingEntry.amount))
      setCurrency(editingEntry.currency || DEFAULT_CURRENCY)
      setRate(editingEntry.rate ? String(editingEntry.rate) : '')
      setPaidBy(editingEntry.paidBy)
      setCategory(editingEntry.category)
      const half = editingEntry.amount / 2
      const owed = Number(editingEntry.owedAmount) || 0
      if (owed === 0) {
        setSplitMode(null)
      } else if (Math.abs(owed - half) < 0.01) {
        setSplitMode('half')
      } else {
        setSplitMode('custom')
        setCustomOwed(String(owed))
      }
      setError(null)
    }
  }, [editingEntry])

  const halfOwed = (Number(amount) || 0) / 2
  const effectiveOwed =
    paidBy === BOTH || !splitMode
      ? 0
      : splitMode === 'half'
        ? halfOwed
        : Number(customOwed) || 0
  const owerName = paidBy === 'A' ? PEOPLE.B : PEOPLE.A
  const payerName = paidByLabel(paidBy)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !description.trim() || !amount || Number(amount) <= 0) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        date,
        description: description.trim(),
        amount: Number(amount),
        currency,
        rate: rate ? Number(rate) : null,
        paidBy,
        category,
        owedAmount: effectiveOwed,
      }
      if (editingEntry) {
        await onUpdate({ id: editingEntry.id, ...payload })
        onCancelEdit()
      } else {
        await onAdd(payload)
        setDescription('')
        setAmount('')
        setCurrency(DEFAULT_CURRENCY)
        setRate('')
        setPaidBy(BOTH)
        setSplitMode(null)
        setCustomOwed('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          {editingEntry ? 'Edit entry' : 'Add an entry'}
        </h2>
        {editingEntry && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Category</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-colors ${
                  category === c.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="text-xl leading-none">{c.emoji}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Amount</label>
          <div className="mt-1 flex gap-2">
            <div className="flex shrink-0 gap-1 rounded-xl bg-slate-100 p-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setCurrency(c.key)
                    if (c.key !== 'JPY') setRate('')
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    currency === c.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {c.symbol}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={currency !== 'JPY'}
              placeholder="rate"
              title="Conversion rate (optional, JPY only)"
              className="w-28 shrink-0 rounded-xl border border-slate-300 px-2 py-3 text-center text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600">Paid by</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {['A', 'B', BOTH].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPaidBy(key)}
                className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                  paidBy === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {paidByLabel(key)}
              </button>
            ))}
          </div>
          {paidBy === BOTH && (
            <p className="mt-1.5 text-xs text-slate-400">
              Split evenly — half goes to each person's total.
            </p>
          )}
        </div>

        {paidBy !== BOTH && (
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Does {owerName} owe {payerName} back?
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitMode((m) => (m === 'half' ? null : 'half'))}
                className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                  splitMode === 'half'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Half
              </button>
              <button
                type="button"
                onClick={() => setSplitMode((m) => (m === 'custom' ? null : 'custom'))}
                className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                  splitMode === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Customise
              </button>
            </div>

            {splitMode === 'custom' && (
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={customOwed}
                onChange={(e) => setCustomOwed(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            )}

            {effectiveOwed > 0 && (
              <p className="mt-1.5 text-xs text-slate-400">
                {owerName} owes {payerName} {currencySymbol(currency)}{formatAmount(effectiveOwed)}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? editingEntry
              ? 'Saving…'
              : 'Adding…'
            : editingEntry
              ? 'Save changes'
              : 'Add entry'}
        </button>
      </div>
    </form>
  )
}
