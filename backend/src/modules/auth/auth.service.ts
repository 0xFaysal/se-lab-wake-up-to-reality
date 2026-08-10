import {
  AccountOrigin,
  LegalAcceptanceSource,
  LegalDocumentType,
  Prisma,
  UserRoleType,
  UserStatus,
} from "../../../generated/prisma/client.js";
import {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { normalizeIdentifier } from "../../common/auth/identifier.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { hashSensitiveMetadata } from "../../common/auth/metadata-hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/auth/jwt.js";
import {
  hashPassword,
  passwordHashNeedsRehash,
  verifyPassword,
} from "../../common/auth/password.js";
import { hashToken } from "../../common/auth/token-hash.js";
import {
  sendEmailVerificationCode,
  sendPasswordResetEmail,
} from "../../common/email/email.service.js";
import { AppError } from "../../common/errors/app-error.js";
import { sendPhoneVerificationCode } from "../../common/sms/sms.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { authErrors } from "./auth.errors.js";
import {
  authUserSelect,
  findCurrentAuthUser,
  findUserForLogin,
} from "./auth.repository.js";
import type {
  AuthResult,
  AuthUser,
  ChangeInitialPasswordInput,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "./auth.types.js";

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const dummyPasswordHash = hashPassword(randomBytes(32).toString("base64url"));

function getRefreshSessionDurationMs(rememberDevice: boolean): number {
  const days = rememberDevice
    ? env.JWT_REFRESH_LONG_DAYS
    : env.JWT_REFRESH_SHORT_DAYS;

  return days * dayInMilliseconds;
}

function normalizeUser(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  mustChangePassword: boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  roles: { role: UserRoleType }[];
}): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    emailVerified: user.emailVerifiedAt !== null,
    phoneVerified: user.phoneVerifiedAt !== null,
    roles: user.roles.map((role) => role.role),
  };
}

function getNextAction(
  user: Pick<
    AuthUser,
    "mustChangePassword" | "emailVerified" | "phoneVerified"
  >,
) {
  if (user.mustChangePassword) return "CHANGE_INITIAL_PASSWORD";
  if (!user.emailVerified) return "VERIFY_EMAIL";
  if (!user.phoneVerified) return "VERIFY_PHONE";
  return null;
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

  if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
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
    ipHash: input.ipAddress ? hashSensitiveMetadata(input.ipAddress) : null,
  };
}

