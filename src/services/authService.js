import { supabase } from './supabase'

const toAuthError = (error) => {
  if (!error) return error
  if (error.message === 'Invalid login credentials') {
    return new Error('No account found with this email/password. Please register first or check your password.')
  }
  if (error.message === 'Email not confirmed') {
    return new Error('Your email is not confirmed yet. Please verify your inbox and then sign in.')
  }
  if (error.message?.toLowerCase().includes('email rate limit exceeded')) {
    return new Error(
      'Too many email attempts. If you already registered, try Sign in. Otherwise wait a few minutes and retry.',
    )
  }
  if (error.message?.toLowerCase().includes('already registered')) {
    return new Error('This email is already registered. Please use Sign in instead.')
  }
  return error
}

export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toAuthError(error)
  return data
}

export const registerWithEmail = async (name, email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) throw toAuthError(error)
  return data
}

export const loginWithGoogleToken = async (idToken) => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })
  if (error) throw toAuthError(error)
  return data
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAuthError(error)
}
