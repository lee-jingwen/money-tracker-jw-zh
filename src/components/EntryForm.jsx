import { useEffect, useState } from 'react'
import {
  CATEGORIES,
  PEOPLE,
  BOTH,
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencySymbol,
  formatAmount,
  otherCurrency,
} from '../config'

const CONVERSION = { key: 'conversion', label: 'Conversion', emoji: '💱' }
// Only this form's category grid knows about "Conversion" — CATEGORIES
// itself (used by CategoryBreakdown/AllCategories/EntryList) stays real
// spending categories only, so a conversion never shows up as a phantom
// $0 category there.
const FORM_CATEGORIES = [...CATEGORIES, CONVERSION]

// Shared by both expenses and conversions: under "Individual", the amount
// splits between JW and ZH — full to one, half/half, or a custom split.
const WHO_OPTIONS = [
  { key: 'A', label: 'JW' },
  { key: 'B', label: 'ZH' },
  { key: BOTH, label: 'Both' },
  { key: 'custom', label: 'Customise' },
]

function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export default function EntryForm({
  onAdd,
  onUpdate,
  editingEntry,
  onAddConversion,
  onUpdateConversion,
  editingConversion,
  onCancelEdit,
}) {
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [rate, setRate] = useState('')
  const [whoIsSpending, setWhoIsSpending] = useState('shared')
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [splitWho, setSplitWho] = useState(BOTH)
  const [customJW, setCustomJW] = useState('')
  const [customZH, setCustomZH] = useState('')
  // If set, that person's box becomes an amount they *owe back* rather
  // than a direct contribution — the other person is treated as having
  // paid the full amount. Mutually exclusive (only one can be true).
  const [oweChecked, setOweChecked] = useState(null)
  // Shared-only: normally a "Shared" entry is split evenly with no debt,
  // but sometimes one person hasn't actually paid their half yet — this
  // flags who still owes it (null = no one does). Mutually exclusive, like
  // oweChecked above.
  const [sharedOwer, setSharedOwer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isConversion = category === CONVERSION.key
  const editing = editingEntry || editingConversion
  // Only 2 currencies are configured, so the destination is always
  // unambiguous — no need for the user to pick it separately.
  const toCurrency = otherCurrency(currency)

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date)
      setDescription(editingEntry.description)
      setAmount(String(editingEntry.amount))
      setCurrency(editingEntry.currency || DEFAULT_CURRENCY)
      setRate(editingEntry.rate ? String(editingEntry.rate) : '')
      setWhoIsSpending(editingEntry.paidBy === BOTH ? 'shared' : 'individual')
      syncOwedState(editingEntry.paidBy, editingEntry.owedAmount)
      setCategory(editingEntry.category)
      setError(null)
    } else if (editingConversion) {
      setDate(editingConversion.date)
      setCategory(CONVERSION.key)
      setCurrency(editingConversion.fromCurrency)
      setAmount(String(editingConversion.fromAmount))
      setRate(String(editingConversion.rate))
      setWhoIsSpending(editingConversion.paidBy === BOTH ? 'shared' : 'individual')
      syncOwedState(editingConversion.paidBy, editingConversion.owedAmount)
      setError(null)
    }

    // A single-payer record with owedAmount > 0 is displayed as that payer's
    // preset (so only the ower's checkbox is offered) with the debt amount
    // pre-filled into the ower's box and their checkbox pre-ticked. A "Both"
    // record's owedAmount sign marks who still owes their half to the
    // shared pool (positive = ZH, negative = JW) instead.
    function syncOwedState(paidBy, owedAmount) {
      const owed = Number(owedAmount) || 0
      if (paidBy === BOTH) {
        setSplitWho(BOTH)
        setOweChecked(null)
        setSharedOwer(owed > 0 ? 'B' : owed < 0 ? 'A' : null)
      } else if (owed > 0 && paidBy === 'A') {
        setSplitWho('A')
        setOweChecked('B')
        setCustomZH(String(owed))
        setSharedOwer(null)
      } else if (owed > 0 && paidBy === 'B') {
        setSplitWho('B')
        setOweChecked('A')
        setCustomJW(String(owed))
        setSharedOwer(null)
      } else {
        setSplitWho(paidBy)
        setOweChecked(null)
        setSharedOwer(null)
      }
    }
  }, [editingEntry, editingConversion])

  const toAmount = (Number(amount) || 0) * (Number(rate) || 0)

  // How the amount splits between JW and ZH. Only meaningful when
  // whoIsSpending === 'individual'.
  const totalAmount = Number(amount) || 0
  let jwSplit
  let zhSplit
  if (splitWho === 'A') {
    jwSplit = totalAmount
    zhSplit = 0
  } else if (splitWho === 'B') {
    jwSplit = 0
    zhSplit = totalAmount
  } else if (splitWho === BOTH) {
    jwSplit = totalAmount / 2
    zhSplit = totalAmount / 2
  } else {
    jwSplit = Number(customJW) || 0
    zhSplit = Number(customZH) || 0
  }

  // Shared-only: paidBy always stays BOTH — the money still comes out of the
  // shared pool either way. If someone hasn't put their half in yet, that's
  // layered on as a debt via owedAmount's sign (positive = ZH owes,
  // negative = JW owes), not by changing who it's attributed to.
  const sharedOwed =
    sharedOwer === 'B' ? totalAmount / 2 : sharedOwer === 'A' ? -(totalAmount / 2) : 0

  function toggleSharedOwer(person) {
    setSharedOwer((current) => (current === person ? null : person))
  }

  // A checkbox only appears under the A/B presets, on the box that's
  // already 0 — turning "the other person paid nothing" into "the other
  // person actually owes this back". Both/Custom stay a pure direct split,
  // no debt option.
  const showJWOweCheckbox = splitWho === 'B'
  const showZHOweCheckbox = splitWho === 'A'

  // When a checkbox is ticked, the other person is treated as having paid
  // the full amount, and the ticked person's box becomes their owed debt.
  let jwBoxValue = splitWho === 'custom' ? customJW : jwSplit.toFixed(2)
  let zhBoxValue = splitWho === 'custom' ? customZH : zhSplit.toFixed(2)
  let jwBoxEditable = splitWho === 'custom'
  let zhBoxEditable = splitWho === 'custom'
  if (oweChecked === 'A') {
    jwBoxValue = customJW
    zhBoxValue = totalAmount.toFixed(2)
    jwBoxEditable = true
    zhBoxEditable = false
  } else if (oweChecked === 'B') {
    jwBoxValue = totalAmount.toFixed(2)
    zhBoxValue = customZH
    jwBoxEditable = false
    zhBoxEditable = true
  }

  function pickCategory(key) {
    const enteringConversion = key === CONVERSION.key && category !== CONVERSION.key
    setCategory(key)
    if (enteringConversion) {
      if (currency === DEFAULT_CURRENCY) setCurrency(otherCurrency(DEFAULT_CURRENCY))
      setWhoIsSpending('shared')
      setSplitWho(BOTH)
      setCustomJW('')
      setCustomZH('')
      setOweChecked(null)
      setSharedOwer(null)
    }
  }

  function pickSplitWho(key) {
    setSplitWho(key)
    setOweChecked(null)
    if (key === 'custom') {
      setCustomJW((totalAmount / 2).toFixed(2))
      setCustomZH((totalAmount / 2).toFixed(2))
    }
  }

  // Final list of {paidBy, amount, owedAmount} parts to submit for the
  // "Individual" card — either two independent contributions, or (if an
  // owe checkbox is ticked) a single payer plus a debt.
  function computeIndividualParts() {
    if (oweChecked === 'A') {
      return [{ paidBy: 'B', amount: totalAmount, owedAmount: Number(customJW) || 0 }]
    }
    if (oweChecked === 'B') {
      return [{ paidBy: 'A', amount: totalAmount, owedAmount: Number(customZH) || 0 }]
    }
    const parts = []
    if (jwSplit > 0) parts.push({ paidBy: 'A', amount: jwSplit, owedAmount: 0 })
    if (zhSplit > 0) parts.push({ paidBy: 'B', amount: zhSplit, owedAmount: 0 })
    return parts
  }

  function toggleOwe(person) {
    setOweChecked((current) => {
      if (current === person) return null
      // Default to half of the total as a sensible starting debt amount.
      if (person === 'A') setCustomJW((totalAmount / 2).toFixed(2))
      else setCustomZH((totalAmount / 2).toFixed(2))
      return person
    })
  }

  // Clamps a typed value into [0, totalAmount] so one side can never exceed
  // the total (leaving the other side negative).
  function clampToTotal(raw) {
    if (raw === '') return ''
    const num = Number(raw)
    if (Number.isNaN(num)) return raw
    return String(Math.max(0, Math.min(totalAmount, num)))
  }

  function handleCustomJWChange(value) {
    const clamped = clampToTotal(value)
    setCustomJW(clamped)
    setCustomZH(String(Math.max(0, totalAmount - (Number(clamped) || 0))))
  }

  function handleCustomZHChange(value) {
    const clamped = clampToTotal(value)
    setCustomZH(clamped)
    setCustomJW(String(Math.max(0, totalAmount - (Number(clamped) || 0))))
  }

  // While a checkbox is ticked, the other box is pinned to the full total,
  // so editing the owed box must NOT auto-balance the other side.
  function handleOwedJWChange(value) {
    setCustomJW(clampToTotal(value))
  }

  function handleOwedZHChange(value) {
    setCustomZH(clampToTotal(value))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !amount || Number(amount) <= 0) return
    if (isConversion) {
      if (!rate || Number(rate) <= 0) return
    } else if (!description.trim()) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (isConversion) {
        const rateNum = Number(rate)
        const buildPart = (fromAmount, personPaidBy, owedAmount = 0) => ({
          date,
          fromCurrency: currency,
          fromAmount,
          toCurrency,
          toAmount: fromAmount * rateNum,
          rate: rateNum,
          paidBy: personPaidBy,
          owedAmount,
        })

        if (whoIsSpending === 'shared') {
          const payload = buildPart(totalAmount, BOTH, sharedOwed)
          if (editingConversion) {
            await onUpdateConversion({ id: editingConversion.id, ...payload })
            onCancelEdit()
          } else {
            await onAddConversion(payload)
          }
        } else {
          const parts = computeIndividualParts().map((p) => buildPart(p.amount, p.paidBy, p.owedAmount))

          if (editingConversion) {
            const [first, ...rest] = parts
            await onUpdateConversion({ id: editingConversion.id, ...first })
            for (const part of rest) await onAddConversion(part)
            onCancelEdit()
          } else {
            for (const part of parts) await onAddConversion(part)
          }
        }

        if (!editingConversion) {
          setAmount('')
          setRate('')
          setWhoIsSpending('shared')
          setSplitWho(BOTH)
          setCustomJW('')
          setCustomZH('')
          setOweChecked(null)
              setSharedOwer(null)
        }
      } else {
        const buildPart = (amt, personPaidBy, owedAmount = 0) => ({
          date,
          description: description.trim(),
          amount: amt,
          currency,
          rate: rate ? Number(rate) : null,
          paidBy: personPaidBy,
          category,
          owedAmount,
        })

        if (whoIsSpending === 'shared') {
          const payload = buildPart(totalAmount, BOTH, sharedOwed)
          if (editingEntry) {
            await onUpdate({ id: editingEntry.id, ...payload })
            onCancelEdit()
          } else {
            await onAdd(payload)
          }
        } else {
          const parts = computeIndividualParts().map((p) => buildPart(p.amount, p.paidBy, p.owedAmount))

          if (editingEntry) {
            const [first, ...rest] = parts
            await onUpdate({ id: editingEntry.id, ...first })
            for (const part of rest) await onAdd(part)
            onCancelEdit()
          } else {
            for (const part of parts) await onAdd(part)
          }
        }

        if (!editingEntry) {
          setDescription('')
          setAmount('')
          setCurrency(DEFAULT_CURRENCY)
          setRate('')
          setWhoIsSpending('shared')
          setSplitWho(BOTH)
          setCustomJW('')
          setCustomZH('')
          setOweChecked(null)
              setSharedOwer(null)
        }
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
          {editing ? (isConversion ? 'Edit conversion' : 'Edit entry') : 'Add an entry'}
        </h2>
        {editing && (
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
            {FORM_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => pickCategory(c.key)}
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

        {!isConversion && (
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
        )}

        {isConversion ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600">− Converting</label>
              <div className="mt-1 flex gap-2">
                <div className="flex shrink-0 gap-1 rounded-xl bg-slate-100 p-1">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCurrency(c.key)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        currency === c.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">
                Rate (1 {currency} = ? {toCurrency})
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.000001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 125.625"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">+ You'll get</p>
              <p className="text-lg font-semibold text-slate-800">
                {currencySymbol(toCurrency)}
                {formatAmount(toAmount)}
              </p>
            </div>
          </>
        ) : (
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
                      currency === c.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
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
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600">Which Card</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setWhoIsSpending('individual')
                          setSharedOwer(null)
              }}
              className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                whoIsSpending === 'individual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => {
                setWhoIsSpending('shared')
                setSplitWho(BOTH)
                setOweChecked(null)
              }}
              className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                whoIsSpending === 'shared'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Shared
            </button>
          </div>
          {whoIsSpending === 'shared' && (
            <div className="mt-2 mb-4 space-y-2">
              <p className="text-xs text-slate-400">
                {isConversion
                  ? 'Goes to the shared wallet — split evenly into Converted So Far.'
                  : "Split evenly — half goes to each person's total."}
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-500">Does anyone owe half?</label>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={sharedOwer === 'A'}
                      onChange={() => toggleSharedOwer('A')}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {PEOPLE.A} owes
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={sharedOwer === 'B'}
                      onChange={() => toggleSharedOwer('B')}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {PEOPLE.B} owes
                  </label>
                </div>
                {sharedOwer && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {PEOPLE[sharedOwer]} still owes the shared wallet {currencySymbol(currency)}
                    {formatAmount(Math.abs(sharedOwed))}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {whoIsSpending === 'individual' && (
          <div>
            <label className="block text-sm font-medium text-slate-600">
              {isConversion ? 'Who wants to add money?' : 'Who is buying this?'}
            </label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {WHO_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => pickSplitWho(opt.key)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    splitWho === opt.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500">
                  JW <span className="text-slate-400">({currencySymbol(currency)})</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={jwBoxValue}
                  onChange={(e) =>
                    oweChecked === 'A'
                      ? handleOwedJWChange(e.target.value)
                      : handleCustomJWChange(e.target.value)
                  }
                  readOnly={!jwBoxEditable}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-base focus:outline-none ${
                    jwBoxEditable
                      ? 'border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                />
                {showJWOweCheckbox && (
                  <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={oweChecked === 'A'}
                      onChange={() => toggleOwe('A')}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {PEOPLE.A} owes
                  </label>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">
                  ZH <span className="text-slate-400">({currencySymbol(currency)})</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={zhBoxValue}
                  onChange={(e) =>
                    oweChecked === 'B'
                      ? handleOwedZHChange(e.target.value)
                      : handleCustomZHChange(e.target.value)
                  }
                  readOnly={!zhBoxEditable}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-base focus:outline-none ${
                    zhBoxEditable
                      ? 'border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                />
                {showZHOweCheckbox && (
                  <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={oweChecked === 'B'}
                      onChange={() => toggleOwe('B')}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {PEOPLE.B} owes
                  </label>
                )}
              </div>
            </div>

            {oweChecked && (
              <p className="mt-2 text-xs text-slate-400">
                {oweChecked === 'A' ? PEOPLE.A : PEOPLE.B} owes {oweChecked === 'A' ? PEOPLE.B : PEOPLE.A}{' '}
                {currencySymbol(currency)}
                {formatAmount(oweChecked === 'A' ? Number(customJW) || 0 : Number(customZH) || 0)}
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
            ? editing
              ? 'Saving…'
              : 'Adding…'
            : editing
              ? 'Save changes'
              : 'Add entry'}
        </button>
      </div>
    </form>
  )
}
