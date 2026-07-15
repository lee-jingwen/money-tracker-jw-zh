import { useRef, useState } from 'react'

const ACTION_WIDTH = 160 // px — total width of the revealed Edit + Delete buttons

export default function SwipeableRow({ children, onEdit, onDelete }) {
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startX: 0, startOffset: 0, moved: false })

  function handlePointerDown(e) {
    // Let buttons inside the row (e.g. "Mark as paid") handle their own
    // clicks — capturing the pointer here would reroute their click event
    // to this row instead.
    if (e.target.closest('button')) return
    drag.current = { startX: e.clientX, startOffset: x, moved: false }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    const delta = e.clientX - drag.current.startX
    if (Math.abs(delta) > 4) drag.current.moved = true
    const next = Math.min(0, Math.max(-ACTION_WIDTH, drag.current.startOffset + delta))
    setX(next)
  }

  function handlePointerUp() {
    if (!dragging) return
    setDragging(false)
    if (!drag.current.moved) {
      setX(0) // plain tap: always closes
      return
    }
    setX((current) => (current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0))
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          type="button"
          onClick={() => {
            setX(0)
            onEdit()
          }}
          className="flex w-20 items-center justify-center bg-slate-500 text-sm font-medium text-white active:bg-slate-600"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            setX(0)
            onDelete()
          }}
          className="flex w-20 items-center justify-center bg-rose-500 text-sm font-medium text-white active:bg-rose-600"
        >
          Delete
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${x}px)`, touchAction: 'pan-y' }}
        className={`relative bg-white ${dragging ? '' : 'transition-transform duration-200 ease-out'}`}
      >
        {children}
      </div>
    </div>
  )
}
