import axiosInstance from "./axiosConfig";

export const getNotifications = async (limit = 30) => {
  const response = await axiosInstance.get("/notifications", {
    params: { limit },
  });
  return response.data.notifications || [];
};

export const getUnreadNotificationCount = async () => {
  const response = await axiosInstance.get("/notifications/unread-count");
  return response.data.unreadCount || 0;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response.data.notification;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};
