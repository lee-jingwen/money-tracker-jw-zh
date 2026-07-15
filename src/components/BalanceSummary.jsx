import { useEffect, useRef, useState } from 'react'
import { PEOPLE, BOTH, CURRENCIES, DEFAULT_CURRENCY, formatAmount } from '../config'

function currencyTotals(entries, currency) {
  const scoped = entries.filter((e) => (e.currency || DEFAULT_CURRENCY) === currency)

  const totals = scoped.reduce((acc, e) => {
    const amount = Number(e.amount)
    if (e.paidBy === BOTH) {
      acc.A += amount / 2
      acc.B += amount / 2
    } else {
      acc[e.paidBy] = (acc[e.paidBy] || 0) + amount
    }
    return acc
  }, { A: 0, B: 0 })

  // Net balance comes only from explicit per-entry "owed" amounts (set when
  // logging a single-payer expense), never assumed from raw totals.
  const owedToA = scoped.reduce(
    (sum, e) => (e.paidBy === 'A' ? sum + (Number(e.owedAmount) || 0) : sum),
    0,
  )
  const owedToB = scoped.reduce(
    (sum, e) => (e.paidBy === 'B' ? sum + (Number(e.owedAmount) || 0) : sum),
    0,
  )

  return { totals, net: owedToA - owedToB }
}

function CurrencySummary({ meta, totals, net }) {
  const { key: currency, symbol, gradient, shadow } = meta
  const total = totals.A + totals.B

  let headline
  let headlineLabel
  if (Math.abs(net) < 0.005) {
    headlineLabel = 'Total spent'
    headline = `${symbol}${formatAmount(total)}`
  } else if (net > 0) {
    headlineLabel = 'Net balance'
    headline = `${PEOPLE.B} owes ${PEOPLE.A} ${symbol}${formatAmount(net)}`
  } else {
    headlineLabel = 'Net balance'
    headline = `${PEOPLE.A} owes ${PEOPLE.B} ${symbol}${formatAmount(Math.abs(net))}`
  }

  return (
    <div
      className={`w-full shrink-0 snap-center rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg ${shadow}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{headlineLabel}</p>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
          {currency}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">{headline}</p>

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

export default function BalanceSummary({ entries, onActiveCurrencyChange }) {
  const present = new Set(entries.map((e) => e.currency || DEFAULT_CURRENCY))
  const currencies = CURRENCIES.filter((c) => present.has(c.key))
  if (currencies.length === 0) currencies.push(CURRENCIES.find((c) => c.key === DEFAULT_CURRENCY))
  const currencyKeys = currencies.map((c) => c.key).join(',')

  const scrollerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startX: 0, startScrollLeft: 0 })

  // Reset to the first card whenever the set of currencies present changes,
  // and tell the parent which currency is showing so other summaries (e.g.
  // category breakdown) can follow the swiped card.
  useEffect(() => {
    setActiveIndex(0)
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0
    onActiveCurrencyChange?.(currencies[0].key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyKeys])

  function handleScroll() {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(idx)
    onActiveCurrencyChange?.(currencies[idx]?.key ?? currencies[0].key)
  }

  // Mouse doesn't have a native "swipe" gesture like touch/trackpad, so drag
  // the scroller manually — scoped to mouse only, touch keeps its native
  // scroll (which already works) untouched.
  function handlePointerDown(e) {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    drag.current = { startX: e.clientX, startScrollLeft: el.scrollLeft }
    setDragging(true)
    el.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = drag.current.startScrollLeft - (e.clientX - drag.current.startX)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  if (currencies.length === 1) {
    const { totals, net } = currencyTotals(entries, currencies[0].key)
    return <CurrencySummary meta={currencies[0]} totals={totals} net={net} />
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`no-scrollbar flex gap-3 overflow-x-auto ${
          dragging ? 'cursor-grabbing select-none' : 'cursor-grab scroll-smooth'
        }`}
        style={{ scrollSnapType: dragging ? 'none' : 'x mandatory' }}
      >
        {currencies.map((meta) => {
          const { totals, net } = currencyTotals(entries, meta.key)
          return <CurrencySummary key={meta.key} meta={meta} totals={totals} net={net} />
        })}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {currencies.map((meta, i) => (
          <span
            key={meta.key}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
