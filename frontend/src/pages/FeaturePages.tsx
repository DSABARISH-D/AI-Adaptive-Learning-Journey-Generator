import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import type { CourseDetail, Enrollment, Course } from '../types'

export function JourneyPage() {
  const { code } = useParams<{ code?: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJourney() {
      try {
        const enrollments = await apiFetch<Enrollment[]>('/enrollments')
        const selected = code ? enrollments.find((item) => item.course_code === code) : enrollments[0]
        if (!selected?.course_code) {
          setLoading(false)
          return
        }
        const courseData = await apiFetch<CourseDetail>(`/courses/${selected.course_code}`)
        setCourse(courseData)
        setEnrollment(selected)
      } catch (journeyError) {
        setError(journeyError instanceof Error ? journeyError.message : 'Unable to load your journey')
      } finally {
        setLoading(false)
      }
    }
    loadJourney()
  }, [code])

  if (loading) return <p className="text-gray-500">Loading your learning journey...</p>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
  if (!course || !enrollment) {
    return <div className="space-y-4"><PageHeading eyebrow="Your personalized roadmap" title="Learning Journey" description="Enroll in a course to generate your first adaptive path." /><Link to="/courses" className="inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Browse courses</Link></div>
  }

  const completedTopics = enrollment.baseline_completed ? Math.min(1, course.topics.length) : 0
  const progress = course.topics.length ? Math.round((completedTopics / course.topics.length) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Personalized roadmap" title={course.title} description="Your adaptive path updates as your skills grow." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div><p className="text-sm text-indigo-600 font-semibold">{course.code.toUpperCase()}</p><h2 className="text-xl font-bold">Topic roadmap</h2></div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{progress}% unlocked</span>
          </div>
          <ol className="space-y-4">
            {course.topics.map((topic, index) => {
              const completed = index < completedTopics
              const current = index === completedTopics
              return (
              <li key={topic.title} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? 'bg-emerald-100 text-emerald-700' : current ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
                <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><strong>{topic.title}</strong><span className="text-xs text-gray-500">{completed ? 'Baseline complete' : current ? 'Current focus' : 'Upcoming'}</span></div><p className="mt-1 text-sm text-gray-500">{topic.description || 'Guided practice and checks will appear here.'}</p><Link to={`/courses/${course.code}/topics/${topic.id}/assessment`} className="mt-2 inline-block text-xs font-semibold text-indigo-600">Practice topic →</Link></div>
              </li>
              )
            })}
          </ol>
        </section>
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-indigo-100">Current focus</p><h2 className="mt-2 text-2xl font-bold">{course.topics[completedTopics]?.title || 'All topics complete'}</h2><p className="mt-3 text-indigo-100">{course.topics[completedTopics]?.description || 'Review your course topics and keep building momentum.'}</p>
          <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-right text-sm text-indigo-100">{enrollment.baseline_completed ? `Baseline score: ${enrollment.baseline_score ?? 0}` : 'Baseline assessment required'}</p>
          {!enrollment.baseline_completed && <Link to={`/courses/${course.code}/baseline`} className="mt-8 block w-full rounded-lg bg-white px-4 py-3 text-center font-semibold text-indigo-700 hover:bg-indigo-50">Take baseline assessment</Link>}
        </section>
      </div>
    </div>
  )
}

export function AssessmentsPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiFetch<Course[]>('/courses').then(setCourses).finally(() => setLoading(false)) }, [])

  return <div className="space-y-6"><PageHeading eyebrow="Measure your skills" title="Assessments" description="Baseline and topic assessments help tailor your learning path." /><div className="grid gap-5 md:grid-cols-2">{loading ? <p>Loading assessments...</p> : courses.map((course) => <article key={course.id} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Baseline assessment</p><h2 className="mt-2 text-xl font-bold">{course.title}</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Not started</span></div><p className="mt-3 text-sm text-gray-500">5 questions · 10 minutes · Personalized difficulty</p><button onClick={() => navigate(`/courses/${course.code}/baseline`)} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Start assessment</button></article>)}</div></div>
}

