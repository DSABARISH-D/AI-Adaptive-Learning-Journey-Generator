export interface User {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface StudentProfile {
  id: number
  user_id: number
  preferred_name: string
  learning_goals: string[]
  interests: string[]
  current_level: string
  created_at: string
}

export interface Course {
  id: number
  code: string
  title: string
  summary: string
}

export interface CourseTopic {
  id: number
  course_id: number
  title: string
  description: string
  order: number
}

export interface CourseDetail extends Course {
  topics: CourseTopic[]
}

export interface Enrollment {
  id: number
  user_id: number
  course_id: number
  status: string
  enrolled_at: string
  course_code?: string | null
  course_title?: string | null
  baseline_score?: number
  baseline_completed?: boolean
}

export interface AuthTokenResponse {
  token: string
  user: User
}

export interface QuizQuestion {
  text: string
  options: string[]
}

export interface BaselineQuizResponse {
  quiz_id: number
  questions: QuizQuestion[]
}
