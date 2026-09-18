import type {
  UserRoleType,
  UserStatus,
} from "../../../generated/prisma/client.js";

export type RequestMetadata = {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

export type RegisterInput = RequestMetadata & {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "DRIVER" | "PROVIDER";
};

export type LoginInput = RequestMetadata & {
  identifier: string;
  password: string;
  rememberDevice: boolean;
};

export type ChangeInitialPasswordInput = RequestMetadata & {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordInput = RequestMetadata & {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  mustChangePassword: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: UserRoleType[];
};

export type AuthResult = {
  user: AuthUser;
  nextAction: "CHANGE_INITIAL_PASSWORD" | "VERIFY_EMAIL" | null;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};
