import { useMemo, useState } from 'react'
import { format, startOfMonth, getDay, getDaysInMonth, addMonths, subMonths } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { sortByDeadline } from '../utils/taskHelpers'
import { updateDocument } from '../services/dbService'

export default function DashboardPage() {
  const { tasks, events, myGroups, groupInvitations, userProfile } = useAppData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [calendarDate, setCalendarDate] = useState(new Date())

  const username = userProfile?.username || userProfile?.name || user?.displayName || 'there'

  const upcomingTasks = useMemo(
    () => sortByDeadline(tasks.filter((t) => t.status === 'pending')).slice(0, 5),
    [tasks],
  )

  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return events.filter((e) => e.date && new Date(e.date) >= today).slice(0, 5)
  }, [events])

  const completed = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks])

  const toggleTaskStatus = async (task) => {
    await updateDocument('tasks', task.id, {
      title: task.title,
      description: task.description || '',
      deadline: task.deadline,
      priority: task.priority,
      status: task.status === 'completed' ? 'pending' : 'completed',
      groupId: task.groupId,
      userId: task.userId,
    })
  }

  // Calendar
  const calendarYear = calendarDate.getFullYear()
  const calendarMonth = calendarDate.getMonth()
  const monthStart = startOfMonth(calendarDate)
  const daysInMonth = getDaysInMonth(calendarDate)
  const rawStartDay = getDay(monthStart) // 0=Sun
  const startOffset = rawStartDay === 0 ? 6 : rawStartDay - 1 // shift to Mon-start

  const eventDateSet = useMemo(() => {
    const set = new Set()
    events.forEach((e) => { if (e.date) set.add(e.date.slice(0, 10)) })
    return set
  }, [events])

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const dayStr = (day) =>
    `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <section className="rounded-2xl bg-white px-5 py-4">
        <h2 className="text-3xl font-semibold text-slate-900">Hi {username}!</h2>
        <p className="mt-1 text-sm text-slate-500">Let's take a look at your activity today.</p>
      </section>

      {/* Group invitation banner */}
      {groupInvitations.length > 0 && (
        <section className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3">
          <p className="text-sm font-medium text-indigo-800">
            You have {groupInvitations.length} pending group invitation{groupInvitations.length > 1 ? 's' : ''}.
          </p>
          <button onClick={() => navigate('/groups')} className="text-sm text-indigo-600 underline hover:text-indigo-800">
            View
          </button>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          {/* Task Progress */}
          <div className="rounded-2xl bg-[#d7cdbb] p-5">
            <p className="text-lg font-semibold text-slate-800">Your Task Progress</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Bubble title="Total" value={tasks.length} tone="bg-slate-900 text-white" />
              <Bubble title="Done" value={completed} tone="bg-orange-300 text-slate-900" />
              <Bubble title="Pending" value={tasks.length - completed} tone="bg-rose-300 text-slate-900" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Upcoming Tasks */}
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-slate-500">Upcoming Tasks</h3>
                <button onClick={() => navigate('/tasks')} className="text-xs text-indigo-600 hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {upcomingTasks.length === 0 && <p className="text-sm text-slate-400">No pending tasks.</p>}
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 transition ${
                        task.status === 'completed'
                          ? 'border-green-500 bg-green-500'
                          : 'border-slate-300 hover:border-indigo-500'
                      }`}
                      title={task.status === 'completed' ? 'Mark pending' : 'Mark complete'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </p>
                      {task.deadline && (
                        <p className="text-xs text-slate-400">{format(new Date(task.deadline), 'PP')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-slate-500">Upcoming Events</h3>
                <button onClick={() => navigate('/events')} className="text-xs text-indigo-600 hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {upcomingEvents.length === 0 && <p className="text-sm text-slate-400">No upcoming events.</p>}
                {upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate('/events')}
                    className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{event.title}</p>
                      <p className="text-xs text-slate-400">
                        {event.date ? format(new Date(event.date), 'PP') : 'No date'}
                        {event.city ? ` · ${event.city}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* My Groups */}
          {myGroups.length > 0 && (
            <div className="rounded-2xl bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">My Groups</h3>
              <div className="flex flex-wrap gap-2">
                {myGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate('/groups')}
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Calendar */}
        <div className="rounded-2xl bg-[#1f2430] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Activity Calendar</h3>
              <p className="mt-0.5 text-xs text-slate-300">{format(calendarDate, 'MMMM yyyy')}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCalendarDate((d) => subMonths(d, 1))}
                className="rounded-lg px-2 py-1 text-lg text-slate-300 transition hover:bg-slate-700"
              >
                ‹
              </button>
              <button
                onClick={() => setCalendarDate((d) => addMonths(d, 1))}
                className="rounded-lg px-2 py-1 text-lg text-slate-300 transition hover:bg-slate-700"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="pb-1 text-slate-400">{d}</span>
            ))}
            {Array.from({ length: startOffset }, (_, i) => <span key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const ds = dayStr(day)
              const hasEvent = eventDateSet.has(ds)
              const isToday = ds === todayStr
              return (
                <button
                  key={day}
                  onClick={() => hasEvent && navigate('/events')}
                  className={`rounded-full py-1 text-xs transition ${
                    isToday
                      ? 'bg-indigo-500 font-bold text-white'
                      : hasEvent
                      ? 'cursor-pointer bg-yellow-300 font-semibold text-slate-900 hover:bg-yellow-200'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-300" /> Event</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Today</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function Bubble({ title, value, tone }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-xs uppercase opacity-80">{title}</p>
      <p className="text-3xl font-semibold leading-tight">{value}</p>
    </div>
  )
}
