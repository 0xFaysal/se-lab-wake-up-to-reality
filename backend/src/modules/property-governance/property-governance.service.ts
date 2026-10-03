import {
  BuildingManagerAssignmentStatus,
  DomainAuditEventType,
  GovernanceVoteDecision,
  GuardAssignmentStatus,
  ManagerDelegationStatus,
  Prisma,
  PropertyChangeProposalStatus,
  PropertyChangeType,
  PropertyProviderStatus,
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import {
  decryptSensitiveText,
  encryptSensitiveText,
} from "../../common/security/encryption.js";
import { prisma } from "../../config/prisma.js";
import { propertyErrors } from "../properties/property.errors.js";
import * as propertyRepository from "../properties/property.repository.js";
import {
  fingerprintPropertyAddress,
  normalizePropertyName,
} from "../properties/property-identity.js";
import { createDomainAuditEvent } from "./domain-audit.js";
import { governanceErrors } from "./property-governance.errors.js";
import {
  toBuildingManagerDto,
  toPropertyChangeProposalDto,
  toProviderMembershipDto,
} from "./property-governance.mapper.js";
import {
  canManagePropertyCommonRules,
  canReadProviderProperty,
  getPropertyGovernanceMode,
} from "./property-governance.policy.js";
import * as repository from "./property-governance.repository.js";
import type {
  BuildingManagerNominationInput,
  CommonRulesInput,
  GovernanceVoteInput,
  MembershipVerificationInput,
  PropertyChangeProposalInput,
  TemporaryClosureInput,
} from "./property-governance.types.js";

const activeVerifiedProviderWhere = repository.activeVerifiedProviderWhere;

function timeToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

async function requireActiveVerifiedMembership(
  userId: string,
  propertyId: string,
  tx: Prisma.TransactionClient,
) {
  const membership = await repository.findActiveVerifiedProviderMembership(
    userId,
    propertyId,
    tx,
  );
  if (!membership) throw governanceErrors.notFound();
  return membership;
}

async function moveManagerToReconfirmation(
  propertyId: string,
  tx: Prisma.TransactionClient,
) {
  const active = await repository.findActiveBuildingManager(propertyId, tx);
  if (!active) return;
  await tx.propertyBuildingManagerAssignment.updateMany({
    where: { id: active.id, status: BuildingManagerAssignmentStatus.ACTIVE },
    data: {
      status: BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
      activatedAt: null,
    },
  });
  await tx.propertyBuildingManagerVote.deleteMany({
    where: { assignmentId: active.id },
  });
}

async function invalidateGovernanceForProviderSetChange(
  propertyId: string,
  tx: Prisma.TransactionClient,
) {
  const active = await repository.findActiveBuildingManager(propertyId, tx);
  const pendingAssignments =
    await tx.propertyBuildingManagerAssignment.findMany({
      where: {
        propertyId,
        status: {
          in: [
            BuildingManagerAssignmentStatus.PENDING_APPROVAL,
            BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
          ],
        },
      },
      select: { id: true },
    });
  if (pendingAssignments.length > 0) {
    await tx.propertyBuildingManagerVote.deleteMany({
      where: {
        assignmentId: { in: pendingAssignments.map((item) => item.id) },
      },
    });
    await tx.propertyBuildingManagerAssignment.updateMany({
      where: { id: { in: pendingAssignments.map((item) => item.id) } },
      data: active
        ? {
            status: BuildingManagerAssignmentStatus.CANCELLED,
            endedAt: new Date(),
          }
        : { status: BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION },
    });
  }
  if (active) await moveManagerToReconfirmation(propertyId, tx);
  await tx.propertyChangeProposal.updateMany({
    where: {
      propertyId,
      status: PropertyChangeProposalStatus.PENDING_APPROVAL,
    },
    data: {
      status: PropertyChangeProposalStatus.STALE,
      resolvedAt: new Date(),
    },
  });
}

async function endActiveBuildingManager(
  propertyId: string,
  actorUserId: string,
  tx: Prisma.TransactionClient,
) {
  const active = await repository.findActiveBuildingManager(propertyId, tx);
  if (!active) return;
  const changed = await tx.propertyBuildingManagerAssignment.updateMany({
    where: { id: active.id, status: BuildingManagerAssignmentStatus.ACTIVE },
    data: {
      status: BuildingManagerAssignmentStatus.ENDED,
      endedAt: new Date(),
    },
  });
  if (changed.count !== 1) throw governanceErrors.conflict();
  await createDomainAuditEvent(tx, {
    eventType: DomainAuditEventType.BUILDING_MANAGER_ENDED,
    actorUserId,
    propertyId,
    entityType: "PropertyBuildingManagerAssignment",
    entityId: active.id,
  });
}

export async function requestProviderMembership(
  providerUserId: string,
  propertyId: string,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const property = await propertyRepository.findPropertyById(propertyId, tx);
    if (
      !property ||
      property.verificationStatus !== VerificationStatus.VERIFIED ||
      property.status === PropertyStatus.INACTIVE
    ) {
      throw governanceErrors.notFound();
    }
    const existing = await tx.propertyProvider.findUnique({
      where: { propertyId_providerUserId: { propertyId, providerUserId } },
    });
    if (existing && existing.status !== PropertyProviderStatus.ENDED) {
      throw governanceErrors.conflict();
    }
    const membership = existing
      ? await tx.propertyProvider.update({
          where: { id: existing.id },
          data: {
            status: PropertyProviderStatus.ACTIVE,
            verificationStatus: VerificationStatus.PENDING,
            joinedAt: new Date(),
            verifiedAt: null,
            verifiedByAdminId: null,
            rejectionReason: null,
            endedAt: null,
          },
        })
      : await tx.propertyProvider.create({
          data: { propertyId, providerUserId },
        });
    return toProviderMembershipDto(membership);
  });
}

