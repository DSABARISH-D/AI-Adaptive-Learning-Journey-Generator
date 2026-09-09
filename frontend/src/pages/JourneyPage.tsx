import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { LearningJourneyPayload } from '../types'
import '../styles/App.css'

export function JourneyPage() {
  const { code } = useParams<{ code?: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<LearningJourneyPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJourney = async (courseCode?: string) => {
    setLoading(true)
    setError(null)
    try {
      const targetCode = courseCode || code || 'java'
      const data = await apiFetch<LearningJourneyPayload>(`/courses/${targetCode}/journey`)
      setJourney(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your personalized learning journey')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJourney(code)

    // Listen to course-switched event from TopNav
    const handleCourseSwitch = (e: any) => {
      const newCode = e.detail?.course_code
      if (newCode) {
        fetchJourney(newCode)
      }
    }
    window.addEventListener('course-switched', handleCourseSwitch)
    return () => window.removeEventListener('course-switched', handleCourseSwitch)
  }, [code])

  if (loading) {
    return (
      <div className="journey-loading-wrap">
        <div className="dash-loader">
          <div className="dash-spinner" />
          <p>Generating your personalized learning journey...</p>
        </div>
      </div>
    )
  }

  if (error || !journey) {
    return (
      <div className="journey-error-wrap">
        <div className="dash-error-card">
          <span className="dash-error-icon">⚠️</span>
          <h2>Unable to load your learning journey</h2>
          <p>{error || 'No learning path found.'}</p>
          <button onClick={() => fetchJourney(code)}>Retry</button>
        </div>
      </div>
    )
  }

  const { course, topics, weakConcept, weakConceptDetails, performance } = journey

  // Subject icon helper
  const renderSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'python':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.9 2c-3.7 0-3.5 1.6-3.5 1.6l.04 1.7h3.5v.5H4.8S2 5.5 2 9.2s2.5 3.6 2.5 3.6h1.5v-2.1s-.1-2.5 2.5-2.5h4.3s2.4-.1 2.4-2.4V4.4s.3-2.4-3.3-2.4zm-1.8 1.2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zm1.9 18.8c3.7 0 3.5-1.6 3.5-1.6l-.04-1.7h-3.5v-.5h7.1s2.8.3 2.8-3.4-2.5-3.6-2.5-3.6h-1.5v2.1s.1 2.5-2.5 2.5h-4.3s-2.4.1-2.4 2.4v1.4s-.3 2.4 3.3 2.4zm1.8-1.2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"/>
          </svg>
        )
      case 'c':
      case 'cpp':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/>
          </svg>
        )
      case 'reasoning':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 3.5 2 6 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c3-1.5 5-4 5-7.5a8 8 0 0 0-8-8z"/><line x1="9.5" y1="9" x2="9.51" y2="9"/><line x1="14.5" y1="9" x2="14.51" y2="9"/>
          </svg>
        )
      case 'quant':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        )
      case 'java':
      default:
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.8 17.2s-.7.3-1.6.4c-1.3.1-2.2-.4-2.2-.4s.8.7 2.5.7c2 0 3.2-.7 3.2-.7s-.9.2-1.9 0zm-.3-2.1s-1.1.4-2.5.5c-2 .1-3.3-.6-3.3-.6s1.2 1 3.7 1c2.8 0 4.5-1 4.5-1s-1.1.2-2.4.1zm6.9 3.8s.5-.3 1.1-.5c.8-.2 1.5-.1 1.5-.1s-.6.4-1.5.6c-1.1.3-1.9.1-1.9.1s.4-.1.8-.1zm-4.3-.9c1.9 0 3.4-.6 3.4-.6s-1.2.3-2.5.3c-1.6 0-2.8-.4-2.8-.4s.7.7 1.9.7zm5.5-2.2c1.7-.5 2.7-1.4 2.7-2.3 0-1.8-2.6-2.5-2.6-2.5s.8.4.8 1.1c0 1.2-1.4 1.7-2.7 2.1-1.1.3-1.8.4-1.8.4s1.6.6 3.6 1.2zm-7.6-5.8c.7 1.3 1.9 2.2 3.6 2.2 1.3 0 2.3-.5 2.3-.5s-1 .3-2 .3c-1.5 0-2.6-.7-3.3-1.8-.7-1-1-2.4-.6-3.8.4 1.2 0 3.6 0 3.6z"/>
          </svg>
        )
    }
  }

  // Stepper icon helper
  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        )
      case 1:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        )
      case 2:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><line x1="12" y1="8" x2="6" y2="16"/><line x1="12" y1="8" x2="18" y2="16"/></svg>
        )
      case 3:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 9l6 6"/></svg>
        )
      case 4:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        )
      case 5:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        )
      case 6:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        )
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        )
    }
  }

  // Color helper for Topic Performance bar
  const getPerformanceColor = (score: number) => {
    if (score >= 70) return '#10b981' // Green
    if (score >= 50) return '#3b82f6' // Blue
    if (score > 0) return '#ef4444'   // Red
    return '#e5e7eb'                 // Gray
  }

  const handleStepAction = (topic: any) => {
    if (topic.defaultStatus === 'locked') return
    // Navigate to practice coding for this topic
    navigate(`/practice?topic=${encodeURIComponent(topic.title)}`)
  }

  return (
    <div className="journey-page-container">
      {/* 1. Breadcrumbs matching Screenshot 1 */}
      <nav className="journey-breadcrumb" aria-label="Breadcrumb">
        <Link to="/courses" className="breadcrumb-link">My Courses</Link>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb-course">{course.title}</span>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb-active">Learning Journey</span>
      </nav>

      {/* 2. Course Header Banner matching Screenshot 1 */}
      <section className="journey-header-banner">
        <div className="banner-left">
          <div className="banner-course-icon" aria-hidden="true">
            {renderSubjectIcon(course.icon)}
          </div>
          <div className="banner-course-info">
            <h1 className="banner-course-title">{course.title}</h1>
            <p className="banner-course-desc">{course.description}</p>
          </div>
        </div>

        <div className="banner-right-stats">
          {/* Your Current Level card */}
          <div className="banner-stat-card">
            <div className="stat-card-top">
              <span className="stat-bar-icon" aria-hidden="true">📊</span>
              <div>
                <p className="stat-sublabel">Your Current Level</p>
                <p className="stat-mainlabel capitalize">{course.level || 'Beginner'}</p>
              </div>
            </div>
            <div className="stat-bar-track">
              <div className="stat-bar-fill green-fill" style={{ width: '45%' }} />
            </div>
          </div>

          {/* Overall Progress card */}
          <div className="banner-stat-card">
            <div className="stat-card-top justify-between">
              <p className="stat-sublabel">Overall Progress</p>
              <p className="stat-progress-val">{course.progress}%</p>
            </div>
            <div className="stat-bar-track">
              <div className="stat-bar-fill purple-fill" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main 2-Column Grid matching Screenshot 1 */}
      <div className="journey-content-grid">
        {/* Left Column: Personalized Learning Journey Stepper */}
        <section className="journey-stepper-card">
          <div className="stepper-header">
            <div className="stepper-title-wrap">
              <div className="stepper-icon-pill" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </div>
              <div>
                <h2 className="stepper-title">Personalized Learning Journey</h2>
                <p className="stepper-subtitle">
                  Complete each topic to unlock the next one. The path adapts to your performance.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/courses/${course.code}/resources`)}
              className="view-path-btn"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              View Learning Path
            </button>
          </div>

          {/* Connected Stepper Timeline */}
          <div className="stepper-list-wrap">
            <div className="timeline-connector-line" aria-hidden="true" />

            <ol className="stepper-list">
              {topics.map((t, idx) => {
                const isCompleted = t.defaultStatus === 'completed'
                const isInProgress = t.defaultStatus === 'in-progress'
                const isRecommended = t.defaultStatus === 'recommended'
                const isLocked = t.defaultStatus === 'locked'

                return (
                  <li key={t.id} className={`stepper-item ${t.defaultStatus}`}>
                    {/* Node status circle */}
                    <div className="stepper-node-circle" aria-hidden="true">
                      {isCompleted && (
                        <span className="node-icon completed-node">✓</span>
                      )}
                      {isInProgress && (
                        <span className="node-icon in-progress-node">
                          <span className="in-progress-dot" />
                        </span>
                      )}
                      {isRecommended && (
                        <span className="node-icon recommended-node">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                          </svg>
                        </span>
                      )}
                      {isLocked && (
                        <span className="node-icon locked-node">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Step Card */}
                    <div className="step-card-content">
                      <div className="step-icon-box" aria-hidden="true">
                        {getStepIcon(idx)}
                      </div>

                      <div className="step-details">
                        <div className="step-header-row">
                          <h3 className="step-title">
                            {idx + 1}. {t.title}
                          </h3>

                          {/* Status Badge */}
                          <div className="step-badge-wrap">
                            {isCompleted && (
                              <span className="step-badge completed-badge">
                                ✓ Completed
                              </span>
                            )}
                            {isInProgress && (
                              <span className="step-badge in-progress-badge">
                                ● In Progress
                              </span>
                            )}
                            {isRecommended && (
                              <span className="step-badge recommended-badge">
                                ★ Recommended
                              </span>
                            )}
                            {isLocked && (
                              <span className="step-badge locked-badge">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="step-subtopics">
                          {t.subtopics || 'Foundational topics and key exercises'}
                        </p>

                        {/* Bottom Score & Action Button Row */}
                        <div className="step-footer-row">
                          <div className="step-score-wrap">
                            {isCompleted && (
                              <span className="step-score-text">
                                Score: <strong>{t.defaultScore}%</strong>
                              </span>
                            )}
                            {isInProgress && (
                              <span className="step-score-text">
                                Score: <strong>{t.defaultScore}%</strong>
                              </span>
                            )}
                          </div>

                          <div className="step-action-wrap">
                            {isCompleted && (
                              <button
                                onClick={() => handleStepAction(t)}
                                className="step-btn review-btn"
                                type="button"
                              >
                                Review
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                onClick={() => handleStepAction(t)}
                                className="step-btn continue-btn"
                                type="button"
                              >
                                Continue →
                              </button>
                            )}
                            {isRecommended && (
                              <button
                                onClick={() => handleStepAction(t)}
                                className="step-btn start-btn"
                                type="button"
                              >
                                Start
                              </button>
                            )}
                            {isLocked && (
                              <button
                                disabled
                                className="step-btn locked-btn"
                                type="button"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Right Column: Topic Performance & AI Recommendation & Quote */}
        <aside className="journey-side-column">
          {/* Card 1: Topic Performance */}
          <div className="side-card performance-card">
            <div className="performance-card-header">
              <div className="flex items-center gap-2">
                <span className="performance-header-icon" aria-hidden="true">📊</span>
                <h3 className="side-card-title">Topic Performance</h3>
              </div>
              <Link to="/progress" className="view-details-link">
                View Details
              </Link>
            </div>

            <div className="performance-bars-list">
              {performance.map((item, i) => (
                <div key={i} className="perf-item-row">
                  <div className="perf-label-row">
                    <span className="perf-topic-name">{item.title}</span>
                    <span className="perf-topic-pct">{item.score}%</span>
                  </div>
                  <div className="perf-bar-track">
                    <div
                      className="perf-bar-fill"
                      style={{
                        width: `${item.score}%`,
                        backgroundColor: getPerformanceColor(item.score)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: AI Recommendation matching Screenshot 1 */}
          <div className="side-card ai-recommendation-card">
            <div className="ai-card-top-title">
              <span className="sparkle-icon" aria-hidden="true">✨</span>
              <h3>AI Recommendation</h3>
            </div>

            <div className="ai-inner-banner">
              <div className="ai-robot-avatar" aria-hidden="true">
                <div className="robot-circle">
                  🤖
                </div>
              </div>
              <div className="ai-message-body">
                <h4 className="ai-salute">You are doing great! 🎉</h4>
                <p className="ai-recommend-text">
                  {weakConceptDetails || `Focus more on ${weakConcept}. Practice additional coding questions to strengthen your understanding.`}
                </p>
              </div>
            </div>

            <Link
              to={`/resources?topic=${encodeURIComponent(weakConcept)}`}
              className="view-recommended-btn"
            >
              View Recommended Resources →
            </Link>
          </div>

          {/* Card 3: Inspirational Quote matching Screenshot 1 */}
          <div className="side-card quote-card">
            <div className="quote-body">
              <span className="big-quote-mark" aria-hidden="true">“</span>
              <p className="quote-saying">
                "Small steps every day lead to big results."
              </p>
              <span className="quote-author">- Adaptive Learner</span>
            </div>
            <div className="quote-leaf-art" aria-hidden="true">
              🌱
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
