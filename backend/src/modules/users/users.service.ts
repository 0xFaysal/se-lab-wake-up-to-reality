import { randomBytes } from "node:crypto";
import {
  AccountOrigin,
  Prisma,
  UserRoleType,
  UserStatus,
} from "../../../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { hashPassword } from "../../common/auth/password.js";
import { hashToken } from "../../common/auth/token-hash.js";
import {
  sendGuardInvitationEmail,
  sendManagerInvitationEmail,
} from "../../common/email/email.service.js";
import { AppError } from "../../common/errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { authUserSelect } from "../auth/auth.repository.js";

type CreatedWorkforceAccount = {
  user: Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
  tokenId: string;
};

async function createWorkforceAccount(input: {
  actorUserId: string;
  actorRoles: UserRoleType[];
  targetRole: typeof UserRoleType.GUARD | typeof UserRoleType.MANAGER;
  fullName: string;
  email: string;
  phone: string;
}) {
  const accountOrigin =
    input.targetRole === UserRoleType.GUARD
      ? input.actorRoles.includes(UserRoleType.ADMIN)
        ? AccountOrigin.ADMIN_CREATED_GUARD
        : AccountOrigin.PROVIDER_CREATED_GUARD
      : input.actorRoles.includes(UserRoleType.ADMIN)
        ? AccountOrigin.ADMIN_CREATED_MANAGER
        : AccountOrigin.PROVIDER_CREATED_MANAGER;
  const phone = normalizeBangladeshPhone(input.phone);
  const setupToken = randomBytes(32).toString("base64url");
  const unusablePassword = randomBytes(48).toString("base64url");
  const passwordHash = await hashPassword(unusablePassword);
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
  );

  let created: CreatedWorkforceAccount;
  try {
    created = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { OR: [{ email: input.email }, { phone }] },
        select: { id: true },
      });
      if (existing) {
        throw new AppError({
          statusCode: 409,
          code: "EMAIL_OR_PHONE_ALREADY_REGISTERED",
          message: "Email or phone is already registered",
        });
      }

      const user = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          phone,
          passwordHash,
          status: UserStatus.PENDING,
          mustChangePassword: true,
          accountOrigin,
          createdByUserId: input.actorUserId,
          roles: { create: { role: input.targetRole } },
        },
        select: authUserSelect,
      });

      const token = await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(setupToken),
          expiresAt,
        },
        select: { id: true },
      });

      return { user, tokenId: token.id };
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

  const setupUrl = new URL(
    env.PASSWORD_RESET_URL ?? "/reset-password",
    env.CORS_ORIGIN,
  );
  setupUrl.searchParams.set("token", setupToken);

  try {
    const sendInvitation =
      input.targetRole === UserRoleType.GUARD
        ? sendGuardInvitationEmail
        : sendManagerInvitationEmail;
    await sendInvitation({
      to: created.user.email,
      fullName: created.user.fullName,
      setupUrl: setupUrl.toString(),
      expiresInMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
    });
  } catch (error) {
    try {
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: { id: created.tokenId, userId: created.user.id },
        }),
        prisma.userRole.deleteMany({ where: { userId: created.user.id } }),
        prisma.user.deleteMany({ where: { id: created.user.id } }),
      ]);
    } catch (cleanupError) {
      logger.error(
        { error: cleanupError, userId: created.user.id },
        "Failed to roll back undelivered workforce invitation",
      );
    }
    throw error;
  }

  return {
    user: {
      id: created.user.id,
      fullName: created.user.fullName,
      email: created.user.email,
      phone: created.user.phone,
      status: created.user.status,
      mustChangePassword: created.user.mustChangePassword,
      emailVerified: created.user.emailVerifiedAt !== null,
      phoneVerified: created.user.phoneVerifiedAt !== null,
      roles: created.user.roles.map((role) => role.role),
    },
    ...(env.EXPOSE_DEVELOPMENT_AUTH_CODES
      ? { developmentSetupToken: setupToken }
      : {}),
  };
}

export function createGuardAccount(
  input: Omit<Parameters<typeof createWorkforceAccount>[0], "targetRole">,
) {
  return createWorkforceAccount({ ...input, targetRole: UserRoleType.GUARD });
}

export function createManagerAccount(
  input: Omit<Parameters<typeof createWorkforceAccount>[0], "targetRole">,
) {
  return createWorkforceAccount({ ...input, targetRole: UserRoleType.MANAGER });
}
