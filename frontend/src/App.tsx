import { useEffect, useState } from 'react'
import { Courses } from './Courses'
import { Profile } from './Profile'
import type { User } from './types'
import './App.css'

type AppView = 'dashboard' | 'courses' | 'profile'

function App() {
  const [status, setStatus] = useState('ok')
  const [view, setView] = useState<AppView>('dashboard')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_token')
    const userStored = localStorage.getItem('auth_user')
    if (stored) {
      setToken(stored)
      if (userStored) setUser(JSON.parse(userStored))
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setStatus('unavailable')
          return
        }
        setStatus('ok')
      })
      .catch(() => {
        setStatus('unavailable')
      })

    return () => controller.abort()
  }, [])

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/login')
      if (!response.ok) throw new Error('Failed to initiate login')
      const data = (await response.json()) as { auth_url: string }
      window.location.href = data.auth_url
    } catch (err) {
      alert(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    setView('dashboard')
  }

  const renderPage = () => {
    switch (view) {
      case 'courses':
        return <Courses token={token ?? undefined} />
      case 'profile':
        return user ? <Profile user={user} token={token ?? undefined} /> : null
      case 'dashboard':
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => (
    <>
      <div className="top-nav">
        <div className="nav-brand">Adaptive Learner</div>
        <div className="nav-actions">
          {token && user && (
            <>
              <span className="user-info">Hello, {user.full_name || user.email}</span>
              <button className="nav-button" onClick={() => setView('profile')}>
                Profile
              </button>
              <button className="nav-button logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {!token && (
            <button className="nav-button" onClick={handleLogin}>
              Login with Google
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Your Learning Journey</h1>
        <div className="status-row">
          <span className="status-dot" aria-hidden="true" />
          <span>Backend: {status === 'ok' ? 'Connected' : 'Offline'}</span>
        </div>

        {token && user ? (
          <>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-label">Completion Rate</div>
                <div className="stat-value">68%</div>
                <div className="stat-subtext">Keep going!</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Courses</div>
                <div className="stat-value">5</div>
                <div className="stat-subtext">In progress</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Hours Learned</div>
                <div className="stat-value">24</div>
                <div className="stat-subtext">This month</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Streak</div>
                <div className="stat-value">18</div>
                <div className="stat-subtext">Days</div>
              </div>
            </div>

            <div className="welcome-section">
              <h2 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.5rem' }}>Your AI Learning Plan</h2>
              <p>Personalized courses based on your interests and goals</p>
              <button className="primary-button" onClick={() => setView('courses')}>
                Explore Courses
              </button>
            </div>
          </>
        ) : (
          <div className="auth-section">
            <h2 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.5rem' }}>Start Your Learning Journey</h2>
            <p>Sign in to get started with personalized adaptive learning paths.</p>
            <button className="primary-button" onClick={handleLogin}>
              Login with Google
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">🎓 Adaptive Learner</div>
        <nav className="sidebar-nav">
          <li className="sidebar-nav-item">
            <button
              className={`sidebar-nav-link ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              📊 Dashboard
            </button>
          </li>
          {token && (
            <>
              <li className="sidebar-nav-item">
                <button
                  className={`sidebar-nav-link ${view === 'courses' ? 'active' : ''}`}
                  onClick={() => setView('courses')}
                >
                  📚 My Courses
                </button>
              </li>
              <li className="sidebar-nav-item">
                <button
                  className={`sidebar-nav-link ${view === 'profile' ? 'active' : ''}`}
                  onClick={() => setView('profile')}
                >
                  👤 Profile
                </button>
              </li>
            </>
          )}
        </nav>
      </aside>
      <div className="main-content">{renderPage()}</div>
    </div>
  )
}

export default App
