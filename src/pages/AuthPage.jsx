import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { loginWithEmail, loginWithGoogleToken, registerWithEmail } from '../services/authService'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { user } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (user) return <Navigate to="/" replace />

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (isRegister) {
        const result = await registerWithEmail(form.name, form.email, form.password)
        if (!result.session) {
          setMessage('Account created. Please confirm your email, then sign in.')
        } else {
          setMessage('Account created and signed in successfully.')
        }
        setIsRegister(false)
      } else {
        await loginWithEmail(form.email, form.password)
      }
    } catch (err) {
      setError(err.message)
      if (isRegister) {
        setMessage('If you already created an account, switch to Sign in.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setMessage('')
    try {
      await loginWithGoogleToken(credentialResponse.credential)
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
    }
  }

  const switchMode = () => {
    setIsRegister((v) => !v)
    setError('')
    setMessage('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CampusSync</h1>
          <p className="mt-1 text-sm text-gray-500">Your campus, organized.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {isRegister ? 'Start organizing your campus life today.' : 'Sign in to continue to CampusSync.'}
          </p>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              size="large"
              width="368"
              text={isRegister ? 'signup_with' : 'signin_with'}
              shape="rectangular"
              theme="outline"
              logo_alignment="left"
            />
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or continue with email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@university.edu"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
                required
              />
            </div>

            {message && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60"
            >
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
