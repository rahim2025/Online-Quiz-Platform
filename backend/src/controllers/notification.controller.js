import Notification from "../models/notification.model.js";

// Get user notifications (paginated and sorted by createdAt descending)
export const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const query = { recipient: user._id };
    if (unreadOnly === "true") {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count for pagination
    const count = await Notification.countDocuments(query);
    
    res.status(200).json({
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = req.user;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Ensure the user is the intended recipient
    if (notification.recipient.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You do not have permission to update this notification" });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const user = req.user;
    
    await Notification.updateMany(
      { recipient: user._id, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    
    const count = await Notification.countDocuments({ 
      recipient: user._id,
      read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a notification (helper function used by other controllers)
export const createNotification = async (recipientId, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};