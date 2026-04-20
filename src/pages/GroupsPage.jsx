import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { createDoc, updateDocument, deleteDocument } from '../services/dbService'

export default function GroupsPage() {
  const { user } = useAuth()
  const { groups, groupInvitations } = useAppData()
  const [name, setName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')

  const myOwnGroups = groups.filter((g) => g.leaderId === user?.uid)

  const createGroup = async (e) => {
    e.preventDefault()
    if (!name.trim() || !user?.uid || !user?.email) return
    setCreating(true)
    setError('')
    try {
      await createDoc('groups', {
        name: name.trim(),
        members: [user.email],
        leaderId: user.uid,
        invitees: [],
      })
      setName('')
    } catch (err) {
      setError(err.message || 'Could not create the group.')
    } finally {
      setCreating(false)
    }
  }

  const sendInvite = async (e) => {
    e.preventDefault()
    setError('')
    const group = groups.find((g) => g.id === selectedGroupId)
    if (!group || !inviteEmail.trim()) return
    const normalizedInviteEmail = inviteEmail.trim().toLowerCase()
    if (group.members.includes(normalizedInviteEmail) || group.invitees?.includes(normalizedInviteEmail)) {
      alert('This person is already a member or has a pending invitation.')
      return
    }
    setInviting(true)
    try {
      await updateDocument('groups', group.id, {
        name: group.name,
        members: group.members,
        leaderId: group.leaderId,
        invitees: [...(group.invitees || []), normalizedInviteEmail],
      })
      setInviteEmail('')
    } catch (err) {
      setError(err.message || 'Could not send the invitation.')
    } finally {
      setInviting(false)
    }
  }

  const acceptInvitation = async (group) => {
    setError('')
    try {
      await updateDocument('groups', group.id, {
        name: group.name,
        leaderId: group.leaderId,
        members: [...group.members, user.email],
        invitees: (group.invitees || []).filter((e) => e !== user.email),
      })
    } catch (err) {
      setError(err.message || 'Could not accept the invitation.')
    }
  }

  const rejectInvitation = async (group) => {
    setError('')
    try {
      await updateDocument('groups', group.id, {
        name: group.name,
        leaderId: group.leaderId,
        members: group.members,
        invitees: (group.invitees || []).filter((e) => e !== user.email),
      })
    } catch (err) {
      setError(err.message || 'Could not reject the invitation.')
    }
  }

  const removeMember = async (group, email) => {
    setError('')
    try {
      await updateDocument('groups', group.id, {
        name: group.name,
        leaderId: group.leaderId,
        members: group.members.filter((e) => e !== email),
        invitees: group.invitees || [],
      })
    } catch (err) {
      setError(err.message || 'Could not remove the member.')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Pending Invitations */}
      {groupInvitations.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h2 className="mb-3 font-semibold text-indigo-900">Pending Invitations</h2>
          <div className="space-y-2">
            {groupInvitations.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                <div>
                  <p className="font-medium text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-500">You've been invited to join this group</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvitation(group)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectInvitation(group)}
                    className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Group */}
      <form onSubmit={createGroup} className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Create Group</h2>
        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">You will be set as the group leader.</p>
      </form>

      {/* Invite Member */}
      <form onSubmit={sendInvite} className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Invite to Group</h2>
        {myOwnGroups.length === 0 ? (
          <p className="text-sm text-slate-500">Create a group first to invite members.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              required
            >
              <option value="">Select your group</option>
              {myOwnGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              type="email"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Member's email"
              required
            />
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        )}
      </form>

      {/* All Groups */}
      <div className="space-y-3">
        {groups.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">No groups yet.</div>
        )}
        {groups.map((group) => {
          const isLeader = group.leaderId === user?.uid
          const isMember = group.members.includes(user?.email)
          return (
            <article key={group.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    {isLeader && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        👑 Leader
                      </span>
                    )}
                    {isMember && !isLeader && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Member
                      </span>
                    )}
                  </div>

                  {/* Members */}
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Members</p>
                    <div className="flex flex-wrap gap-1">
                      {group.members.length === 0 ? (
                        <span className="text-xs text-slate-400">No members</span>
                      ) : (
                        group.members.map((email) => (
                          <span key={email} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                            {email}
                            {isLeader && email !== user.email && (
                              <button
                                onClick={() => removeMember(group, email)}
                                className="ml-0.5 text-slate-400 transition hover:text-rose-600"
                                title="Remove member"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pending invitees (visible to leader) */}
                  {isLeader && (group.invitees || []).length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Pending Invitations</p>
                      <div className="flex flex-wrap gap-1">
                        {group.invitees.map((email) => (
                          <span key={email} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                            {email} · pending
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isLeader && (
                  <button
                    onClick={async () => {
                      setError('')
                      try {
                        await deleteDocument('groups', group.id)
                      } catch (err) {
                        setError(err.message || 'Could not delete the group.')
                      }
                    }}
                    className="flex-shrink-0 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
