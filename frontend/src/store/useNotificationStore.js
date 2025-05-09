import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // Fetch user notifications with pagination
  fetchNotifications: async (page = 1, limit = 10, unreadOnly = false) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get(`/notifications`, {
        params: { page, limit, unreadOnly }
      });
      
      set({ 
        notifications: response.data.notifications, 
        loading: false 
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch notifications";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Get unread notification count
  fetchUnreadCount: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get('/notifications/unread-count');
      set({ unreadCount: response.data.count, loading: false });
      return { success: true, count: response.data.count };
    } catch (error) {
      console.error("Error fetching unread count:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch notification count";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.put(`/notifications/${notificationId}/read`);
      
      // Update notifications array with the updated notification
      set((state) => ({
        notifications: state.notifications.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        loading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      const errorMessage = error.response?.data?.message || "Failed to mark notification as read";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.put('/notifications/mark-all-read');
      
      // Update all notifications to read
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        loading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      const errorMessage = error.response?.data?.message || "Failed to mark all notifications as read";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Navigate to the related item (quiz, class, etc.)
  navigateToRelated: (notification) => {
    if (!notification.relatedId || !notification.relatedModel) {
      return null;
    }
    
    switch (notification.relatedModel) {
      case "Quiz":
        return `/quizzes/${notification.relatedId}`;
      case "Class":
        return `/classes/${notification.relatedId}`;
      case "Submission":
        return `/quizzes/${notification.relatedId}`;
      default:
        return null;
    }
  },
  
  // Clear notification state (used during logout)
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      error: null,
      loading: false
    });
  }
}));