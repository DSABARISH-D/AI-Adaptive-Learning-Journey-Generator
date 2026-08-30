import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export function TopNav() {
  const { user } = useAuth()

  return (
    <header className="top-nav h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex-1 flex items-center">
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search courses, resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      <div className="nav-actions flex items-center gap-4">
        <button className="text-gray-500 hover:text-indigo-600 text-xl relative">
          🔔
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {user ? (
          <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{user.full_name || user.email}</span>
              <span className="text-xs text-gray-500">Student</span>
            </div>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border border-gray-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        ) : null}
      </div>
    </header>
  )
}
