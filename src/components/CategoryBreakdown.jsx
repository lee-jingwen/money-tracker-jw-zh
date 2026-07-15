import { PEOPLE, BOTH, CATEGORIES } from '../config'

function categoryTotalsFor(entries, person) {
  const totals = {}
  for (const e of entries) {
    let share = 0
    if (e.paidBy === person) share = Number(e.amount)
    else if (e.paidBy === BOTH) share = Number(e.amount) / 2
    else continue

    totals[e.category] = (totals[e.category] || 0) + share
  }
  return totals
}

function PersonBreakdown({ person }) {
  const total = Object.values(person.totals).reduce((sum, v) => sum + v, 0)

  const segments = CATEGORIES.map((c) => ({
    ...c,
    amount: person.totals[c.key] || 0,
  }))
    .filter((c) => c.amount > 0)
    .map((c) => ({ ...c, pct: (c.amount / total) * 100 }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-700">{person.name}</span>
        <span className="text-sm text-slate-400">${total.toFixed(2)}</span>
      </div>

      {total === 0 ? (
        <p className="mt-2 text-xs text-slate-400">No spending yet.</p>
      ) : (
        <>
          <div className="mt-2 flex h-6 w-full overflow-hidden rounded-full bg-slate-100">
            {segments.map((s) => (
              <div
                key={s.key}
                title={`${s.emoji} ${s.label}: ${s.pct.toFixed(0)}% ($${s.amount.toFixed(2)})`}
                className={`${s.color} flex items-center justify-center first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${s.pct}%` }}
              >
                {s.pct >= 12 && (
                  <span className="text-[10px] font-semibold text-white">
                    {s.pct.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {segments.map((s) => (
              <span key={s.key} className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                {s.emoji} {s.label} · {s.pct.toFixed(0)}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function CategoryBreakdown({ entries }) {
  const people = [
    { key: 'A', name: PEOPLE.A, totals: categoryTotalsFor(entries, 'A') },
    { key: 'B', name: PEOPLE.B, totals: categoryTotalsFor(entries, 'B') },
  ]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">Spending by category</h2>
      <div className="mt-4 space-y-5">
        {people.map((p) => (
          <PersonBreakdown key={p.key} person={p} />
        ))}
      </div>
    </div>
  )
}