async function createTokenPair(
  input: {
    userId: string;
    roles: string[];
    rememberDevice?: boolean | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
  },
  db: Pick<Prisma.TransactionClient, "refreshSession"> = prisma,
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshExpiresAt: Date;
}> {
  const metadata = getSessionMetadata(input);
  const rememberDevice = input.rememberDevice ?? false;
  const refreshExpiresAt = new Date(
    Date.now() + getRefreshSessionDurationMs(rememberDevice),
  );
  const refreshSession = await db.refreshSession.create({
    data: {
      userId: input.userId,
      tokenHash: `pending:${randomUUID()}`,
      rememberDevice,
      expiresAt: refreshExpiresAt,
      userAgent: metadata.userAgent,
      ipHash: metadata.ipHash,
    },
  });

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: input.userId,
      sessionId: refreshSession.id,
      roles: input.roles,
    }),
    signRefreshToken(
      {
        userId: input.userId,
        sessionId: refreshSession.id,
      },
      refreshExpiresAt,
    ),
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
    refreshExpiresAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);
  const normalizedPhone = normalizeBangladeshPhone(input.phone);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: {
          OR: [{ email: input.email }, { phone: normalizedPhone }],
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
          type: true,
        },
        orderBy: {
          effectiveAt: "desc",
        },
      });

      const termsDocument = legalDocuments.find(
        (document) => document.type === LegalDocumentType.TERMS_OF_SERVICE,
      );
      const privacyDocument = legalDocuments.find(
        (document) => document.type === LegalDocumentType.PRIVACY_POLICY,
      );

      if (!termsDocument || !privacyDocument) {
        throw new AppError({
          statusCode: 500,
          code: "REQUIRED_LEGAL_DOCUMENTS_NOT_CONFIGURED",
          message: "Required legal documents are not configured",
          isOperational: false,
        });
      }

      const requiredLegalDocuments = [termsDocument, privacyDocument];

      const user = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          phone: normalizedPhone,
          passwordHash,
          status: UserStatus.PENDING,
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
          ...authUserSelect,
          accountOrigin: true,
          createdAt: true,
        },
      });

      await tx.userLegalAcceptance.createMany({
        data: requiredLegalDocuments.map((document) => ({
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
          rememberDevice: false,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
        tx,
      );

      return {
        user: authUser,
        nextAction: getNextAction(authUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshExpiresAt: tokens.refreshExpiresAt,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError({
        statusCode: 409,
        code: "EMAIL_OR_PHONE_ALREADY_REGISTERED",
        message: "Email or phone is already registered",
      });
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  let identifier;

  try {
    identifier = normalizeIdentifier(input.identifier);
  } catch {
    throw authErrors.invalidCredentials();
  }

  const user = await findUserForLogin(identifier);
  const passwordValid = await verifyPassword(
    user?.passwordHash ?? (await dummyPasswordHash),
    input.password,
  );

  if (!user || !passwordValid) {
    throw authErrors.invalidCredentials();
  }

  const authUser = normalizeUser(user);
  assertUserCanLogin(authUser);
  const upgradedPasswordHash = passwordHashNeedsRehash(user.passwordHash)
    ? await hashPassword(input.password)
    : undefined;

  const tokens = await prisma.$transaction(async (tx) => {
    const tokenPair = await createTokenPair(
      {
        userId: user.id,
        roles: authUser.roles,
        rememberDevice: input.rememberDevice,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
      tx,
    );
    await tx.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(upgradedPasswordHash ? { passwordHash: upgradedPasswordHash } : {}),
      },
    });
    return tokenPair;
  });

  return {
    user: authUser,
    nextAction: getNextAction(authUser),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await findCurrentAuthUser(userId);

  if (!user) {
    throw new AppError({
      statusCode: 404,
      code: "AUTH_USER_NOT_FOUND",
      message: "Authenticated user was not found",
    });
  }

  const authUser = normalizeUser(user);
  assertUserCanLogin(authUser);
  return authUser;
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
    throw authErrors.invalidRefreshToken();
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const currentSession = await tx.refreshSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.userId,
          user: {
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: authUserSelect,
          },
        },
      });

      if (
        !currentSession ||
        currentSession.expiresAt <= new Date() ||
        currentSession.tokenHash !== hashToken(input.refreshToken)
      ) {
        throw authErrors.invalidRefreshToken();
      }

      if (currentSession.revokedAt) {
        throw authErrors.refreshTokenReused();
      }

      const authUser = normalizeUser(currentSession.user);
      assertUserCanLogin(authUser);

      const revoked = await tx.refreshSession.updateMany({
        where: {
          id: currentSession.id,
          userId: payload.userId,
          tokenHash: hashToken(input.refreshToken),
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (revoked.count !== 1) {
        throw authErrors.refreshTokenReused();
      }

      const tokens = await createTokenPair(
        {
          userId: authUser.id,
          roles: authUser.roles,
          rememberDevice: currentSession.rememberDevice,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
        tx,
      );

      await tx.refreshSession.update({
        where: {
          id: currentSession.id,
        },
        data: {
          replacedBySessionId: tokens.sessionId,
        },
      });

      return {
        user: authUser,
        nextAction: getNextAction(authUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshExpiresAt: tokens.refreshExpiresAt,
      };
    });
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === "AUTH_REFRESH_TOKEN_REUSED"
    ) {
      await prisma.refreshSession.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      logger.warn(
        { userId: payload.userId, sessionId: payload.sessionId },
        "Refresh token replay detected; active sessions revoked",
      );
    }
    throw error;
  }
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

export async function logoutAllUserSessions(userId: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function listUserSessions(
  userId: string,
  currentSessionId: string,
) {
  const sessions = await prisma.refreshSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userAgent: true,
      rememberDevice: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return sessions.map((session) => ({
    ...session,
    current: session.id === currentSessionId,
  }));
}

export async function revokeUserSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const result = await prisma.refreshSession.updateMany({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new AppError({
      statusCode: 404,
      code: "AUTH_SESSION_NOT_FOUND",
      message: "Active session was not found",
    });
  }
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<AuthResult> {
  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      deletedAt: null,
    },
    select: {
      ...authUserSelect,
      passwordHash: true,
    },
  });

  if (
    !user ||
    !(await verifyPassword(user.passwordHash, input.currentPassword))
  ) {
    throw authErrors.invalidCredentials();
  }

  const authUser = normalizeUser(user);
  assertUserCanLogin(authUser);

  if (await verifyPassword(user.passwordHash, input.newPassword)) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_NEW_PASSWORD_MUST_DIFFER",
      message: "New password must be different from the current password",
    });
  }

  const passwordHash = await hashPassword(input.newPassword);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: user.id,
        passwordHash: user.passwordHash,
        deletedAt: null,
      },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    if (updated.count !== 1) {
      throw authErrors.invalidCredentials();
    }

    await tx.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const updatedUser = {
      ...authUser,
      mustChangePassword: false,
    };
    const tokens = await createTokenPair(
      {
        userId: updatedUser.id,
        roles: updatedUser.roles,
        rememberDevice: false,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
      tx,
    );

    return {
      user: updatedUser,
      nextAction: getNextAction(updatedUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  });
}

