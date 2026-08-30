import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('fetches the health endpoint and renders the status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', service: 'ai-adaptive-learning-generator' }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.any(Object))
    })

    expect(screen.getByRole('heading', { name: /your learning journey/i, level: 1 })).toBeInTheDocument()
    expect(await screen.findByText(/backend: connected/i)).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
