import {
  DomainAuditEventType,
  GuardAssignmentStatus,
  ManagerDelegationPermission,
  ManagerDelegationStatus,
  Prisma,
  PropertyGuardMembershipStatus,
  PropertyProviderStatus,
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { prisma } from "../../config/prisma.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import * as governanceRepository from "../property-governance/property-governance.repository.js";
import * as propertyRepository from "../properties/property.repository.js";
import { propertyErrors } from "../properties/property.errors.js";
import { guardAssignmentErrors } from "./guard-assignment.errors.js";
import {
  toGuardMembership,
  toProviderGuardAssignment,
} from "./guard-assignment.mapper.js";
import {
  guardMembershipInclude,
  providerGuardAssignmentInclude,
} from "./guard-assignment.repository.js";
import {
  canAcceptGuardMembership,
  canEditProviderAssignmentShift,
  canEndProviderAssignment,
  canResumeProviderAssignment,
  canSuspendProviderAssignment,
} from "./guard-assignment.policy.js";
import type {
  AddPropertyGuardInput,
  CreateProviderGuardAssignmentInput,
  ListGuardAssignmentsQuery,
  ListGuardMembershipsQuery,
  UpdateGuardAssignmentInput,
} from "./guard-assignment.types.js";

function shiftTimeToDate(value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours!, minutes!, 0, 0));
}

function parseIdentifier(identifier: string): {
  type: "email" | "phone";
  value: string;
} {
  const value = identifier.trim().toLowerCase();
  if (value.includes("@")) return { type: "email", value };
  try {
    return { type: "phone", value: normalizeBangladeshPhone(identifier) };
  } catch {
    throw guardAssignmentErrors.guardNotFound();
  }
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function lockGuardAssignment(
  tx: Prisma.TransactionClient,
  assignmentId: string,
) {
  await tx.$queryRaw<Array<{ lockResult: string }>>`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${`provider-guard-assignment:${assignmentId}`}, 0)
    )::text AS "lockResult"
  `;
}

async function requireEligibleProperty(
  tx: Prisma.TransactionClient,
  propertyId: string,
) {
  const property = await tx.property.findFirst({
    where: { id: propertyId, deletedAt: null },
    select: { id: true, status: true, verificationStatus: true },
  });
  if (
    !property ||
    property.status !== PropertyStatus.ACTIVE ||
    property.verificationStatus !== VerificationStatus.VERIFIED
  ) {
    throw guardAssignmentErrors.propertyNotEligible();
  }
  return property;
}

async function resolveProviderMembership(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  propertyId: string,
  permission: ManagerDelegationPermission,
  requestedProviderMembershipId?: string,
) {
  const own = await governanceRepository.findActiveVerifiedProviderMembership(
    actorUserId,
    propertyId,
    tx,
  );
  if (
    own &&
    (!requestedProviderMembershipId || requestedProviderMembershipId === own.id)
  ) {
    return own;
  }

  if (!requestedProviderMembershipId) {
    const now = new Date();
    const delegatedScopes = await tx.providerManagerDelegation.findMany({
      where: {
        managerUserId: actorUserId,
        propertyId,
        status: ManagerDelegationStatus.ACTIVE,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: now } }] }],
        grantorProviderMembership:
          governanceRepository.activeVerifiedProviderWhere,
        permissions: { some: { permission } },
      },
      select: { grantorProviderMembershipId: true },
      take: 2,
    });
    if (delegatedScopes.length === 0) throw propertyErrors.notFound();
    if (delegatedScopes.length > 1) {
      throw guardAssignmentErrors.providerScopeRequired();
    }
    requestedProviderMembershipId =
      delegatedScopes[0]!.grantorProviderMembershipId;
  }

  const delegated = await governanceRepository.findLiveManagerDelegation(
    actorUserId,
    propertyId,
    permission,
    requestedProviderMembershipId,
    tx,
  );
  if (!delegated) throw propertyErrors.notFound();
  const membership = await tx.propertyProvider.findUnique({
    where: { id: delegated.grantorProviderMembershipId },
  });
  if (!membership) throw propertyErrors.notFound();
  return membership;
}

