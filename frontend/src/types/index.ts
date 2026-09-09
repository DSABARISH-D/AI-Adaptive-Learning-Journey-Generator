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
  current_course: { code: string; title: string; subtitle?: string; icon?: string; level?: string } | null
  current_topic: { title: string; description: string | null } | null
  roadmap: Array<{ title: string; description: string | null; status: string; score: number | null }>
  recommendation: { topic: string; message: string; priority: string }
  recent_activity: Array<{ type: string; title: string; score: number | null; created_at: string }>
  daily_goal: { minutes: number; target: number }
  upcoming_tasks: Array<{ title: string; kind: string }>
}

export interface PersonalizedCourse {
  id: string | number
  code: string
  title: string
  subtitle?: string
  icon?: string
  description?: string
  difficulty?: string
  total_topics?: number
  progress?: number
  currentTopic?: string
  weakConcept?: string
  is_active?: boolean
  topics?: Array<{
    id: number
    title: string
    subtopics?: string
    defaultScore?: number
    defaultStatus?: string
    order?: number
  }>
}

export interface RoadmapTopic {
  id: number
  title: string
  subtopics?: string
  defaultScore: number
  defaultStatus: 'completed' | 'in-progress' | 'recommended' | 'locked'
  order: number
}

export interface TopicPerformanceItem {
  title: string
  score: number
  status: string
}

export interface LearningJourneyPayload {
  course: {
    code: string
    title: string
    subtitle: string
    icon: string
    description: string
    level: string
    progress: number
  }
  topics: RoadmapTopic[]
  currentTopic: string
  weakConcept: string
  weakConceptDetails: string
  performance: TopicPerformanceItem[]
  aiRecommendation: {
    title: string
    message: string
    weakConcept: string
    buttonText: string
  }
  user: any
}

export interface VideoResource {
  title: string
  channel: string
  views: string
  age: string
  duration: string
  url: string
}

export interface QuickNotes {
  topic: string
  bullets: string[]
}

export interface DocumentationResource {
  name: string
  type: string
  url: string
  provider: string
}

export interface LearningResourcesPayload {
  course: {
    code: string
    title: string
    subtitle: string
    icon: string
  }
  topic: string
  progress: number
  language: string
  englishResources: VideoResource[]
  tamilResources: VideoResource[]
  quickNotes: QuickNotes
  additionalDocs: DocumentationResource[]
  tutorTip: string
  user: any
}

