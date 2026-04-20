import { supabase } from './supabase'

/*
 * Run this SQL once in your Supabase SQL Editor (Dashboard → SQL Editor):
 *
 * ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
 * ALTER TABLE events ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
 *
 * ALTER TABLE groups ADD COLUMN IF NOT EXISTS leader_id TEXT;
 * ALTER TABLE groups ADD COLUMN IF NOT EXISTS invitees TEXT[] DEFAULT ARRAY[]::text[];
 *
 * ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
 * ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name TEXT DEFAULT '';
 *
 * CREATE TABLE IF NOT EXISTS institutional_details (
 *   id BIGSERIAL PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   institution TEXT DEFAULT '',
 *   department TEXT DEFAULT '',
 *   semester TEXT DEFAULT '',
 *   student_id TEXT DEFAULT '',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(user_id)
 * );
 */

const PROFILE_OVERRIDES_KEY = 'campussync_profile_overrides'
const INSTITUTIONAL_DETAILS_KEY = 'campussync_institutional_details'

const getStoredMap = (key) => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

const setStoredMap = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const updateStoredMap = (key, mapKey, value) => {
  const current = getStoredMap(key)
  current[mapKey] = value
  setStoredMap(key, current)
}

const getStoredValue = (key, mapKey) => getStoredMap(key)[mapKey] || null

const emitLocalProfileChange = (userId) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('campussync:user-profile-updated', { detail: { userId } }))
}

const getProfileOverride = (userId) => getStoredValue(PROFILE_OVERRIDES_KEY, userId) || {}

const setProfileOverride = (userId, patch) => {
  updateStoredMap(PROFILE_OVERRIDES_KEY, userId, {
    ...getProfileOverride(userId),
    ...patch,
  })
  emitLocalProfileChange(userId)
}

const getLocalInstitutionalDetails = (userId) => getStoredValue(INSTITUTIONAL_DETAILS_KEY, userId)

const setLocalInstitutionalDetails = (userId, payload) => {
  updateStoredMap(INSTITUTIONAL_DETAILS_KEY, userId, {
    institution: payload.institution || '',
    department: payload.department || '',
    semester: payload.semester || '',
    studentId: payload.studentId || '',
  })
  const institution = payload.institution?.trim()
  if (institution) {
    setProfileOverride(userId, { college_name: institution })
  }
}

const isRecoverableTableError = (error) => {
  if (!error) return false
  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase()
  return (
    error.status === 401 ||
    error.status === 403 ||
    error.status === 404 ||
    error.code === '42501' ||
    message.includes('forbidden') ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('rls') ||
    message.includes('not found') ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('column') && message.includes('does not exist')
  )
}

const describeAction = (verb, collectionName) => {
  const label = collectionName.replaceAll('_', ' ')
  return `${verb} ${label}`
}

const toUserFacingError = (error, collectionName, verb) => {
  if (!error) return new Error(`Failed to ${describeAction(verb, collectionName)}.`)

  if (isRecoverableTableError(error)) {
    return new Error(
      `Unable to ${describeAction(verb, collectionName)} because your Supabase ${collectionName} table is missing columns or the current policies block this action.`,
    )
  }

  return new Error(error.message || `Failed to ${describeAction(verb, collectionName)}.`)
}

const buildFallbackProfile = (user, profile = null) => {
  if (!user) return null
  const override = getProfileOverride(user.uid)
  return {
    id: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || '',
    username: profile?.username || override.username || profile?.name || user.displayName || '',
    college_name: profile?.college_name || override.college_name || '',
  }
}