export async function leaveProviderMembership(
  providerUserId: string,
  propertyId: string,
) {
  await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const membership = await requireActiveVerifiedMembership(
      providerUserId,
      propertyId,
      tx,
    );
    const before = await repository.getActiveVerifiedProviderCount(
      propertyId,
      tx,
    );
    const parkingResourceCount = await tx.parkingSpot.count({
      where: { providerMembershipId: membership.id, deletedAt: null },
    });
    if (parkingResourceCount > 0)
      throw governanceErrors.membershipExitBlocked();
    await tx.propertyProvider.updateMany({
      where: {
        id: membership.id,
        status: PropertyProviderStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      data: { status: PropertyProviderStatus.ENDED, endedAt: new Date() },
    });
    await tx.providerManagerDelegation.updateMany({
      where: {
        grantorProviderMembershipId: membership.id,
        status: {
          in: [
            ManagerDelegationStatus.PENDING_ACCEPTANCE,
            ManagerDelegationStatus.ACTIVE,
            ManagerDelegationStatus.SUSPENDED,
          ],
        },
      },
      data: { status: ManagerDelegationStatus.ENDED, endedAt: new Date() },
    });
    await tx.providerGuardAssignment.updateMany({
      where: {
        providerMembershipId: membership.id,
        status: {
          in: [
            GuardAssignmentStatus.PENDING_ACCEPTANCE,
            GuardAssignmentStatus.ACTIVE,
            GuardAssignmentStatus.SUSPENDED,
          ],
        },
      },
      data: { status: GuardAssignmentStatus.ENDED, endedAt: new Date() },
    });
    if (before > 1) {
      await invalidateGovernanceForProviderSetChange(propertyId, tx);
    } else if (before === 1) {
      await endActiveBuildingManager(propertyId, providerUserId, tx);
    }
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROPERTY_PROVIDER_ENDED,
      actorUserId: providerUserId,
      propertyId,
      entityType: "PropertyProvider",
      entityId: membership.id,
    });
  });
}

