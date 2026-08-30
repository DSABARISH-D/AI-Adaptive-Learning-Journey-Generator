import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        handleCallback(token, user)
        navigate('/', { replace: true })
      } catch {
        console.error('Failed to parse user data from callback')
        navigate('/login', { replace: true })
      }
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, handleCallback])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
        <p className="text-gray-500">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