const toDbPayload = (collectionName, payload) => {
  if (collectionName === 'tasks') {
    return {
      title: payload.title,
      description: payload.description || '',
      deadline: payload.deadline || null,
      priority: payload.priority,
      status: payload.status,
      group_id: payload.groupId || null,
      user_id: payload.userId,
    }
  }
  if (collectionName === 'resources') {
    return {
      title: payload.title,
      subject: payload.subject,
      semester: payload.semester,
      file_url: payload.fileURL,
      uploaded_by: payload.uploadedBy,
    }
  }
  if (collectionName === 'groups') {
    return {
      name: payload.name,
      members: payload.members || [],
      leader_id: payload.leaderId || null,
      invitees: payload.invitees || [],
    }
  }
  if (collectionName === 'events') {
    return {
      title: payload.title,
      category: payload.category || '',
      date: payload.date || null,
      description: payload.description || '',
      location: payload.location || '',
      city: payload.city || '',
    }
  }
  if (collectionName === 'institutional_details') {
    return {
      user_id: payload.userId,
      institution: payload.institution || '',
      department: payload.department || '',
      semester: payload.semester || '',
      student_id: payload.studentId || '',
    }
  }
  return payload
}

const fromDbRow = (collectionName, row) => {
  if (collectionName === 'tasks') {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      deadline: row.deadline,
      priority: row.priority,
      status: row.status,
      groupId: row.group_id,
      createdAt: row.created_at,
    }
  }
  if (collectionName === 'resources') {
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      semester: row.semester,
      fileURL: row.file_url,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }
  }
  if (collectionName === 'groups') {
    return {
      id: row.id,
      name: row.name,
      members: row.members || [],
      leaderId: row.leader_id,
      invitees: row.invitees || [],
      createdAt: row.created_at,
    }
  }
  if (collectionName === 'events') {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      date: row.date,
      description: row.description,
      location: row.location || '',
      city: row.city || '',
      createdAt: row.created_at,
    }
  }
  if (collectionName === 'institutional_details') {
    return {
      id: row.id,
      userId: row.user_id,
      institution: row.institution || '',
      department: row.department || '',
      semester: row.semester || '',
      studentId: row.student_id || '',
      createdAt: row.created_at,
    }
  }
  return row
}

