import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Sidebar() {
  const { logout } = useAuth()

  const navItems = [
    { name: 'Dashboard', icon: '📊', path: '/' },
    { name: 'My Courses', icon: '📚', path: '/courses' },
    { name: 'Learning Journey', icon: '🗺️', path: '/journey' },
    { name: 'Assessments', icon: '📝', path: '/assessments' },
    { name: 'AI Tutor', icon: '🤖', path: '/tutor' },
    { name: 'Resources', icon: '📦', path: '/resources' },
    { name: 'Progress', icon: '📈', path: '/progress' },
    { name: 'Profile', icon: '👤', path: '/profile' },
    { name: 'Settings', icon: '⚙️', path: '/settings' },
  ]

  return (
    <aside className="sidebar flex flex-col h-full bg-white border-r border-gray-200">
      <div className="sidebar-brand p-6 flex items-center gap-3 font-bold text-indigo-600 text-xl border-b border-gray-100">
        🎓 Adaptive Learner
      </div>
      <nav className="sidebar-nav flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name} className="sidebar-nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
