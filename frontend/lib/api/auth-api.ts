import { apiClient, clearClientTokens, getClientRefreshToken, setClientTokens } from "./api-client";
import type { AuthUser, SessionDto, UserRole } from "./api-types";

export type NextAccountAction = "CHANGE_INITIAL_PASSWORD" | "VERIFY_EMAIL" | "VERIFY_PHONE" | null;
export interface AuthResult {
  user: AuthUser;
  nextAction: NextAccountAction;
  accessToken?: string;
  refreshToken?: string;
}
export interface VerificationRequestResult { alreadyVerified: boolean; developmentCode?: string }

export const authApi = {
  me: (options?: { skipAuthRefresh?: boolean }) => apiClient.get<{ user: AuthUser }>("/auth/me", options),
  login: async (input: { identifier: string; password: string; rememberDevice: boolean }) => {
    const result = await apiClient.post<AuthResult>("/auth/login", input, { skipAuthRefresh: true });
    if (result.accessToken) {
      setClientTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    return result;
  },
  register: async (input: { fullName: string; email: string; phone: string; password: string; role: Extract<UserRole, "DRIVER" | "PROVIDER">; acceptTerms: true; acceptPrivacyPolicy: true }) => {
    const result = await apiClient.post<AuthResult>("/auth/register", input, { skipAuthRefresh: true });
    if (result.accessToken) {
      setClientTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    return result;
  },
  logout: async () => {
    try {
      const refreshToken = getClientRefreshToken();
      await apiClient.post<void>("/auth/logout", { refreshToken });
    } finally {
      clearClientTokens();
    }
  },
  logoutAll: async () => {
    try {
      await apiClient.post<void>("/auth/logout-all");
    } finally {
      clearClientTokens();
    }
  },
  changeInitialPassword: async (input: { currentPassword: string; newPassword: string }) => {
    const result = await apiClient.post<AuthResult>("/auth/change-initial-password", input);
    if (result.accessToken) {
      setClientTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    return result;
  },
  requestPasswordReset: (identifier: string) => apiClient.post<{ message: string }>("/auth/request-password-reset", { identifier }, { skipAuthRefresh: true }),
  resetPassword: (token: string, newPassword: string) => apiClient.post<{ message: string }>("/auth/reset-password", { token, newPassword }, { skipAuthRefresh: true }),
  requestVerification: (channel: "email" | "phone") =>
    apiClient.post<VerificationRequestResult>(`/auth/${channel}-verification/request`, undefined, { timeoutMs: 60_000 }),
  confirmVerification: (channel: "email" | "phone", code: string) => apiClient.post<{ verified: true; channel: string }>(`/auth/${channel}-verification/confirm`, { code }),
  sessions: () => apiClient.get<{ sessions: SessionDto[] }>("/users/me/sessions"),
  revokeSession: (sessionId: string) => apiClient.delete<void>(`/users/me/sessions/${sessionId}`),
};
