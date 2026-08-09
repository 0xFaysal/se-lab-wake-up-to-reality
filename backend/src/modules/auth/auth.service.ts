import {
  AccountOrigin,
  LegalAcceptanceSource,
  LegalDocumentType,
  type Prisma,
  UserRoleType,
  UserStatus,
} from "../../../generated/prisma/client.js";
import { randomUUID } from "node:crypto";
import { normalizeIdentifier } from "../../common/auth/identifier.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/auth/jwt.js";
import { hashPassword, verifyPassword } from "../../common/auth/password.js";
import { hashToken } from "../../common/auth/token-hash.js";
import { AppError } from "../../common/errors/app-error.js";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

export type RegisterInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "DRIVER" | "PARKING_OWNER";
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

export type LoginInput = {
  identifier: string;
  password: string;
  rememberDevice: boolean;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

export type ChangeInitialPasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  mustChangePassword: boolean;
  roles: UserRoleType[];
};

type AuthResult = {
  user: AuthUser;
  nextAction: "CHANGE_INITIAL_PASSWORD" | null;
  accessToken: string;
  refreshToken: string;
};

const refreshSessionDurationMs =
  env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

function normalizeUser(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  mustChangePassword: boolean;
  roles: { role: UserRoleType }[];
}): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    roles: user.roles.map((role) => role.role),
  };
}

function getNextAction(user: Pick<AuthUser, "mustChangePassword" | "roles">) {
  return user.mustChangePassword && user.roles.includes(UserRoleType.GUARD)
    ? "CHANGE_INITIAL_PASSWORD"
    : null;
}

function assertUserCanLogin(user: Pick<AuthUser, "status">): void {
  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError({
      statusCode: 403,
      code: "AUTH_ACCOUNT_SUSPENDED",
      message: "This account is suspended",
    });
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError({
      statusCode: 403,
      code: "AUTH_ACCOUNT_BLOCKED",
      message: "This account is blocked",
    });
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError({
      statusCode: 403,
      code: "AUTH_ACCOUNT_NOT_ACTIVE",
      message: "This account is not active",
    });
  }
}

function getSessionMetadata(input: {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}) {
  return {
    userAgent: input.userAgent ?? null,
    ipHash: input.ipAddress ? hashToken(input.ipAddress) : null,
  };
}

