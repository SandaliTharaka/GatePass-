const {
  getNotificationsForUser,
  countUnreadForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationForUser,
} = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user, {
      limit: req.query.limit,
    });
    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications failed:", error);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await countUnreadForUser(req.user);
    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread notification count failed:", error);
    res.status(500).json({ message: "Failed to load notification count" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ notification });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user);
    res.json({ modifiedCount: result.modifiedCount || 0 });
  } catch (error) {
    console.error("Mark all notifications read failed:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

const removeNotification = async (req, res) => {
  try {
    const notification = await deleteNotificationForUser(req.params.id, req.user);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification removed" });
  } catch (error) {
    console.error("Delete notification failed:", error);
    res.status(500).json({ message: "Failed to remove notification" });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
};
