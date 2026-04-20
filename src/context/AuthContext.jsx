import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import { ensureUserProfile } from '../services/dbService'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const normalizeUser = (sessionUser) => {
      if (!sessionUser) return null
      return {
        uid: sessionUser.id,
        email: sessionUser.email,
        displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '',
      }
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const normalized = normalizeUser(data.session?.user)
        if (normalized) {
          await ensureUserProfile(normalized)
        }
        if (mounted) {
          setUser(normalized)
        }
      } catch {
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const normalized = normalizeUser(session?.user)
      if (mounted) {
        setUser(normalized)
        setLoading(false)
      }
      // Avoid awaiting Supabase queries inside auth callback.
      if (normalized) {
        setTimeout(() => {
          ensureUserProfile(normalized).catch(() => {})
        }, 0)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, loading }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
