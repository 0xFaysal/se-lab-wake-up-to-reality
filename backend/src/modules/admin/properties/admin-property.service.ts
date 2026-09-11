import {
  BuildingManagerAssignmentStatus,
  DomainAuditEventType,
  Prisma,
  PropertyChangeProposalStatus,
  PropertyProviderStatus,
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../../generated/prisma/client.js";
import { SensitiveDataEncryptionError } from "../../../common/security/encryption.js";
import { logger } from "../../../config/logger.js";
import { prisma } from "../../../config/prisma.js";
import { propertyErrors } from "../../properties/property.errors.js";
import * as propertyRepository from "../../properties/property.repository.js";
import { decryptPropertySensitiveData } from "../../properties/property-sensitive-data.js";
import { createDomainAuditEvent } from "../../property-governance/domain-audit.js";
import { adminPropertyErrors } from "./admin-property.errors.js";
import {
  toAdminPropertyDetail,
  toAdminPropertySummary,
  toPropertyVerificationResult,
} from "./admin-property.mapper.js";
import * as adminPropertyRepository from "./admin-property.repository.js";
import type { AdminPropertyDetailRecord } from "./admin-property.repository.js";
import type {
  PendingAdminPropertiesQuery,
  VerifyAdminPropertyInput,
  MergeAdminPropertiesInput,
} from "./admin-property.types.js";

function throwAdminDecryptionFailure(
  error: unknown,
  propertyId: string,
): never {
  if (error instanceof SensitiveDataEncryptionError) {
    logger.error(
      { propertyId, errorType: error.name },
      "Admin Property review data could not be decrypted",
    );
    throw propertyErrors.encryptionFailed();
  }
  throw error;
}

export async function listPendingProperties(
  query: PendingAdminPropertiesQuery,
) {
  const skip = (query.page - 1) * query.limit;
  const [total, properties] = await prisma.$transaction([
    adminPropertyRepository.countPendingProperties(),
    adminPropertyRepository.findPendingProperties(skip, query.limit),
  ]);
  return {
    properties: properties.map(toAdminPropertySummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getAdminProperty(propertyId: string) {
  const property =
    await adminPropertyRepository.findAdminPropertyById(propertyId);
  if (!property) throw propertyErrors.notFound();
  try {
    return toAdminPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
    );
  } catch (error) {
    throwAdminDecryptionFailure(error, propertyId);
  }
}

function propertyMeetsApprovalRequirements(
  property: AdminPropertyDetailRecord,
): boolean {
  const latitude = property.latitude.toNumber();
  const longitude = property.longitude.toNumber();
  return (
    property.exactAddressCiphertext.length > 0 &&
    Boolean(property.exactAddressIv) &&
    Boolean(property.exactAddressTag) &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    property.images.length > 0 &&
    property.createdBy.status === UserStatus.ACTIVE &&
    property.createdBy.deletedAt === null &&
    property.createdBy.emailVerifiedAt !== null &&
    !property.createdBy.mustChangePassword &&
    property.createdBy.roles.some(
      (role) => role.role === UserRoleType.PROVIDER,
    )
  );
}

export async function verifyProperty(
  adminUserId: string,
  propertyId: string,
  input: VerifyAdminPropertyInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const property = await adminPropertyRepository.findAdminPropertyById(
        propertyId,
        tx,
      );
      if (!property) throw propertyErrors.notFound();

      if (
        property.verificationStatus === VerificationStatus.VERIFIED &&
        input.decision === "APPROVE"
      ) {
        throw adminPropertyErrors.alreadyVerified();
      }
      if (property.verificationStatus !== VerificationStatus.PENDING) {
        throw adminPropertyErrors.conflict();
      }
      if (input.decision === "APPROVE") {
        decryptPropertySensitiveData(property);
        if (!propertyMeetsApprovalRequirements(property)) {
          throw adminPropertyErrors.requirementsNotMet();
        }
      }

      const reviewedAt = new Date();
      const updated =
        await adminPropertyRepository.updatePendingPropertyVerification(
          propertyId,
          input.decision === "APPROVE"
            ? {
                verificationStatus: VerificationStatus.VERIFIED,
                status: PropertyStatus.ACTIVE,
                verifiedByAdminId: adminUserId,
                verifiedAt: reviewedAt,
                rejectionReason: null,
              }
            : {
                verificationStatus: VerificationStatus.REJECTED,
                status: PropertyStatus.INACTIVE,
                verifiedByAdminId: adminUserId,
                verifiedAt: null,
                rejectionReason: input.reason,
              },
          tx,
        );
      if (updated.count !== 1) throw adminPropertyErrors.conflict();

      await tx.propertyProvider.updateMany({
        where: {
          propertyId,
          providerUserId: property.createdByUserId,
        },
        data:
          input.decision === "APPROVE"
            ? {
                verificationStatus: VerificationStatus.VERIFIED,
                verifiedByAdminId: adminUserId,
                verifiedAt: reviewedAt,
                rejectionReason: null,
              }
            : {
                verificationStatus: VerificationStatus.REJECTED,
                verifiedByAdminId: adminUserId,
                verifiedAt: null,
                rejectionReason: input.reason,
              },
      });

      const result = await adminPropertyRepository.findAdminPropertyById(
        propertyId,
        tx,
      );
      if (!result) throw adminPropertyErrors.conflict();
      return toPropertyVerificationResult(result);
    });
  } catch (error) {
    throwAdminDecryptionFailure(error, propertyId);
  }
}

