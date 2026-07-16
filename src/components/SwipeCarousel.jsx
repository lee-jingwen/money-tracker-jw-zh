import { useEffect, useRef, useState } from 'react'

// Generic horizontal swipe/scroll carousel with a dot-page indicator.
// Children are rendered one per "page" — each gets wrapped so it snaps to
// the full width of the carousel. Pass a `resetKey` that changes whenever
// the set of children changes shape, so the carousel snaps back to page 0
// instead of scrolling to whatever the old index now points at.
export default function SwipeCarousel({ children, resetKey, onActiveChange }) {
  const items = Array.isArray(children) ? children : [children]
  const scrollerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startX: 0, startScrollLeft: 0 })

  useEffect(() => {
    setActiveIndex(0)
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0
    onActiveChange?.(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function handleScroll() {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(idx)
    onActiveChange?.(idx)
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

  if (items.length <= 1) return items[0] ?? null

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
        {items.map((child, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            {child}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
