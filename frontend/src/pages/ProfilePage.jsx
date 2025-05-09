import { useState, useEffect } from 'react'
import { authStore } from '../store/useAuthStore'

export const ProfilePage = () => {
  const { authUser, updateProfile } = authStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  })
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize form data when authUser changes
  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || authUser.fullname || '',
        email: authUser.email || ''
      })
    }
  }, [authUser])

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const result = await updateProfile({ profilePic: reader.result })
        if (!result.success) {
          setError(result.error)
        }
      }
    } catch (err) {
      setError('Failed to update profile picture')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleEdit = () => {
    if (isEditing) {
      // Reset form data to original values if canceling
      setFormData({
        fullName: authUser.fullName || authUser.fullname || '',
        email: authUser.email || ''
      })
    }
    setIsEditing(!isEditing)
    setSaveSuccess(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaveSuccess(false)

    try {
      const result = await updateProfile({
        fullName: formData.fullName,
        email: formData.email
      })

      if (result.success) {
        setSaveSuccess(true)
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to update profile information')
      }
    } catch (err) {
      setError('An error occurred while updating your profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={authUser?.profilePic || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              <label
                className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700"
                htmlFor="profile-pic"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <input
                  type="file"
                  id="profile-pic"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </label>
            </div>

            {!isEditing ? (
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">{authUser?.fullName || authUser?.fullname}</h2>
                    <p className="text-gray-600">{authUser?.email}</p>
                    <p className="text-gray-500 mt-1 text-sm">
                      {authUser?.userType === 'teacher' ? 'Teacher' : 'Student'}
                    </p>
                  </div>
                  <button
                    onClick={toggleEdit}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-grow">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={toggleEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Additional profile sections could go here */}
          
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}
      
      {loading && (
        <div className="mt-4 text-indigo-600">Updating profile...</div>
      )}
    </div>
  )
}