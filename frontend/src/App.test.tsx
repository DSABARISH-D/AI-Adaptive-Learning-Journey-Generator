import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock useAuth so Dashboard renders without redirecting to login
vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com' },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}))

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    })
  })

  it('calls health endpoint on mount', async () => {
    render(<App />)

    await waitFor(() => {
      // It might be called with localhost/api/health if API_BASE is setup, but apiFetch handles it
      expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object))
    })
    
    // Check if it renders
    expect(screen.getByText(/Your Learning Journey/i)).toBeInTheDocument()
  })
})
