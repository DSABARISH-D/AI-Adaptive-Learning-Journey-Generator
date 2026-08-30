export interface CourseTopic {
  id: number
  title: string
  description: string | null
  order: number
}

export interface Course {
  id: number
  code: string
  title: string
  summary: string | null
}

export interface CourseDetail extends Course {
  topics: CourseTopic[]
}

export interface Enrollment {
  id: number
  user_id: number
  course_id: number
  course_code: string | null
  course_title: string | null
  status: string
}

export interface User {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface AuthTokenResponse {
  token: string
  user: User
}
