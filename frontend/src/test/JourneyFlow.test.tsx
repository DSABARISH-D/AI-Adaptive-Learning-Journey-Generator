import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { JourneyPage } from '../pages/JourneyPage'

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'student@example.com', full_name: 'Test Student' },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('JourneyFlow Component Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders journey topics and adaptive recommendations when data loads', async () => {
    const mockJourney = {
      course: {
        code: 'java',
        title: 'Java Programming',
        subtitle: 'Java Programming',
        icon: 'java',
        description: 'Your personalized learning journey',
        level: 'Beginner',
        progress: 50,
      },
      topics: [
        {
          id: 1,
          title: 'Basics',
          subtopics: 'Syntax and setup',
          defaultScore: 90,
          defaultStatus: 'completed',
          order: 1,
        },
        {
          id: 2,
          title: 'Loops',
          subtopics: 'for, while',
          defaultScore: 45,
          defaultStatus: 'in-progress',
          order: 2,
        },
        {
          id: 3,
          title: 'Methods',
          subtopics: 'Functions and return types',
          defaultScore: 0,
          defaultStatus: 'locked',
          order: 3,
        },
      ],
      currentTopic: 'Loops',
      weakConcept: 'Loops',
      weakConceptDetails: 'Focus on loop boundary conditions.',
      performance: [
        { title: 'Basics', score: 90, status: 'completed' },
        { title: 'Loops', score: 45, status: 'in-progress' },
        { title: 'Methods', score: 0, status: 'locked' },
      ],
      aiRecommendation: {
        title: 'Adaptive Learning Pathway',
        message: 'Master Loops before unlocking Methods.',
        weakConcept: 'Loops',
        buttonText: 'View Recommended Resources →',
      },
      plan: {
        id: 1,
        source: 'strands',
        summary: 'Master Loops before unlocking Methods.',
        next_topic: 'Loops',
      },
      user: { id: 1 },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJourney,
    })

    render(
      <MemoryRouter initialEntries={['/courses/java/journey']}>
        <JourneyPage />
      </MemoryRouter>
    )

    // Wait for the journey to finish loading
    await waitFor(() => {
      expect(screen.getAllByText('Java Programming').length).toBeGreaterThan(0)
    })

    // Verify topics are rendered
    expect(screen.getAllByText('Basics').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Loops').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Methods').length).toBeGreaterThan(0)

    // Verify AI recommendation message and card
    expect(screen.getByText('AI Recommendation')).toBeInTheDocument()
    expect(screen.getByText(/Focus on loop boundary conditions/i)).toBeInTheDocument()
    expect(screen.getByText('View Recommended Resources →')).toBeInTheDocument()
  })

  it('renders error state when API fails gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error loading journey'))

    render(
      <MemoryRouter initialEntries={['/courses/java/journey']}>
        <JourneyPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Unable to load your learning journey/i)).toBeInTheDocument()
    })
  })
})
