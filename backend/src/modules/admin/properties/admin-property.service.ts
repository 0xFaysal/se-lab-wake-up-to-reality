import {
  BuildingManagerAssignmentStatus,
  BookingStatus,
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
    const detail = toAdminPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
    );
    const [riskFlags, adminNotes, auditTimeline, duplicateCandidates, recentBookings, governanceHistory, resources, rights, listings, guards, buildingManagers] = await Promise.all([
      prisma.riskFlag.findMany({ where: { targetType: "PROPERTY", targetId: propertyId }, orderBy: { createdAt: "desc" }, include: { createdByAdmin: { select: { id: true, fullName: true } } } }),
      prisma.adminNote.findMany({ where: { subjectType: "PROPERTY", subjectId: propertyId }, orderBy: { createdAt: "desc" }, include: { authorAdmin: { select: { id: true, fullName: true } } } }),
      prisma.domainAuditEvent.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, eventType: true, entityType: true, entityId: true, requestId: true, metadata: true, createdAt: true, actor: { select: { id: true, fullName: true } } } }),
      prisma.property.findMany({ where: { id: { not: propertyId }, deletedAt: null, canonicalPropertyId: null, OR: [ ...(property.addressFingerprint ? [{ addressFingerprint: property.addressFingerprint }] : []), { normalizedName: property.normalizedName, publicArea: property.publicArea } ] }, take: 20, select: { id: true, name: true, publicArea: true, approximateAddress: true, verificationStatus: true, status: true, version: true, createdAt: true } }),
      prisma.booking.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, bookingCode: true, status: true, startAt: true, scheduledEndAt: true, driver: { select: { id: true, fullName: true } }, provider: { select: { id: true, fullName: true } } } }),
      prisma.propertyChangeProposal.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" }, take: 50, include: { proposedBy: { select: { id: true, fullName: true } }, votes: { select: { decision: true, reason: true, createdAt: true, voter: { select: { id: true, fullName: true } } } } } }),
      prisma.parkingSpot.findMany({ where: { propertyId, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, displayName: true, spotCode: true, resourceType: true, floor: true, zone: true, capacity: true, status: true, supportedVehicleTypes: true, units: { where: { deletedAt: null }, orderBy: { normalizedSpotCode: "asc" }, select: { id: true, spotCode: true, displayName: true, status: true } }, _count: { select: { parkingRights: true, listings: true, bookings: true, units: true } } } }),
      prisma.parkingRight.findMany({ where: { parkingSpot: { propertyId } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, rightType: true, quantity: true, status: true, canUse: true, canList: true, canSetPrice: true, canManageBookings: true, validFrom: true, validUntil: true, createdAt: true, holder: { select: { id: true, fullName: true } }, parkingSpot: { select: { id: true, displayName: true, spotCode: true } } } }),
      prisma.parkingListing.findMany({ where: { parkingSpot: { propertyId } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, title: true, status: true, pricePerHourPaisa: true, createdAt: true, provider: { select: { id: true, fullName: true } }, parkingSpot: { select: { id: true, displayName: true, spotCode: true } } } }),
      prisma.propertyGuardMembership.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, status: true, invitedAt: true, joinedAt: true, endedAt: true, guard: { select: { id: true, fullName: true, email: true, phone: true, status: true } }, assignments: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, status: true, shiftStart: true, shiftEnd: true, assignedAt: true, endedAt: true } } } }),
      prisma.propertyBuildingManagerAssignment.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, status: true, nominatedAt: true, activatedAt: true, endedAt: true, candidate: { select: { id: true, fullName: true, email: true, phone: true, status: true } }, nominatedBy: { select: { id: true, fullName: true } }, votes: { select: { decision: true, reason: true, createdAt: true, voter: { select: { id: true, fullName: true } } } } } }),
    ]);
    return { ...detail, riskFlags, adminNotes, auditTimeline, duplicateCandidates, recentBookings, governanceHistory, resources, rights, listings: listings.map((listing) => ({ ...listing, pricePerHourPaisa: Number(listing.pricePerHourPaisa) })), guards, buildingManagers };
  } catch (error) {
    throwAdminDecryptionFailure(error, propertyId);
  }
}

function propertyMeetsApprovalRequirements(
  property: AdminPropertyDetailRecord,
): boolean {
  const latitude = property.latitude.toNumber();
  const longitude = property.longitude.toNumber();
  const hasEligibleProvider = property.providerMemberships.some(
    (membership) =>
      membership.status === PropertyProviderStatus.ACTIVE &&
      membership.provider.status === UserStatus.ACTIVE &&
      membership.provider.deletedAt === null &&
      membership.provider.emailVerifiedAt !== null &&
      !membership.provider.mustChangePassword &&
      membership.provider.roles.some(
        (role) => role.role === UserRoleType.PROVIDER,
      ),
  );
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
    hasEligibleProvider
  );
}