export async function verifyProviderMembership(
  adminUserId: string,
  propertyId: string,
  membershipId: string,
  input: MembershipVerificationInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const membership = await tx.propertyProvider.findFirst({
      where: {
        id: membershipId,
        propertyId,
        status: PropertyProviderStatus.ACTIVE,
        provider: {
          status: UserStatus.ACTIVE,
          deletedAt: null,
          emailVerifiedAt: { not: null },
          roles: { some: { role: UserRoleType.PROVIDER } },
        },
      },
    });
    if (!membership) throw governanceErrors.notFound();
    if (membership.verificationStatus !== VerificationStatus.PENDING) {
      throw governanceErrors.conflict();
    }
    const before = await repository.getActiveVerifiedProviderCount(
      propertyId,
      tx,
    );
    const verifiedAt = new Date();
    const updated = await tx.propertyProvider.update({
      where: { id: membership.id },
      data:
        input.decision === "APPROVE"
          ? {
              verificationStatus: VerificationStatus.VERIFIED,
              status: PropertyProviderStatus.ACTIVE,
              verifiedByAdminId: adminUserId,
              verifiedAt,
              rejectionReason: null,
              endedAt: null,
            }
          : {
              verificationStatus: VerificationStatus.REJECTED,
              status: PropertyProviderStatus.ENDED,
              verifiedByAdminId: adminUserId,
              verifiedAt: null,
              rejectionReason: input.reason,
              endedAt: verifiedAt,
            },
    });
    if (input.decision === "APPROVE" && before >= 1) {
      await invalidateGovernanceForProviderSetChange(propertyId, tx);
    }
    if (input.decision === "APPROVE") {
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PROPERTY_PROVIDER_JOINED,
        actorUserId: adminUserId,
        propertyId,
        entityType: "PropertyProvider",
        entityId: membership.id,
        metadata: { providerUserId: membership.providerUserId },
      });
    }
    return toProviderMembershipDto(updated);
  });
}

export async function nominateBuildingManager(
  nominatorUserId: string,
  propertyId: string,
  input: BuildingManagerNominationInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const nominator = await requireActiveVerifiedMembership(
      nominatorUserId,
      propertyId,
      tx,
    );
    const now = new Date();
    const candidate = await tx.user.findFirst({
      where: {
        id: input.candidateUserId,
        deletedAt: null,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: { not: null },
        OR: [
          {
            roles: { some: { role: UserRoleType.PROVIDER } },
            providerMemberships: {
              some: { propertyId, ...activeVerifiedProviderWhere },
            },
          },
          {
            roles: { some: { role: UserRoleType.MANAGER } },
            managerDelegations: {
              some: {
                propertyId,
                status: ManagerDelegationStatus.ACTIVE,
                OR: [{ validFrom: null }, { validFrom: { lte: now } }],
                AND: [
                  { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
                ],
                grantorProviderMembership: activeVerifiedProviderWhere,
              },
            },
          },
        ],
      },
      select: { id: true, fullName: true },
    });
    if (!candidate) throw governanceErrors.managerRelationshipRequired();

    const providerCount = await repository.getActiveVerifiedProviderCount(
      propertyId,
      tx,
    );
    const pendingNomination =
      await tx.propertyBuildingManagerAssignment.findFirst({
        where: {
          propertyId,
          status: {
            in: [
              BuildingManagerAssignmentStatus.PENDING_APPROVAL,
              BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
            ],
          },
        },
        select: { id: true },
      });
    if (pendingNomination) throw governanceErrors.conflict();
    const property = await tx.property.findUniqueOrThrow({
      where: { id: propertyId },
      select: { isSharedBuilding: true },
    });
    const activateImmediately =
      providerCount === 1 && !property.isSharedBuilding;
    if (activateImmediately) {
      await endActiveBuildingManager(propertyId, nominatorUserId, tx);
    }
    const assignment = await tx.propertyBuildingManagerAssignment.create({
      data: {
        propertyId,
        candidateUserId: candidate.id,
        nominatedByUserId: nominatorUserId,
        status: activateImmediately
          ? BuildingManagerAssignmentStatus.ACTIVE
          : BuildingManagerAssignmentStatus.PENDING_APPROVAL,
        ...(activateImmediately ? { activatedAt: new Date() } : {}),
      },
    });
    if (!activateImmediately) {
      await tx.propertyBuildingManagerVote.create({
        data: {
          assignmentId: assignment.id,
          providerMembershipId: nominator.id,
          voterUserId: nominatorUserId,
          decision: GovernanceVoteDecision.APPROVE,
        },
      });
    }
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.BUILDING_MANAGER_NOMINATED,
      actorUserId: nominatorUserId,
      propertyId,
      entityType: "PropertyBuildingManagerAssignment",
      entityId: assignment.id,
      metadata: { candidateUserId: candidate.id },
    });
    if (activateImmediately) {
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.BUILDING_MANAGER_ACTIVATED,
        actorUserId: nominatorUserId,
        propertyId,
        entityType: "PropertyBuildingManagerAssignment",
        entityId: assignment.id,
      });
    }
    return toBuildingManagerDto({ ...assignment, candidate });
  });
}

