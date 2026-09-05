import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { CourseDetail, Enrollment } from '../types'
import '../styles/Courses.css'

export function CourseDetailPage() {
  const { code } = useParams<{ code: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const fetchDetails = async () => {
      try {
        setLoading(true)
        const [courseData, enrollmentsData] = await Promise.all([
          apiFetch<CourseDetail>(`/courses/${code}`),
          apiFetch<Enrollment[]>('/enrollments').catch(() => [])
        ])
        setCourse(courseData)
        setEnrollment(enrollmentsData.find((e) => e.course_code === code) ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [code])

  const handleEnroll = async () => {
    if (!code) return
    try {
      setEnrolling(true)
      await apiFetch(`/courses/${code}/enroll`, { method: 'POST' })
      const enrollments = await apiFetch<Enrollment[]>('/enrollments')
      setEnrollment(enrollments.find((item) => item.course_code === code) ?? null)
      alert(`Successfully enrolled in ${code}!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading && !course) {
    return <div className="p-6 text-gray-500">Loading course details...</div>
  }

  if (error || !course) {
    return (
      <div className="p-6 space-y-4">
        <Link to="/courses" className="text-indigo-600 hover:underline">← Back to courses</Link>
        <div className="error-message bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error || 'Course not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="panel course-detail-page max-w-4xl space-y-8">
      <Link to="/courses" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2">
        ← Back to courses
      </Link>
      
      <div className="detail-hero bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        {course.summary && <p className="text-lg text-gray-600 mb-8">{course.summary}</p>}
        
        <div className="topics space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-2">Topics</h3>
          <ul className="space-y-4">
            {course.topics.map((topic) => (
              <li key={topic.id} className="bg-gray-50 p-5 rounded-xl border-l-4 border-indigo-500">
                <strong className="block text-lg font-medium text-gray-900 mb-2">{topic.title}</strong>
                {topic.description && <p className="text-gray-600">{topic.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100">
          {/* Enrollment Section */}
          <section className="progress-section rounded-xl p-6 border">
            <h2 className="text-xl font-bold mb-4">Your Progress</h2>
            
            {!enrollment ? (
              <button 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course'}
              </button>
            ) : enrollment.baseline_completed ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <span>Baseline Assessment Score</span>
                  <span className="font-bold text-indigo-400">{enrollment.baseline_score} / 5</span>
                </div>
                <Link 
                  to={`/courses/${code}/journey`}
                  className="block text-center w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                  View Learning Journey
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400">Complete the baseline assessment to personalize your learning journey.</p>
                <Link 
                  to={`/courses/${code}/baseline`}
                  className="block text-center w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                  Take Baseline Assessment
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
