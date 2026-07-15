import { CATEGORIES, PEOPLE, BOTH, paidByLabel } from '../config'
import SwipeableRow from './SwipeableRow'

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function categoryEmoji(key) {
  return CATEGORIES.find((c) => c.key === key)?.emoji ?? CATEGORIES.at(-1).emoji
}

function EntryCard({ entry }) {
  const owedAmount = Number(entry.owedAmount) || 0
  const owerLabel = entry.paidBy === 'A' ? PEOPLE.B : PEOPLE.A

  return (
    <div className="flex items-center justify-between bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl leading-none">{categoryEmoji(entry.category)}</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">{entry.description}</p>
          <p className="text-sm text-slate-400">{formatDate(entry.date)}</p>
          {entry.paidBy !== BOTH && owedAmount > 0 && (
            <p className="text-xs text-slate-400">
              {owerLabel} owes ${owedAmount.toFixed(2)}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end pl-3">
        <p className="font-semibold text-slate-800">${Number(entry.amount).toFixed(2)}</p>
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

export default function EntryList({ entries, onEdit, onDelete }) {
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
                <EntryCard entry={entry} />
              </SwipeableRow>
            </li>
          ) : (
            <li
              key={i}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <EntryCard entry={entry} />
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
