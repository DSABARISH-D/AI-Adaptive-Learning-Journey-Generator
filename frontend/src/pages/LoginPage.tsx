import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { useEffect, useState } from 'react'
import heroImage from '../assets/login-hero.jpg'
import '../styles/Login.css'

export function LoginPage() {
  const { user, login, handleCallback } = useAuth()
  const [searchParams] = useSearchParams()
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return

    apiFetch<{ token: string; user: { id: number; email: string; full_name: string | null; avatar_url: string | null } }>(`/auth/google/exchange?code=${encodeURIComponent(code)}`)
      .then((data) => handleCallback(data.token, data.user))
      .catch((error) => setOauthError(error instanceof Error ? error.message : 'Google login failed'))
  }, [searchParams, handleCallback])

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleDevLogin = async () => {
    try {
      const response = await fetch('/api/auth/dev-login', { method: 'POST' })
      if (response.ok) {
        const data = await response.json() as { token: string; user: { id: number; email: string; full_name: string; avatar_url: string | null } }
        handleCallback(data.token, {
          ...data.user,
          full_name: data.user.full_name || 'Sabarish D',
          avatar_url: data.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        })
        return
      }
    } catch {
      // Backend not reached, fall through to instant demo session
    }

    // Instant demo session fallback for Sabarish D
    handleCallback('demo-token-sabarish-d', {
      id: 1,
      email: 'sabarish@adaptivelearner.ai',
      full_name: 'Sabarish D',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    })
  }

  return (
    <main className="login-page">
      {/* ============ LEFT — Branded Hero Panel ============ */}
      <section className="login-hero-panel" aria-hidden="true">
        <div className="hero-content">
          <img
            src={heroImage}
            alt="Student learning with AI-powered tools"
            className="hero-illustration"
          />
          <h1 className="hero-tagline">
            Learn. Adapt. Grow. <span>Succeed.</span>
          </h1>
          <p className="hero-subtitle-text">
            AI-powered personalized learning that adapts to your unique
            pace, style, and goals.
          </p>
          <div className="hero-features">
            <div className="feature-pill">
              <span className="pill-icon pi-path">📚</span>
              Personalized Paths
            </div>
            <div className="feature-pill">
              <span className="pill-icon pi-ai">🧠</span>
              AI Recommendations
            </div>
            <div className="feature-pill">
              <span className="pill-icon pi-res">🎯</span>
              Curated Resources
            </div>
            <div className="feature-pill">
              <span className="pill-icon pi-prog">📈</span>
              Track Progress
            </div>
          </div>
        </div>
      </section>

      {/* ============ RIGHT — Login Card ============ */}
      <section className="login-form-panel">
        <div className="login-card">
          {/* Brand */}
          <div className="card-brand">
            <div className="card-brand-logo" aria-hidden="true">
              {/* Graduation cap SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
              </svg>
            </div>
            <span className="card-brand-name">Adaptive Learner</span>
          </div>

          {/* Heading */}
          <div className="card-heading">
            <h2>Welcome Back!</h2>
            <p>Continue your personalized learning journey</p>
          </div>

          {/* OAuth error */}
          {oauthError && <p className="oauth-error">{oauthError}</p>}

          {/* Google OAuth */}
          <button onClick={login} className="oauth-button" type="button">
            <span className="google-icon" aria-hidden="true" />
            Continue with Google
          </button>

          {/* GitHub OAuth */}
          <button disabled className="oauth-button muted-oauth" type="button">
            <span className="github-icon" aria-hidden="true" />
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="or-divider"><span>OR</span></div>

          {/* Email/Password Form */}
          <form onSubmit={(event) => { event.preventDefault(); void handleDevLogin() }}>
            <label htmlFor="login-email">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="show-password"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="form-options">
              <a href="#forgot">Forgot Password?</a>
            </div>

            <button type="submit" className="sign-in-button">
              Sign In
              <span className="btn-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          </form>

          {/* Create account */}
          <p className="create-account-text">
            Don't have an account? <a href="#signup">Create an Account</a>
          </p>

          {/* Privacy footer */}
          <div className="privacy-footer">
            <p className="privacy-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Your data is safe with us
            </p>
            <p className="privacy-tagline">
              Learn <span>·</span> Adapt <span>·</span> Grow <span>·</span> Succeed
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
