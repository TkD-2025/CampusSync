import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchInstitutionalDetails, upsertInstitutionalDetails } from '../services/dbService'

export default function InstitutionalDetailsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ institution: '', department: '', semester: '', studentId: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    fetchInstitutionalDetails(user.uid)
      .then((data) => { if (data) setForm(data) })
      .catch(() => setError('Could not load details. The institutional_details table may not exist yet.'))
      .finally(() => setLoading(false))
  }, [user?.uid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await upsertInstitutionalDetails(user.uid, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save. Ensure the institutional_details table exists in Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const onChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold text-slate-900">Institutional Details</h2>
        <p className="text-sm text-slate-600">
          Your academic details are stored securely and used to discover Peers from the same institution.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Institution / College Name"
            placeholder="e.g., Scaler School of Technology"
            value={form.institution}
            onChange={onChange('institution')}
          />
          <Field
            label="Department"
            placeholder="e.g., Computer Science & Engineering"
            value={form.department}
            onChange={onChange('department')}
          />
          <Field
            label="Current Semester"
            placeholder="e.g., Semester 4"
            value={form.semester}
            onChange={onChange('semester')}
          />
          <Field
            label="Student ID / Roll Number"
            placeholder="e.g., CS2024001"
            value={form.studentId}
            onChange={onChange('studentId')}
          />
        </div>
        {saved && <p className="mt-3 text-sm font-medium text-green-600">Details saved successfully!</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Details'}
        </button>
      </form>
    </section>
  )
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
