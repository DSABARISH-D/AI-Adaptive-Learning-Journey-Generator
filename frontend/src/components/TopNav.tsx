import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'

export function TopNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentCourse, setCurrentCourse] = useState<string>('java')
  const [switching, setSwitching] = useState<boolean>(false)

  useEffect(() => {
    apiFetch<{ currentCourse?: string }>('/profile')
      .then((data) => {
        if (data && data.currentCourse) {
          setCurrentCourse(data.currentCourse)
        }
      })
      .catch(() => {})
  }, [])

  const handleCourseSwitch = async (newCode: string) => {
    if (newCode === currentCourse || switching) return
    setSwitching(true)
    try {
      await apiFetch<{ success?: boolean }>('/profile/switch-course', {
        method: 'POST',
        body: JSON.stringify({ course_code: newCode })
      })
      setCurrentCourse(newCode)
      // Broadcast custom event so active pages update immediately
      window.dispatchEvent(new CustomEvent('course-switched', { detail: { course_code: newCode } }))
      // Navigate or reload view
      navigate('/journey')
    } catch (err) {
      console.error('Course switch error:', err)
    } finally {
      setSwitching(false)
    }
  }

  const coursesList = [
    { code: 'java', label: 'Java', icon: '☕' },
    { code: 'python', label: 'Python', icon: '🐍' },
    { code: 'c', label: 'C Language', icon: '⚙️' },
    { code: 'cpp', label: 'C++', icon: '⚡' },
    { code: 'reasoning', label: 'Logical Reasoning', icon: '🧩' },
    { code: 'quant', label: 'Quantitative Aptitude', icon: '📐' }
  ]

  return (
    <header className="top-nav">
      {/* Search bar matching screenshot */}
      <div className="topnav-search">
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search topics, resources, or ask anything..."
          id="topnav-search-input"
        />
      </div>

      {/* Right actions matching screenshot */}
      <div className="topnav-actions">
        {/* Dynamic Subject / Course Switcher */}
        <div className="course-switcher-pill">
          <span className="switcher-label">Subject:</span>
          <select
            value={currentCourse}
            onChange={(e) => handleCourseSwitch(e.target.value)}
            disabled={switching}
            className="course-select-dropdown"
            title="Switch adaptive course curriculum"
          >
            {coursesList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Bell */}
        <button aria-label="Notifications" className="topnav-icon-btn relative" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User Pill Avatar (SD Sabarish D v) */}
        <Link to="/profile" className="topnav-user-pill">
          <div className="topnav-avatar-circle">
            SD
          </div>
          <span className="topnav-user-name">
            {user?.full_name || 'Sabarish D'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>

        {/* Consistency today, Success tomorrow quote banner matching screenshot */}
        <div className="topnav-quote-badge">
          <span className="quote-sprout-icon" aria-hidden="true">🌱</span>
          <div className="quote-text-wrap">
            <p className="quote-line-1">"Consistency today,</p>
            <p className="quote-line-2">Success tomorrow."</p>
          </div>
        </div>
      </div>
    </header>
  )
}