export async function getBuildingManager(propertyId: string, userId: string) {
  const canRead = await canReadProviderProperty(userId, propertyId);
  if (!canRead) throw governanceErrors.notFound();
  const assignment = await prisma.propertyBuildingManagerAssignment.findFirst({
    where: {
      propertyId,
      status: {
        in: [
          BuildingManagerAssignmentStatus.ACTIVE,
          BuildingManagerAssignmentStatus.PENDING_APPROVAL,
          BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: { candidate: { select: { id: true, fullName: true } } },
  });
  return assignment ? toBuildingManagerDto(assignment) : null;
}

export async function listBuildingManagerNominations(
  propertyId: string,
  userId: string,
) {
  if (!(await canReadProviderProperty(userId, propertyId))) {
    throw governanceErrors.notFound();
  }
  const assignments = await prisma.propertyBuildingManagerAssignment.findMany({
    where: { propertyId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      candidate: { select: { id: true, fullName: true } },
      votes: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          providerMembershipId: true,
          voterUserId: true,
          decision: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });
  return assignments.map(toBuildingManagerDto);
}

export async function voteForBuildingManager(
  voterUserId: string,
  propertyId: string,
  assignmentId: string,
  input: GovernanceVoteInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const voter = await requireActiveVerifiedMembership(
      voterUserId,
      propertyId,
      tx,
    );
    const assignment = await tx.propertyBuildingManagerAssignment.findFirst({
      where: {
        id: assignmentId,
        propertyId,
        status: {
          in: [
            BuildingManagerAssignmentStatus.PENDING_APPROVAL,
            BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
          ],
        },
      },
    });
    if (!assignment) throw governanceErrors.notFound();
    const existingVote = await tx.propertyBuildingManagerVote.findUnique({
      where: {
        assignmentId_providerMembershipId: {
          assignmentId,
          providerMembershipId: voter.id,
        },
      },
      select: { id: true },
    });
    if (existingVote) throw governanceErrors.conflict();
    await tx.propertyBuildingManagerVote.create({
      data: {
        assignmentId,
        providerMembershipId: voter.id,
        voterUserId,
        decision: input.decision,
        ...(input.decision === "REJECT" ? { reason: input.reason } : {}),
      },
    });
    if (input.decision === "REJECT") {
      const rejected = await tx.propertyBuildingManagerAssignment.update({
        where: { id: assignmentId },
        data: { status: BuildingManagerAssignmentStatus.REJECTED },
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.BUILDING_MANAGER_REJECTED,
        actorUserId: voterUserId,
        propertyId,
        entityType: "PropertyBuildingManagerAssignment",
        entityId: assignmentId,
        metadata: { reason: input.reason },
      });
      return toBuildingManagerDto(rejected);
    }

    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.BUILDING_MANAGER_APPROVED,
      actorUserId: voterUserId,
      propertyId,
      entityType: "PropertyBuildingManagerAssignment",
      entityId: assignmentId,
    });
    const [eligibleCount, approvalCount] = await Promise.all([
      repository.getActiveVerifiedProviderCount(propertyId, tx),
      tx.propertyBuildingManagerVote.count({
        where: {
          assignmentId,
          decision: GovernanceVoteDecision.APPROVE,
          providerMembership: activeVerifiedProviderWhere,
        },
      }),
    ]);
    if (eligibleCount > 0 && approvalCount === eligibleCount) {
      await endActiveBuildingManager(propertyId, voterUserId, tx);
      const activated = await tx.propertyBuildingManagerAssignment.update({
        where: { id: assignmentId },
        data: {
          status: BuildingManagerAssignmentStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.BUILDING_MANAGER_ACTIVATED,
        actorUserId: voterUserId,
        propertyId,
        entityType: "PropertyBuildingManagerAssignment",
        entityId: assignmentId,
      });
      return toBuildingManagerDto(activated);
    }
    return toBuildingManagerDto(assignment);
  });
}

function commonRuleUpdateData(input: Omit<CommonRulesInput, "version">) {
  const data: Prisma.PropertyUncheckedUpdateManyInput = {
    ...(input.visitorIdentificationRequired !== undefined
      ? { visitorIdentificationRequired: input.visitorIdentificationRequired }
      : {}),
    ...(input.vehicleHeightLimitCm !== undefined
      ? { vehicleHeightLimitCm: input.vehicleHeightLimitCm }
      : {}),
    ...(input.entryCutoffLocalTime !== undefined
      ? {
          entryCutoffLocalTime: input.entryCutoffLocalTime
            ? timeToDate(input.entryCutoffLocalTime)
            : null,
        }
      : {}),
    ...(input.generalParkingRules !== undefined
      ? { generalParkingRules: input.generalParkingRules }
      : {}),
    ...(input.commonSafetyRules !== undefined
      ? { commonSafetyRules: input.commonSafetyRules }
      : {}),
  };
  if (input.accessInstructions !== undefined) {
    if (input.accessInstructions === null) {
      Object.assign(data, {
        accessInstructionsCiphertext: null,
        accessInstructionsIv: null,
        accessInstructionsTag: null,
      });
    } else {
      const encrypted = encryptSensitiveText(input.accessInstructions);
      Object.assign(data, {
        accessInstructionsCiphertext: encrypted.ciphertext,
        accessInstructionsIv: encrypted.iv,
        accessInstructionsTag: encrypted.authTag,
      });
    }
  }
  return data;
}

export async function updateCommonRules(
  userId: string,
  propertyId: string,
  input: CommonRulesInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    if (!(await canManagePropertyCommonRules(userId, propertyId, tx))) {
      throw governanceErrors.commonAuthorityRequired();
    }
    const { version, ...rules } = input;
    const updated = await propertyRepository.updatePropertyConditionally(
      propertyId,
      version,
      commonRuleUpdateData(rules),
      tx,
    );
    if (updated.count !== 1) throw propertyErrors.staleVersion();
    const property = await propertyRepository.findPropertyById(propertyId, tx);
    if (!property) throw governanceErrors.notFound();
    return { propertyId, version: property.version };
  });
}

