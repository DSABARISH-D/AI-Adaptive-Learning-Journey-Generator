import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export function TopNav() {
  const { user } = useAuth()

  return (
    <header className="top-nav">
      {/* Search bar */}
      <div className="topnav-search">
        <span className="search-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search for courses, topics, or resources..."
          id="topnav-search-input"
        />
        <kbd className="search-shortcut">Ctrl + K</kbd>
      </div>

      {/* Right actions */}
      <div className="topnav-actions">
        {/* Notifications */}
        <button aria-label="Notifications" className="topnav-icon-btn" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-badge">3</span>
        </button>

        {/* User profile */}
        {user ? (
          <Link to="/profile" className="topnav-user">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="topnav-avatar" />
            ) : (
              <div className="topnav-avatar topnav-avatar-placeholder">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="topnav-user-info">
              <span className="topnav-user-name">{user.full_name || user.email}</span>
              <span className="topnav-user-role">CSE Student</span>
            </div>
            <svg className="topnav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Link>
        ) : null}
      </div>
    </header>
  )
}
