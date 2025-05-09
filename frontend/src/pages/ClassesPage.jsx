import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClassStore } from '../store/useClassStore'
import { authStore } from '../store/useAuthStore'

export const ClassesPage = () => {
  const { classes, loading, error, fetchClasses } = useClassStore()
  const { authUser } = authStore()
  const navigate = useNavigate()
  
  const isTeacher = authUser?.userType === 'teacher'

  useEffect(() => {
    if (authUser) {
      fetchClasses(authUser.userType)
    }
  }, [authUser, fetchClasses])

  const handleCreateClass = () => {
    navigate('/create-class')
  }

  const handleEnrollClass = () => {
    navigate('/enroll-class')
  }

  const handleClassClick = (classId) => {
    navigate(`/classes/${classId}`)
  }

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Classes</h1>
        {isTeacher ? (
          <button
            onClick={handleCreateClass}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Create Class
          </button>
        ) : (
          <button
            onClick={handleEnrollClass}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Enroll in Class
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-lg text-gray-600 mb-4">
            {isTeacher
              ? "You haven't created any classes yet."
              : "You're not enrolled in any classes yet."}
          </p>
          {isTeacher ? (
            <Link
              to="/create-class"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Create your first class
            </Link>
          ) : (
            <Link
              to="/enroll-class"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Enroll in a class
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classItem) => (
            <div
              key={classItem._id}
              onClick={() => handleClassClick(classItem._id)}
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{classItem.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>
              {isTeacher && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {classItem.students?.length || 0} Students
                </div>
              )}
              {!isTeacher && classItem.teacher && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Teacher: {classItem.teacher.fullName || "Unknown"}
                </div>
              )}
              {isTeacher && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
                  <p className="font-medium">Enrollment Code:</p>
                  <code className="bg-gray-200 px-2 py-1 rounded">{classItem.enrollmentCode}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}