type TemporaryClosureChanges =
  | Omit<Extract<TemporaryClosureInput, { action: "CLOSE" }>, "version">
  | Omit<Extract<TemporaryClosureInput, { action: "REOPEN" }>, "version">;

function closureUpdateData(input: TemporaryClosureChanges) {
  if (input.action === "REOPEN") {
    return {
      status: PropertyStatus.ACTIVE,
      temporaryClosureReason: null,
      temporaryClosedAt: null,
      temporaryClosedUntil: null,
    } satisfies Prisma.PropertyUncheckedUpdateManyInput;
  }
  return {
    status: PropertyStatus.TEMPORARILY_CLOSED,
    temporaryClosureReason: input.reason,
    temporaryClosedAt: new Date(),
    temporaryClosedUntil: input.until ? new Date(input.until) : null,
  } satisfies Prisma.PropertyUncheckedUpdateManyInput;
}

export async function updateTemporaryClosure(
  userId: string,
  propertyId: string,
  input: TemporaryClosureInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const property = await propertyRepository.findPropertyById(propertyId, tx);
    if (
      !property ||
      property.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw governanceErrors.notFound();
    }
    if (
      (input.action === "CLOSE" && property.status !== PropertyStatus.ACTIVE) ||
      (input.action === "REOPEN" &&
        property.status !== PropertyStatus.TEMPORARILY_CLOSED)
    ) {
      throw governanceErrors.conflict();
    }
    if (!(await canManagePropertyCommonRules(userId, propertyId, tx))) {
      throw governanceErrors.commonAuthorityRequired();
    }
    const { version } = input;
    const updated = await propertyRepository.updatePropertyConditionally(
      propertyId,
      version,
      closureUpdateData(input),
      tx,
    );
    if (updated.count !== 1) throw propertyErrors.staleVersion();
    const result = await propertyRepository.findPropertyById(propertyId, tx);
    if (!result) throw governanceErrors.notFound();
    return { propertyId, status: result.status, version: result.version };
  });
}

