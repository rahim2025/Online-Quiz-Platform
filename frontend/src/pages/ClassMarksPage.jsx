import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useClassStore } from '../store/useClassStore'
import { useQuizStore } from '../store/useQuizStore'
import { authStore } from '../store/useAuthStore'

export const ClassMarksPage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { classDetails, loading: classLoading, error: classError, fetchClassDetails } = useClassStore()
  const { 
    classMarks, 
    loading: marksLoading, 
    error: marksError, 
    fetchStudentClassMarks, 
    clearClassMarks 
  } = useQuizStore()
  const { authUser } = authStore()
  
  // Get studentId from URL query parameters if present
  const queryParams = new URLSearchParams(location.search)
  const studentIdFromUrl = queryParams.get('studentId')
  
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl || null)
  
  const isTeacher = authUser?.userType === 'teacher'
  
  useEffect(() => {
    if (classId) {
      // Fetch basic class details for all users
      fetchClassDetails(classId)
      
      // For teachers with selected student or for students viewing their own marks
      if (isTeacher && selectedStudentId) {
        fetchStudentClassMarks(classId, selectedStudentId)
      } else if (!isTeacher) {
        fetchStudentClassMarks(classId)
      }
    }
    
    return () => {
      clearClassMarks()
    }
  }, [classId, isTeacher, selectedStudentId, fetchClassDetails, fetchStudentClassMarks, clearClassMarks])
  
  // Update selected student when URL query param changes
  useEffect(() => {
    if (studentIdFromUrl) {
      setSelectedStudentId(studentIdFromUrl)
    }
  }, [studentIdFromUrl])
  
  const handleBack = () => {
    navigate(`/classes/${classId}`)
  }
  
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId)
    // Update URL with the selected student ID without page refresh
    navigate(`/classes/${classId}/marks?studentId=${studentId}`, { replace: true })
  }
  
  const handleViewQuiz = (quizId) => {
    if (isTeacher && selectedStudentId) {
      // For teachers viewing a specific student's submission
      navigate(`/quizzes/${quizId}?studentId=${selectedStudentId}`)
    } else {
      navigate(`/quizzes/${quizId}`)
    }
  }
  
  const isLoading = classLoading || marksLoading
  
  // Find selected student name for title display
  const selectedStudent = classDetails?.students?.find(
    student => student._id === selectedStudentId
  )
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading quiz marks...</p>
        </div>
      </div>
    )
  }
  
  if (classError || marksError) {
    const errorMessage = classError || marksError
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Class
        </button>
        
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-4">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{errorMessage}</p>
        </div>
      </div>
    )
  }
  
  if (!classDetails) {
    return null
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
        Back to Class
      </button>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {classDetails.name} - Quiz Marks
          {isTeacher && selectedStudent && (
            <span className="text-indigo-600"> - {selectedStudent.fullName}</span>
          )}
        </h1>
        <p className="text-gray-600 mb-4">
          {isTeacher 
            ? selectedStudentId 
              ? `Viewing quiz scores for ${selectedStudent?.fullName || 'selected student'}`
              : 'Select a student to view their quiz scores' 
            : 'View all your quiz scores for this class'}
        </p>
      </div>
      
      {/* For teachers only - Student selection */}
      {isTeacher && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Student</h2>
          
          {classDetails.students && classDetails.students.length === 0 ? (
            <p className="text-gray-500">No students enrolled in this class.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classDetails.students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentSelect(student._id)}
                  className={`p-4 border rounded-md text-left hover:bg-gray-50 transition-colors ${
                    selectedStudentId === student._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-gray-500 text-sm">{student.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Quiz Marks Display */}
      {((isTeacher && selectedStudentId) || !isTeacher) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {isTeacher && selectedStudent ? 
              `Quiz Results for ${selectedStudent.fullName}` : 
              'Your Quiz Results'}
          </h2>
          
          {!classMarks || classMarks.quizResults.length === 0 ? (
            <div className="py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="text-gray-500">No quiz results available.</p>
              <p className="text-gray-400 text-sm mt-1">
                {isTeacher ? 
                  'This student has not attempted any quizzes yet.' : 
                  'You have not attempted any quizzes in this class yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classMarks.quizResults.map((result) => {
                    // Calculate percentage score
                    const percentage = result.score !== null && result.totalPoints > 0
                      ? Math.round((result.score / result.totalPoints) * 100)
                      : null;
                    
                    // Get status style and label
                    let statusStyle = 'bg-gray-100 text-gray-800';
                    let statusLabel = 'Not started';
                    
                    if (result.status === 'completed' || result.status === 'graded') {
                      if (result.isGraded) {
                        statusStyle = 'bg-green-100 text-green-800';
                        statusLabel = 'Graded';
                      } else {
                        statusStyle = 'bg-yellow-100 text-yellow-800';
                        statusLabel = 'Needs grading';
                      }
                    } else if (result.status === 'in-progress') {
                      statusStyle = 'bg-blue-100 text-blue-800';
                      statusLabel = 'In progress';
                    }
                    
                    return (
                      <tr key={result.quizId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{result.description || 'No description'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {result.score !== null ? (
                            <div>
                              <span className="text-base font-semibold">
                                {result.score}/{result.totalPoints}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                ({percentage}%)
                              </span>
                              
                              {/* Visual progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {result.completedAt ? (
                            <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleViewQuiz(result.quizId)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {result.score !== null ? 'View Details' : 'View Quiz'} 
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Summary Statistics - only show if we have scores */}
      {classMarks && classMarks.quizResults && classMarks.quizResults.some(r => r.score !== null) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Average Score */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-700">Average Score</h3>
              <div className="mt-2 flex items-baseline">
                {(() => {
                  const completedQuizzes = classMarks.quizResults.filter(r => r.score !== null);
                  if (completedQuizzes.length === 0) return <span className="text-gray-500">N/A</span>;
                  
                  const totalScore = completedQuizzes.reduce((sum, quiz) => 
                    sum + (quiz.score / quiz.totalPoints) * 100, 0);
                  const avgScore = Math.round(totalScore / completedQuizzes.length);
                  
                  return (
                    <>
                      <span className="text-3xl font-bold text-blue-800">{avgScore}%</span>
                      <span className="ml-1 text-sm text-blue-600">average</span>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Highest Score */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-700">Highest Score</h3>
              <div className="mt-2 flex items-baseline">
                {(() => {
                  const completedQuizzes = classMarks.quizResults.filter(r => r.score !== null);
                  if (completedQuizzes.length === 0) return <span className="text-gray-500">N/A</span>;
                  
                  const highestScoreQuiz = completedQuizzes.reduce((highest, quiz) => {
                    const percentage = (quiz.score / quiz.totalPoints) * 100;
                    return percentage > highest.percentage ? { quiz: quiz.title, percentage } : highest;
                  }, { quiz: '', percentage: 0 });
                  
                  return (
                    <>
                      <span className="text-3xl font-bold text-green-800">
                        {Math.round(highestScoreQuiz.percentage)}%
                      </span>
                      <span className="ml-1 text-sm text-green-600">
                        ({highestScoreQuiz.quiz})
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Completed Quizzes */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-700">Completed Quizzes</h3>
              <div className="mt-2">
                {(() => {
                  const completedQuizzes = classMarks.quizResults.filter(r => r.score !== null).length;
                  const totalQuizzes = classMarks.quizResults.length;
                  
                  return (
                    <div className="flex flex-col">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-purple-800">{completedQuizzes}</span>
                        <span className="ml-1 text-sm text-purple-600">of {totalQuizzes}</span>
                      </div>
                      <div className="mt-1 flex items-center">
                        <div className="w-full bg-purple-200 rounded-full h-1.5">
                          <div 
                            className="bg-purple-600 h-1.5 rounded-full"
                            style={{ width: `${(completedQuizzes / totalQuizzes) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-purple-600">
                          {Math.round((completedQuizzes / totalQuizzes) * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Pending Grades */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-700">Pending Grades</h3>
              <div className="mt-2">
                {(() => {
                  const pendingGradeCount = classMarks.quizResults.filter(
                    r => r.status === 'completed' && !r.isGraded
                  ).length;
                  
                  return (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-amber-800">{pendingGradeCount}</span>
                      <span className="ml-1 text-sm text-amber-600">
                        quiz{pendingGradeCount !== 1 ? 'zes' : ''}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}