import { useEffect, useState } from 'react'
import { getEntries, addEntry, updateEntry, deleteEntry } from './api'
import { getStoredPasscode, setStoredPasscode, clearStoredPasscode } from './auth'
import LockScreen from './components/LockScreen'
import BalanceSummary from './components/BalanceSummary'
import CategoryBreakdown from './components/CategoryBreakdown'
import EntryForm from './components/EntryForm'
import EntryList from './components/EntryList'

export default function App() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('add')
  const [editingEntry, setEditingEntry] = useState(null)

  const [checkingPasscode, setCheckingPasscode] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [passcodeError, setPasscodeError] = useState(null)

  useEffect(() => {
    if (getStoredPasscode()) {
      load()
    } else {
      setCheckingPasscode(false)
    }
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getEntries()
      setEntries(data)
      setUnlocked(true)
    } catch (err) {
      if (err.unauthorized) {
        clearStoredPasscode()
        setPasscodeError('Incorrect passcode, try again.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      setCheckingPasscode(false)
      setUnlocking(false)
    }
  }

  function handleUnlock(code) {
    setUnlocking(true)
    setPasscodeError(null)
    setStoredPasscode(code)
    load()
  }

  function lock() {
    clearStoredPasscode()
    setUnlocked(false)
    setEntries([])
  }

  // Returns true if the error was an auth failure (and was handled by
  // bouncing back to the lock screen), false otherwise.
  function handleAuthError(err) {
    if (err.unauthorized) {
      clearStoredPasscode()
      setUnlocked(false)
      setPasscodeError('Session expired — please re-enter the passcode.')
      return true
    }
    return false
  }

  async function handleAdd(entry) {
    try {
      const result = await addEntry(entry)
      setEntries((prev) => [...prev, { ...entry, id: result.id }])
    } catch (err) {
      if (handleAuthError(err)) return
      throw err
    }
  }

  async function handleUpdate(entry) {
    try {
      await updateEntry(entry)
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
    } catch (err) {
      if (handleAuthError(err)) return
      throw err
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    try {
      await deleteEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      if (handleAuthError(err)) return
      throw err
    }
  }

  function startEdit(entry) {
    setEditingEntry(entry)
    setTab('add')
  }

  function cancelEdit() {
    setEditingEntry(null)
    setTab('view')
  }

  if (checkingPasscode) {
    return <div className="min-h-screen bg-slate-50" />
  }

  if (!unlocked) {
    return <LockScreen onUnlock={handleUnlock} error={passcodeError} submitting={unlocking} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Money Tracker</h1>
            <p className="text-sm text-slate-500">Who paid for what, at a glance.</p>
          </div>
          <button
            type="button"
            onClick={lock}
            title="Lock"
            className="rounded-full p-2 text-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
          >
            🔒
          </button>
        </header>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setTab('add')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Add Entry
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null)
              setTab('view')
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'view' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            View Entries
          </button>
        </div>

        <div className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Couldn't load entries: {error}
            </div>
          )}

          {tab === 'add' ? (
            <EntryForm
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              editingEntry={editingEntry}
              onCancelEdit={cancelEdit}
            />
          ) : loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : (
            <>
              <BalanceSummary entries={entries} />
              <CategoryBreakdown entries={entries} />
              <EntryList entries={entries} onEdit={startEdit} onDelete={handleDelete} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
