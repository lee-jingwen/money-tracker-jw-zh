import { CATEGORIES, PEOPLE, BOTH, paidByLabel, currencySymbol, formatAmount, formatDate, DEFAULT_CURRENCY } from '../config'
import SwipeableRow from './SwipeableRow'

function categoryEmoji(key) {
  return CATEGORIES.find((c) => c.key === key)?.emoji ?? CATEGORIES.at(-1).emoji
}

// Returns null if there's no outstanding debt. For a single-payer record,
// owedAmount is always positive and the other person owes it back to them.
// For a "Both" record, paidBy stays "Both" (the money still came out of the
// shared pool) and the SIGN of owedAmount marks who still owes their half
// to that pool instead (positive = ZH, negative = JW).
function getDebtInfo(paidBy, owedAmount) {
  const owed = Number(owedAmount) || 0
  if (owed === 0) return null
  if (paidBy === BOTH) {
    return { owerLabel: owed > 0 ? PEOPLE.B : PEOPLE.A, amount: Math.abs(owed), toShared: true }
  }
  if (owed < 0) return null
  return { owerLabel: paidBy === 'A' ? PEOPLE.B : PEOPLE.A, amount: owed, toShared: false }
}

function EntryCard({ entry, onResolve }) {
  const debt = getDebtInfo(entry.paidBy, entry.owedAmount)
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
              <> · <span className="whitespace-nowrap">≈ {currencySymbol('SGD')}{formatAmount(sgdEquivalent)} (@ {rate})</span></>
            )}
          </p>
          {debt && (
            <div className="mt-0.5">
              <p className="text-xs text-slate-400">
                {debt.owerLabel} owes {debt.toShared ? 'the shared wallet ' : ''}
                {symbol}{formatAmount(debt.amount)}
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

function ConversionCard({ conversion, onResolve }) {
  const debt = getDebtInfo(conversion.paidBy, conversion.owedAmount)

  return (
    <div className="flex items-center justify-between bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl leading-none">💱</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800">
            {currencySymbol(conversion.fromCurrency)}
            {formatAmount(conversion.fromAmount)} → {currencySymbol(conversion.toCurrency)}
            {formatAmount(conversion.toAmount)}
          </p>
          <p className="text-xs text-slate-400">
            {formatDate(conversion.date)} · rate {conversion.rate}
          </p>
          {debt && (
            <div className="mt-0.5">
              <p className="text-xs text-slate-400">
                {debt.owerLabel} owes {debt.toShared ? 'the shared wallet ' : ''}
                {currencySymbol(conversion.fromCurrency)}
                {formatAmount(debt.amount)}
              </p>
              {conversion.id && (
                <button
                  type="button"
                  onClick={() => onResolve(conversion)}
                  className="whitespace-nowrap text-xs font-medium text-indigo-500 hover:text-indigo-600"
                >
                  Mark as paid
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <span
        className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          conversion.paidBy === 'A'
            ? 'bg-emerald-100 text-emerald-700'
            : conversion.paidBy === BOTH
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
        }`}
      >
        {paidByLabel(conversion.paidBy)}
      </span>
    </div>
  )
}

export default function EntryList({ entries, conversions = [], onEdit, onDelete, onResolve }) {
  // Reversed before merging (not after) so that, once sorted by date, same-
  // date ties resolve to most-recently-added first — sort is stable, so
  // ties keep whatever relative order they're given going in.
  const combined = [
    ...[...entries].reverse().map((e) => ({ ...e, kind: 'entry' })),
    ...[...conversions].reverse().map((c) => ({ ...c, kind: 'conversion' })),
  ]

  if (combined.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
        <p className="text-sm text-slate-500">No entries yet — add your first one above.</p>
      </div>
    )
  }

  const mostRecentFirst = combined.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <p className="mb-2 text-xs text-slate-400">Swipe an entry left to edit or delete.</p>
      <ul className="space-y-2.5">
        {mostRecentFirst.map((item, i) =>
          item.id ? (
            <li key={item.id}>
              <SwipeableRow onEdit={() => onEdit(item)} onDelete={() => onDelete(item)}>
                {item.kind === 'conversion' ? (
                  <ConversionCard conversion={item} onResolve={onResolve} />
                ) : (
                  <EntryCard entry={item} onResolve={onResolve} />
                )}
              </SwipeableRow>
            </li>
          ) : (
            <li key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {item.kind === 'conversion' ? (
                <ConversionCard conversion={item} onResolve={onResolve} />
              ) : (
                <EntryCard entry={item} onResolve={onResolve} />
              )}
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