async function canManageSharedGuards(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  propertyId: string,
) {
  if (
    await governanceRepository.findActiveVerifiedProviderMembership(
      actorUserId,
      propertyId,
      tx,
    )
  )
    return true;
  return Boolean(
    await governanceRepository.findLiveManagerDelegation(
      actorUserId,
      propertyId,
      ManagerDelegationPermission.GUARD_ADD_TO_PROPERTY,
      undefined,
      tx,
    ),
  );
}

async function canViewSharedGuards(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  propertyId: string,
) {
  if (
    await governanceRepository.findActiveVerifiedProviderMembership(
      actorUserId,
      propertyId,
      tx,
    )
  )
    return true;
  const admin = await tx.user.findFirst({
    where: {
      id: actorUserId,
      deletedAt: null,
      roles: { some: { role: UserRoleType.ADMIN } },
    },
    select: { id: true },
  });
  if (admin) return true;
  return Boolean(
    await governanceRepository.findLiveManagerDelegation(
      actorUserId,
      propertyId,
      ManagerDelegationPermission.GUARD_VIEW,
      undefined,
      tx,
    ),
  );
}

export async function addPropertyGuard(
  actorUserId: string,
  propertyId: string,
  input: AddPropertyGuardInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      if (!(await canManageSharedGuards(tx, actorUserId, propertyId)))
        throw propertyErrors.notFound();
      await requireEligibleProperty(tx, propertyId);
      const identifier = parseIdentifier(input.identifier);
      const guard = await tx.user.findFirst({
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
      if (!guard) throw guardAssignmentErrors.guardNotFound();
      const existing = await tx.propertyGuardMembership.findUnique({
        where: {
          propertyId_guardUserId: { propertyId, guardUserId: guard.id },
        },
      });
      if (
        existing &&
        existing.status !== PropertyGuardMembershipStatus.ENDED &&
        existing.status !== PropertyGuardMembershipStatus.CANCELLED
      ) {
        throw guardAssignmentErrors.membershipAlreadyExists();
      }
      const membership = existing
        ? await tx.propertyGuardMembership.update({
            where: { id: existing.id },
            data: {
              status: PropertyGuardMembershipStatus.PENDING_ACCEPTANCE,
              addedByUserId: actorUserId,
              invitedAt: new Date(),
              joinedAt: null,
              endedAt: null,
            },
            include: guardMembershipInclude,
          })
        : await tx.propertyGuardMembership.create({
            data: {
              propertyId,
              guardUserId: guard.id,
              addedByUserId: actorUserId,
            },
            include: guardMembershipInclude,
          });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PROPERTY_GUARD_ADDED,
        actorUserId,
        propertyId,
        entityType: "PropertyGuardMembership",
        entityId: membership.id,
        metadata: { guardUserId: guard.id },
      });
      return toGuardMembership(membership);
    });
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw guardAssignmentErrors.membershipAlreadyExists();
    throw error;
  }
}

export async function listPropertyGuards(
  actorUserId: string,
  propertyId: string,
) {
  const property = await propertyRepository.findPropertyById(propertyId);
  if (!property) throw propertyErrors.notFound();
  const allowed = await prisma.$transaction((tx) =>
    canViewSharedGuards(tx, actorUserId, propertyId),
  );
  if (!allowed) throw propertyErrors.notFound();
  const records = await prisma.propertyGuardMembership.findMany({
    where: { propertyId },
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    include: guardMembershipInclude,
  });
  return records.map(toGuardMembership);
}

