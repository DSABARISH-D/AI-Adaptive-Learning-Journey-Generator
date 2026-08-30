import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  token: string | null
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  handleCallback: (token: string, user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = async () => {
    try {
      const response = await fetch('/api/auth/google/login')
      if (!response.ok) throw new Error('Failed to initiate login')
      const data = await response.json() as { auth_url: string }
      window.location.href = data.auth_url
    } catch (err) {
      alert(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  const handleCallback = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
