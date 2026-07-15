import { useState } from 'react'

export default function LockScreen({ onUnlock, error, submitting }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value) return
    onUnlock(value)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="text-center">
          <span className="text-3xl">🔒</span>
          <h1 className="mt-2 text-lg font-bold text-slate-900">Money Tracker</h1>
          <p className="text-sm text-slate-500">Enter the passcode to continue</p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />

        {error && <p className="mt-2 text-center text-sm font-medium text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
