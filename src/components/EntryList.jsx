import { CATEGORIES, PEOPLE, BOTH, paidByLabel, currencySymbol, formatAmount, formatDate, DEFAULT_CURRENCY } from '../config'
import SwipeableRow from './SwipeableRow'

function categoryEmoji(key) {
  return CATEGORIES.find((c) => c.key === key)?.emoji ?? CATEGORIES.at(-1).emoji
}

function EntryCard({ entry, onResolve }) {
  const owedAmount = Number(entry.owedAmount) || 0
  const owerLabel = entry.paidBy === 'A' ? PEOPLE.B : PEOPLE.A
  const symbol = currencySymbol(entry.currency || DEFAULT_CURRENCY)
  const rate = Number(entry.rate) || 0
  const sgdEquivalent = entry.currency === 'JPY' && rate > 0 ? Number(entry.amount) / rate : null

  return (
    <div className="flex items-center justify-between bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl leading-none">{categoryEmoji(entry.category)}</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">{entry.description}</p>
          <p className="text-xs text-slate-400">
            {formatDate(entry.date)}
            {sgdEquivalent !== null && (
              <> · ≈ {currencySymbol('SGD')}{formatAmount(sgdEquivalent)} (@ {rate})</>
            )}
          </p>
          {entry.paidBy !== BOTH && owedAmount > 0 && (
            <div className="mt-0.5">
              <p className="text-xs text-slate-400">
                {owerLabel} owes {symbol}{formatAmount(owedAmount)}
              </p>
              {entry.id && (
                <button
                  type="button"
                  onClick={() => onResolve(entry)}
                  className="whitespace-nowrap text-xs font-medium text-indigo-500 hover:text-indigo-600"
                >
                  Mark as paid
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end pl-3">
        <p className="font-semibold text-slate-800">{symbol}{formatAmount(entry.amount)}</p>
        <span
          className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            entry.paidBy === 'A'
              ? 'bg-emerald-100 text-emerald-700'
              : entry.paidBy === BOTH
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {paidByLabel(entry.paidBy)}
        </span>
      </div>
    </div>
  )
}

export default function EntryList({ entries, onEdit, onDelete, onResolve }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
        <p className="text-sm text-slate-500">No entries yet — add your first one above.</p>
      </div>
    )
  }

  const mostRecentFirst = [...entries].reverse()

  return (
    <div>
      <p className="mb-2 text-xs text-slate-400">Swipe an entry left to edit or delete.</p>
      <ul className="space-y-2.5">
        {mostRecentFirst.map((entry, i) =>
          entry.id ? (
            <li key={entry.id}>
              <SwipeableRow onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)}>
                <EntryCard entry={entry} onResolve={onResolve} />
              </SwipeableRow>
            </li>
          ) : (
            <li
              key={i}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <EntryCard entry={entry} onResolve={onResolve} />
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
