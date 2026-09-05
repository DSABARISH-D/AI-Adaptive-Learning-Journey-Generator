import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import type { StudentProfile } from '../types'
import '../styles/Profile.css'

export function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ preferred_name: user?.full_name || '', current_level: '', learning_goals: '', interests: '' })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await apiFetch<StudentProfile>('/profile')
        setProfile(data)
        setEditForm({
          preferred_name: data.preferred_name || '',
          current_level: data.current_level || '',
          learning_goals: data.learning_goals.join(', '),
          interests: data.interests.join(', '),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<StudentProfile>('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          preferred_name: editForm.preferred_name,
          current_level: editForm.current_level || null,
          learning_goals: editForm.learning_goals.split(',').map((item) => item.trim()).filter(Boolean),
          interests: editForm.interests.split(',').map((item) => item.trim()).filter(Boolean),
        })
      })
      setProfile(data)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile) {
    return <div className="p-6">Loading profile...</div>
  }

  if (error && !profile) {
    return <div className="p-6 text-red-600">Error: {error}</div>
  }

  if (!profile) return null

  return (
    <div className="profile-container max-w-4xl mx-auto space-y-6">
      <div className="profile-header bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Profile" className="w-32 h-32 rounded-full border-4 border-indigo-100 object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-indigo-100 bg-indigo-50 flex items-center justify-center text-4xl text-indigo-600 font-bold">
            {(profile.preferred_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="profile-info text-center md:text-left flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                <input
                  type="text"
                  value={editForm.preferred_name}
                  onChange={(e) => setEditForm({ ...editForm, preferred_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Level</label>
                <select value={editForm.current_level} onChange={(e) => setEditForm({ ...editForm, current_level: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select a level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Goals</label>
                <input type="text" value={editForm.learning_goals} onChange={(e) => setEditForm({ ...editForm, learning_goals: e.target.value })} placeholder="Build projects, pass interviews" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                <input type="text" value={editForm.interests} onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })} placeholder="Web development, data" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      preferred_name: profile.preferred_name || '',
                      current_level: profile.current_level || '',
                      learning_goals: profile.learning_goals.join(', '),
                      interests: profile.interests.join(', '),
                    })
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{profile.preferred_name || user?.full_name || 'No name set'}</h3>
              <p className="text-gray-500 text-lg mb-4">{user?.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm transition-colors"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-sections grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="profile-section bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Account Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-sm">{profile.user_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email Status</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Verified
              </p>
            </div>
          </div>
        </div>

        <div className="profile-section bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Learning Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700 mb-1">12</div>
              <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Courses</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700 mb-1">45h</div>
              <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Time</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700 mb-1">3</div>
              <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Certs</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700 mb-1">98%</div>
              <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
