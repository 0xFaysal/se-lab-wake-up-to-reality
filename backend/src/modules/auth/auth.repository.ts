import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

export const authUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  mustChangePassword: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  roles: {
    select: {
      role: true,
    },
  },
} satisfies Prisma.UserSelect;

export function findUserForLogin(identifier: {
  type: "email" | "phone";
  value: string;
}) {
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      ...(identifier.type === "email"
        ? { email: identifier.value }
        : { phone: identifier.value }),
    },
    select: {
      ...authUserSelect,
      passwordHash: true,
    },
  });
}

export function findCurrentAuthUser(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: authUserSelect,
  });
}

export function findAccessSession(input: {
  sessionId: string;
  userId: string;
}) {
  return prisma.refreshSession.findFirst({
    where: {
      id: input.sessionId,
      userId: input.userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      user: {
        select: authUserSelect,
      },
    },
  });
}
