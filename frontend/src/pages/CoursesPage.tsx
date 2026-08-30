import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { Course, Enrollment } from '../types'
import '../styles/Courses.css'

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [coursesData, enrollmentsData] = await Promise.all([
          apiFetch<Course[]>('/courses'),
          apiFetch<Enrollment[]>('/enrollments').catch(() => [] as Enrollment[])
        ])
        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const isEnrolled = (courseCode: string) =>
    enrollments.some((e) => e.course_code === courseCode)

  return (
    <div className="panel space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Courses</h1>
        <p className="text-gray-600">Discover new topics to learn.</p>
      </div>
      
      {error && <div className="error-message bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
      
      {loading && !courses.length ? (
        <p className="text-gray-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses available</p>
      ) : (
        <div className="courses-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="course-card bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
              {course.summary && <p className="summary text-gray-600 mb-4 flex-1">{course.summary}</p>}
              <div className="card-footer mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                {isEnrolled(course.code) ? (
                  <span className="enrolled-badge bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Enrolled</span>
                ) : (
                  <span />
                )}
                <Link
                  to={`/courses/${course.code}`}
                  className="view-button bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
