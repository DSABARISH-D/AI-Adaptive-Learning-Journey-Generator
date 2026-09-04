import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, login, handleCallback } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleDevLogin = async () => {
    try {
      const response = await fetch('/api/auth/dev-login', { method: 'POST' })
      if (!response.ok) throw new Error('Dev login failed')
      const data = await response.json() as { token: string; user: { id: number; email: string; full_name: string; avatar_url: string | null } }
      handleCallback(data.token, data.user)
    } catch (err) {
      alert(`Dev login failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
          Adaptive Learner
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your AI-powered personalized learning journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Sign in with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <button
              onClick={handleDevLogin}
              className="w-full flex justify-center py-3 px-4 border-2 border-amber-400 rounded-lg shadow-sm text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              🛠️ Dev Login (no Google required)
            </button>
            <p className="text-xs text-center text-gray-400">Dev login creates a demo account for local testing</p>
          </div>
        </div>
      </div>
    </div>
  )
}