type ProtectedProposalChanges = Record<string, unknown> & {
  accessInstructionsProtected?: {
    ciphertext: string;
    iv: string;
    authTag: string;
  };
  exactAddressProtected?: {
    ciphertext: string;
    iv: string;
    authTag: string;
  };
};

function protectProposalChanges(changes: Record<string, unknown>) {
  const protectedChanges: ProtectedProposalChanges = { ...changes };
  if (typeof changes.accessInstructions === "string") {
    const encrypted = encryptSensitiveText(changes.accessInstructions);
    delete protectedChanges.accessInstructions;
    protectedChanges.accessInstructionsProtected = encrypted;
  }
  if (typeof changes.exactAddress === "string") {
    const encrypted = encryptSensitiveText(changes.exactAddress);
    delete protectedChanges.exactAddress;
    protectedChanges.exactAddressProtected = encrypted;
  }
  return protectedChanges;
}

function revealProposalChanges(value: Prisma.JsonValue) {
  const changes = { ...(value as ProtectedProposalChanges) };
  if (changes.accessInstructionsProtected) {
    const protectedValue = changes.accessInstructionsProtected;
    changes.accessInstructions = decryptSensitiveText(
      protectedValue.ciphertext,
      protectedValue.iv,
      protectedValue.authTag,
    );
    delete changes.accessInstructionsProtected;
  }
  if (changes.exactAddressProtected) {
    const protectedValue = changes.exactAddressProtected;
    changes.exactAddress = decryptSensitiveText(
      protectedValue.ciphertext,
      protectedValue.iv,
      protectedValue.authTag,
    );
    delete changes.exactAddressProtected;
  }
  return changes;
}

