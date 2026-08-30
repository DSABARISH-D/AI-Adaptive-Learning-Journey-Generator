import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import '../styles/App.css'

export function DashboardPage() {
  const [status, setStatus] = useState('ok')

  useEffect(() => {
    const controller = new AbortController()

    apiFetch('/health', { signal: controller.signal })
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unavailable'))

    return () => controller.abort()
  }, [])

  return (
    <div className="panel space-y-8">
      <div>
        <p className="eyebrow text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-gray-900">Your Learning Journey</h1>
        <div className="status-row flex items-center gap-2 mt-2 text-sm text-gray-600">
          <span className={`status-dot w-3 h-3 rounded-full ${status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
          <span>Backend: {status === 'ok' ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      <div className="dashboard-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Completion Rate</div>
          <div className="stat-value text-3xl font-bold text-indigo-600 mb-1">68%</div>
          <div className="stat-subtext text-sm text-gray-500">Keep going!</div>
        </div>
        <div className="stat-card bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Active Courses</div>
          <div className="stat-value text-3xl font-bold text-indigo-600 mb-1">5</div>
          <div className="stat-subtext text-sm text-gray-500">In progress</div>
        </div>
        <div className="stat-card bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Hours Learned</div>
          <div className="stat-value text-3xl font-bold text-indigo-600 mb-1">24</div>
          <div className="stat-subtext text-sm text-gray-500">This month</div>
        </div>
        <div className="stat-card bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Streak</div>
          <div className="stat-value text-3xl font-bold text-indigo-600 mb-1">18</div>
          <div className="stat-subtext text-sm text-gray-500">Days</div>
        </div>
      </div>

      <div className="welcome-section bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-8 text-white shadow-md text-center">
        <h2 className="text-2xl font-bold mb-3">Your AI Learning Plan</h2>
        <p className="text-indigo-100 mb-6 max-w-lg mx-auto">Personalized courses based on your interests and goals are ready for you to explore.</p>
        <Link to="/courses" className="primary-button inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors">
          Explore Courses
        </Link>
      </div>
    </div>
  )
}
