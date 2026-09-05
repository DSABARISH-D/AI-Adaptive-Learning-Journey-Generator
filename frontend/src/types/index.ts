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
  topic?: string | null
}

export interface BaselineQuizResponse {
  quiz_id: number
  questions: QuizQuestion[]
}

export interface AssessmentResult {
  score: number
  total: number
  percentage: number
  strong_topics: Array<{ topic: string; score: number | null; status: string }>
  medium_topics: Array<{ topic: string; score: number | null; status: string }>
  weak_topics: Array<{ topic: string; score: number | null; status: string }>
}

export interface DashboardData {
  user: User
  stats: { overall_progress: number; courses_enrolled: number; topics_completed: number; assessments_attempted: number; average_score: number; latest_score: number | null }
  current_course: { code: string; title: string } | null
  current_topic: { title: string; description: string | null } | null
  roadmap: Array<{ title: string; description: string | null; status: string; score: number | null }>
  recommendation: { topic: string; message: string; priority: string }
  recent_activity: Array<{ type: string; title: string; score: number | null; created_at: string }>
  daily_goal: { minutes: number; target: number }
  upcoming_tasks: Array<{ title: string; kind: string }>
}
