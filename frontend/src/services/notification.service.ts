import { apiRequest } from "./api";
import type { AppNotification } from "../types/notification";

export function listNotifications() {
  return apiRequest<AppNotification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return apiRequest<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiRequest<null>("/notifications/read-all", { method: "PATCH" });
}
