import { apiClient } from "./api-client";
import type { NotificationDto } from "./marketplace-types";

export const notificationsApi = {
  list: () => apiClient.get<NotificationDto[]>("/notifications"),
  read: (notificationId: string) => apiClient.patch<{ read: true }>(`/notifications/${notificationId}/read`, {}),
  readAll: () => apiClient.post<{ count: number }>("/notifications/read-all", {}),
};
