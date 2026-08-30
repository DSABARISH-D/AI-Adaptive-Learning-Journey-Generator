import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { CourseDetail, Enrollment } from '../types'
import '../styles/Courses.css'

export function CourseDetailPage() {
  const { code } = useParams<{ code: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
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
        setIsEnrolled(enrollmentsData.some((e) => e.course_code === code))
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
      setLoading(true)
      await apiFetch(`/courses/${code}/enroll`, { method: 'POST' })
      setIsEnrolled(true)
      alert(`Successfully enrolled in ${code}!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
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
    <div className="panel max-w-4xl space-y-8">
      <Link to="/courses" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2">
        ← Back to courses
      </Link>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
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
          <button
            className={`w-full md:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-sm transition-all ${
              isEnrolled
                ? 'bg-green-500 hover:bg-green-600 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
            }`}
            onClick={handleEnroll}
            disabled={isEnrolled || loading}
          >
            {isEnrolled ? '✓ Already Enrolled' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