export async function listMyGuardMemberships(
  guardUserId: string,
  query: ListGuardMembershipsQuery,
) {
  const where = {
    guardUserId,
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    prisma.propertyGuardMembership.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
      include: guardMembershipInclude,
    }),
    prisma.propertyGuardMembership.count({ where }),
  ]);
  return {
    memberships: records.map(toGuardMembership),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function respondToGuardMembership(
  guardUserId: string,
  membershipId: string,
  accept: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.propertyGuardMembership.findFirst({
      where: { id: membershipId, guardUserId },
      include: guardMembershipInclude,
    });
    if (!membership) throw guardAssignmentErrors.membershipNotFound();
    if (!canAcceptGuardMembership(membership.status))
      throw guardAssignmentErrors.invalidTransition();
    if (accept) {
      const guard = await tx.user.findUnique({
        where: { id: guardUserId },
        select: {
          status: true,
          mustChangePassword: true,
          emailVerifiedAt: true,
          deletedAt: true,
        },
      });
      if (
        !guard ||
        guard.status !== UserStatus.ACTIVE ||
        guard.mustChangePassword ||
        !guard.emailVerifiedAt ||
        guard.deletedAt
      ) {
        throw guardAssignmentErrors.guardNotEligible();
      }
      await requireEligibleProperty(tx, membership.propertyId);
    }
    const changed = await tx.propertyGuardMembership.updateMany({
      where: {
        id: membershipId,
        guardUserId,
        status: PropertyGuardMembershipStatus.PENDING_ACCEPTANCE,
      },
      data: accept
        ? {
            status: PropertyGuardMembershipStatus.ACTIVE,
            joinedAt: new Date(),
            endedAt: null,
          }
        : {
            status: PropertyGuardMembershipStatus.CANCELLED,
            endedAt: new Date(),
          },
    });
    if (changed.count !== 1) throw guardAssignmentErrors.stateConflict();
    return toGuardMembership(
      await tx.propertyGuardMembership.findUniqueOrThrow({
        where: { id: membershipId },
        include: guardMembershipInclude,
      }),
    );
  });
}

