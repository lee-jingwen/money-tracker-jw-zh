import { useEffect, useState } from 'react'
import { getEntries, addEntry, updateEntry, deleteEntry } from './api'
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

  useEffect(() => {
    getEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(entry) {
    const result = await addEntry(entry)
    setEntries((prev) => [...prev, { ...entry, id: result.id }])
  }

  async function handleUpdate(entry) {
    await updateEntry(entry)
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    await deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function startEdit(entry) {
    setEditingEntry(entry)
    setTab('add')
  }

  function cancelEdit() {
    setEditingEntry(null)
    setTab('view')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Money Tracker</h1>
          <p className="text-sm text-slate-500">Who paid for what, at a glance.</p>
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