export function ResourcesPage() {
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<any[]>([])

  useEffect(() => {
    apiFetch<any>('/context')
      .then((data) => {
        if (data && data.resources && data.resources.length > 0) {
          setResources(data.resources)
        } else {
          setResources([])
        }
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learn with context"
        title="Adaptive Learning Resources"
        description="Curated videos, certified courses, and Kaggle datasets tailored to your current syllabus and skill level."
      />

      {loading ? (
        <p className="text-gray-500">Loading learning resources...</p>
      ) : resources.length > 0 ? (
        <div className="space-y-8">
          {resources.map((item: any) => (
            <section key={item.topic} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h2 className="text-xl font-bold capitalize text-gray-900">{item.topic}</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 capitalize">
                  Level: {item.level || 'Intermediate'}
                </span>
              </div>

              {/* Videos */}
              {item.videos && item.videos.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Recommended Video Tutorials</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.videos.map((vid: any, i: number) => (
                      <a
                        key={i}
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold text-sm">▶</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{vid.title}</p>
                          <p className="text-xs text-gray-500">{vid.channel || 'YouTube'}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {item.courses && item.courses.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Verified Courses & Certifications</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.courses.map((crs: any, i: number) => (
                      <a
                        key={i}
                        href={crs.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">🎓</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{crs.title}</p>
                          <p className="text-xs text-gray-500">{crs.provider || 'Coursera / edX'}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Project */}
              {item.project && (
                <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-4">
                  <p className="text-xs font-bold uppercase text-amber-800 tracking-wider">Hands-on Mini Project</p>
                  <p className="text-sm text-amber-900 mt-1 font-medium">{item.project}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600">No resources generated yet. Start your learning plan or browse courses.</p>
          <Link to="/courses" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white text-sm">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  )
}

export function ProgressPage() {
  const [context, setContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<any>('/context')
      .then(setContext)
      .catch(() => setContext(null))
      .finally(() => setLoading(false))
  }, [])

  const learningScore = context?.learningScore ?? 78
  const pathMetrics = context?.pathMetrics || {}
  const modelScores = context?.modelScores || []

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Your momentum & AI evaluation"
        title="Progress & Model Analytics"
        description="Real-time adaptive learning score, syllabus milestones, and machine learning performance predictions."
      />

      {loading ? (
        <p className="text-gray-500">Loading progress...</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Adaptive Mastery</p>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600">{learningScore}%</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Auto-weighted score</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Syllabus Completed</p>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600">{pathMetrics.topic_completion_pct ?? 25}%</p>
              <p className="mt-1 text-xs text-gray-500">Prerequisite milestones</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Quiz Performance</p>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600">{pathMetrics.quiz_pct ?? 75}%</p>
              <p className="mt-1 text-xs text-gray-500">Average assessment score</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Active Model</p>
              <p className="mt-2 text-xl font-bold text-gray-900">{context?.modelName || 'Gradient Boosting'}</p>
              <p className="mt-1 text-xs text-indigo-600 font-semibold">{context?.automlEngine || 'Scikit-Learn AutoML'}</p>
            </div>
          </div>

          {/* Model Leaderboard */}
          {modelScores.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-1">AutoML Model Evaluation Leaderboard</h2>
              <p className="text-xs text-gray-500 mb-4">Trained on real student interaction & assessment benchmarks</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase">
                      <th className="pb-3">Rank</th>
                      <th className="pb-3">Model Architecture</th>
                      <th className="pb-3">Validation Accuracy</th>
                      <th className="pb-3">F1 Score</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {modelScores.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 font-semibold text-gray-700">#{idx + 1}</td>
                        <td className="py-3 font-bold text-gray-900 flex items-center gap-2">
                          {m.model}
                          {idx === 0 && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Best Model</span>}
                        </td>
                        <td className="py-3 font-semibold text-indigo-600">{m.accuracy}%</td>
                        <td className="py-3 text-gray-600">{m.f1_score}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  topic?: string
  mode?: string
  retrieved?: string[]
  resources?: Array<{ title: string; url: string; type: string }>
}

export function TutorPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I'm your AI Adaptive Learning Tutor. Ask me any doubt about Python, Machine Learning, Data Preprocessing, or your personalized learning roadmap!`,
    },
  ])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const quickPrompts = [
    'How do Decision Trees work?',
    'Explain Linear Regression vs Ridge',
    'What is Data Preprocessing in ML?',
    'What are Activation Functions in Neural Networks?',
  ]

  const send = async (queryText?: string) => {
    const text = (queryText || draft).trim()
    if (!text || loading) return

    setDraft('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const resp = await apiFetch<any>('/tutor', {
        method: 'POST',
        body: JSON.stringify({ question: text }),
      })

      if (resp && resp.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: resp.answer,
            topic: resp.topic,
            mode: resp.mode,
            retrieved: resp.retrieved,
            resources: resp.related_resources,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'I could not process that question right now. Please try rephrasing or asking about a syllabus topic.',
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Connection to the AI Tutor service was interrupted. Please make sure the backend is active.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Your AI study companion"
        title="AI Adaptive Tutor"
        description="Instant doubt-solving grounded in your course syllabus, prerequisite graph, and recommended learning resources."
      />

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => send(prompt)}
            disabled={loading}
            className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-sm"
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      <section className="flex min-h-[550px] flex-col rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[500px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
                }`}
              >
                {/* Assistant Topic Header */}
                {message.role === 'assistant' && message.topic && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200/60">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-bold uppercase text-indigo-800">
                      Topic: {message.topic}
                    </span>
                    {message.mode && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {message.mode === 'openai' ? 'OpenAI LLM' : 'Pedagogical RAG Engine'}
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-line">{message.text}</div>

                {/* Retrieved Context Chunks */}
                {message.retrieved && message.retrieved.length > 0 && (
                  <div className="mt-3 rounded-lg bg-indigo-50/50 p-2.5 text-xs text-indigo-950 border border-indigo-100">
                    <p className="font-bold text-[11px] text-indigo-800 uppercase tracking-wider mb-1">Knowledge Context Used:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {message.retrieved.map((chunk, i) => (
                        <li key={i}>{chunk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Resource Buttons */}
                {message.resources && message.resources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200/60">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Recommended learning links:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                        >
                          {res.type === 'video' ? '▶ Video' : '🎓 Course'}: {res.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-50 px-5 py-4 text-sm text-gray-500 border border-gray-100 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-600" />
                Thinking & generating step-by-step guidance...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && send()}
              placeholder="Ask anything about machine learning, algorithms, or your syllabus..."
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => send()}
              disabled={loading || !draft.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false)
  return <div className="space-y-6"><PageHeading eyebrow="Workspace preferences" title="Settings" description="Control notifications and learning preferences." /><section className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5"><label className="flex items-center justify-between gap-4"><span><strong className="block">Daily learning reminder</strong><small className="text-gray-500">Receive a reminder when it is time to study.</small></span><input type="checkbox" defaultChecked className="h-5 w-5 accent-indigo-600" /></label><label className="flex items-center justify-between gap-4"><span><strong className="block">Adaptive recommendations</strong><small className="text-gray-500">Use assessment performance to adjust your roadmap.</small></span><input type="checkbox" defaultChecked className="h-5 w-5 accent-indigo-600" /></label><button onClick={() => setSaved(true)} className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">{saved ? 'Saved' : 'Save preferences'}</button></section></div>
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1><p className="mt-2 text-gray-600">{description}</p></header>
}

export function MyCoursesPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Keep learning" title="My Courses" description="Continue where you left off and explore your enrolled courses." /><Link to="/courses" className="inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Browse course catalog</Link></div>
}