export async function requestPasswordReset(
  identifierInput: string,
): Promise<{ developmentResetToken?: string }> {
  let identifier;

  try {
    identifier = normalizeIdentifier(identifierInput);
  } catch {
    return {};
  }

  const user = await findUserForLogin(identifier);
  if (!user) return {};

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
  );

  const resetToken = await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
      select: { id: true },
    });
  });

  const resetUrl = new URL(
    env.PASSWORD_RESET_URL ?? "/reset-password",
    env.CORS_ORIGIN,
  );
  resetUrl.searchParams.set("token", token);

  try {
    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl: resetUrl.toString(),
      expiresInMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
    });
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({
      where: { id: resetToken.id, tokenHash: hashToken(token), usedAt: null },
    });
    logger.error({ error }, "Password reset request could not be delivered");
    return {};
  }

  return env.EXPOSE_DEVELOPMENT_AUTH_CODES
    ? { developmentResetToken: token }
    : {};
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<void> {
  const tokenHash = hashToken(input.token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
      user: { deletedAt: null },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          passwordHash: true,
          status: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!resetToken) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_PASSWORD_RESET_TOKEN_INVALID",
      message: "Password reset token is invalid or expired",
    });
  }

  if (await verifyPassword(resetToken.user.passwordHash, input.newPassword)) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_NEW_PASSWORD_MUST_DIFFER",
      message: "New password must be different from the current password",
    });
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (consumed.count !== 1) {
      throw new AppError({
        statusCode: 400,
        code: "AUTH_PASSWORD_RESET_TOKEN_INVALID",
        message: "Password reset token is invalid or expired",
      });
    }

    const updatedUser = await tx.user.updateMany({
      where: { id: resetToken.userId, deletedAt: null },
      data: {
        passwordHash,
        mustChangePassword: false,
        emailVerifiedAt: resetToken.user.emailVerifiedAt ?? new Date(),
        status:
          resetToken.user.status === UserStatus.PENDING
            ? UserStatus.ACTIVE
            : resetToken.user.status,
      },
    });

    if (updatedUser.count !== 1) {
      throw new AppError({
        statusCode: 400,
        code: "AUTH_PASSWORD_RESET_TOKEN_INVALID",
        message: "Password reset token is invalid or expired",
      });
    }

    await tx.refreshSession.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  });
}

type VerificationChannel = "email" | "phone";

function verificationKey(channel: VerificationChannel, userId: string) {
  return `verify:${channel}:${userId}`;
}

function verificationAttemptsKey(channel: VerificationChannel, userId: string) {
  return `verify:${channel}:${userId}:attempts`;
}

async function deleteVerificationCodeIfCurrent(
  key: string,
  attemptsKey: string,
  expectedHash: string,
): Promise<boolean> {
  const deleted = await redis.eval(
    `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        redis.call("DEL", KEYS[1])
        redis.call("DEL", KEYS[2])
        return 1
      end
      return 0
    `,
    {
      keys: [key, attemptsKey],
      arguments: [expectedHash],
    },
  );
  return Number(deleted) === 1;
}

function hashVerificationCode(
  channel: VerificationChannel,
  userId: string,
  code: string,
): string {
  return createHmac("sha256", env.VERIFICATION_CODE_SECRET)
    .update(`${channel}:${userId}:${code}`)
    .digest("hex");
}

