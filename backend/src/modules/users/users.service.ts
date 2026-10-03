import { randomBytes } from "node:crypto";
import {
  AccountOrigin,
  ManagerDelegationPermission,
  ManagerDelegationStatus,
  PropertyProviderStatus,
  VerificationStatus,
  Prisma,
  UserRoleType,
  UserStatus,
} from "../../../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { hashPassword } from "../../common/auth/password.js";
import { hashToken } from "../../common/auth/token-hash.js";
import {
  sendAccountSetupEmail,
  sendGuardInvitationEmail,
  sendManagerInvitationEmail,
} from "../../common/email/email.service.js";
import { AppError } from "../../common/errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { authUserSelect } from "../auth/auth.repository.js";

export async function updateOwnProfile(userId: string, fullName: string) {
  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      deletedAt: null,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      emailVerifiedAt: { not: null },
    },
    data: { fullName },
  });
  if (updated.count !== 1) {
    throw new AppError({
      statusCode: 403,
      code: "PROFILE_UPDATE_FORBIDDEN",
      message: "An active, verified account is required",
    });
  }
  return { id: userId, fullName };
}

type CreatedWorkforceAccount = {
  user: Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
  tokenId: string;
};

async function createWorkforceAccount(input: {
  actorUserId: string;
  actorRoles: UserRoleType[];
  targetRole:
    | typeof UserRoleType.DRIVER
    | typeof UserRoleType.PROVIDER
    | typeof UserRoleType.GUARD
    | typeof UserRoleType.MANAGER;
  fullName: string;
  email: string;
  phone: string;
}) {
  if (
    input.targetRole === UserRoleType.GUARD &&
    input.actorRoles.includes(UserRoleType.MANAGER) &&
    !input.actorRoles.some(
      (role) => role === UserRoleType.PROVIDER || role === UserRoleType.ADMIN,
    )
  ) {
    const authorized = await prisma.providerManagerDelegation.findFirst({
      where: {
        managerUserId: input.actorUserId,
        status: ManagerDelegationStatus.ACTIVE,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }] },
          { OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
        ],
        grantorProviderMembership: {
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        property: { deletedAt: null, canonicalPropertyId: null },
        permissions: {
          some: {
            permission: ManagerDelegationPermission.GUARD_ADD_TO_PROPERTY,
          },
        },
      },
      select: { id: true },
    });
    if (!authorized)
      throw new AppError({
        statusCode: 403,
        code: "MANAGER_GUARD_CREATE_FORBIDDEN",
        message: "An active Guard-management delegation is required",
      });
  }
  const createdByAdmin = input.actorRoles.includes(UserRoleType.ADMIN);
  const accountOrigin =
    createdByAdmin &&
    input.targetRole !== UserRoleType.GUARD &&
    input.targetRole !== UserRoleType.MANAGER
      ? AccountOrigin.ADMIN_CREATED_USER
      : input.targetRole === UserRoleType.GUARD
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
    if (createdByAdmin) {
      await sendAccountSetupEmail({
        to: created.user.email,
        fullName: created.user.fullName,
        role: input.targetRole,
        setupUrl: setupUrl.toString(),
        expiresInMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
      });
    } else {
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
    }
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

export function createAdminManagedAccount(input: {
  actorUserId: string;
  fullName: string;
  email: string;
  phone: string;
  targetRole:
    | typeof UserRoleType.DRIVER
    | typeof UserRoleType.PROVIDER
    | typeof UserRoleType.MANAGER
    | typeof UserRoleType.GUARD;
}) {
  return createWorkforceAccount({
    ...input,
    actorRoles: [UserRoleType.ADMIN],
  });
}

export async function resendAdminAccountSetup(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      status: UserStatus.PENDING,
      createdByUserId: { not: null },
      accountOrigin: {
        in: [
          AccountOrigin.ADMIN_CREATED_USER,
          AccountOrigin.ADMIN_CREATED_GUARD,
          AccountOrigin.ADMIN_CREATED_MANAGER,
        ],
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      roles: { select: { role: true }, take: 1 },
    },
  });
  if (!user || !user.roles[0]) {
    throw new AppError({
      statusCode: 409,
      code: "ACCOUNT_SETUP_RESEND_NOT_ALLOWED",
      message:
        "A setup link can only be resent for a pending Admin-created account",
    });
  }

  const setupToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(setupToken);
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
  );
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
  });

  const setupUrl = new URL(
    env.PASSWORD_RESET_URL ?? "/reset-password",
    env.CORS_ORIGIN,
  );
  setupUrl.searchParams.set("token", setupToken);
  await sendAccountSetupEmail({
    to: user.email,
    fullName: user.fullName,
    role: user.roles[0].role,
    setupUrl: setupUrl.toString(),
    expiresInMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
  });

  return {
    userId: user.id,
    expiresAt,
    ...(env.EXPOSE_DEVELOPMENT_AUTH_CODES
      ? { developmentSetupToken: setupToken }
      : {}),
  };
}
