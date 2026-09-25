import {
  BuildingManagerAssignmentStatus,
  ManagerDelegationPermission,
  ManagerDelegationStatus,
  Prisma,
  PropertyProviderStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

export type GovernanceClient = Pick<
  Prisma.TransactionClient,
  | "property"
  | "propertyProvider"
  | "propertyBuildingManagerAssignment"
  | "providerManagerDelegation"
  | "user"
>;

export const activeVerifiedProviderWhere = {
  status: PropertyProviderStatus.ACTIVE,
  verificationStatus: VerificationStatus.VERIFIED,
} as const;

export function findActiveVerifiedProviderMembership(
  providerUserId: string,
  propertyId: string,
  db: GovernanceClient = prisma,
) {
  return db.propertyProvider.findFirst({
    where: { propertyId, providerUserId, ...activeVerifiedProviderWhere },
  });
}

export function findActiveProviderMembership(
  providerUserId: string,
  propertyId: string,
  db: GovernanceClient = prisma,
) {
  return db.propertyProvider.findFirst({
    where: {
      propertyId,
      providerUserId,
      status: PropertyProviderStatus.ACTIVE,
    },
  });
}

export function findProvisionalProviderMembership(
  providerUserId: string,
  propertyId: string,
  db: GovernanceClient = prisma,
) {
  return db.propertyProvider.findFirst({
    where: {
      propertyId,
      providerUserId,
      status: PropertyProviderStatus.ACTIVE,
      verificationStatus: {
        in: [
          VerificationStatus.DRAFT,
          VerificationStatus.PENDING,
          VerificationStatus.REJECTED,
        ],
      },
      property: {
        deletedAt: null,
        archivedAt: null,
        verificationStatus: {
          in: [
            VerificationStatus.DRAFT,
            VerificationStatus.PENDING,
            VerificationStatus.REJECTED,
          ],
        },
      },
    },
  });
}

export function getActiveVerifiedProviderCount(
  propertyId: string,
  db: GovernanceClient = prisma,
) {
  return db.propertyProvider.count({
    where: { propertyId, ...activeVerifiedProviderWhere },
  });
}

export function findActiveBuildingManager(
  propertyId: string,
  db: GovernanceClient = prisma,
) {
  return db.propertyBuildingManagerAssignment.findFirst({
    where: { propertyId, status: BuildingManagerAssignmentStatus.ACTIVE },
  });
}

export function findLiveManagerDelegation(
  managerUserId: string,
  propertyId: string,
  permission: ManagerDelegationPermission,
  providerMembershipId?: string,
  db: GovernanceClient = prisma,
) {
  const now = new Date();
  return db.providerManagerDelegation.findFirst({
    where: {
      managerUserId,
      propertyId,
      ...(providerMembershipId
        ? { grantorProviderMembershipId: providerMembershipId }
        : {}),
      status: ManagerDelegationStatus.ACTIVE,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: now } }] }],
      grantorProviderMembership: activeVerifiedProviderWhere,
      permissions: { some: { permission } },
    },
  });
}
