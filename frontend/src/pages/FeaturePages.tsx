import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { recordLearningEvent } from '../services/cloudStore'
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
  const resources = ['Loop Control in Java', 'Nested Loops Explained', 'Practice Problems: Iteration', 'Methods and Parameters']
  return <div className="space-y-6"><PageHeading eyebrow="Learn with context" title="Learning Resources" description="Recommended videos and practice material for your current weak concepts." /><div className="grid gap-5 md:grid-cols-2">{resources.map((resource, index) => <article key={resource} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"><div className="flex gap-4"><div className="flex h-14 w-20 items-center justify-center rounded-lg bg-indigo-50 text-2xl">▶</div><div><span className="text-xs font-semibold text-emerald-600">{index < 2 ? 'Beginner' : 'Practice'}</span><h2 className="mt-1 font-bold">{resource}</h2><p className="mt-1 text-sm text-gray-500">Suggested for your Loops topic</p></div></div></article>)}</div></div>
}

export function ProgressPage() {
  return <div className="space-y-6"><PageHeading eyebrow="Your momentum" title="Progress" description="A clear view of what you have learned and what comes next." /><div className="grid gap-5 sm:grid-cols-3">{[['32','Topics'], ['16','Lessons'], ['71%','Average score']].map(([value, label]) => <div key={label} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">{label}</p><p className="mt-3 text-3xl font-bold text-indigo-600">{value}</p></div>)}</div><section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"><h2 className="text-xl font-bold">Weekly study activity</h2><div className="mt-8 flex h-48 items-end gap-4">{[45, 75, 35, 90, 58, 82, 38].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-indigo-500" style={{ height: `${height}%` }} /><span className="text-xs text-gray-500">{['M','T','W','T','F','S','S'][index]}</span></div>)}</div></section></div>
}

export function TutorPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([{ role: 'assistant', text: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! Ask me anything about your current learning journey.` }])
  const [draft, setDraft] = useState('')
  const send = () => { if (!draft.trim()) return; const text = draft.trim(); setMessages((items) => [...items, { role: 'user', text }, { role: 'assistant', text: 'Great question. Start by tracing the loop one iteration at a time, then check the condition before each pass.' }]); recordLearningEvent('tutor_message', { text }); setDraft('') }
  return <div className="space-y-6"><PageHeading eyebrow="Your study companion" title="AI Tutor" description="Get focused help grounded in your profile and current roadmap." /><section className="flex min-h-[520px] flex-col rounded-2xl bg-white shadow-sm border border-gray-100"><div className="flex-1 space-y-4 p-6">{messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{message.text}</div></div>)}</div><div className="border-t border-gray-100 p-4"><div className="flex gap-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Ask about loops, methods, or your roadmap..." className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /><button onClick={send} className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Send</button></div></div></section></div>
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