const subscribeTable = async ({ table, callback, filterField, filterValue, orderByField }) => {
  let query = supabase.from(table).select('*')
  if (filterField) query = query.eq(filterField, filterValue)
  if (orderByField) query = query.order(orderByField, { ascending: true })
  const { data, error } = await query
  if (!error) callback((data || []).map((row) => fromDbRow(table, row)))

  const channel = supabase
    .channel(`${table}-${filterValue || 'all'}-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
      let refresh = supabase.from(table).select('*')
      if (filterField) refresh = refresh.eq(filterField, filterValue)
      if (orderByField) refresh = refresh.order(orderByField, { ascending: true })
      const { data: refreshed } = await refresh
      callback((refreshed || []).map((row) => fromDbRow(table, row)))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export const subscribeTasks = (userId, callback) =>
  subscribeTable({ table: 'tasks', callback, filterField: 'user_id', filterValue: userId, orderByField: 'deadline' })

export const subscribeEvents = (callback) =>
  subscribeTable({ table: 'events', callback, orderByField: 'date' })

export const subscribeResources = (callback) =>
  subscribeTable({ table: 'resources', callback })

export const subscribeGroups = (callback) =>
  subscribeTable({ table: 'groups', callback })

export const subscribeUserProfile = async (user, callback) => {
  if (!user?.uid) {
    callback(null)
    return () => {}
  }

  let currentProfile = null
  const pushProfile = (profile) => {
    currentProfile = profile || null
    callback(currentProfile)
  }

  const handleProfileChange = (event) => {
    if (event.detail?.userId === user.uid) {
      pushProfile(buildFallbackProfile(user, currentProfile))
    }
  }

  window.addEventListener('campussync:user-profile-updated', handleProfileChange)

  pushProfile(buildFallbackProfile(user))

  const { data, error } = await supabase.from('users').select('*').eq('id', user.uid).maybeSingle()
  if (error) {
    if (isRecoverableTableError(error)) {
      return () => {
        window.removeEventListener('campussync:user-profile-updated', handleProfileChange)
      }
    }
    window.removeEventListener('campussync:user-profile-updated', handleProfileChange)
    throw error
  }
  pushProfile(buildFallbackProfile(user, data))

  const channel = supabase
    .channel(`user-profile-${user.uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.uid}` }, async () => {
      const { data: refreshed } = await supabase.from('users').select('*').eq('id', user.uid).maybeSingle()
      pushProfile(buildFallbackProfile(user, refreshed))
    })
    .subscribe()

  return () => {
    window.removeEventListener('campussync:user-profile-updated', handleProfileChange)
    supabase.removeChannel(channel)
  }
}

export const createDoc = async (collectionName, payload) => {
  const { error } = await supabase.from(collectionName).insert(toDbPayload(collectionName, payload))
  if (error) throw toUserFacingError(error, collectionName, 'create')
}

export const updateDocument = async (collectionName, id, payload) => {
  const { error } = await supabase.from(collectionName).update(toDbPayload(collectionName, payload)).eq('id', id)
  if (error) throw toUserFacingError(error, collectionName, 'update')
}

export const deleteDocument = async (collectionName, id) => {
  const { error } = await supabase.from(collectionName).delete().eq('id', id)
  if (error) throw toUserFacingError(error, collectionName, 'delete')
}

export const ensureUserProfile = async (user) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', user.uid).maybeSingle()
  if (error) {
    if (isRecoverableTableError(error)) return buildFallbackProfile(user)
    throw error
  }
  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({ id: user.uid, name: user.displayName || '', email: user.email, username: user.displayName || '', college_name: '' })
      .select()
      .single()
    if (insertError) {
      if (isRecoverableTableError(insertError)) return buildFallbackProfile(user)
      throw insertError
    }
    return inserted
  }
  return buildFallbackProfile(user, data)
}

export const updateUsername = async (userId, username) => {
  setProfileOverride(userId, { username })
  const { error } = await supabase.from('users').update({ username }).eq('id', userId)
  if (error && !isRecoverableTableError(error)) throw error
}

export const fetchPeers = async (collegeName, userId) => {
  if (!collegeName) return []
  const { data, error } = await supabase.from('users').select('*').eq('college_name', collegeName).neq('id', userId)
  if (error) {
    if (isRecoverableTableError(error)) return []
    throw error
  }
  return data || []
}

export const fetchInstitutionalDetails = async (userId) => {
  try {
    const { data, error } = await supabase.from('institutional_details').select('*').eq('user_id', userId).maybeSingle()
    if (error) {
      if (isRecoverableTableError(error)) return getLocalInstitutionalDetails(userId)
      throw error
    }
    return data ? fromDbRow('institutional_details', data) : null
  } catch {
    return getLocalInstitutionalDetails(userId)
  }
}

export const upsertInstitutionalDetails = async (userId, payload) => {
  setLocalInstitutionalDetails(userId, payload)
  const { error } = await supabase.from('institutional_details').upsert(
    { user_id: userId, institution: payload.institution || '', department: payload.department || '', semester: payload.semester || '', student_id: payload.studentId || '' },
    { onConflict: 'user_id' },
  )
  if (error && !isRecoverableTableError(error)) throw error

  const institution = payload.institution?.trim()
  if (institution) {
    const { error: profileError } = await supabase.from('users').update({ college_name: institution }).eq('id', userId)
    if (profileError && !isRecoverableTableError(profileError)) {
      throw profileError
    }
  }
}

export const seedDemoEvents = async () => {
  try {
    const { data } = await supabase.from('events').select('id').eq('title', 'Arise Hackathon').maybeSingle()
    if (!data) {
      await supabase.from('events').insert([{
        title: 'Arise Hackathon',
        category: 'Hackathon',
        date: '2026-05-10',
        description: 'An exciting hackathon at Scaler School of Technology. Build innovative solutions and compete with the best!',
        location: 'Scaler School of Technology',
        city: 'Bangalore',
      }])
    }
  } catch {
    // Silently fail — columns may not exist yet
  }
}
