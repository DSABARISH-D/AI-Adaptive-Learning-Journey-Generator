import type { User } from './types'
import './Profile.css'

interface ProfileProps {
  user: User
  token: string
}

export function Profile({ user }: ProfileProps) {
  return (
    <>
      <div className="top-nav">
        <div className="nav-brand">Adaptive Learner</div>
      </div>

      <div className="panel">
        <h2>My Profile</h2>

        <div className="profile-container">
          <div className="profile-header">
            {user.avatar_url && <img src={user.avatar_url} alt="Profile" className="profile-avatar" />}
            <div className="profile-info">
              <h3>{user.full_name || 'User'}</h3>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>

          <div className="profile-sections">
            <section className="profile-section">
              <h4>Account Information</h4>
              <div className="profile-field">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="profile-field">
                <label>Full Name</label>
                <p>{user.full_name || 'Not set'}</p>
              </div>
            </section>

            <section className="profile-section">
              <h4>Learning Statistics</h4>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-value">68%</div>
                  <div className="stat-label">Completion</div>
                </div>
                <div className="stat">
                  <div className="stat-value">24</div>
                  <div className="stat-label">Hours Learned</div>
                </div>
                <div className="stat">
                  <div className="stat-value">18</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <h4>Preferences</h4>
              <div className="profile-field">
                <label>Learning Level</label>
                <p>Beginner</p>
              </div>
              <div className="profile-field">
                <label>Interests</label>
                <p>Programming, Web Development</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
