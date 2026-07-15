import { useState } from 'react'
import { PEOPLE, BOTH, CATEGORIES, CURRENCIES, DEFAULT_CURRENCY, paidByLabel, currencySymbol, formatAmount, formatDate } from '../config'
import { categoryTotalsFor } from './CategoryBreakdown'

function PersonAllCategories({ personKey, name, totals, symbol, selection, onSelectCategory }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">{name}</p>
      <ul className="space-y-1">
        {CATEGORIES.map((c) => {
          const amount = totals[c.key] || 0
          const isSelected = selection?.person === personKey && selection?.categoryKey === c.key
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onSelectCategory(personKey, c.key)}
                className={`flex w-full items-center justify-between gap-1 rounded-lg px-1.5 py-1 text-left text-xs transition-colors ${
                  isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                  <span className="shrink-0 text-sm leading-none">{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </span>
                <span
                  className={`shrink-0 font-medium ${amount > 0 ? 'text-slate-800' : 'text-slate-300'}`}
                >
                  {symbol}{formatAmount(amount)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function AllCategories({ entries, currency, onBack }) {
  const present = new Set(entries.map((e) => e.currency || DEFAULT_CURRENCY))
  const currencies = CURRENCIES.filter((c) => present.has(c.key))
  if (currencies.length === 0) currencies.push(CURRENCIES.find((c) => c.key === DEFAULT_CURRENCY))

  const [selected, setSelected] = useState(currency)
  const active = currencies.find((c) => c.key === selected) || currencies[0]

  // { person: 'A' | 'B', categoryKey } for the category row currently
  // expanded below the two cards.
  const [selection, setSelection] = useState(null)

  const people = [
    { key: 'A', name: PEOPLE.A, totals: categoryTotalsFor(entries, 'A', active.key) },
    { key: 'B', name: PEOPLE.B, totals: categoryTotalsFor(entries, 'B', active.key) },
  ]

  function handleSelectCategory(person, categoryKey) {
    setSelection((current) =>
      current && current.person === person && current.categoryKey === categoryKey
        ? null
        : { person, categoryKey },
    )
  }

  const selectedCategory = selection ? CATEGORIES.find((c) => c.key === selection.categoryKey) : null

  // A person's category total includes their own paid entries plus half of
  // "Both" entries, so the matching detail list includes both too.
  const matchingEntries = selection
    ? [...entries]
        .filter(
          (e) =>
            (e.currency || DEFAULT_CURRENCY) === active.key &&
            e.category === selection.categoryKey &&
            (e.paidBy === selection.person || e.paidBy === BOTH),
        )
        .reverse()
    : []

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Back
      </button>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">All categories</h2>
        {currencies.length > 1 && (
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {currencies.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active.key === c.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {c.key}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {people.map((p) => (
          <PersonAllCategories
            key={p.key}
            personKey={p.key}
            name={p.name}
            totals={p.totals}
            symbol={active.symbol}
            selection={selection}
            onSelectCategory={handleSelectCategory}
          />
        ))}
      </div>

      {selection && (
        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {selectedCategory.emoji} {selectedCategory.label} · {PEOPLE[selection.person]}
            </p>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          {matchingEntries.length === 0 ? (
            <p className="text-xs text-slate-400">No entries yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {matchingEntries.map((e) => {
                // Matches the category total above: a person's share of a
                // "Both" entry is half, not the full amount.
                const share = e.paidBy === BOTH ? Number(e.amount) / 2 : Number(e.amount)
                const rate = Number(e.rate) || 0
                const sgdEquivalent = e.currency === 'JPY' && rate > 0 ? share / rate : null
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700">{e.description}</p>
                      <p className="mt-0.5 text-slate-400">
                        {formatDate(e.date)}
                        {sgdEquivalent !== null && (
                          <> · <span className="whitespace-nowrap">≈ {currencySymbol('SGD')}{formatAmount(sgdEquivalent)} (@ {rate})</span></>
                        )}
                      </p>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          e.paidBy === 'A'
                            ? 'bg-emerald-100 text-emerald-700'
                            : e.paidBy === BOTH
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {paidByLabel(e.paidBy)}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium text-slate-800">
                      {active.symbol}{formatAmount(share)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
