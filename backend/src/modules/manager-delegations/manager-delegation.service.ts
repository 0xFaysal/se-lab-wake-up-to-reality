import {
  DomainAuditEventType,
  ManagerDelegationStatus,
  Prisma,
  PropertyProviderStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import * as propertyRepository from "../properties/property.repository.js";
import { managerDelegationErrors } from "./manager-delegation.errors.js";
import { toManagerDelegationDto } from "./manager-delegation.mapper.js";
import type {
  CreateManagerDelegationInput,
  UpdateManagerDelegationPermissionsInput,
} from "./manager-delegation.types.js";

const delegationInclude = {
  permissions: { select: { permission: true } },
  resources: { select: { parkingSpotId: true } },
  property: {
    select: {
      id: true,
      name: true,
      publicArea: true,
      approximateAddress: true,
      description: true,
    },
  },
  manager: { select: { id: true, fullName: true, email: true, phone: true } },
  grantorProviderMembership: {
    select: {
      id: true,
      provider: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  },
} satisfies Prisma.ProviderManagerDelegationInclude;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function lockDelegation(
  tx: Prisma.TransactionClient,
  delegationId: string,
) {
  await tx.$queryRaw<Array<{ lockResult: string }>>`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${`manager-delegation:${delegationId}`}, 0)
    )::text AS "lockResult"
  `;
}

async function requireProviderMembership(
  tx: Prisma.TransactionClient,
  providerUserId: string,
  propertyId: string,
) {
  const membership = await tx.propertyProvider.findFirst({
    where: {
      providerUserId,
      propertyId,
      status: PropertyProviderStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });
  if (!membership) throw managerDelegationErrors.forbidden();
  return membership;
}

async function requireValidResources(
  tx: Prisma.TransactionClient,
  providerMembershipId: string,
  propertyId: string,
  resourceIds: string[],
) {
  if (resourceIds.length === 0) return;
  const count = await tx.parkingSpot.count({
    where: { id: { in: resourceIds }, propertyId, providerMembershipId },
  });
  if (count !== resourceIds.length)
    throw managerDelegationErrors.invalidResourceScope();
}

export async function createManagerDelegation(
  providerUserId: string,
  input: CreateManagerDelegationInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(input.propertyId, tx);
      const membership = await requireProviderMembership(
        tx,
        providerUserId,
        input.propertyId,
      );
      const manager = await tx.user.findFirst({
        where: {
          id: input.managerUserId,
          deletedAt: null,
          status: { in: [UserStatus.PENDING, UserStatus.ACTIVE] },
          roles: { some: { role: UserRoleType.MANAGER } },
        },
        select: { id: true },
      });
      if (!manager) throw managerDelegationErrors.managerNotEligible();
      await requireValidResources(
        tx,
        membership.id,
        input.propertyId,
        input.resourceIds,
      );

      const delegation = await tx.providerManagerDelegation.create({
        data: {
          grantorProviderMembershipId: membership.id,
          managerUserId: manager.id,
          propertyId: input.propertyId,
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          permissions: {
            create: input.permissions.map((permission) => ({ permission })),
          },
          resources: {
            create: input.resourceIds.map((parkingSpotId) => ({
              parkingSpotId,
            })),
          },
        },
        include: delegationInclude,
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.MANAGER_DELEGATION_CREATED,
        actorUserId: providerUserId,
        propertyId: input.propertyId,
        entityType: "ProviderManagerDelegation",
        entityId: delegation.id,
        metadata: {
          managerUserId: manager.id,
          permissionCount: input.permissions.length,
        },
      });
      return toManagerDelegationDto(delegation);
    });
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw managerDelegationErrors.conflict();
    throw error;
  }
}

export async function createManagerDelegationByIdentifier(
  providerUserId: string,
  input: Omit<CreateManagerDelegationInput, "managerUserId"> & {
    managerIdentifier: string;
  },
) {
  const identifier = input.managerIdentifier.trim();
  let normalizedPhone: string | null = null;
  try {
    normalizedPhone = normalizeBangladeshPhone(identifier);
  } catch {
    // The identifier may be an email address.
  }
  const manager = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      status: { in: [UserStatus.PENDING, UserStatus.ACTIVE] },
      roles: { some: { role: UserRoleType.MANAGER } },
      OR: [
        { email: identifier.toLowerCase() },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    },
    select: { id: true },
  });
  if (!manager) throw managerDelegationErrors.managerNotEligible();
  const { managerIdentifier: _managerIdentifier, ...delegation } = input;
  return createManagerDelegation(providerUserId, {
    ...delegation,
    managerUserId: manager.id,
  });
}

export async function listProviderDelegations(providerUserId: string) {
  const records = await prisma.providerManagerDelegation.findMany({
    where: { grantorProviderMembership: { providerUserId } },
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    include: delegationInclude,
  });
  return records.map(toManagerDelegationDto);
}

export async function listManagerDelegations(managerUserId: string) {
  const records = await prisma.providerManagerDelegation.findMany({
    where: { managerUserId },
    orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
    include: delegationInclude,
  });
  return records.map(toManagerDelegationDto);
}

export async function getProviderDelegation(
  providerUserId: string,
  delegationId: string,
) {
  const record = await prisma.providerManagerDelegation.findFirst({
    where: {
      id: delegationId,
      grantorProviderMembership: { providerUserId },
    },
    include: delegationInclude,
  });
  if (!record) throw managerDelegationErrors.notFound();
  return toManagerDelegationDto(record);
}

