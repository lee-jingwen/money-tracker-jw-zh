import { PEOPLE, BOTH, CURRENCIES, DEFAULT_CURRENCY, formatAmount } from '../config'
import SwipeCarousel from './SwipeCarousel'

function currencyTotals(entries, conversions, currency) {
  const scopedEntries = entries.filter((e) => (e.currency || DEFAULT_CURRENCY) === currency)
  const scopedConversions = conversions.filter((c) => c.fromCurrency === currency)

  // "Paid" / "Total spent" reflects actual spending only. Converting
  // currency just moves money between forms — it isn't spent — so
  // conversions never contribute here (they do feed the Wallet's on-hand
  // balance instead).
  // A settled "Both" entry (no debt) is a genuine 50/50 split. One with an
  // outstanding debt — owedAmount's sign marks who owes, see EntryForm/
  // EntryList — attributes the whole amount to whoever actually fronted
  // it; the ower's share only counts once "Mark as paid" clears the debt.
  const totals = scopedEntries.reduce((acc, e) => {
    const amount = Number(e.amount)
    if (e.paidBy === BOTH) {
      const owed = Number(e.owedAmount) || 0
      if (owed === 0) {
        acc.A += amount / 2
        acc.B += amount / 2
      } else if (owed > 0) {
        acc.A += amount
      } else {
        acc.B += amount
      }
    } else {
      acc[e.paidBy] = (acc[e.paidBy] || 0) + amount
    }
    return acc
  }, { A: 0, B: 0 })

  // Net balance still folds in conversions, though — an explicit "owed"
  // amount from converting currency is a real debt, same as from an
  // expense, even though the conversion itself isn't "spending".
  const owedToA =
    scopedEntries.reduce((sum, e) => (e.paidBy === 'A' ? sum + (Number(e.owedAmount) || 0) : sum), 0) +
    scopedConversions.reduce((sum, c) => (c.paidBy === 'A' ? sum + (Number(c.owedAmount) || 0) : sum), 0)
  const owedToB =
    scopedEntries.reduce((sum, e) => (e.paidBy === 'B' ? sum + (Number(e.owedAmount) || 0) : sum), 0) +
    scopedConversions.reduce((sum, c) => (c.paidBy === 'B' ? sum + (Number(c.owedAmount) || 0) : sum), 0)

  // A "Both" item's debt isn't owed to the other person — it's owed to the
  // shared pool itself (see EntryForm/EntryList). Its owedAmount sign marks
  // who still owes their half (positive = ZH, negative = JW).
  const owedToShared =
    scopedEntries.reduce((sum, e) => (e.paidBy === BOTH ? sum + (Number(e.owedAmount) || 0) : sum), 0) +
    scopedConversions.reduce((sum, c) => (c.paidBy === BOTH ? sum + (Number(c.owedAmount) || 0) : sum), 0)

  return { totals, net: owedToA - owedToB, owedToShared }
}

function CurrencySummary({ meta, totals, net, owedToShared }) {
  const { key: currency, symbol, gradient, shadow } = meta
  const total = totals.A + totals.B

  // Stack up whichever debts are outstanding — peer-to-peer (net) and/or
  // owed to the shared pool — same treatment as "Total spent" normally
  // gets. If neither is outstanding, "Total spent" is the only headline.
  const headlines = []
  if (Math.abs(net) >= 0.005) {
    headlines.push({
      label: 'Net balance',
      text:
        net > 0
          ? `${PEOPLE.B} owes ${PEOPLE.A} ${symbol}${formatAmount(net)}`
          : `${PEOPLE.A} owes ${PEOPLE.B} ${symbol}${formatAmount(Math.abs(net))}`,
    })
  }
  if (Math.abs(owedToShared) >= 0.005) {
    headlines.push({
      label: 'Owed to shared wallet',
      text: `${owedToShared > 0 ? PEOPLE.B : PEOPLE.A} owes ${symbol}${formatAmount(Math.abs(owedToShared))}`,
    })
  }
  if (headlines.length === 0) {
    headlines.push({ label: 'Total spent', text: `${symbol}${formatAmount(total)}` })
  }

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg ${shadow}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{headlines[0].label}</p>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
          {currency}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">{headlines[0].text}</p>
      {headlines.slice(1).map((h) => (
        <div key={h.label} className="mt-2">
          <p className="text-xs font-medium text-white/80">{h.label}</p>
          <p className="text-base font-semibold">{h.text}</p>
        </div>
      ))}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-white/80">{PEOPLE.A} paid</p>
          <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(totals.A)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <p className="text-xs font-medium text-white/80">{PEOPLE.B} paid</p>
          <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(totals.B)}</p>
        </div>
      </div>
    </div>
  )
}

export default function BalanceSummary({ entries, conversions = [], onActiveCurrencyChange }) {
  const present = new Set([
    ...entries.map((e) => e.currency || DEFAULT_CURRENCY),
    ...conversions.map((c) => c.fromCurrency),
  ])
  const currencies = CURRENCIES.filter((c) => present.has(c.key))
  if (currencies.length === 0) currencies.push(CURRENCIES.find((c) => c.key === DEFAULT_CURRENCY))
  const currencyKeys = currencies.map((c) => c.key).join(',')

  return (
    <SwipeCarousel
      resetKey={currencyKeys}
      onActiveChange={(idx) => onActiveCurrencyChange?.(currencies[idx]?.key ?? currencies[0].key)}
    >
      {currencies.map((meta) => {
        const { totals, net, owedToShared } = currencyTotals(entries, conversions, meta.key)
        return <CurrencySummary key={meta.key} meta={meta} totals={totals} net={net} owedToShared={owedToShared} />
      })}
    </SwipeCarousel>
  )
}
