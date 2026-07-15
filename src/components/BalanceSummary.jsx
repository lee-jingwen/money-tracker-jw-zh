import { PEOPLE, BOTH } from '../config'

export default function BalanceSummary({ entries }) {
  const totals = entries.reduce((acc, e) => {
    const amount = Number(e.amount)
    if (e.paidBy === BOTH) {
      acc.A += amount / 2
      acc.B += amount / 2
    } else {
      acc[e.paidBy] = (acc[e.paidBy] || 0) + amount
    }
    return acc
  }, { A: 0, B: 0 })

  const total = totals.A + totals.B

  // Net balance comes only from explicit per-entry "owed" amounts (set when
  // logging a single-payer expense), never assumed from raw totals.
  const owedToA = entries.reduce(
    (sum, e) => (e.paidBy === 'A' ? sum + (Number(e.owedAmount) || 0) : sum),
    0,
  )
  const owedToB = entries.reduce(
    (sum, e) => (e.paidBy === 'B' ? sum + (Number(e.owedAmount) || 0) : sum),
    0,
  )
  const net = owedToA - owedToB

  let headline
  let headlineLabel
  if (Math.abs(net) < 0.005) {
    headlineLabel = 'Total spent'
    headline = `$${total.toFixed(2)}`
  } else if (net > 0) {
    headlineLabel = 'Net balance'
    headline = `${PEOPLE.B} owes ${PEOPLE.A} $${net.toFixed(2)}`
  } else {
    headlineLabel = 'Net balance'
    headline = `${PEOPLE.A} owes ${PEOPLE.B} $${Math.abs(net).toFixed(2)}`
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-lg shadow-indigo-200/50">
      <p className="text-sm font-medium text-indigo-100">{headlineLabel}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{headline}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-indigo-100">{PEOPLE.A} paid</p>
          <p className="mt-0.5 text-lg font-semibold">${totals.A.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-indigo-100">{PEOPLE.B} paid</p>
          <p className="mt-0.5 text-lg font-semibold">${totals.B.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
