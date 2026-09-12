import { apiClient } from "./api-client";
import type { AuthUser, SessionDto, UserRole } from "./api-types";

export type NextAccountAction = "CHANGE_INITIAL_PASSWORD" | "VERIFY_EMAIL" | "VERIFY_PHONE" | null;
export interface AuthResult { user: AuthUser; nextAction: NextAccountAction }
export interface VerificationRequestResult { alreadyVerified: boolean; developmentCode?: string }

export const authApi = {
  me: (options?: { skipAuthRefresh?: boolean }) => apiClient.get<{ user: AuthUser }>("/auth/me", options),
  login: (input: { identifier: string; password: string; rememberDevice: boolean }) =>
    apiClient.post<AuthResult>("/auth/login", input, { skipAuthRefresh: true }),
  register: (input: { fullName: string; email: string; phone: string; password: string; role: Extract<UserRole, "DRIVER" | "PROVIDER">; acceptTerms: true; acceptPrivacyPolicy: true }) =>
    apiClient.post<AuthResult>("/auth/register", input, { skipAuthRefresh: true }),
  logout: () => apiClient.post<void>("/auth/logout"),
  logoutAll: () => apiClient.post<void>("/auth/logout-all"),
  changeInitialPassword: (input: { currentPassword: string; newPassword: string }) => apiClient.post<AuthResult>("/auth/change-initial-password", input),
  requestPasswordReset: (identifier: string) => apiClient.post<{ message: string }>("/auth/request-password-reset", { identifier }, { skipAuthRefresh: true }),
  resetPassword: (token: string, newPassword: string) => apiClient.post<{ message: string }>("/auth/reset-password", { token, newPassword }, { skipAuthRefresh: true }),
  requestVerification: (channel: "email" | "phone") =>
    apiClient.post<VerificationRequestResult>(`/auth/${channel}-verification/request`, undefined, { timeoutMs: 60_000 }),
  confirmVerification: (channel: "email" | "phone", code: string) => apiClient.post<{ verified: true; channel: string }>(`/auth/${channel}-verification/confirm`, { code }),
  sessions: () => apiClient.get<{ sessions: SessionDto[] }>("/users/me/sessions"),
  revokeSession: (sessionId: string) => apiClient.delete<void>(`/users/me/sessions/${sessionId}`),
};