async function createTokenPair(
  input: {
    userId: string;
    roles: string[];
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
  },
  db: Pick<Prisma.TransactionClient, "refreshSession"> = prisma,
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}> {
  const metadata = getSessionMetadata(input);
  const refreshSession = await db.refreshSession.create({
    data: {
      userId: input.userId,
      tokenHash: `pending:${randomUUID()}`,
      expiresAt: new Date(Date.now() + refreshSessionDurationMs),
      userAgent: metadata.userAgent,
      ipHash: metadata.ipHash,
    },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: input.userId,
      roles: input.roles,
    }),
    signRefreshToken({
      userId: input.userId,
      sessionId: refreshSession.id,
    }),
  ]);

  await db.refreshSession.update({
    where: {
      id: refreshSession.id,
    },
    data: {
      tokenHash: hashToken(refreshToken),
    },
  });

  return {
    accessToken,
    refreshToken,
    sessionId: refreshSession.id,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: "EMAIL_OR_PHONE_ALREADY_REGISTERED",
        message: "Email or phone is already registered",
      });
    }

    const legalDocuments = await tx.legalDocument.findMany({
      where: {
        isActive: true,
        type: {
          in: [
            LegalDocumentType.TERMS_OF_SERVICE,
            LegalDocumentType.PRIVACY_POLICY,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (legalDocuments.length !== 2) {
      throw new AppError({
        statusCode: 500,
        code: "REQUIRED_LEGAL_DOCUMENTS_NOT_CONFIGURED",
        message: "Required legal documents are not configured",
        isOperational: false,
      });
    }

    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        status: UserStatus.ACTIVE,
        accountOrigin: AccountOrigin.SELF_REGISTERED,
        mustChangePassword: false,
        lastLoginAt: new Date(),
        roles: {
          create: {
            role:
              input.role === "DRIVER"
                ? UserRoleType.DRIVER
                : UserRoleType.PARKING_OWNER,
          },
        },
        walletAccounts: {
          create: {
            currency: "BDT",
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        accountOrigin: true,
        mustChangePassword: true,
        createdAt: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    await tx.userLegalAcceptance.createMany({
      data: legalDocuments.map((document) => ({
        userId: user.id,
        legalDocumentId: document.id,
        acceptanceSource: LegalAcceptanceSource.REGISTRATION,
      })),
    });

    const authUser = normalizeUser(user);
    const tokens = await createTokenPair(
      {
        userId: authUser.id,
        roles: authUser.roles,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
      tx,
    );

    return {
      user: authUser,
      nextAction: null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  });
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const identifier = normalizeIdentifier(input.identifier);

  const user = await prisma.user.findFirst({
    where:
      identifier.type === "email"
        ? { email: identifier.value }
        : { phone: identifier.value },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      passwordHash: true,
      status: true,
      mustChangePassword: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email/phone or password",
    });
  }

  const authUser = normalizeUser(user);
  assertUserCanLogin(authUser);

  const tokens = await createTokenPair({
    userId: user.id,
    roles: authUser.roles,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return {
    user: authUser,
    nextAction: getNextAction(authUser),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      code: "AUTH_USER_NOT_FOUND",
      message: "Authenticated user was not found",
    });
  }

  return normalizeUser(user);
}

export async function refreshAuthSession(input: {
  refreshToken: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}): Promise<AuthResult> {
  let payload;

  try {
    payload = await verifyRefreshToken(input.refreshToken);
  } catch {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid",
    });
  }

  const currentSession = await prisma.refreshSession.findUnique({
    where: {
      id: payload.sessionId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          mustChangePassword: true,
          roles: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (
    !currentSession ||
    currentSession.userId !== payload.userId ||
    currentSession.revokedAt ||
    currentSession.expiresAt <= new Date() ||
    currentSession.tokenHash !== hashToken(input.refreshToken)
  ) {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid",
    });
  }

  const authUser = normalizeUser(currentSession.user);
  assertUserCanLogin(authUser);

  const metadata = getSessionMetadata(input);
  const newSession = await prisma.refreshSession.create({
    data: {
      userId: authUser.id,
      tokenHash: `pending:${randomUUID()}`,
      expiresAt: new Date(Date.now() + refreshSessionDurationMs),
      userAgent: metadata.userAgent,
      ipHash: metadata.ipHash,
    },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: authUser.id,
      roles: authUser.roles,
    }),
    signRefreshToken({
      userId: authUser.id,
      sessionId: newSession.id,
    }),
  ]);

  await prisma.$transaction([
    prisma.refreshSession.update({
      where: {
        id: currentSession.id,
      },
      data: {
        revokedAt: new Date(),
        replacedBySessionId: newSession.id,
      },
    }),
    prisma.refreshSession.update({
      where: {
        id: newSession.id,
      },
      data: {
        tokenHash: hashToken(refreshToken),
      },
    }),
  ]);

  return {
    user: authUser,
    nextAction: getNextAction(authUser),
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = await verifyRefreshToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch {
    return;
  }
}

export async function changeInitialPassword(
  input: ChangeInitialPasswordInput,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      passwordHash: true,
      status: true,
      mustChangePassword: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      code: "AUTH_USER_NOT_FOUND",
      message: "Authenticated user was not found",
    });
  }

  const authUser = normalizeUser(user);
  assertUserCanLogin(authUser);

  if (!authUser.mustChangePassword) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_PASSWORD_CHANGE_NOT_REQUIRED",
      message: "Initial password change is not required",
    });
  }

  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid current password",
    });
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    }),
    prisma.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);

  const updatedUser = {
    ...authUser,
    mustChangePassword: false,
  };

  const tokens = await createTokenPair({
    userId: user.id,
    roles: updatedUser.roles,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  return {
    user: updatedUser,
    nextAction: null,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}
