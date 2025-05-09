import {create} from "zustand"
import { axiosInstance } from "../lib/axios"

export const authStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,

    login: async (email, password) => {
        try {
            const res = await axiosInstance.post("/auth/login", {
                email,
                password
            });
            set({ authUser: res.data });
            return { success: true };
        } catch (error) {
            console.error("Error in login:", error);
            return {
                success: false,
                error: error.response?.data?.message || "An error occurred during login"
            };
        }
    },

    signup: async (userData) => {
        try {
            const res = await axiosInstance.post("/auth/signup", userData);
            set({ authUser: res.data });
            return { success: true };
        } catch (error) {
            console.error("Error in signup:", error);
            return {
                success: false,
                error: error.response?.data?.message || "An error occurred during signup"
            };
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            return { success: true };
        } catch (error) {
            console.error("Error in logout:", error);
            return { 
                success: false,
                error: error.response?.data?.message || "An error occurred during logout"
            };
        }
    },

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
        } catch (error) {
            console.log("Error in check auth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    updateProfile: async (profileData) => {
        try {
            const res = await axiosInstance.put("/auth/update-profile", profileData);
            set({ authUser: res.data });
            return { success: true };
        } catch (error) {
            console.error("Error updating profile:", error);
            return {
                success: false,
                error: error.response?.data?.message || "An error occurred updating profile"
            };
        }
    },

}))