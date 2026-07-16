import { CURRENCIES, DEFAULT_CURRENCY, PEOPLE, BOTH, otherCurrency, currencySymbol, formatAmount } from '../config'
import SwipeCarousel from './SwipeCarousel'

// How much of a currency is actually on hand: what's come in via
// conversions, minus what's been converted away, minus what expense
// entries have spent in that currency. `person` narrows this to one
// person's individual wallet — a "Shared"/"Both" conversion or expense
// belongs only to the combined shared balance, never to an individual's,
// so it's skipped entirely rather than split in half. The shared balance,
// in turn, only counts spending/conversions actually done by "Both" — an
// individual expense or conversion only affects that person's own wallet.
// Converting currency isn't spending — money converted OUT of a currency
// doesn't reduce an individual's balance (only actual expenses do); money
// converted IN still counts, since that's new cash landing in this currency.
function walletBalance(entries, conversions, currency, person) {
  let broughtIn = 0
  let takenOut = 0
  let spent = 0

  for (const c of conversions) {
    if (c.toCurrency === currency) {
      const amount = Number(c.toAmount)
      if (person) {
        if (c.paidBy === person) broughtIn += amount
      } else if (c.paidBy === BOTH) {
        broughtIn += amount
      }
    }
    if (c.fromCurrency === currency && !person && c.paidBy === BOTH) {
      takenOut += Number(c.fromAmount)
    }
  }
  for (const e of entries) {
    if ((e.currency || DEFAULT_CURRENCY) !== currency) continue
    const amount = Number(e.amount)
    if (person) {
      if (e.paidBy === person) spent += amount
    } else if (e.paidBy === BOTH) {
      spent += amount
    }
  }

  return { broughtIn, takenOut, spent, onHand: broughtIn - takenOut - spent }
}

// Per-person share of how much of `fromCurrency` each has converted away.
// A "Shared" (Both) conversion belongs only to the shared total, not to
// either individual's wallet, so it's excluded here entirely.
function personConvertedTotals(conversions, fromCurrency) {
  const totals = { A: 0, B: 0 }
  for (const c of conversions) {
    if (c.fromCurrency !== fromCurrency || c.paidBy === BOTH) continue
    totals[c.paidBy] = (totals[c.paidBy] || 0) + Number(c.fromAmount)
  }
  return totals
}

// Same "Both only" rule as the shared balance: an individually-converted
// amount belongs to that person's own wallet, not the shared total.
function sharedConvertedTotal(conversions, fromCurrency) {
  return conversions
    .filter((c) => c.fromCurrency === fromCurrency && c.paidBy === BOTH)
    .reduce((sum, c) => sum + Number(c.fromAmount), 0)
}

// Per-person share of the shared pool's spending/conversions, for display.
// A fully-settled "Both" item (no debt) is a genuine 50/50 split. One with
// an outstanding debt (owedAmount's sign marks who owes — see EntryForm/
// EntryList) attributes the whole amount to whoever actually fronted it —
// the ower's share only shows up once "Mark as paid" clears the debt and it
// becomes a real 50/50 split.
function sharedBreakdown(items, currency, amountKey, currencyKey) {
  const totals = { A: 0, B: 0 }
  for (const item of items) {
    if ((item[currencyKey] || DEFAULT_CURRENCY) !== currency || item.paidBy !== BOTH) continue
    const amount = Number(item[amountKey])
    const owed = Number(item.owedAmount) || 0
    if (owed === 0) {
      totals.A += amount / 2
      totals.B += amount / 2
    } else if (owed > 0) {
      totals.A += amount
    } else {
      totals.B += amount
    }
  }
  return totals
}

function BalanceCard({ meta, label, balance, badge, paidBreakdown }) {
  const { symbol, gradient, shadow } = meta

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg ${shadow}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{label}</p>
        {badge && (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">
        {symbol}
        {formatAmount(balance.onHand)}
      </p>
      {paidBreakdown && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/80">{PEOPLE.A} paid</p>
            <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(paidBreakdown.A)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/80">{PEOPLE.B} paid</p>
            <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(paidBreakdown.B)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ConvertedCard({ meta, label, amount, breakdown, badge }) {
  const { symbol, gradient, shadow } = meta

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg ${shadow}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{label}</p>
        {badge && (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">
        {symbol}
        {formatAmount(amount)}
      </p>
      {breakdown && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/80">{PEOPLE.A} converted</p>
            <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(breakdown.A)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/80">{PEOPLE.B} converted</p>
            <p className="mt-0.5 text-lg font-semibold">{symbol}{formatAmount(breakdown.B)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Wallet({ entries, conversions }) {
  const sharedCurrency = DEFAULT_CURRENCY
  const otherCur = otherCurrency(sharedCurrency)
  const sharedMeta = CURRENCIES.find((c) => c.key === sharedCurrency)
  const otherMeta = CURRENCIES.find((c) => c.key === otherCur)

  const sharedBalance = walletBalance(entries, conversions, sharedCurrency)
  const convertedTotals = personConvertedTotals(conversions, otherCur)
  const combinedConverted = sharedConvertedTotal(conversions, otherCur)
  const sharedSpentBreakdown = sharedBreakdown(entries, sharedCurrency, 'amount', 'currency')
  const sharedConvertedBreakdown = sharedBreakdown(conversions, otherCur, 'fromAmount', 'fromCurrency')

  const balanceAJPY = walletBalance(entries, conversions, sharedCurrency, 'A')
  const balanceBJPY = walletBalance(entries, conversions, sharedCurrency, 'B')
  const combinedOnHand = balanceAJPY.onHand + balanceBJPY.onHand
  const combinedMeta = {
    symbol: currencySymbol(sharedCurrency),
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-200/50',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-base font-semibold text-slate-800">Shared</h2>
        <SwipeCarousel resetKey={`${sharedCurrency}-${otherCur}`}>
          <BalanceCard
            meta={sharedMeta}
            label="Shared Balance"
            balance={sharedBalance}
            paidBreakdown={sharedSpentBreakdown}
          />
          <ConvertedCard
            meta={otherMeta}
            label={`${otherCur} Converted So Far`}
            amount={combinedConverted}
            breakdown={sharedConvertedBreakdown}
          />
        </SwipeCarousel>
      </div>

      <div>
        <h2 className="mb-2 text-base font-semibold text-slate-800">Individual Spendings</h2>
        <ConvertedCard meta={combinedMeta} label="Combined Balance" amount={combinedOnHand} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <BalanceCard meta={sharedMeta} label={`${PEOPLE.A} Balance`} balance={balanceAJPY} />
            <ConvertedCard meta={otherMeta} label={`${PEOPLE.A} Converted`} amount={convertedTotals.A} />
          </div>
          <div className="space-y-3">
            <BalanceCard meta={sharedMeta} label={`${PEOPLE.B} Balance`} balance={balanceBJPY} />
            <ConvertedCard meta={otherMeta} label={`${PEOPLE.B} Converted`} amount={convertedTotals.B} />
          </div>
        </div>
      </div>
    </div>
  )
}