export async function requestVerificationCode(
  userId: string,
  channel: VerificationChannel,
): Promise<{ alreadyVerified: boolean; developmentCode?: string }> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      fullName: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
    },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      code: "AUTH_USER_NOT_FOUND",
      message: "Authenticated user was not found",
    });
  }

  const alreadyVerified =
    channel === "email"
      ? user.emailVerifiedAt !== null
      : user.phoneVerifiedAt !== null;

  if (alreadyVerified) return { alreadyVerified: true };

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const ttlSeconds = env.VERIFICATION_CODE_EXPIRES_MINUTES * 60;
  const key = verificationKey(channel, userId);
  const attemptsKey = verificationAttemptsKey(channel, userId);
  const codeHash = hashVerificationCode(channel, userId, code);

  await Promise.all([
    redis.set(key, codeHash, { EX: ttlSeconds }),
    redis.del(attemptsKey),
  ]);

  try {
    if (channel === "email") {
      await sendEmailVerificationCode({
        to: user.email,
        fullName: user.fullName,
        code,
        expiresInMinutes: env.VERIFICATION_CODE_EXPIRES_MINUTES,
      });
    } else {
      await sendPhoneVerificationCode({
        to: user.phone,
        code,
        expiresInMinutes: env.VERIFICATION_CODE_EXPIRES_MINUTES,
      });
    }
  } catch (error) {
    await Promise.allSettled([
      deleteVerificationCodeIfCurrent(key, attemptsKey, codeHash),
    ]);
    throw error;
  }

  return env.EXPOSE_DEVELOPMENT_AUTH_CODES
    ? { alreadyVerified: false, developmentCode: code }
    : { alreadyVerified: false };
}

export async function confirmVerificationCode(
  userId: string,
  channel: VerificationChannel,
  code: string,
): Promise<void> {
  const key = verificationKey(channel, userId);
  const attemptsKey = verificationAttemptsKey(channel, userId);
  const [storedHash, attempts] = await Promise.all([
    redis.get(key),
    redis.incr(attemptsKey),
  ]);

  if (attempts === 1) {
    await redis.expire(attemptsKey, env.VERIFICATION_CODE_EXPIRES_MINUTES * 60);
  }

  if (attempts > 5) {
    await Promise.all([redis.del(key), redis.del(attemptsKey)]);
    throw new AppError({
      statusCode: 429,
      code: "AUTH_VERIFICATION_ATTEMPTS_EXCEEDED",
      message: "Too many invalid verification attempts",
    });
  }

  const candidateHash = hashVerificationCode(channel, userId, code);
  const valid =
    storedHash !== null &&
    storedHash.length === candidateHash.length &&
    timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(candidateHash, "hex"),
    );

  if (!valid) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_VERIFICATION_CODE_INVALID",
      message: "Verification code is invalid or expired",
    });
  }

  const consumed = await deleteVerificationCodeIfCurrent(
    key,
    attemptsKey,
    candidateHash,
  );
  if (!consumed) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_VERIFICATION_CODE_INVALID",
      message: "Verification code is invalid or expired",
    });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { status: true },
  });
  if (
    !user ||
    (user.status !== UserStatus.PENDING && user.status !== UserStatus.ACTIVE)
  ) {
    throw authErrors.authenticationRequired();
  }

  const verifiedAt = new Date();
  const updated = await prisma.user.updateMany({
    where: { id: userId, status: user.status, deletedAt: null },
    data:
      channel === "email"
        ? { emailVerifiedAt: verifiedAt, status: UserStatus.ACTIVE }
        : { phoneVerifiedAt: verifiedAt },
  });

  if (updated.count !== 1) throw authErrors.authenticationRequired();
}

export async function changeInitialPassword(
  input: ChangeInitialPasswordInput,
): Promise<AuthResult> {
  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      deletedAt: null,
    },
    select: {
      ...authUserSelect,
      passwordHash: true,
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

  if (
    !authUser.roles.includes(UserRoleType.GUARD) &&
    !authUser.roles.includes(UserRoleType.ADMIN)
  ) {
    throw authErrors.forbidden();
  }

  if (!authUser.mustChangePassword) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_PASSWORD_CHANGE_NOT_REQUIRED",
      message: "Initial password change is not required",
    });
  }

  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw authErrors.invalidCredentials();
  }

  if (await verifyPassword(user.passwordHash, input.newPassword)) {
    throw new AppError({
      statusCode: 400,
      code: "AUTH_NEW_PASSWORD_MUST_DIFFER",
      message: "New password must be different from the current password",
    });
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: user.id,
        passwordHash: user.passwordHash,
        mustChangePassword: true,
        deletedAt: null,
      },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    if (updated.count !== 1) throw authErrors.invalidCredentials();

    await tx.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const updatedUser = {
      ...authUser,
      mustChangePassword: false,
    };
    const tokens = await createTokenPair(
      {
        userId: user.id,
        roles: updatedUser.roles,
        rememberDevice: false,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
      tx,
    );

    return {
      user: updatedUser,
      nextAction: getNextAction(updatedUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  });
}
