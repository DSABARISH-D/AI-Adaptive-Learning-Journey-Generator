import { useEffect, useState } from 'react'
import type { Course, CourseDetail, Enrollment } from './types'
import './Courses.css'

interface CoursesProps {
  token?: string
}

export function Courses({ token }: CoursesProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/courses')
        if (!response.ok) throw new Error('Failed to fetch courses')
        const data = (await response.json()) as Course[]
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    if (!token) return

    const fetchEnrollments = async () => {
      try {
        const response = await fetch('/api/enrollments', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = (await response.json()) as Enrollment[]
          setEnrollments(data)
        }
      } catch (err) {
        console.error('Failed to fetch enrollments:', err)
      }
    }

    fetchEnrollments()
  }, [token])

  const handleCourseSelect = async (courseCode: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseCode}`)
      if (!response.ok) throw new Error('Failed to fetch course details')
      const data = (await response.json()) as CourseDetail
      setSelectedCourse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseCode: string) => {
    if (!token) {
      setError('You must be logged in to enroll')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseCode}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to enroll in course')

      // Refresh enrollments
      const enrollResponse = await fetch('/api/enrollments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (enrollResponse.ok) {
        const data = (await response.json()) as Enrollment[]
        setEnrollments(data)
      }

      setSelectedCourse(null)
      alert(`Successfully enrolled in ${courseCode}!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const isEnrolled = (courseCode: string) =>
    enrollments.some((e) => e.course_code === courseCode)

  if (selectedCourse) {
    return (
      <main className="app-shell">
        <section className="panel">
          <button className="back-button" onClick={() => setSelectedCourse(null)}>
            ← Back to courses
          </button>
          <h2>{selectedCourse.title}</h2>
          {selectedCourse.summary && <p className="summary">{selectedCourse.summary}</p>}
          <div className="topics">
            <h3>Topics</h3>
            <ul>
              {selectedCourse.topics.map((topic) => (
                <li key={topic.id}>
                  <strong>{topic.title}</strong>
                  {topic.description && <p>{topic.description}</p>}
                </li>
              ))}
            </ul>
          </div>
          {token && (
            <button
              className={`enroll-button ${isEnrolled(selectedCourse.code) ? 'enrolled' : ''}`}
              onClick={() => handleEnroll(selectedCourse.code)}
              disabled={isEnrolled(selectedCourse.code) || loading}
            >
              {isEnrolled(selectedCourse.code) ? 'Already Enrolled' : 'Enroll Now'}
            </button>
          )}
          {!token && <p className="auth-prompt">Log in to enroll in courses</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="panel">
        <h1>Available Courses</h1>
        {error && <div className="error-message">{error}</div>}
        {loading && !courses.length && <p>Loading courses...</p>}
        {courses.length === 0 && !loading && <p>No courses available</p>}
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <h3>{course.title}</h3>
              {course.summary && <p className="summary">{course.summary}</p>}
              <div className="card-footer">
                {isEnrolled(course.code) && <span className="enrolled-badge">Enrolled</span>}
                <button
                  className="view-button"
                  onClick={() => handleCourseSelect(course.code)}
                  disabled={loading}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
