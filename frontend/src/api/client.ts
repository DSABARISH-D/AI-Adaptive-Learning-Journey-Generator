export const API_BASE = '/api'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.error && errorData.error.message) {
        message = errorData.error.message
      }
    } catch {
      // Ignored
    }
    throw new Error(message)
  }

  // Some endpoints might return empty body
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
