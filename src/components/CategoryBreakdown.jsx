import { PEOPLE, BOTH, CATEGORIES, CURRENCIES, DEFAULT_CURRENCY, formatAmount } from '../config'

export function categoryTotalsFor(entries, person, currency) {
  const totals = {}
  for (const e of entries) {
    if ((e.currency || DEFAULT_CURRENCY) !== currency) continue

    // Mirrors the balance card's "paid" totals: who fronted the money for
    // this category, not who ultimately owes what — `owedAmount` only
    // ever feeds the separate "Net balance" / "owes" line.
    let share = 0
    if (e.paidBy === person) share = Number(e.amount)
    else if (e.paidBy === BOTH) share = Number(e.amount) / 2
    else continue

    totals[e.category] = (totals[e.category] || 0) + share
  }
  return totals
}

const CX = 50
const CY = 50
const RADIUS = 34
const STROKE_WIDTH = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Each person's own percentages differ, so the split has to live on their
// own donut (as a per-slice label) rather than in one shared legend number.
function buildArcs(segments) {
  let offset = 0
  return segments.map((s) => {
    const dash = (s.pct / 100) * CIRCUMFERENCE
    const midPct = (offset / CIRCUMFERENCE) * 100 + s.pct / 2
    const arc = {
      ...s,
      strokeDasharray: `${dash} ${CIRCUMFERENCE - dash}`,
      strokeDashoffset: CIRCUMFERENCE - offset,
      midPct,
    }
    offset += dash
    return arc
  })
}

// Avoids a tiny-but-nonzero slice (e.g. a ¥20 entry next to a ¥91,047
// flight) rounding down to a misleading "0%".
function formatPct(pct) {
  return pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`
}

function PersonDonut({ person, symbol }) {
  const total = Object.values(person.totals).reduce((sum, v) => sum + v, 0)

  const segments = CATEGORIES.map((c) => ({
    ...c,
    amount: person.totals[c.key] || 0,
  }))
    .filter((c) => c.amount > 0)
    .map((c) => ({ ...c, pct: (c.amount / total) * 100 }))
    .sort((a, b) => b.amount - a.amount)

  const arcs = total > 0 ? buildArcs(segments) : []

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          {total === 0 ? (
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth={STROKE_WIDTH} />
          ) : (
            <>
              <g transform={`rotate(-90 ${CX} ${CY})`}>
                {arcs.map((s) => (
                  <circle
                    key={s.key}
                    cx={CX}
                    cy={CY}
                    r={RADIUS}
                    fill="none"
                    stroke={s.hex}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={s.strokeDasharray}
                    strokeDashoffset={s.strokeDashoffset}
                  />
                ))}
              </g>
              {arcs.map((s) => {
                const angle = (s.midPct / 100) * 2 * Math.PI - Math.PI / 2
                const cos = Math.cos(angle)
                const sin = Math.sin(angle)

                // Every slice's label sits outside the ring on a leader
                // line — the ring itself is too slim to hold text inside.
                const innerR = RADIUS + STROKE_WIDTH / 2
                const outerR = innerR + 4
                const labelR = outerR + 4
                const anchor = cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle'
                return (
                  <g key={s.key}>
                    <line
                      x1={CX + innerR * cos}
                      y1={CY + innerR * sin}
                      x2={CX + outerR * cos}
                      y2={CY + outerR * sin}
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                    />
                    <text
                      x={CX + labelR * cos}
                      y={CY + labelR * sin}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fontSize="6"
                      fill="#64748b"
                    >
                      {formatPct(s.pct)}
                    </text>
                  </g>
                )
              })}
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-semibold text-slate-700">{person.name}</span>
          <span className="mt-0.5 text-xs text-slate-400">
            {symbol}{formatAmount(total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function CategoryBreakdown({ entries, currency, onSeeAll }) {
  const present = new Set(entries.map((e) => e.currency || DEFAULT_CURRENCY))
  const currencies = CURRENCIES.filter((c) => present.has(c.key))
  if (currencies.length === 0) currencies.push(CURRENCIES.find((c) => c.key === DEFAULT_CURRENCY))

  const active = currencies.find((c) => c.key === currency) || currencies[0]

  const people = [
    { key: 'A', name: PEOPLE.A, totals: categoryTotalsFor(entries, 'A', active.key) },
    { key: 'B', name: PEOPLE.B, totals: categoryTotalsFor(entries, 'B', active.key) },
  ]

  // Combined (both people) totals, just to order the shared legend by
  // relevance — no percentage shown here since each person's split (drawn
  // on their own donut above) can differ from the combined one.
  const combinedTotals = {}
  for (const e of entries) {
    if ((e.currency || DEFAULT_CURRENCY) !== active.key) continue
    combinedTotals[e.category] = (combinedTotals[e.category] || 0) + Number(e.amount)
  }
  const legend = CATEGORIES.map((c) => ({ ...c, amount: combinedTotals[c.key] || 0 })).sort(
    (a, b) => b.amount - a.amount,
  )

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Spending by category</h2>
          {currencies.length > 1 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
              {active.key}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {people.map((p) => (
            <PersonDonut key={p.key} person={p} symbol={active.symbol} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-slate-100 pt-4">
          {legend.map((c) => (
            <span
              key={c.key}
              title={c.label}
              className="flex items-center gap-1 text-xs text-slate-500"
            >
              <span className={`h-2 w-2 rounded-full ${c.color}`} />
              {c.emoji}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSeeAll}
        className="flex w-full items-center justify-end gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-600"
      >
        See all categories
        <span aria-hidden="true">→</span>
      </button>
    </>
  )
}
