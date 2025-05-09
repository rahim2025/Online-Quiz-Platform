import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useClassStore } from '../store/useClassStore'
import { useQuizStore } from '../store/useQuizStore'
import { authStore } from '../store/useAuthStore'

export const ClassDetailsPage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { classDetails, loading: classLoading, error: classError, fetchClassDetails, clearClassDetails } = useClassStore()
  const { quizzes, loading: quizLoading, error: quizError, fetchClassQuizzes, publishQuiz } = useQuizStore()
  const { authUser } = authStore()
  const [copied, setCopied] = useState(false)
  
  const isTeacher = authUser?.userType === 'teacher'
  const isClassTeacher = isTeacher && classDetails && 
    authUser && 
    (classDetails.teacher._id === authUser.id || classDetails.teacher._id === authUser._id)

  useEffect(() => {
    if (classId) {
      fetchClassDetails(classId)
      fetchClassQuizzes(classId)
    }
    
    return () => {
      clearClassDetails()
    }
  }, [classId, fetchClassDetails, clearClassDetails, fetchClassQuizzes])

  const handleCopyEnrollmentCode = () => {
    if (classDetails?.enrollmentCode) {
      navigator.clipboard.writeText(classDetails.enrollmentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBack = () => {
    navigate('/classes')
  }

  const handleCreateQuiz = () => {
    navigate(`/classes/${classId}/create-quiz`)
  }

  const handlePublishQuiz = async (quizId) => {
    await publishQuiz(quizId)
  }

  const handleViewQuiz = (quizId, status) => {
    // For students with active quizzes, navigate with state to indicate starting the quiz
    if (status === 'active' && !isTeacher) {
      navigate(`/quizzes/${quizId}`, { state: { action: 'start' } });
    } else {
      navigate(`/quizzes/${quizId}`);
    }
  }
  
  const handleViewMarks = () => {
    navigate(`/classes/${classId}/marks`)
  }

  const isLoading = classLoading || quizLoading

  if (isLoading) {
    return <div className="text-center py-8">Loading class details...</div>
  }

  if (classError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {classError}
        </div>
        <button
          onClick={handleBack}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Back to Classes
        </button>
      </div>
    )
  }

  if (!classDetails) {
    return null
  }

  // Calculate quiz status
  const getQuizStatus = (quiz) => {
    const now = new Date()
    const startTime = new Date(quiz.startTime)
    const endTime = new Date(quiz.endTime)

    if (!quiz.isPublished) {
      return "draft"
    } else if (now < startTime) {
      return "upcoming"
    } else if (now >= startTime && now <= endTime) {
      return "active"
    } else {
      return "ended"
    }
  }

  // Get status label and color
  const getQuizStatusInfo = (status) => {
    switch (status) {
      case "draft":
        return { label: "Draft", color: "bg-gray-200 text-gray-800" }
      case "upcoming":
        return { label: "Upcoming", color: "bg-blue-100 text-blue-800" }
      case "active":
        return { label: "Active", color: "bg-green-100 text-green-800" }
      case "ended":
        return { label: "Ended", color: "bg-red-100 text-red-800" }
      default:
        return { label: "Unknown", color: "bg-gray-200 text-gray-800" }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={handleBack}
        className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
      >
        <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Classes
      </button>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{classDetails.name}</h1>
            <p className="text-gray-600 mb-4">{classDetails.description}</p>
          </div>
          
          {/* Marks button for both students and teachers */}
          <button
            onClick={handleViewMarks}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isTeacher ? 'View Class Marks' : 'View Marks'}
          </button>
        </div>
        
        <div className="flex items-center mb-6">
          <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Teacher: {classDetails.teacher.fullName}</span>
        </div>
        
        {isClassTeacher && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Class Enrollment Code</h3>
                <p className="text-gray-600 text-sm">Share this code with students to join the class</p>
                <code className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
                  {classDetails.enrollmentCode}
                </code>
              </div>
              <button
                onClick={handleCopyEnrollmentCode}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Add a prominent marks summary for students with a button to view details */}
        {!isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Your Quiz Marks
                </h3>
                <p className="text-gray-600 text-sm">View your scores from all quizzes in this class</p>
              </div>
              <button
                onClick={handleViewMarks}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View All Marks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quizzes section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quizzes</h2>
          {isClassTeacher && (
            <button
              onClick={handleCreateQuiz}
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            >
              Create Quiz
            </button>
          )}
        </div>

        {quizError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {quizError}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isClassTeacher
              ? "You haven't created any quizzes yet."
              : "No quizzes available in this class yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const status = getQuizStatus(quiz)
              const { label, color } = getQuizStatusInfo(status)

              return (
                <div
                  key={quiz._id}
                  className="border rounded-md p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{quiz.title}</h3>
                      <p className="text-gray-600 text-sm">{quiz.description}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-xs ${color} px-2 py-1 rounded-full`}>
                          {label}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {quiz.duration} mins • {quiz.questions.length} questions
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Available: {new Date(quiz.startTime).toLocaleString()} to {new Date(quiz.endTime).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewQuiz(quiz._id, status)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        {status === 'active' && !isTeacher ? 'Take Quiz' : 'View'}
                      </button>
                      {isClassTeacher && !quiz.isPublished && (
                        <button
                          onClick={() => handlePublishQuiz(quiz._id)}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {isTeacher && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enrolled Students ({classDetails.students.length})</h2>
          {classDetails.students.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <ul className="divide-y">
              {classDetails.students.map((student) => (
                <li key={student._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-gray-500 text-sm">{student.email}</p>
                    </div>
                  </div>
                  
                  {/* Add button for teachers to view specific student's marks */}
                  <button
                    onClick={() => navigate(`/classes/${classId}/marks?studentId=${student._id}`)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Marks
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}