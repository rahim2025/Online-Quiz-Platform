import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead,
    navigateToRelated 
  } = useNotificationStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleBellClick = async () => {
    setIsDropdownOpen(!isDropdownOpen);
    
    // If opening dropdown, fetch latest notifications
    if (!isDropdownOpen) {
      await fetchNotifications(1, 5);
    }
  };
  
  const handleNotificationClick = async (notification) => {
    // Mark as read regardless of navigation
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Don't navigate for quiz-submission notifications
    if (notification.type === 'quiz-submission') {
      setIsDropdownOpen(false);
      return;
    }
    
    // For other notification types, try to navigate if possible
    const relatedUrl = navigateToRelated(notification);
    // if (relatedUrl) {
    //   navigate(relatedUrl);
    // }
    
    setIsDropdownOpen(false);
  };
  
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleBellClick}
        className="p-1 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <>
              {notifications.map(notification => (
                <div 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <h4 className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
              ))}
              {notifications.length >= 5 && (
                <div className="px-4 py-2 text-center">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};