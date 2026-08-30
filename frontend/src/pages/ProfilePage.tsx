import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import type { User } from '../types'
import '../styles/Profile.css'

export function ProfilePage() {
  const { user, handleCallback } = useAuth()
  const [profile, setProfile] = useState<User | null>(user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: user?.full_name || '' })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await apiFetch<User>('/profile')
        setProfile(data)
        setEditForm({ full_name: data.full_name || '' })
        // Update context if needed, though mostly token based.
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
      const data = await apiFetch<User>('/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm)
      })
      setProfile(data)
      setIsEditing(false)
      // We could update the user in context/localStorage here if needed
      const currentToken = localStorage.getItem('auth_token')
      if (currentToken) {
        handleCallback(currentToken, data)
      }
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
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-full border-4 border-indigo-100 object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-indigo-100 bg-indigo-50 flex items-center justify-center text-4xl text-indigo-600 font-bold">
            {(profile.full_name || profile.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="profile-info text-center md:text-left flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
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
                    setEditForm({ full_name: profile.full_name || '' })
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name || 'No name set'}</h3>
              <p className="text-gray-500 text-lg mb-4">{profile.email}</p>
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
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-sm">{profile.id}</p>
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
