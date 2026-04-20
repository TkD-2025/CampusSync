import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <Link className="mt-3 inline-block text-indigo-600" to="/">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
