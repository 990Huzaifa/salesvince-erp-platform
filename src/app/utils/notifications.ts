import { apiJson } from "./api";

export type PlatformNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error" | string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformNotificationsResponse = {
  result: PlatformNotification[];
};

export const loadPlatformNotifications = async () => {
  const response = await apiJson<PlatformNotificationsResponse>("platform/notifications");
  return response.result ?? [];
};

export const markPlatformNotificationAsRead = async (notificationId: string) => {
  await apiJson(`platform/notifications/${notificationId}/read`, {
    method: "PUT",
  });
};

export const normalizePlatformNotification = (
  notification: Partial<PlatformNotification> & { userId: string }
): PlatformNotification => {
  const now = new Date().toISOString();

  return {
    id: notification.id || `local-${now}`,
    userId: notification.userId,
    title: notification.title || "New notification",
    message: notification.message || "",
    type: notification.type || "info",
    isRead: notification.isRead ?? false,
    createdAt: notification.createdAt || now,
    updatedAt: notification.updatedAt || now,
  };
};
