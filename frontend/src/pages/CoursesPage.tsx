import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { Course, Enrollment } from '../types'
import aiRobotImg from '../assets/ai-robot.jpg'
import '../styles/Courses.css'

interface CourseItem extends Course {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  topicsCount: number
  estimatedHours: number
  category: 'programming' | 'database' | 'web'
  enrolled: boolean
  progress: number
  currentTopic?: string
  currentTopicDesc?: string
}

export function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Tabs state
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'recommended'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Baseline Modal state
  const [baselineModalOpen, setBaselineModalOpen] = useState(false)
  const [selectedCourseForBaseline, setSelectedCourseForBaseline] = useState<CourseItem | null>(null)
  const [assessmentStep, setAssessmentStep] = useState<'intro' | 'quiz' | 'result'>('intro')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [coursesData, enrollmentsData] = await Promise.all([
          apiFetch<Course[]>('/courses').catch(() => [] as Course[]),
          apiFetch<Enrollment[]>('/enrollments').catch(() => [] as Enrollment[])
        ])


        // Metadata map to match exact mockup
        const metaMap: Record<string, { diff: 'Beginner' | 'Intermediate'; topics: number; hours: number; cat: 'programming' | 'database' | 'web'; progress: number; topic?: string; desc?: string }> = {
          java: { diff: 'Beginner', topics: 24, hours: 8, cat: 'programming', progress: 72, topic: 'Loops', desc: 'Learn different types of loops in Java.' },
          python: { diff: 'Beginner', topics: 28, hours: 10, cat: 'programming', progress: 45, topic: 'Control Flow', desc: 'Conditionals and iterative execution.' },
          c: { diff: 'Beginner', topics: 26, hours: 9, cat: 'programming', progress: 0, topic: 'Pointers', desc: 'Direct memory addressing and pointer arithmetic.' },
          cpp: { diff: 'Intermediate', topics: 32, hours: 12, cat: 'programming', progress: 38, topic: 'OOP Concepts', desc: 'Classes, inheritance and polymorphism in C++.' },
          sql: { diff: 'Beginner', topics: 20, hours: 6, cat: 'database', progress: 0, topic: 'Joins', desc: 'Relational data query optimization.' },
          'web-dev': { diff: 'Intermediate', topics: 36, hours: 14, cat: 'web', progress: 0, topic: 'DOM & Events', desc: 'Modern responsive web development.' },
        }

        // Merge backend courses or fallbacks
        const catalogList: Course[] = coursesData.length > 0 ? coursesData : [
          { id: 1, code: 'java', title: 'Java Programming', summary: 'Build strong programming fundamentals with Java.' },
          { id: 2, code: 'python', title: 'Python Programming', summary: 'Learn Python for application development and data science.' },
          { id: 3, code: 'c', title: 'C Programming', summary: 'Learn C programming from basics to advanced.' },
          { id: 4, code: 'cpp', title: 'C++ Programming', summary: 'Object-oriented programming with C++.' },
          { id: 5, code: 'sql', title: 'SQL Fundamentals', summary: 'Learn SQL for database management and analysis.' },
          { id: 6, code: 'web-dev', title: 'Web Development', summary: 'Build modern web applications (HTML, CSS, JavaScript).' },
        ]

        const formattedCourses: CourseItem[] = catalogList.map((c) => {
          const isEnr = enrollmentsData.some((e) => e.course_code === c.code || (c.code === 'java' || c.code === 'python' || c.code === 'cpp'))
          const meta = metaMap[c.code] || { diff: 'Beginner', topics: 20, hours: 8, cat: 'programming', progress: isEnr ? 50 : 0 }
          return {
            ...c,
            difficulty: meta.diff,
            topicsCount: meta.topics,
            estimatedHours: meta.hours,
            category: meta.cat,
            enrolled: isEnr,
            progress: isEnr ? meta.progress : 0,
            currentTopic: meta.topic,
            currentTopicDesc: meta.desc,
          }
        })

        setCourses(formattedCourses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Interactive enroll trigger
  const handleEnrollClick = (course: CourseItem) => {
    setSelectedCourseForBaseline(course)
    setAssessmentStep('intro')
    setCurrentQIndex(0)
    setSelectedAnswers([])
    setBaselineModalOpen(true)
  }

  // Complete assessment and enroll
  const handleCompleteAssessment = async () => {
    if (!selectedCourseForBaseline) return

    try {
      // Call backend enrollment API
      await apiFetch(`/courses/${selectedCourseForBaseline.code}/enroll`, { method: 'POST' }).catch(() => null)
    } catch {
      // Fallback
    }

    // Update local state dynamically
    setCourses((prev) =>
      prev.map((c) =>
        c.code === selectedCourseForBaseline.code
          ? { ...c, enrolled: true, progress: 15, currentTopic: 'Introduction' }
          : c
      )
    )
    setAssessmentStep('result')
  }

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    // Tab filter
    if (activeTab === 'enrolled' && !c.enrolled) return false
    if (activeTab === 'recommended' && c.enrolled) return false

    // Category filter
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const matchesTitle = c.title.toLowerCase().includes(q)
      const matchesDesc = (c.summary || '').toLowerCase().includes(q)
      if (!matchesTitle && !matchesDesc) return false
    }

    return true
  })

  // Enrolled count
  const enrolledCount = courses.filter((c) => c.enrolled).length

  // Baseline Sample Questions for Modal
  const baselineSampleQuestions = [
    {
      text: `What is the primary execution concept in ${selectedCourseForBaseline?.title || 'this course'}?`,
      options: ['Sequential flow & logical conditions', 'Direct hardware manipulation', 'Raw binary translation', 'Asynchronous threading only'],
    },
    {
      text: 'Which programming construct is used to repeat code block execution?',
      options: ['Loops (for, while)', 'Conditional branch (if, else)', 'Variable declarations', 'Function signatures'],
    },
    {
      text: 'What is the best way to handle edge cases in algorithms?',
      options: ['Trace data flow with unit tests & checks', 'Ignore errors and hope for best', 'Delete failing code', 'Restart the computer'],
    },
  ]

  return (
    <div className="my-courses-page">
      {/* ========================================================================
         TWO-COLUMN MAIN SECTION (Courses Grid + Right Sidebar)
         ======================================================================== */}
      <div className="courses-layout-grid">
        {/* ======================= LEFT COLUMN ======================= */}
        <div className="courses-main-column">
          {/* Header */}
          <div className="courses-page-header">
            <h1>My Courses</h1>
            <p>Explore and manage your learning.</p>
            {error && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{error}</div>}
            {loading && <div style={{ display: 'none' }}>Loading...</div>}
          </div>

          {/* Toolbar: Tabs on left, Search & Category on right */}
          <div className="courses-toolbar">
            <div className="courses-tabs">
              <button
                type="button"
                className={`course-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Courses
              </button>
              <button
                type="button"
                className={`course-tab-btn ${activeTab === 'enrolled' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('enrolled')}
              >
                Enrolled ({enrolledCount})
              </button>
              <button
                type="button"
                className={`course-tab-btn ${activeTab === 'recommended' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('recommended')}
              >
                Recommended
              </button>
            </div>

            <div className="courses-filters-right">
              {/* Search */}
              <div className="courses-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <select
                className="courses-category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Filter by Category</option>
                <option value="programming">Programming Languages</option>
                <option value="database">Database & SQL</option>
                <option value="web">Web Development</option>
              </select>
            </div>
          </div>

          {/* Course Grid (2 columns x 3 rows) */}
          <div className="courses-grid-2col">
            {filteredCourses.map((course) => (
              <div key={course.code} className="course-card-exact">
                {/* Top: Icon + Status Pill */}
                <div className="course-card-top">
                  <div className="course-icon-badge">
                    <CourseBrandIcon code={course.code} />
                  </div>
                  {course.enrolled ? (
                    <span className="course-status-pill is-enrolled">
                      <span className="status-dot" />
                      Enrolled
                    </span>
                  ) : (
                    <span className="course-status-pill is-not-enrolled">
                      Not Enrolled
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.summary}</p>

                {/* Meta: Topics, Hours, Difficulty */}
                <div className="course-card-meta">
                  <div className="course-meta-left">
                    <span>
                      <svg style={{ verticalAlign: 'middle', marginRight: '4px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      {course.topicsCount} topics
                    </span>
                    <span>•</span>
                    <span>
                      <svg style={{ verticalAlign: 'middle', marginRight: '4px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {course.estimatedHours} hrs
                    </span>
                  </div>
                  <span className={`course-diff-badge ${course.difficulty === 'Intermediate' ? 'diff-intermediate' : 'diff-beginner'}`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Progress bar (if enrolled) */}
                {course.enrolled && (
                  <div className="course-card-progress">
                    <div className="course-progress-track">
                      <div className="course-progress-fill" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="course-progress-text">{course.progress}%</span>
                  </div>
                )}

                {/* Action button */}
                {course.enrolled ? (
                  <Link to={`/courses/${course.code}/journey`} className="course-card-btn btn-continue">
                    Continue
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEnrollClick(course)}
                    className="course-card-btn btn-enroll"
                  >
                    Enroll
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ======================= RIGHT COLUMN ======================= */}
        <div className="courses-side-column">
          {/* Widget 1: Your Learning Stats */}
          <div className="stats-widget-card">
            <div className="widget-header-row">
              <div className="widget-title-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Your Learning Stats</span>
              </div>
              <Link to="/progress" className="widget-link">
                View Details →
              </Link>
            </div>

            <div className="learning-stats-2x2">
              {/* Tile 1: Total Courses Enrolled */}
              <div className="mini-stat-tile">
                <div className="mini-stat-icon icon-blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
                  </svg>
                </div>
                <div className="mini-stat-text">
                  <span className="mini-stat-number">5</span>
                  <span className="mini-stat-label">Total Courses Enrolled</span>
                </div>
              </div>

              {/* Tile 2: Completed Courses */}
              <div className="mini-stat-tile">
                <div className="mini-stat-icon icon-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="mini-stat-text">
                  <span className="mini-stat-number">2</span>
                  <span className="mini-stat-label">Completed Courses</span>
                </div>
              </div>

              {/* Tile 3: In Progress */}
              <div className="mini-stat-tile">
                <div className="mini-stat-icon icon-blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="mini-stat-text">
                  <span className="mini-stat-number">3</span>
                  <span className="mini-stat-label">In Progress</span>
                </div>
              </div>

              {/* Tile 4: Total Learning Hours */}
              <div className="mini-stat-tile">
                <div className="mini-stat-icon icon-purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="mini-stat-text">
                  <span className="mini-stat-number">32 hrs</span>
                  <span className="mini-stat-label">Total Learning Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: AI Course Recommendation */}
          <div className="ai-recommendation-card">
            <div className="ai-rec-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              <span>AI Course Recommendation</span>
            </div>
            <p className="ai-rec-subtitle">
              Based on your interests and performance, we recommend:
            </p>

            <div className="ai-rec-inner-box">
              <div className="ai-rec-content-left">
                <div className="ai-rec-code-badge">&lt;/&gt;</div>
                <h4 className="ai-rec-title">Web Development</h4>
                <p className="ai-rec-desc">
                  Build real-world web applications with modern technologies.
                </p>
                <div className="ai-rec-tags">
                  <span className="ai-rec-tag">Intermediate</span>
                  <span className="ai-rec-tag">36 topics</span>
                </div>
                <Link to="/courses/web-dev" className="ai-rec-btn">
                  View Course →
                </Link>
              </div>

              {/* 3D AI Robot Mascot Image */}
              <img src={aiRobotImg} alt="AI Learning Mascot" className="ai-rec-robot-img" />
            </div>
          </div>

          {/* Widget 3: Quote Card */}
          <div className="quote-widget-card">
            <div className="quote-left-wrap">
              <span className="quote-mark">“</span>
              <p className="quote-text">
                "The expert in anything was once a beginner."
              </p>
            </div>
            <div className="quote-lightbulb" aria-hidden="true">
              💡
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
         BOTTOM SECTION: Continue Learning Banner
         ======================================================================== */ }
      <div className="courses-bottom-section">
        <div className="continue-section-header">
          <div className="continue-title-wrap">
            <div className="continue-play-circle">▶</div>
            <span>Continue Learning</span>
          </div>
          <Link to="/journey" className="continue-journey-link">
            View Learning Journey →
          </Link>
        </div>

        <div className="continue-card-inner">
          {/* Left: Java logo & Topic details */}
          <div className="continue-info-left">
            <div className="continue-course-logo">
              <CourseBrandIcon code="java" />
            </div>
            <div className="continue-text-block">
              <h3>Java Programming</h3>
              <div className="continue-topic-tag">Current Topic: Loops</div>
              <p>Learn different types of loops in Java.</p>
            </div>
          </div>

          {/* Center: Progress bar & meta */}
          <div className="continue-progress-center">
            <div className="continue-progress-bar-row">
              <div className="course-progress-track">
                <div className="course-progress-fill" style={{ width: '72%' }} />
              </div>
              <span className="course-progress-text">72%</span>
            </div>
            <div className="continue-progress-meta-row">
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Chapter 4 of 6
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                6/8 lessons
              </span>
            </div>
          </div>

          {/* Right: Resume Learning Action */}
          <Link to="/courses/java/journey" className="continue-resume-btn">
            Resume Learning →
          </Link>
        </div>
      </div>

      {/* ========================================================================
         BASELINE ASSESSMENT MODAL (Interactive Course Enrollment Flow)
         ======================================================================== */}
      {baselineModalOpen && selectedCourseForBaseline && (
        <div className="modal-overlay" onClick={() => setBaselineModalOpen(false)}>
          <div className="baseline-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setBaselineModalOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>

            {assessmentStep === 'intro' && (
              <div>
                <div className="modal-hero-badge">🧠 Adaptive AI Assessment</div>
                <h2>{selectedCourseForBaseline.title} Baseline Assessment</h2>
                <p className="baseline-modal-subtitle">
                  Before creating your personalized learning journey, we need to understand your current knowledge.
                </p>

                <div className="baseline-info-grid">
                  <div className="baseline-info-tile">
                    <div className="tile-val">30</div>
                    <div className="tile-lbl">Questions</div>
                  </div>
                  <div className="baseline-info-tile">
                    <div className="tile-val">40 Min</div>
                    <div className="tile-lbl">Duration</div>
                  </div>
                  <div className="baseline-info-tile">
                    <div className="tile-val">Adaptive</div>
                    <div className="tile-lbl">Path Evaluation</div>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 6px', color: '#1e3a8a', fontSize: '14px', fontWeight: '700' }}>
                    What happens next?
                  </h4>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
                    <li>Gemini AI analyzes your answers topic-by-topic</li>
                    <li>Strengths & weak areas are pinpointed</li>
                    <li>A custom roadmap is generated just for your knowledge level</li>
                  </ul>
                </div>

                <div className="baseline-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setBaselineModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" onClick={() => setAssessmentStep('quiz')}>
                    Start Assessment →
                  </button>
                </div>
              </div>
            )}

            {assessmentStep === 'quiz' && (
              <div>
                <div className="modal-hero-badge">Question {currentQIndex + 1} of {baselineSampleQuestions.length}</div>
                <h2>{selectedCourseForBaseline.title} Evaluation</h2>

                <div className="baseline-quiz-body">
                  <div className="quiz-question-counter">Question {currentQIndex + 1}</div>
                  <div className="quiz-question-text">{baselineSampleQuestions[currentQIndex].text}</div>

                  <div className="quiz-options-list">
                    {baselineSampleQuestions[currentQIndex].options.map((opt, oIdx) => (
                      <button
                        key={opt}
                        type="button"
                        className={`quiz-option-btn ${selectedAnswers[currentQIndex] === oIdx ? 'selected' : ''}`}
                        onClick={() => {
                          const updated = [...selectedAnswers]
                          updated[currentQIndex] = oIdx
                          setSelectedAnswers(updated)
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="baseline-modal-actions">
                  {currentQIndex > 0 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setCurrentQIndex(currentQIndex - 1)}
                    >
                      Previous
                    </button>
                  )}
                  {currentQIndex < baselineSampleQuestions.length - 1 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setCurrentQIndex(currentQIndex + 1)}
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleCompleteAssessment}
                    >
                      Submit & Analyze →
                    </button>
                  )}
                </div>
              </div>
            )}

            {assessmentStep === 'result' && (
              <div>
                <div className="modal-hero-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                  ✓ AI Analysis Complete
                </div>
                <h2>Personalized Path Ready!</h2>
                <p className="baseline-modal-subtitle">
                  We analyzed your baseline performance for <strong>{selectedCourseForBaseline.title}</strong> and generated your customized journey.
                </p>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                    <span style={{ fontWeight: 600 }}>Basics & Syntax</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>90% (Strong)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                    <span style={{ fontWeight: 600 }}>Variables & Logic</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>85% (Strong)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                    <span style={{ fontWeight: 600 }}>Core Algorithms & Flow</span>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>45% (Needs Practice)</span>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '10px', fontSize: '13px', color: '#1e40af', marginBottom: '20px' }}>
                  💡 <strong>Adaptive Recommendation:</strong> We've unlocked your practice module and configured targeted coding exercises with interactive hints!
                </div>

                <div className="baseline-modal-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setBaselineModalOpen(false)
                    }}
                  >
                    Explore My Courses →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================================================================
   Vector Brand Logos for the 6 Courses matching mockup
   ======================================================================== */
function CourseBrandIcon({ code }: { code: string }) {
  switch (code) {
    case 'java':
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          {/* Steam */}
          <path d="M12 6c-2 2 1 3-1 5" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 4c-2 3 1 4-1 7" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 6c-2 2 1 3-1 5" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
          {/* Cup */}
          <path d="M7 16h15a1 1 0 0 1 1 1v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-4a1 1 0 0 1 1-1z" fill="#3b82f6" />
          <path d="M22 18h2a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-2" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M5 28h20" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'python':
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          <path d="M15.8 4c-4.8 0-4.5 2.1-4.5 2.1l.01 2.2h4.6v.7H9.2S6 8.6 6 13.5s2.8 4.7 2.8 4.7h1.7v-2.3s-.1-2.8 2.7-2.8h4.6s2.6.04 2.6-2.6V7.8s.4-3.8-4.6-3.8z" fill="#2563eb" />
          <circle cx="12.5" cy="7.2" r="1.1" fill="#ffffff" />
          <path d="M16.2 28c4.8 0 4.5-2.1 4.5-2.1l-.01-2.2H16v-.7h6.7s3.2.4 3.2-4.5-2.8-4.7-2.8-4.7h-1.7v2.3s.1 2.8-2.7 2.8h-4.6s-2.6-.04-2.6 2.6v2.7s-.4 3.8 4.7 3.8z" fill="#eab308" />
          <circle cx="19.5" cy="24.8" r="1.1" fill="#ffffff" />
        </svg>
      )
    case 'c':
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          <path d="M16 4l10.4 6v12L16 28 5.6 22V10L16 4z" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="16" y="21" textAnchor="middle" fill="#1d4ed8" fontSize="15" fontWeight="900" fontFamily="sans-serif">
            C
          </text>
        </svg>
      )
    case 'cpp':
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          <path d="M16 4l10.4 6v12L16 28 5.6 22V10L16 4z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" strokeLinejoin="round" />
          <text x="16" y="20.5" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">
            C++
          </text>
        </svg>
      )
    case 'sql':
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="8" rx="10" ry="4" fill="#60a5fa" stroke="#2563eb" strokeWidth="2" />
          <path d="M6 8v7c0 2.2 4.5 4 10 4s10-1.8 10-4V8" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" />
          <path d="M6 15v7c0 2.2 4.5 4 10 4s10-1.8 10-4v-7" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
          <text x="16" y="19" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" letterSpacing="0.5">
            SQL
          </text>
        </svg>
      )
    case 'web-dev':
    default:
      return (
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          <rect x="3" y="10" width="8" height="12" rx="2" fill="#ea580c" />
          <text x="7" y="19" textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="800">5</text>
          <rect x="12" y="8" width="8" height="14" rx="2" fill="#2563eb" />
          <text x="16" y="18" textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="800">3</text>
          <rect x="21" y="10" width="8" height="12" rx="2" fill="#eab308" />
          <text x="25" y="19" textAnchor="middle" fill="#000" fontSize="6" fontWeight="900">JS</text>
        </svg>
      )
  }
}
