import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  subscribeEvents,
  subscribeGroups,
  subscribeResources,
  subscribeTasks,
  subscribeUserProfile,
} from '../services/dbService'
import { AppDataContext } from './appDataContextObject'

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [resources, setResources] = useState([])
  const [groups, setGroups] = useState([])
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    let unsubEvents = () => {}
    let unsubResources = () => {}
    let unsubGroups = () => {}
    let unsubTasks = () => {}
    let unsubProfile = () => {}

    const start = async () => {
      unsubEvents = (await subscribeEvents(setEvents)) || (() => {})
      unsubResources = (await subscribeResources(setResources)) || (() => {})
      unsubGroups = (await subscribeGroups(setGroups)) || (() => {})

      if (user?.uid) {
        unsubTasks = (await subscribeTasks(user.uid, setTasks)) || (() => {})
        unsubProfile = (await subscribeUserProfile(user, setUserProfile)) || (() => {})
      } else {
        setTasks([])
        setUserProfile(null)
      }
    }
    start()

    return () => {
      unsubEvents()
      unsubResources()
      unsubGroups()
      unsubTasks()
      unsubProfile()
    }
  }, [user])

  const myGroups = useMemo(
    () => groups.filter((g) => g.members.includes(user?.email) || g.leaderId === user?.uid),
    [groups, user],
  )

  const groupInvitations = useMemo(
    () => groups.filter((g) => g.invitees?.includes(user?.email)),
    [groups, user],
  )

  const value = useMemo(
    () => ({ tasks: user ? tasks : [], events, resources, groups, myGroups, groupInvitations, userProfile }),
    [user, tasks, events, resources, groups, myGroups, groupInvitations, userProfile],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
