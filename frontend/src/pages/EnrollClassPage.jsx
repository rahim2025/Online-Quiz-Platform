import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClassStore } from '../store/useClassStore'

export const EnrollClassPage = () => {
  const [enrollmentCode, setEnrollmentCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { enrollInClass, loading } = useClassStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!enrollmentCode.trim()) {
      setError('Please enter an enrollment code')
      return
    }
    
    try {
      const result = await enrollInClass(enrollmentCode)
      if (result.success) {
        navigate('/classes')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Enroll in a Class</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="enrollmentCode" className="block text-sm font-medium text-gray-700">
              Enrollment Code
            </label>
            <input
              type="text"
              id="enrollmentCode"
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter the enrollment code provided by your teacher"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}