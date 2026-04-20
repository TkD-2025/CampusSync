import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { updateUsername } from '../services/dbService'

export default function ProfilePage() {
  const { user } = useAuth()
  const { userProfile } = useAppData()
  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  const currentUsername = userProfile?.username || userProfile?.name || user?.displayName || 'Not set'

  const handleSave = async (e) => {
    e.preventDefault()
    if (!newUsername.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateUsername(user.uid, newUsername.trim())
      setEditing(false)
      setNewUsername('')
      setSuccessMsg('Username updated!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Could not update your username.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-600">Manage your personal account information.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {/* Editable Username */}
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Username</p>
          {editing ? (
            <form onSubmit={handleSave} className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={currentUsername}
                autoFocus
              />
              <button
                type="submit"
                disabled={saving || !newUsername.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setNewUsername('') }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{currentUsername}</p>
              <button
                onClick={() => { setNewUsername(currentUsername !== 'Not set' ? currentUsername : ''); setEditing(true) }}
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Edit
              </button>
            </div>
          )}
          {successMsg && <p className="mt-1 text-xs text-green-600">{successMsg}</p>}
        </article>

        <InfoCard label="Email" value={user?.email || 'Not available'} />
        <InfoCard label="User ID" value={user?.uid || 'Not available'} />
        <InfoCard label="Role" value="Student" />
      </div>
    </section>
  )
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-800">{value}</p>
    </article>
  )
}
