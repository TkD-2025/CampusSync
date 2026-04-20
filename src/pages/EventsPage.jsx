import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useAppData } from '../hooks/useAppData'
import { createDoc, deleteDocument, seedDemoEvents } from '../services/dbService'

export default function EventsPage() {
  const { events } = useAppData()
  const [category, setCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', date: '', description: '', location: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    seedDemoEvents().catch(() => {})
  }, [])

  const categories = useMemo(
    () => ['all', ...new Set(events.map((e) => e.category).filter(Boolean))],
    [events],
  )

  const filtered = useMemo(
    () => (category === 'all' ? events : events.filter((e) => e.category === category)),
    [category, events],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createDoc('events', form)
      setForm({ title: '', category: '', date: '', description: '', location: '', city: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Could not save the event.')
    } finally {
      setSaving(false)
    }
  }

  const onChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Events</h2>
          <p className="text-sm text-slate-500">Upcoming campus events and activities</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">New Event</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Title *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Arise Hackathon"
                value={form.title}
                onChange={onChange('title')}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Hackathon, Workshop"
                value={form.category}
                onChange={onChange('category')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                value={form.date}
                onChange={onChange('date')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Location</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Scaler School of Technology"
                value={form.location}
                onChange={onChange('location')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">City</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Bangalore"
                value={form.city}
                onChange={onChange('city')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <textarea
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Brief description of the event"
                rows="2"
                value={form.description}
                onChange={onChange('description')}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Adding...' : 'Add Event'}
          </button>
        </form>
      )}

      {/* Events List */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        {/* Category Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">No events yet. Add one above.</p>
          )}
          {filtered.map((event) => (
            <article
              key={event.id}
              className="group relative rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{event.title}</p>
                    {event.category && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {event.category}
                      </span>
                    )}
                  </div>
                  {event.date && (
                    <p className="mt-1 text-sm text-slate-500">
                      📅 {format(new Date(event.date), 'PPP')}
                    </p>
                  )}
                  {(event.location || event.city) && (
                    <p className="text-sm text-slate-500">
                      📍 {[event.location, event.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1.5 text-sm text-slate-600">{event.description}</p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setError('')
                    try {
                      await deleteDocument('events', event.id)
                    } catch (err) {
                      setError(err.message || 'Could not delete the event.')
                    }
                  }}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                  title="Delete event"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
