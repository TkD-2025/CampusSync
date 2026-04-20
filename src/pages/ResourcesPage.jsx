import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { createDoc, deleteDocument } from '../services/dbService'

export default function ResourcesPage() {
  const { user } = useAuth()
  const { resources } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', subject: '', semester: '', fileURL: '' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createDoc('resources', { ...form, uploadedBy: user.uid })
      setForm({ title: '', subject: '', semester: '', fileURL: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Could not save the resource.')
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
          <h2 className="text-xl font-semibold text-slate-900">Resources</h2>
          <p className="text-sm text-slate-500">Study materials and shared links</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>

      {/* Add Resource Form */}
      {showForm && (
        <form onSubmit={submit} className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">New Resource</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Title *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Data Structures Notes"
                value={form.title}
                onChange={onChange('title')}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Subject *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Computer Science"
                value={form.subject}
                onChange={onChange('subject')}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Semester *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="e.g., Semester 4"
                value={form.semester}
                onChange={onChange('semester')}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Resource URL *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="https://..."
                value={form.fileURL}
                onChange={onChange('fileURL')}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Resource'}
          </button>
        </form>
      )}

      {/* Resources as dark blue pills */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        {resources.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No resources yet. Add one above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => setSelected(resource)}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16304f] active:scale-95"
              >
                {resource.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{selected.title}</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <DetailRow label="Subject" value={selected.subject} />
              <DetailRow label="Semester" value={selected.semester} />
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Link</span>
                <a
                  href={selected.fileURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                >
                  Open Resource ↗
                </a>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={async () => {
                  setError('')
                  try {
                    await deleteDocument('resources', selected.id)
                    setSelected(null)
                  } catch (err) {
                    setError(err.message || 'Could not delete the resource.')
                  }
                }}
                className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}
