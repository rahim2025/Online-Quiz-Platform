import express from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// Apply protectRoute middleware to all notification routes
router.use(protectRoute);

// Get user notifications
router.get("/", getUserNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markNotificationRead);

// Mark all notifications as read
router.put("/mark-all-read", markAllNotificationsRead);

export default router;