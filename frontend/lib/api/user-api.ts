import { apiClient, setClientTokens } from "./api-client";
import type { AuthResult } from "./auth-api";

export interface InvitedUser { id: string; fullName: string; email: string; phone: string; roles?: string[] }
export const userApi = {
  createGuard: (input: { fullName: string; email: string; phone: string }) => apiClient.post<{ user: InvitedUser }>("/users/guards", input),
  createManager: (input: { fullName: string; email: string; phone: string }) => apiClient.post<{ user: InvitedUser }>("/users/managers", input),
  changePassword: async (input: { currentPassword: string; newPassword: string }) => {
    const result = await apiClient.post<AuthResult>("/users/me/change-password", input);
    if (result.accessToken) {
      setClientTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    return result;
  },
};
