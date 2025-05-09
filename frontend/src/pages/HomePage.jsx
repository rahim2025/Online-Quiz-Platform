import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authStore } from '../store/useAuthStore'
import { useClassStore } from '../store/useClassStore'
import { useQuizStore } from '../store/useQuizStore'
import { useNotificationStore } from '../store/useNotificationStore'

export const HomePage = () => {
  const navigate = useNavigate()
  const { authUser } = authStore()
  const { 
    classes, 
    fetchClasses,
    loading: classesLoading 
  } = useClassStore()
  
  const { 
    fetchUpcomingQuizzes,
    upcomingQuizzes,
    loading: quizzesLoading 
  } = useQuizStore()
  
  const { notifications, fetchNotifications, loading: notificationsLoading } = useNotificationStore()
  
  const isTeacher = authUser?.userType === 'teacher'
  const isStudent = authUser?.userType === 'student'
  
  useEffect(() => {
    const loadData = async () => {
      await fetchClasses(authUser?.userType)
      
      if (isStudent) {
        await fetchUpcomingQuizzes()
      }
      
      await fetchNotifications(1, 5)
    }
    
    loadData()
  }, [fetchClasses, fetchUpcomingQuizzes, fetchNotifications, isStudent, authUser?.userType])
  
  const calculateTimeLeft = (startTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMs = start - now
    
    if (diffMs <= 0) return 'Starting now'
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffDays > 0) {
      return `Starts in ${diffDays}d ${diffHrs}h`
    }
    
    return diffHrs > 0 
      ? `Starts in ${diffHrs}h ${diffMins}m` 
      : `Starts in ${diffMins}m`
  }

  const isLoading = classesLoading || quizzesLoading || notificationsLoading

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* BRAC University Banner */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-700 to-blue-800 rounded-lg overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative py-10 px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 flex items-center">
            <div className="bg-white p-3 rounded-full shadow-md">
              <img 
                src="https://images.app.goo.gl/rGsVb1KTgvV4u2NVA" 
                alt="BRAC University" 
                className="h-16 w-16 object-contain" 
              />
            </div>
            <div className="ml-6">
              <h1 className="text-3xl font-bold text-white mb-1">BRAC University Quiz Portal</h1>
              <p className="text-blue-100">Online assessment platform for students and faculty</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg">
              <p className="text-white font-medium">
                Welcome, {authUser?.fullName || 'User'}! 
                <span className="ml-2 text-sm px-2 py-1 bg-white/25 rounded">
                  {isTeacher ? 'Faculty' : 'Student'}
                </span>
              </p>
              {authUser?.email && (
                <p className="text-blue-100 text-sm">{authUser.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link 
                    to="/classes" 
                    className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="bg-blue-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="mt-2 text-sm font-medium">My Classes</span>
                  </Link>
                  
                  {isStudent && (
                    <Link 
                      to="enroll-class" 
                      className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="bg-green-100 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="mt-2 text-sm font-medium">Enroll in Class</span>
                    </Link>
                  )}
                  
                  {isTeacher && (
                    <Link 
                      to="/classes/create" 
                      className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="mt-2 text-sm font-medium">Create Class</span>
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="bg-amber-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="mt-2 text-sm font-medium">My Profile</span>
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="bg-gray-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="mt-2 text-sm font-medium">Settings</span>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Your Classes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Your Classes</h2>
                  <Link to="/classes" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View All
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                {classesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 inline-block rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Classes Yet</h3>
                    <p className="text-gray-500 mb-4">
                      {isTeacher 
                        ? "You haven't created any classes yet." 
                        : "You're not enrolled in any classes yet."}
                    </p>
                    {isTeacher ? (
                      <Link 
                        to="/classes/create" 
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Your First Class
                      </Link>
                    ) : (
                      <Link 
                        to="/classes/enroll" 
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Enroll in a Class
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.slice(0, 4).map((classItem) => (
                      <div 
                        key={classItem._id} 
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <Link to={`/classes/${classItem._id}`} className="block">
                          <h3 className="font-semibold text-gray-800 mb-1">{classItem.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{classItem.description || 'No description'}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-xs text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {classItem.students?.length || 0} student{classItem.students?.length !== 1 ? 's' : ''}
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              {isTeacher ? 'Teaching' : 'Enrolled'}
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          
            {isStudent && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Upcoming Quizzes</h2>
                  </div>
                  
                  {upcomingQuizzes && upcomingQuizzes.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingQuizzes.map((quiz) => (
                        <div 
                          key={quiz._id} 
                          className="border border-blue-100 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                              <p className="text-sm text-gray-500 mb-2">{quiz.className || 'Class'}</p>
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="flex items-center text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {quiz.duration} mins
                                </span>
                                <span className="flex items-center text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(quiz.startTime).toLocaleDateString()}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {calculateTimeLeft(quiz.startTime)}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => navigate(`/quizzes/${quiz._id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Upcoming Quizzes</h3>
                      <p className="text-gray-500">You don't have any scheduled quizzes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
          
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Mark all as read
                  </button>
                </div>
                
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`p-3 rounded-lg ${
                          !notification.read ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                      >
                        <h4 className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 inline-block rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}