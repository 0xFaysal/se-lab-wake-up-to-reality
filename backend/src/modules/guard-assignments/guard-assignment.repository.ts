import {
  GuardAssignmentStatus,
  Prisma,
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type GuardAssignmentClient = Pick<
  Prisma.TransactionClient,
  "property" | "propertyGuardAssignment" | "user"
>;

export const guardAssignmentSelect = {
  id: true,
  propertyId: true,
  guardUserId: true,
  status: true,
  shiftStart: true,
  shiftEnd: true,
  invitedAt: true,
  acceptedAt: true,
  assignedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: {
      id: true,
      name: true,
      publicArea: true,
      status: true,
      verificationStatus: true,
      deletedAt: true,
      owner: { select: { id: true, fullName: true } },
    },
  },
  guard: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      emailVerifiedAt: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.PropertyGuardAssignmentSelect;

export type GuardAssignmentRecord = Prisma.PropertyGuardAssignmentGetPayload<{
  select: typeof guardAssignmentSelect;
}>;

export function findOwnedPropertyForGuardInvitation(
  propertyId: string,
  ownerUserId: string,
  db: GuardAssignmentClient = prisma,
) {
  return db.property.findFirst({
    where: { id: propertyId, ownerUserId, deletedAt: null },
    select: {
      id: true,
      status: true,
      verificationStatus: true,
    },
  });
}

export function propertyIsGuardEligible(property: {
  status: PropertyStatus;
  verificationStatus: VerificationStatus;
}): boolean {
  return (
    property.status === PropertyStatus.ACTIVE &&
    property.verificationStatus === VerificationStatus.VERIFIED
  );
}

export function findEligibleGuard(
  identifier: { type: "email" | "phone"; value: string },
  db: GuardAssignmentClient = prisma,
) {
  return db.user.findFirst({
    where: {
      deletedAt: null,
      status: { in: [UserStatus.PENDING, UserStatus.ACTIVE] },
      roles: { some: { role: UserRoleType.GUARD } },
      ...(identifier.type === "email"
        ? { email: identifier.value }
        : { phone: identifier.value }),
    },
    select: { id: true },
  });
}

export function findNonTerminalAssignment(
  propertyId: string,
  guardUserId: string,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.findFirst({
    where: {
      propertyId,
      guardUserId,
      status: {
        in: [
          GuardAssignmentStatus.PENDING_ACCEPTANCE,
          GuardAssignmentStatus.ACTIVE,
          GuardAssignmentStatus.SUSPENDED,
        ],
      },
    },
    select: { id: true },
  });
}

export function createGuardAssignment(
  data: Prisma.PropertyGuardAssignmentUncheckedCreateInput,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.create({
    data,
    select: guardAssignmentSelect,
  });
}

function ownerScope(
  ownerUserId: string,
): Prisma.PropertyGuardAssignmentWhereInput {
  return { property: { ownerUserId } };
}

export function countOwnerAssignments(
  ownerUserId: string,
  filters: { propertyId?: string; status?: GuardAssignmentStatus },
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.count({
    where: {
      ...ownerScope(ownerUserId),
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
  });
}

export function findOwnerAssignments(
  ownerUserId: string,
  filters: { propertyId?: string; status?: GuardAssignmentStatus },
  skip: number,
  take: number,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.findMany({
    where: {
      ...ownerScope(ownerUserId),
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    skip,
    take,
    select: guardAssignmentSelect,
  });
}

export function findOwnerAssignmentById(
  assignmentId: string,
  ownerUserId: string,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.findFirst({
    where: { id: assignmentId, ...ownerScope(ownerUserId) },
    select: guardAssignmentSelect,
  });
}

export function countGuardAssignments(
  guardUserId: string,
  status?: GuardAssignmentStatus,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.count({
    where: { guardUserId, ...(status ? { status } : {}) },
  });
}

export function findGuardAssignments(
  guardUserId: string,
  status: GuardAssignmentStatus | undefined,
  skip: number,
  take: number,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.findMany({
    where: { guardUserId, ...(status ? { status } : {}) },
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    skip,
    take,
    select: guardAssignmentSelect,
  });
}

export function findGuardAssignmentById(
  assignmentId: string,
  guardUserId: string,
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.findFirst({
    where: { id: assignmentId, guardUserId },
    select: guardAssignmentSelect,
  });
}

export function updateAssignmentConditionally(
  assignmentId: string,
  expectedStatus: GuardAssignmentStatus,
  data: Prisma.PropertyGuardAssignmentUpdateManyMutationInput,
  scope: {
    ownerUserId?: string;
    guardUserId?: string;
    requireReadyGuard?: boolean;
    requireEligibleProperty?: boolean;
  },
  db: GuardAssignmentClient = prisma,
) {
  return db.propertyGuardAssignment.updateMany({
    where: {
      id: assignmentId,
      status: expectedStatus,
      ...(scope.guardUserId ? { guardUserId: scope.guardUserId } : {}),
      ...(scope.ownerUserId ? ownerScope(scope.ownerUserId) : {}),
      ...(scope.requireReadyGuard
        ? {
            guard: {
              status: UserStatus.ACTIVE,
              deletedAt: null,
              mustChangePassword: false,
              emailVerifiedAt: { not: null },
            },
          }
        : {}),
      ...(scope.requireEligibleProperty
        ? {
            property: {
              status: PropertyStatus.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
              deletedAt: null,
            },
          }
        : {}),
    },
    data,
  });
}
