import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoginPage } from './pages/LoginPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'
import { BaselineAssessmentPage } from './pages/BaselineAssessmentPage'
import { TopicAssessmentPage } from './pages/TopicAssessmentPage'
import { AssessmentResultPage } from './pages/AssessmentResultPage'
import { AssessmentsPage, JourneyPage, ProgressPage, ResourcesPage, SettingsPage, TutorPage } from './pages/FeaturePages'
import { AuthProvider } from './hooks/useAuth'
import './styles/index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:code" element={<CourseDetailPage />} />
            <Route path="courses/:code/baseline" element={<BaselineAssessmentPage />} />
            <Route path="courses/:code/baseline/:quizId/result" element={<AssessmentResultPage />} />
            <Route path="courses/:code/topics/:topicId/assessment" element={<TopicAssessmentPage />} />
            <Route path="courses/:code/journey" element={<JourneyPage />} />
            <Route path="journey" element={<JourneyPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="tutor" element={<TutorPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Fallback for other routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
