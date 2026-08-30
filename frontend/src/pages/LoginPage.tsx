import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, login } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
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
          <div className="space-y-6">
            <button
              onClick={login}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