export async function createProviderGuardAssignment(
  actorUserId: string,
  propertyId: string,
  input: CreateProviderGuardAssignmentInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const providerMembership = await resolveProviderMembership(
        tx,
        actorUserId,
        propertyId,
        ManagerDelegationPermission.GUARD_ASSIGN,
        input.providerMembershipId,
      );
      await requireEligibleProperty(tx, propertyId);
      const guardMembership = await tx.propertyGuardMembership.findFirst({
        where: {
          id: input.guardMembershipId,
          propertyId,
          status: PropertyGuardMembershipStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!guardMembership) throw guardAssignmentErrors.membershipNotActive();
      const existing = await tx.providerGuardAssignment.findFirst({
        where: {
          propertyGuardMembershipId: guardMembership.id,
          providerMembershipId: providerMembership.id,
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
      if (existing) throw guardAssignmentErrors.alreadyExists();
      const assignment = await tx.providerGuardAssignment.create({
        data: {
          propertyGuardMembershipId: guardMembership.id,
          providerMembershipId: providerMembership.id,
          createdByUserId: actorUserId,
          status: GuardAssignmentStatus.ACTIVE,
          shiftStart: shiftTimeToDate(input.shiftStart),
          shiftEnd: shiftTimeToDate(input.shiftEnd),
        },
        include: providerGuardAssignmentInclude,
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PROVIDER_GUARD_ASSIGNED,
        actorUserId,
        propertyId,
        entityType: "ProviderGuardAssignment",
        entityId: assignment.id,
        metadata: {
          providerMembershipId: providerMembership.id,
          guardMembershipId: guardMembership.id,
        },
      });
      return toProviderGuardAssignment(assignment);
    });
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw guardAssignmentErrors.alreadyExists();
    throw error;
  }
}

function providerAssignmentActorWhere(actorUserId: string) {
  const now = new Date();
  return {
    OR: [
      {
        providerMembership: {
          providerUserId: actorUserId,
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      {
        providerMembership: {
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
          managerDelegations: {
            some: {
              managerUserId: actorUserId,
              status: ManagerDelegationStatus.ACTIVE,
              OR: [{ validFrom: null }, { validFrom: { lte: now } }],
              AND: [
                { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
              ],
              permissions: {
                some: { permission: ManagerDelegationPermission.GUARD_VIEW },
              },
            },
          },
        },
      },
    ],
  } satisfies Prisma.ProviderGuardAssignmentWhereInput;
}

export async function listProviderAssignments(
  actorUserId: string,
  query: ListGuardAssignmentsQuery,
) {
  const where: Prisma.ProviderGuardAssignmentWhereInput = {
    ...providerAssignmentActorWhere(actorUserId),
    ...(query.propertyId
      ? { propertyGuardMembership: { propertyId: query.propertyId } }
      : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    prisma.providerGuardAssignment.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
      include: providerGuardAssignmentInclude,
    }),
    prisma.providerGuardAssignment.count({ where }),
  ]);
  return {
    assignments: records.map(toProviderGuardAssignment),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getProviderAssignment(
  actorUserId: string,
  assignmentId: string,
) {
  const record = await prisma.providerGuardAssignment.findFirst({
    where: {
      id: assignmentId,
      ...providerAssignmentActorWhere(actorUserId),
    },
    include: providerGuardAssignmentInclude,
  });
  if (!record) throw guardAssignmentErrors.notFound();
  return toProviderGuardAssignment(record);
}

export async function listMyProviderAssignments(
  guardUserId: string,
  query: ListGuardAssignmentsQuery,
) {
  const where: Prisma.ProviderGuardAssignmentWhereInput = {
    propertyGuardMembership: {
      guardUserId,
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    },
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    prisma.providerGuardAssignment.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
      include: providerGuardAssignmentInclude,
    }),
    prisma.providerGuardAssignment.count({ where }),
  ]);
  return {
    assignments: records.map(toProviderGuardAssignment),
    pagination: pagination(query.page, query.limit, total),
  };
}

async function requireAssignmentMutationAuthority(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  assignmentId: string,
) {
  const assignment = await tx.providerGuardAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      propertyGuardMembership: { select: { propertyId: true } },
      providerMembership: true,
    },
  });
  if (!assignment) throw guardAssignmentErrors.notFound();
  const propertyId = assignment.propertyGuardMembership.propertyId;
  const membership = await resolveProviderMembership(
    tx,
    actorUserId,
    propertyId,
    ManagerDelegationPermission.GUARD_ASSIGN,
    assignment.providerMembershipId,
  );
  if (membership.id !== assignment.providerMembershipId)
    throw guardAssignmentErrors.notFound();
  return assignment;
}

export async function updateProviderGuardAssignment(
  actorUserId: string,
  assignmentId: string,
  input: UpdateGuardAssignmentInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockGuardAssignment(tx, assignmentId);
    const current = await requireAssignmentMutationAuthority(
      tx,
      actorUserId,
      assignmentId,
    );
    let data: Prisma.ProviderGuardAssignmentUpdateManyMutationInput;
    let expected: GuardAssignmentStatus;
    if (input.action === "SUSPEND") {
      if (!canSuspendProviderAssignment(current.status))
        throw guardAssignmentErrors.invalidTransition();
      expected = GuardAssignmentStatus.ACTIVE;
      data = { status: GuardAssignmentStatus.SUSPENDED };
    } else if (input.action === "RESUME") {
      if (!canResumeProviderAssignment(current.status))
        throw guardAssignmentErrors.invalidTransition();
      expected = GuardAssignmentStatus.SUSPENDED;
      data = { status: GuardAssignmentStatus.ACTIVE };
    } else {
      if (!canEditProviderAssignmentShift(current.status)) {
        throw guardAssignmentErrors.invalidTransition();
      }
      expected = current.status;
      data = {
        status: GuardAssignmentStatus.PENDING_ACCEPTANCE,
        shiftStart: shiftTimeToDate(input.shiftStart),
        shiftEnd: shiftTimeToDate(input.shiftEnd),
      };
    }
    if (current.status !== expected)
      throw guardAssignmentErrors.invalidTransition();
    const changed = await tx.providerGuardAssignment.updateMany({
      where: { id: assignmentId, status: expected },
      data,
    });
    if (changed.count !== 1) throw guardAssignmentErrors.stateConflict();
    return toProviderGuardAssignment(
      await tx.providerGuardAssignment.findUniqueOrThrow({
        where: { id: assignmentId },
        include: providerGuardAssignmentInclude,
      }),
    );
  });
}

