import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import type { DashboardData } from '../types'
import aiRobotImg from '../assets/ai-robot.jpg'
import '../styles/App.css'

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      apiFetch('/health', { signal: controller.signal }),
      apiFetch<DashboardData>('/dashboard', { signal: controller.signal }),
    ])
      .then(([, data]) => {
        if (data && data.stats && data.user) setDashboard(data)
        else setDashboard(createEmptyDashboard(user))
      })
      .catch((requestError) => { if (requestError instanceof Error && requestError.name !== 'AbortError') setError(requestError.message) })

    return () => controller.abort()
  }, [user])

  if (error) return <div className="dash-error-state"><div className="dash-error-card"><span className="dash-error-icon">⚠️</span><h2>Unable to load your dashboard</h2><p>{error}</p><button onClick={() => window.location.reload()}>Try Again</button></div></div>
  if (!dashboard) return <div className="dash-loading-state"><div className="dash-loader"><div className="dash-spinner" /><p>Loading your personalized dashboard...</p></div></div>

  const { stats, current_course: course, current_topic: topic, roadmap, recommendation, recent_activity: activity, daily_goal: goal, upcoming_tasks: tasks } = dashboard
  const continuePath = course ? `/courses/${course.code}/journey` : '/courses'

  return (
    <div className="dashboard-page">
      {/* ===== HEADER: Greeting + Motivational Quote ===== */}
      <div className="dash-header">
        <div className="dash-greeting">
          <h1>Hello, {dashboard.user.full_name || 'Learner'} 👋</h1>
          <h2 className="sr-only">Your Learning Journey</h2>
          <p>Let's continue your personalized learning journey</p>
        </div>
        <div className="dash-quote">
          <span className="quote-sparkle">✨</span>
          <em>"A better you is just a topic away!"</em>
        </div>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="dash-stats-row">
        {/* Overall Progress — circular */}
        <div className="stat-card stat-progress-card">
          <div className="stat-circle-wrap">
            <svg className="stat-circle" viewBox="0 0 80 80">
              <circle className="stat-circle-bg" cx="40" cy="40" r="34" />
              <circle
                className="stat-circle-fill"
                cx="40" cy="40" r="34"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - stats.overall_progress / 100)}`}
              />
            </svg>
            <span className="stat-circle-text">{stats.overall_progress}%</span>
          </div>
          <div className="stat-info">
            <span className="stat-title">Overall Progress</span>
            <span className="stat-sub">{stats.overall_progress >= 50 ? "🔥 You're doing great!" : 'Keep going!'}</span>
          </div>
        </div>

        {/* Courses Enrolled */}
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.courses_enrolled}</span>
            <span className="stat-title">Courses Enrolled</span>
            <span className="stat-sub">Keep learning</span>
          </div>
        </div>

        {/* Topics Completed */}
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.topics_completed}</span>
            <span className="stat-title">Topics Completed</span>
            <span className="stat-sub">Great consistency!</span>
          </div>
        </div>

        {/* Quizzes Taken */}
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.assessments_attempted}</span>
            <span className="stat-title">Quizzes Taken</span>
            <span className="stat-sub">Keep going!</span>
          </div>
        </div>
      </div>

      {/* ===== MIDDLE ROW: Continue Learning | AI Plan | AI Recommendation ===== */}
      <div className="dash-mid-row">
        {/* Continue Learning */}
        <section className="dash-card continue-card">
          <div className="card-header">
            <span className="card-kicker">Continue Learning</span>
            <Link to={continuePath} className="card-link">View Course →</Link>
          </div>
          <div className="continue-inner">
            <div className="continue-icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div className="continue-details">
              <h3>{course?.title || 'Choose your first course'}</h3>
              <p className="continue-topic">{topic?.title || 'Enroll in a course to begin'}</p>
            </div>
          </div>
          <div className="continue-progress-row">
            <div className="progress-track"><div className="progress-fill" style={{ width: `${stats.overall_progress}%` }} /></div>
            <span className="progress-pct">{stats.overall_progress}%</span>
          </div>
          <Link to={continuePath} className="continue-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Continue Learning
          </Link>
        </section>

        {/* AI Learning Plan */}
        <section className="dash-card plan-card">
          <div className="card-header">
            <span className="card-kicker">Your AI Learning Plan</span>
            <span className="ai-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Created by AI
            </span>
          </div>
          <ol className="plan-list">
            {roadmap.map((item, index) => (
              <li key={item.title} className={item.status === 'completed' ? 'is-done' : item.status === 'in_progress' ? 'is-current' : ''}>
                <span className="plan-num">{item.status === 'completed' ? '✓' : index + 1}</span>
                <span className="plan-title">{item.title}</span>
                <span className="plan-status">
                  {item.status === 'in_progress' ? 'In Progress' : item.status === 'completed' ? 'Completed' : 'Upcoming'}
                </span>
              </li>
            ))}
            {roadmap.length === 0 && <li className="plan-empty">Enroll in a course to see your learning plan</li>}
          </ol>
        </section>

        {/* AI Recommendation */}
        <section className="dash-card recommendation-card">
          <span className="card-kicker">AI Recommendation</span>
          <p className="rec-text">{recommendation.message}</p>
          <Link to="/resources" className="rec-btn">
            Explore Resources →
          </Link>
          <img src={aiRobotImg} alt="AI Assistant" className="rec-robot" />
        </section>
      </div>

      {/* ===== BOTTOM ROW: Activity | Daily Goal | Upcoming Tasks ===== */}
      <div className="dash-bottom-row">
        {/* Recent Activity */}
        <section className="dash-card activity-card">
          <div className="card-header">
            <span className="card-kicker">Recent Activity</span>
            <Link to="/progress" className="card-link">View All →</Link>
          </div>
          <div className="activity-list">
            {activity.length ? activity.map((item) => (
              <div key={`${item.created_at}-${item.title}`} className="activity-item">
                <span className={`activity-icon ${item.type === 'quiz' ? 'ai-quiz' : item.type === 'lesson' ? 'ai-lesson' : 'ai-other'}`}>
                  {item.type === 'quiz' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                </span>
                <div className="activity-info">
                  <span className="activity-title">{item.title}</span>
                  <span className="activity-time">{new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                {item.score !== null && <span className="activity-score">{item.score}%</span>}
              </div>
            )) : <p className="empty-text">No learning activity yet. Start a lesson or assessment.</p>}
          </div>
        </section>

        {/* Daily Goal */}
        <section className="dash-card goal-card">
          <div className="goal-header">
            <div className="goal-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <span className="card-kicker">Daily Goal</span>
          </div>
          <h2 className="goal-number">{goal.minutes}<span>/{goal.target}</span></h2>
          <p className="goal-unit">minutes of study</p>
          <div className="progress-track goal-track"><div className="progress-fill goal-fill" style={{ width: `${Math.min(100, goal.minutes / goal.target * 100)}%` }} /></div>
          <div className="goal-quote">
            <span className="goal-plant">🌱</span>
            <em>"Small progress every day leads to big results."</em>
          </div>
        </section>

        {/* Upcoming Tasks */}
        <section className="dash-card tasks-card">
          <div className="card-header">
            <span className="card-kicker">Upcoming Tasks</span>
            <Link to="/journey" className="card-link">View All →</Link>
          </div>
          <div className="tasks-list">
            {tasks.length ? tasks.map((task, i) => (
              <div key={task.title} className="task-item">
                <span className={`task-icon ${task.kind === 'quiz' ? 'ti-quiz' : task.kind === 'lesson' ? 'ti-lesson' : 'ti-other'}`}>
                  {task.kind === 'quiz' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  )}
                </span>
                <span className="task-title">{task.title}</span>
                <span className={`task-due ${i < 2 ? 'due-today' : ''}`}>{i < 2 ? 'Today' : 'Tomorrow'}</span>
              </div>
            )) : <p className="empty-text">You are all caught up! 🎉</p>}
          </div>
        </section>
      </div>

      {/* ===== BOTTOM BANNER ===== */}
      <div className="dash-banner">
        <div className="banner-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div className="banner-text">
          <strong>Keep Learning, Keep Growing!</strong>
          <span>You are {stats.overall_progress > 0 ? `${100 - stats.overall_progress}%` : 'just getting started'} {stats.overall_progress > 0 ? 'closer to completing your current course.' : '— enroll in a course to begin!'}</span>
        </div>
        <Link to="/journey" className="banner-btn">View Learning Journey →</Link>
      </div>
    </div>
  )
}

function createEmptyDashboard(user: ReturnType<typeof useAuth>['user']): DashboardData {
  return { user: user || { id: 0, email: '', full_name: null, avatar_url: null }, stats: { overall_progress: 0, courses_enrolled: 0, topics_completed: 0, assessments_attempted: 0, average_score: 0, latest_score: null }, current_course: null, current_topic: null, roadmap: [], recommendation: { topic: 'your first course', message: 'Enroll in a course to receive a personalized AI recommendation tailored to your learning style and progress.', priority: 'next' }, recent_activity: [], daily_goal: { minutes: 0, target: 10 }, upcoming_tasks: [] }
}
