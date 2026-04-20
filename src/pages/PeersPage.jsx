import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { fetchPeers, fetchInstitutionalDetails } from '../services/dbService'

export default function PeersPage() {
  const { user } = useAuth()
  const { userProfile } = useAppData()
  const navigate = useNavigate()
  const [peers, setPeers] = useState([])
  const [collegeName, setCollegeName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const details = await fetchInstitutionalDetails(user.uid).catch(() => null)
        const college = details?.institution || userProfile?.college_name || ''
        setCollegeName(college)
        if (college) {
          const data = await fetchPeers(college, user.uid)
          setPeers(data)
        } else {
          setPeers([])
        }
      } catch (err) {
        setPeers([])
        setError(err.message || 'Could not load peers right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid, userProfile?.college_name])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Finding your peers...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold text-slate-900">Peers</h2>
        <p className="text-sm text-slate-500">
          {collegeName
            ? `Users from ${collegeName}`
            : 'Add your institution in Institutional Details to see peers from the same college.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!collegeName ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-sm text-slate-500">No institution set yet.</p>
          <button
            onClick={() => navigate('/institutional-details')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Add Institution Details
          </button>
        </div>
      ) : peers.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">No other users from {collegeName} yet.</p>
          <p className="mt-1 text-xs text-slate-400">Invite your classmates to join CampusSync!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {peers.map((peer) => {
            const initial = (peer.username || peer.name || peer.email || '?')[0].toUpperCase()
            return (
              <article key={peer.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {peer.username || peer.name || 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{peer.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-xs text-slate-500">{collegeName}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
