import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { createDoc, deleteDocument, updateDocument } from '../services/dbService'
import { sortByDeadline } from '../utils/taskHelpers'

const initialForm = { title: '', description: '', deadline: '', priority: 'medium', status: 'pending', groupId: '' }

export default function TasksPage() {
  const { user } = useAuth()
  const { tasks, groups } = useAppData()
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  const filteredTasks = useMemo(() => {
    const base = sortByDeadline(tasks)
    return filter === 'all' ? base : base.filter((task) => task.status === filter)
  }, [tasks, filter])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      const payload = { ...form, userId: user.uid, deadline: form.deadline || null }
      try {
        if (editingId) {
          await updateDocument('tasks', editingId, payload)
        } else {
          await createDoc('tasks', payload)
        }
        setForm(initialForm)
        setEditingId(null)
        titleRef.current?.focus()
      } catch (err) {
        setError(err.message || 'Could not save the task.')
      }
    },
    [editingId, form, user.uid],
  )

  const startEdit = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title || '',
      description: task.description || '',
      deadline: task.deadline || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      groupId: task.groupId || '',
    })
    titleRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">{editingId ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-2">
          <input ref={titleRef} className="rounded-lg border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="rounded-lg border p-2" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input type="date" className="rounded-lg border p-2" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
          <select className="rounded-lg border p-2" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <select className="rounded-lg border p-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="pending">Pending</option><option value="completed">Completed</option>
          </select>
          <select className="rounded-lg border p-2" value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))}>
            <option value="">Personal task</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white md:col-span-2">{editingId ? 'Update Task' : 'Create Task'}</button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2">
          {['all', 'pending', 'completed'].map((key) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-1 text-sm ${filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{key}</button>
          ))}
        </div>
        {filteredTasks.map((task) => (
          <article key={task.id} className="mb-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-slate-500">{task.priority} - {task.status} {task.groupId ? '(group)' : ''}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded bg-amber-100 px-2 py-1 text-sm" onClick={() => startEdit(task)}>Edit</button>
              <button
                className="rounded bg-rose-100 px-2 py-1 text-sm"
                onClick={async () => {
                  setError('')
                  try {
                    await deleteDocument('tasks', task.id)
                  } catch (err) {
                    setError(err.message || 'Could not delete the task.')
                  }
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