export async function getManagerDelegation(
  managerUserId: string,
  delegationId: string,
) {
  const record = await prisma.providerManagerDelegation.findFirst({
    where: { id: delegationId, managerUserId },
    include: delegationInclude,
  });
  if (!record) throw managerDelegationErrors.notFound();
  return toManagerDelegationDto(record);
}

export async function updateManagerDelegationPermissions(
  providerUserId: string,
  delegationId: string,
  input: UpdateManagerDelegationPermissionsInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockDelegation(tx, delegationId);
    const current = await tx.providerManagerDelegation.findUnique({
      where: { id: delegationId },
      include: { grantorProviderMembership: true },
    });
    if (!current) throw managerDelegationErrors.notFound();
    if (current.grantorProviderMembership.providerUserId !== providerUserId) {
      throw managerDelegationErrors.notFound();
    }
    if (
      current.status !== ManagerDelegationStatus.PENDING_ACCEPTANCE &&
      current.status !== ManagerDelegationStatus.ACTIVE
    ) {
      throw managerDelegationErrors.invalidTransition();
    }
    await requireProviderMembership(tx, providerUserId, current.propertyId);
    await requireValidResources(
      tx,
      current.grantorProviderMembershipId,
      current.propertyId,
      input.resourceIds,
    );
    await tx.providerManagerDelegationPermission.deleteMany({
      where: { delegationId },
    });
    await tx.providerManagerDelegationResource.deleteMany({
      where: { delegationId },
    });
    const updated = await tx.providerManagerDelegation.update({
      where: { id: delegationId },
      data: {
        permissions: {
          create: input.permissions.map((permission) => ({ permission })),
        },
        resources: {
          create: input.resourceIds.map((parkingSpotId) => ({ parkingSpotId })),
        },
      },
      include: delegationInclude,
    });
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.MANAGER_PERMISSION_UPDATED,
      actorUserId: providerUserId,
      propertyId: current.propertyId,
      entityType: "ProviderManagerDelegation",
      entityId: delegationId,
      metadata: { permissionCount: input.permissions.length },
    });
    return toManagerDelegationDto(updated);
  });
}

async function finishDelegation(
  actorUserId: string,
  delegationId: string,
  actor: "PROVIDER" | "MANAGER",
  accept: boolean,
) {
  return prisma.$transaction(async (tx) => {
    await lockDelegation(tx, delegationId);
    const current = await tx.providerManagerDelegation.findUnique({
      where: { id: delegationId },
      include: { grantorProviderMembership: true },
    });
    if (!current) throw managerDelegationErrors.notFound();
    const allowed =
      actor === "MANAGER"
        ? current.managerUserId === actorUserId
        : current.grantorProviderMembership.providerUserId === actorUserId;
    if (!allowed) throw managerDelegationErrors.notFound();

    if (accept) {
      if (
        actor !== "MANAGER" ||
        current.status !== ManagerDelegationStatus.PENDING_ACCEPTANCE
      ) {
        throw managerDelegationErrors.invalidTransition();
      }
      const now = new Date();
      if (current.validUntil && current.validUntil <= now)
        throw managerDelegationErrors.invalidTransition();
      const changed = await tx.providerManagerDelegation.updateMany({
        where: {
          id: delegationId,
          managerUserId: actorUserId,
          status: ManagerDelegationStatus.PENDING_ACCEPTANCE,
        },
        data: { status: ManagerDelegationStatus.ACTIVE, acceptedAt: now },
      });
      if (changed.count !== 1) throw managerDelegationErrors.conflict();
    } else {
      if (
        current.status !== ManagerDelegationStatus.PENDING_ACCEPTANCE &&
        current.status !== ManagerDelegationStatus.ACTIVE &&
        current.status !== ManagerDelegationStatus.SUSPENDED
      ) {
        throw managerDelegationErrors.invalidTransition();
      }
      const status =
        current.status === ManagerDelegationStatus.PENDING_ACCEPTANCE
          ? ManagerDelegationStatus.CANCELLED
          : ManagerDelegationStatus.ENDED;
      const changed = await tx.providerManagerDelegation.updateMany({
        where: { id: delegationId, status: current.status },
        data: { status, endedAt: new Date() },
      });
      if (changed.count !== 1) throw managerDelegationErrors.conflict();
    }

    const updated = await tx.providerManagerDelegation.findUniqueOrThrow({
      where: { id: delegationId },
      include: delegationInclude,
    });
    await createDomainAuditEvent(tx, {
      eventType: accept
        ? DomainAuditEventType.MANAGER_DELEGATION_ACCEPTED
        : DomainAuditEventType.MANAGER_DELEGATION_ENDED,
      actorUserId,
      propertyId: current.propertyId,
      entityType: "ProviderManagerDelegation",
      entityId: delegationId,
    });
    return toManagerDelegationDto(updated);
  });
}

export const acceptManagerDelegation = (
  managerUserId: string,
  delegationId: string,
) => finishDelegation(managerUserId, delegationId, "MANAGER", true);
export const rejectManagerDelegation = (
  managerUserId: string,
  delegationId: string,
) => finishDelegation(managerUserId, delegationId, "MANAGER", false);
export const endManagerDelegation = (
  providerUserId: string,
  delegationId: string,
) => finishDelegation(providerUserId, delegationId, "PROVIDER", false);