function identityLocationUpdateData(changes: Record<string, unknown>) {
  const data: Prisma.PropertyUncheckedUpdateManyInput = {
    ...(typeof changes.name === "string"
      ? {
          name: changes.name,
          normalizedName: normalizePropertyName(changes.name),
        }
      : {}),
    ...(typeof changes.publicArea === "string"
      ? { publicArea: changes.publicArea }
      : {}),
    ...(typeof changes.approximateAddress === "string"
      ? { approximateAddress: changes.approximateAddress }
      : {}),
    ...(typeof changes.latitude === "number"
      ? { latitude: changes.latitude }
      : {}),
    ...(typeof changes.longitude === "number"
      ? { longitude: changes.longitude }
      : {}),
    ...(changes.entranceLatitude !== undefined
      ? { entranceLatitude: changes.entranceLatitude as number | null }
      : {}),
    ...(changes.entranceLongitude !== undefined
      ? { entranceLongitude: changes.entranceLongitude as number | null }
      : {}),
    verificationStatus: VerificationStatus.PENDING,
    status: PropertyStatus.INACTIVE,
    verifiedByAdminId: null,
    verifiedAt: null,
    rejectionReason: null,
  };
  if (typeof changes.exactAddress === "string") {
    const encrypted = encryptSensitiveText(changes.exactAddress);
    Object.assign(data, {
      exactAddressCiphertext: encrypted.ciphertext,
      exactAddressIv: encrypted.iv,
      exactAddressTag: encrypted.authTag,
      addressFingerprint: fingerprintPropertyAddress(changes.exactAddress),
    });
  }
  return data;
}

export async function createPropertyChangeProposal(
  proposerUserId: string,
  propertyId: string,
  input: PropertyChangeProposalInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const membership = await requireActiveVerifiedMembership(
      proposerUserId,
      propertyId,
      tx,
    );
    const property = await propertyRepository.findPropertyById(propertyId, tx);
    if (!property) throw governanceErrors.notFound();
    if (property.version !== input.baseVersion)
      throw propertyErrors.staleVersion();
    if (
      (await getPropertyGovernanceMode(propertyId, tx)) !== "MULTI_PROVIDER"
    ) {
      throw governanceErrors.conflict();
    }
    const protectedChanges = protectProposalChanges(input.changes);
    const proposal = await tx.propertyChangeProposal.create({
      data: {
        propertyId,
        proposedByUserId: proposerUserId,
        basePropertyVersion: input.baseVersion,
        changeType: PropertyChangeType[input.changeType],
        proposedChanges: protectedChanges as Prisma.InputJsonValue,
        votes: {
          create: {
            providerMembershipId: membership.id,
            voterUserId: proposerUserId,
            decision: GovernanceVoteDecision.APPROVE,
          },
        },
      },
    });
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROPERTY_CHANGE_PROPOSED,
      actorUserId: proposerUserId,
      propertyId,
      entityType: "PropertyChangeProposal",
      entityId: proposal.id,
      metadata: {
        changeType: input.changeType,
        baseVersion: input.baseVersion,
      },
    });
    return toPropertyChangeProposalDto(proposal, input.changes);
  });
}

export async function listPropertyChangeProposals(
  userId: string,
  propertyId: string,
) {
  const membership = await repository.findActiveVerifiedProviderMembership(
    userId,
    propertyId,
  );
  if (!membership) throw governanceErrors.notFound();
  const proposals = await prisma.propertyChangeProposal.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    include: {
      votes: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          providerMembershipId: true,
          voterUserId: true,
          decision: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });
  return proposals.map((proposal) =>
    toPropertyChangeProposalDto(
      proposal,
      revealProposalChanges(proposal.proposedChanges),
    ),
  );
}