export async function mergeDuplicateProperties(
  adminUserId: string,
  input: MergeAdminPropertiesInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
    const ids = [input.canonicalPropertyId, input.duplicatePropertyId].sort();
    await propertyRepository.lockPropertyForMutation(ids[0]!, tx);
    await propertyRepository.lockPropertyForMutation(ids[1]!, tx);

    const [canonical, duplicate] = await Promise.all([
      tx.property.findFirst({
        where: { id: input.canonicalPropertyId, deletedAt: null, archivedAt: null },
        include: {
          providerMemberships: { where: { status: { not: PropertyProviderStatus.ENDED } }, select: { providerUserId: true } },
          guardMemberships: { select: { guardUserId: true } },
        },
      }),
      tx.property.findFirst({
        where: { id: input.duplicatePropertyId, deletedAt: null, archivedAt: null },
        include: {
          providerMemberships: { where: { status: { not: PropertyProviderStatus.ENDED } }, select: { providerUserId: true } },
          guardMemberships: { select: { guardUserId: true } },
        },
      }),
    ]);
    if (!canonical || !duplicate) throw propertyErrors.notFound();
    if (canonical.version !== input.canonicalVersion || duplicate.version !== input.duplicateVersion) {
      throw adminPropertyErrors.mergeConflict("A Property changed while the merge was being reviewed");
    }

    const canonicalProviders = new Set(canonical.providerMemberships.map((item) => item.providerUserId));
    if (duplicate.providerMemberships.some((item) => canonicalProviders.has(item.providerUserId))) {
      throw adminPropertyErrors.mergeConflict("The same provider has current memberships in both Properties");
    }
    const canonicalGuards = new Set(canonical.guardMemberships.map((item) => item.guardUserId));
    if (duplicate.guardMemberships.some((item) => canonicalGuards.has(item.guardUserId))) {
      throw adminPropertyErrors.mergeConflict("The same Guard has memberships in both Properties");
    }
    const [canonicalSpotCodes, duplicateSpotCodes] = await Promise.all([
      tx.parkingSpot.findMany({ where: { propertyId: canonical.id }, select: { spotCode: true } }),
      tx.parkingSpot.findMany({ where: { propertyId: duplicate.id }, select: { spotCode: true } }),
    ]);
    const canonicalSpotCodeSet = new Set(canonicalSpotCodes.map((spot) => spot.spotCode));
    if (duplicateSpotCodes.some((spot) => canonicalSpotCodeSet.has(spot.spotCode))) {
      throw adminPropertyErrors.mergeConflict("Parking spot codes overlap and require manual resolution");
    }

    const now = new Date();
    const activeDuplicateManagers = await tx.propertyBuildingManagerAssignment.findMany({
      where: { propertyId: duplicate.id, status: BuildingManagerAssignmentStatus.ACTIVE },
      select: { id: true },
    });
    await tx.propertyBuildingManagerAssignment.updateMany({
      where: {
        propertyId: duplicate.id,
        status: { in: [BuildingManagerAssignmentStatus.ACTIVE, BuildingManagerAssignmentStatus.PENDING_APPROVAL, BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION] },
      },
      data: { status: BuildingManagerAssignmentStatus.ENDED, endedAt: now },
    });
    for (const assignment of activeDuplicateManagers) {
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.BUILDING_MANAGER_ENDED,
        actorUserId: adminUserId,
        propertyId: duplicate.id,
        entityType: "PropertyBuildingManagerAssignment",
        entityId: assignment.id,
        metadata: { reason: "PROPERTY_MERGE" },
      });
    }
    await tx.propertyChangeProposal.updateMany({
      where: { propertyId: duplicate.id, status: PropertyChangeProposalStatus.PENDING_APPROVAL },
      data: { status: PropertyChangeProposalStatus.STALE, resolvedAt: now },
    });

    await tx.propertyProvider.updateMany({ where: { propertyId: duplicate.id }, data: { propertyId: canonical.id } });
    await tx.propertyGuardMembership.updateMany({ where: { propertyId: duplicate.id }, data: { propertyId: canonical.id } });
    await tx.providerManagerDelegation.updateMany({ where: { propertyId: duplicate.id }, data: { propertyId: canonical.id } });
    await tx.parkingSpot.updateMany({ where: { propertyId: duplicate.id }, data: { propertyId: canonical.id } });
    const [canonicalImageCount, canonicalCover] = await Promise.all([
      tx.propertyImage.count({ where: { propertyId: canonical.id } }),
      tx.propertyImage.findFirst({ where: { propertyId: canonical.id, isCover: true }, select: { id: true } }),
    ]);
    if (canonicalCover) {
      await tx.propertyImage.updateMany({
        where: { propertyId: duplicate.id, isCover: true },
        data: { isCover: false },
      });
    }
    await tx.propertyImage.updateMany({
      where: { propertyId: duplicate.id },
      data: { propertyId: canonical.id, sortOrder: { increment: canonicalImageCount } },
    });

    const canonicalUpdated = await tx.property.updateMany({
      where: { id: canonical.id, version: input.canonicalVersion, archivedAt: null },
      data: { version: { increment: 1 } },
    });
    const duplicateUpdated = await tx.property.updateMany({
      where: { id: duplicate.id, version: input.duplicateVersion, archivedAt: null },
      data: {
        canonicalPropertyId: canonical.id,
        archivedAt: now,
        status: PropertyStatus.INACTIVE,
        version: { increment: 1 },
      },
    });
    if (canonicalUpdated.count !== 1 || duplicateUpdated.count !== 1) {
      throw adminPropertyErrors.mergeConflict("A Property changed while the merge was being applied");
    }

    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.PROPERTY_MERGED,
      actorUserId: adminUserId,
      propertyId: canonical.id,
      entityType: "Property",
      entityId: duplicate.id,
      metadata: { canonicalPropertyId: canonical.id, reason: input.reason },
    });
    return {
      canonicalPropertyId: canonical.id,
      archivedDuplicatePropertyId: duplicate.id,
      mergedAt: now,
    };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      throw adminPropertyErrors.mergeConflict("The merge conflicted with another database change");
    }
    throw error;
  }
}