export async function verifyProperty(
  adminUserId: string,
  propertyId: string,
  input: VerifyAdminPropertyInput,
  requestId?: string,
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
      const hasVerifiedProvider = property.providerMemberships.some(
        (membership) =>
          membership.status === PropertyProviderStatus.ACTIVE &&
          membership.verificationStatus === VerificationStatus.VERIFIED,
      );
      const provisionalMembership = hasVerifiedProvider
        ? null
        : property.providerMemberships.find(
            (membership) =>
              membership.status === PropertyProviderStatus.ACTIVE,
          ) ?? null;
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

      if (provisionalMembership) {
        await tx.propertyProvider.update({
          where: { id: provisionalMembership.id },
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
      }

      await createDomainAuditEvent(tx, {
        eventType: input.decision === "APPROVE"
          ? DomainAuditEventType.PROPERTY_APPROVED
          : DomainAuditEventType.PROPERTY_REJECTED,
        actorUserId: adminUserId,
        propertyId,
        entityType: "Property",
        entityId: propertyId,
        metadata: {
          decision: input.decision,
          reason: input.decision === "REJECT" ? input.reason : null,
        },
        requestId,
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
  requestId?: string,
) {
  if (input.canonicalPropertyId === input.duplicatePropertyId) {
    throw adminPropertyErrors.mergeConflict(
      "Canonical and duplicate Property must be different",
    );
  }
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
      tx.parkingResourceUnit.findMany({ where: { parkingSpot: { propertyId: canonical.id }, deletedAt: null }, select: { normalizedSpotCode: true } }),
      tx.parkingResourceUnit.findMany({ where: { parkingSpot: { propertyId: duplicate.id }, deletedAt: null }, select: { normalizedSpotCode: true } }),
    ]);
    const canonicalSpotCodeSet = new Set(canonicalSpotCodes.map((spot) => spot.normalizedSpotCode));
    if (duplicateSpotCodes.some((spot) => canonicalSpotCodeSet.has(spot.normalizedSpotCode))) {
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
      requestId,
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

export async function previewPropertyMerge(canonicalPropertyId: string, duplicatePropertyId: string) {
  if (canonicalPropertyId === duplicatePropertyId) throw adminPropertyErrors.mergeConflict("Canonical and duplicate Property must be different");
  const activeBookingStatuses = [BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKOUT_REQUESTED, BookingStatus.PAYMENT_DUE, BookingStatus.DISPUTED];
  const [canonical, duplicate] = await Promise.all([
    prisma.property.findFirst({ where: { id: canonicalPropertyId, deletedAt: null, archivedAt: null }, select: { id: true, name: true, publicArea: true, approximateAddress: true, verificationStatus: true, status: true, version: true, _count: { select: { providerMemberships: true, parkingSpots: true, images: true, guardMemberships: true, managerDelegations: true, bookings: true } } } }),
    prisma.property.findFirst({ where: { id: duplicatePropertyId, deletedAt: null, archivedAt: null }, select: { id: true, name: true, publicArea: true, approximateAddress: true, verificationStatus: true, status: true, version: true, _count: { select: { providerMemberships: true, parkingSpots: true, images: true, guardMemberships: true, managerDelegations: true, bookings: true } } } }),
  ]);
  if (!canonical || !duplicate) throw propertyErrors.notFound();
  const [rights, listings, activeBookings] = await Promise.all([
    prisma.parkingRight.count({ where: { parkingSpot: { propertyId: duplicatePropertyId } } }),
    prisma.parkingListing.count({ where: { parkingSpot: { propertyId: duplicatePropertyId } } }),
    prisma.booking.count({ where: { propertyId: duplicatePropertyId, status: { in: activeBookingStatuses } } }),
  ]);
  return { canonical, duplicate, entitiesToMigrate: { providers: duplicate._count.providerMemberships, resources: duplicate._count.parkingSpots, rights, listings, guards: duplicate._count.guardMemberships, delegations: duplicate._count.managerDelegations, images: duplicate._count.images, activeOrFutureBookingReferences: activeBookings }, warnings: activeBookings ? ["Active or future bookings retain their immutable original Property reference while the duplicate points to the canonical Property."] : [] };
}