export async function endProviderGuardAssignment(
  actorUserId: string,
  assignmentId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockGuardAssignment(tx, assignmentId);
    const current = await requireAssignmentMutationAuthority(
      tx,
      actorUserId,
      assignmentId,
    );
    if (!canEndProviderAssignment(current.status)) {
      throw guardAssignmentErrors.invalidTransition();
    }
    const changed = await tx.providerGuardAssignment.updateMany({
      where: { id: assignmentId, status: current.status },
      data: { status: GuardAssignmentStatus.ENDED, endedAt: new Date() },
    });
    if (changed.count !== 1) throw guardAssignmentErrors.stateConflict();
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROVIDER_GUARD_ASSIGNMENT_ENDED,
      actorUserId,
      propertyId: current.propertyGuardMembership.propertyId,
      entityType: "ProviderGuardAssignment",
      entityId: assignmentId,
    });
  });
}

export async function removePropertyGuard(
  adminUserId: string,
  propertyId: string,
  membershipId: string,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const membership = await tx.propertyGuardMembership.findFirst({
      where: { id: membershipId, propertyId },
    });
    if (!membership) throw guardAssignmentErrors.membershipNotFound();
    if (
      membership.status === PropertyGuardMembershipStatus.ENDED ||
      membership.status === PropertyGuardMembershipStatus.CANCELLED
    ) {
      throw guardAssignmentErrors.invalidTransition();
    }
    const activeAssignments = await tx.providerGuardAssignment.count({
      where: {
        propertyGuardMembershipId: membership.id,
        status: {
          in: [
            GuardAssignmentStatus.PENDING_ACCEPTANCE,
            GuardAssignmentStatus.ACTIVE,
            GuardAssignmentStatus.SUSPENDED,
          ],
        },
      },
    });
    if (activeAssignments > 0)
      throw guardAssignmentErrors.membershipRemovalBlocked();
    const targetStatus =
      membership.status === PropertyGuardMembershipStatus.PENDING_ACCEPTANCE
        ? PropertyGuardMembershipStatus.CANCELLED
        : PropertyGuardMembershipStatus.ENDED;
    const changed = await tx.propertyGuardMembership.updateMany({
      where: { id: membership.id, status: membership.status },
      data: { status: targetStatus, endedAt: new Date() },
    });
    if (changed.count !== 1) throw guardAssignmentErrors.stateConflict();
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROPERTY_GUARD_REMOVED,
      actorUserId: adminUserId,
      propertyId,
      entityType: "PropertyGuardMembership",
      entityId: membership.id,
    });
  });
}

export const inviteGuard = (
  actorUserId: string,
  propertyId: string,
  input: AddPropertyGuardInput,
) => addPropertyGuard(actorUserId, propertyId, input);
export const listOwnerAssignments = listProviderAssignments;
export const updateOwnerAssignment = updateProviderGuardAssignment;
export const endOwnerAssignment = endProviderGuardAssignment;
export const listGuardAssignments = listMyProviderAssignments;
export const acceptGuardAssignment = (
  guardUserId: string,
  membershipId: string,
) => respondToGuardMembership(guardUserId, membershipId, true);
export const rejectGuardAssignment = (
  guardUserId: string,
  membershipId: string,
) => respondToGuardMembership(guardUserId, membershipId, false);
