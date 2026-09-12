import { apiClient } from "./api-client";

export interface InvitedUser { id: string; fullName: string; email: string; phone: string; roles?: string[] }
export const userApi = {
  createGuard: (input: { fullName: string; email: string; phone: string }) => apiClient.post<{ user: InvitedUser }>("/users/guards", input),
  createManager: (input: { fullName: string; email: string; phone: string }) => apiClient.post<{ user: InvitedUser }>("/users/managers", input),
  changePassword: (input: { currentPassword: string; newPassword: string }) => apiClient.post("/users/me/change-password", input),
};
