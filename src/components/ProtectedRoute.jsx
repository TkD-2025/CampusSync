import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-6 text-center">Checking session...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}
