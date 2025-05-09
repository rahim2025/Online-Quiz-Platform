import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useClassStore = create((set) => ({
  classes: [],
  classDetails: null,
  loading: false,
  error: null,

  // For teachers to create a class
  createClass: async (classData) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post("/classes/create", classData);
      set((state) => ({
        classes: [...state.classes, response.data]
      }));
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating class:", error);
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to create class"
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create class"
      };
    }
  },

  // For students to enroll in a class
  enrollInClass: async (enrollmentCode) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post("/classes/enroll", {
        enrollmentCode
      });
      set((state) => ({
        classes: [...state.classes, response.data.class]
      }));
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error enrolling in class:", error);
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to enroll in class"
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to enroll in class"
      };
    }
  },

  // Get classes for the logged in user (teacher or student)
  fetchClasses: async (userType) => {
    try {
      set({ loading: true, error: null });
      const endpoint = userType === "teacher" ? "/classes/teacher-classes" : "/classes/student-classes";
      const response = await axiosInstance.get(endpoint);
      set({ classes: response.data, loading: false });
      return { success: true };
    } catch (error) {
      console.error("Error fetching classes:", error);
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to fetch classes"
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch classes"
      };
    }
  },
  
  // Alias for fetchClasses to maintain backward compatibility
  fetchUserClasses: async (userType) => {
    return await useClassStore.getState().fetchClasses(userType);
  },

  // Get detailed information about a specific class
  fetchClassDetails: async (classId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get(`/classes/${classId}`);
      set({ classDetails: response.data, loading: false });
      return { success: true };
    } catch (error) {
      console.error("Error fetching class details:", error);
      set({
        loading: false,
        error: error.response?.data?.message || "Failed to fetch class details"
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch class details"
      };
    }
  },

  // Clear the class details (e.g., when navigating away)
  clearClassDetails: () => {
    set({ classDetails: null });
  }
}));