export async function getPropertyChangeProposal(
  userId: string,
  propertyId: string,
  proposalId: string,
) {
  const membership = await repository.findActiveVerifiedProviderMembership(
    userId,
    propertyId,
  );
  if (!membership) throw governanceErrors.notFound();
  const proposal = await prisma.propertyChangeProposal.findFirst({
    where: { id: proposalId, propertyId },
    include: {
      votes: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          providerMembershipId: true,
          voterUserId: true,
          decision: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });
  if (!proposal) throw governanceErrors.notFound();
  return toPropertyChangeProposalDto(
    proposal,
    revealProposalChanges(proposal.proposedChanges),
  );
}

async function applyApprovedProposal(
  proposal: {
    id: string;
    propertyId: string;
    basePropertyVersion: number;
    changeType: PropertyChangeType;
    proposedChanges: Prisma.JsonValue;
  },
  actorUserId: string,
  tx: Prisma.TransactionClient,
) {
  const changes = revealProposalChanges(proposal.proposedChanges);
  const updateData =
    proposal.changeType === PropertyChangeType.COMMON_RULES
      ? commonRuleUpdateData(changes as Omit<CommonRulesInput, "version">)
      : proposal.changeType === PropertyChangeType.TEMPORARY_CLOSURE
        ? closureUpdateData(changes as TemporaryClosureChanges)
        : identityLocationUpdateData(changes);
  const updated = await propertyRepository.updatePropertyConditionally(
    proposal.propertyId,
    proposal.basePropertyVersion,
    updateData,
    tx,
  );
  if (updated.count !== 1) {
    await tx.propertyChangeProposal.update({
      where: { id: proposal.id },
      data: {
        status: PropertyChangeProposalStatus.STALE,
        resolvedAt: new Date(),
      },
    });
    return PropertyChangeProposalStatus.STALE;
  }
  await tx.propertyChangeProposal.update({
    where: { id: proposal.id },
    data: {
      status: PropertyChangeProposalStatus.APPLIED,
      resolvedAt: new Date(),
      appliedAt: new Date(),
    },
  });
  await createDomainAuditEvent(tx, {
    eventType: DomainAuditEventType.PROPERTY_CHANGE_APPLIED,
    actorUserId,
    propertyId: proposal.propertyId,
    entityType: "PropertyChangeProposal",
    entityId: proposal.id,
  });
  return PropertyChangeProposalStatus.APPLIED;
}

export async function voteOnPropertyChangeProposal(
  voterUserId: string,
  propertyId: string,
  proposalId: string,
  input: GovernanceVoteInput,
) {
  return prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const membership = await requireActiveVerifiedMembership(
      voterUserId,
      propertyId,
      tx,
    );
    const proposal = await tx.propertyChangeProposal.findFirst({
      where: {
        id: proposalId,
        propertyId,
        status: PropertyChangeProposalStatus.PENDING_APPROVAL,
      },
    });
    if (!proposal) throw governanceErrors.notFound();
    const existingVote = await tx.propertyChangeVote.findUnique({
      where: {
        proposalId_providerMembershipId: {
          proposalId,
          providerMembershipId: membership.id,
        },
      },
      select: { id: true },
    });
    if (existingVote) throw governanceErrors.conflict();
    await tx.propertyChangeVote.create({
      data: {
        proposalId,
        providerMembershipId: membership.id,
        voterUserId,
        decision: GovernanceVoteDecision[input.decision],
        ...(input.decision === "REJECT" ? { reason: input.reason } : {}),
      },
    });
    if (input.decision === "REJECT") {
      await tx.propertyChangeProposal.update({
        where: { id: proposalId },
        data: {
          status: PropertyChangeProposalStatus.REJECTED,
          resolvedAt: new Date(),
        },
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PROPERTY_CHANGE_REJECTED,
        actorUserId: voterUserId,
        propertyId,
        entityType: "PropertyChangeProposal",
        entityId: proposalId,
        metadata: { reason: input.reason },
      });
      return { proposalId, status: PropertyChangeProposalStatus.REJECTED };
    }
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROPERTY_CHANGE_APPROVED,
      actorUserId: voterUserId,
      propertyId,
      entityType: "PropertyChangeProposal",
      entityId: proposalId,
    });
    const [eligibleCount, approvalCount] = await Promise.all([
      repository.getActiveVerifiedProviderCount(propertyId, tx),
      tx.propertyChangeVote.count({
        where: {
          proposalId,
          decision: GovernanceVoteDecision.APPROVE,
          providerMembership: activeVerifiedProviderWhere,
        },
      }),
    ]);
    if (eligibleCount > 0 && approvalCount === eligibleCount) {
      const status = await applyApprovedProposal(proposal, voterUserId, tx);
      return { proposalId, status };
    }
    return {
      proposalId,
      status: PropertyChangeProposalStatus.PENDING_APPROVAL,
    };
  });
}
