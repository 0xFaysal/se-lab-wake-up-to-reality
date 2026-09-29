import { createHash, randomBytes, randomUUID } from "node:crypto";
import { basename } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import {
  BookingStatus,
  DisputeStatus,
  DomainAuditEventType,
  ManagerDelegationPermission,
  OvertimeBillingMode,
  ParkingAllocationStatus,
  ParkingListingStatus,
  ParkingResourceType,
  ParkingRightAmendmentStatus,
  ParkingRightClaimBatchStatus,
  ParkingRightDocumentCategory,
  ParkingRightStatus,
  ParkingRightType,
  ParkingSpotStatus,
  PaymentStatus,
  PayoutMethodStatus,
  PayoutMethodType,
  PayoutStatus,
  PropertyStatus,
  RefundStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
  type Prisma,
  type VehicleType,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";
import { encryptSensitiveText } from "../../common/security/encryption.js";
import { decryptPropertySensitiveData } from "../properties/property-sensitive-data.js";
import { getRightDocumentStorage } from "../../common/uploads/right-document-storage.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import {
  activeRightWhere,
  isGuardAuthorizedForBooking,
  listProviderAccessScopes,
  lockEntity,
  releaseExpiredHolds,
  resolveProviderAuthority,
  type MarketplaceDb,
} from "./marketplace.repository.js";
import { resolvePlatformFee } from "./platform-fee.service.js";
import {
  PAYMENT_SESSION_TTL_MS,
  requestAdminRefund,
} from "../payments/payment.service.js";
import {
  getOrCreateWallet,
  postSuccessfulBookingPayment,
  releasePaymentWalletHolds,
} from "../payments/payment-ledger.service.js";
import { notifyUser } from "../../common/realtime/realtime.js";
import {
  calculateCancellation,
  calculateOvertime,
  calculateParkingCharge,
  calculateSettlement,
  calculateWalletSplit,
} from "../../common/finance/booking-finance.js";

const DHAKA_TIME_ZONE = "Asia/Dhaka";
const QUOTE_TTL_MS = 5 * 60 * 1000;
const HOLD_TTL_MS = 5 * 60 * 1000;
const PAYMENT_CALLBACK_GRACE_MS = 5 * 60 * 1000;

type JsonObject = Record<string, unknown>;
type AuditMetadata = Record<string, string | number | boolean | null>;

function fail(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): never {
  throw new AppError({
    message,
    statusCode,
    code,
    ...(details === undefined ? {} : { details }),
  });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as T;
}

function normalizeSpotCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

function timeValue(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function dhakaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    dayOfWeek: weekdayMap[get("weekday")] ?? -1,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function audit(
  tx: MarketplaceDb,
  eventType: DomainAuditEventType,
  actorUserId: string,
  propertyId: string | undefined,
  entityType: string,
  entityId: string,
  metadata?: AuditMetadata,
) {
  await createDomainAuditEvent(tx, {
    eventType,
    actorUserId,
    ...(propertyId ? { propertyId } : {}),
    entityType,
    entityId,
    ...(metadata ? { metadata } : {}),
  });
}

async function notification(
  tx: MarketplaceDb,
  input: {
    userId: string;
    type:
      | "BOOKING_CONFIRMED"
      | "BOOKING_CANCELLED"
      | "PAYMENT_SUCCEEDED"
      | "REFUND_PROCESSED"
      | "PAYOUT_UPDATED"
      | "DISPUTE_UPDATE"
      | "PROPERTY_GOVERNANCE";
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    idempotencyKey: string;
  },
) {
  await tx.notification.upsert({
    where: {
      userId_idempotencyKey: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    update: {},
    create: input,
  });
}

async function requireEligibleProperty(
  propertyId: string,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  const property = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, canonicalPropertyId: null },
  });
  if (!property) fail(404, "PROPERTY_NOT_FOUND", "Property was not found");
  if (
    property.status !== PropertyStatus.ACTIVE ||
    property.verificationStatus !== VerificationStatus.VERIFIED
  ) {
    fail(
      409,
      "PROPERTY_NOT_MARKETPLACE_ELIGIBLE",
      "Property must be active and verified before parking inventory can be configured",
    );
  }
  return property;
}

async function requireAuthority(
  actorUserId: string,
  propertyId: string,
  permission?: ManagerDelegationPermission,
  resourceId?: string,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  const authority = await resolveProviderAuthority(
    actorUserId,
    propertyId,
    permission,
    resourceId,
    db,
  );
  if (!authority)
    fail(
      403,
      "MARKETPLACE_FORBIDDEN",
      "You do not have authority for this operation",
    );
  return authority;
}

async function isResourceAvailable(
  resource: {
    id: string;
    resourceType: ParkingResourceType;
    capacity: number;
    availabilityRules: Array<{
      dayOfWeek: number;
      startLocalTime: Date;
      endLocalTime: Date;
      validFrom: Date;
      validUntil: Date | null;
      isActive: boolean;
    }>;
    availabilityExceptions: Array<{
      startsAt: Date;
      endsAt: Date;
      exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE";
    }>;
    property: {
      status: PropertyStatus;
      temporaryClosedAt: Date | null;
      temporaryClosedUntil: Date | null;
    };
  },
  startAt: Date,
  endAt: Date,
) {
  if (resource.property.status !== PropertyStatus.ACTIVE) return false;
  if (
    resource.property.temporaryClosedAt &&
    overlaps(
      resource.property.temporaryClosedAt,
      resource.property.temporaryClosedUntil ?? endAt,
      startAt,
      endAt,
    )
  ) {
    return false;
  }
  const blocked = resource.availabilityExceptions.some(
    (exception) =>
      exception.exceptionType === "BLOCKED" &&
      overlaps(exception.startsAt, exception.endsAt, startAt, endAt),
  );
  if (blocked) return false;
  const special = resource.availabilityExceptions.some(
    (exception) =>
      exception.exceptionType === "SPECIAL_AVAILABLE" &&
      exception.startsAt <= startAt &&
      exception.endsAt >= endAt,
  );
  if (special) return true;

  const start = dhakaParts(startAt);
  const end = dhakaParts(endAt);
  if (start.date !== end.date) return false;
  return resource.availabilityRules.some((rule) => {
    const validFrom = rule.validFrom.toISOString().slice(0, 10);
    const validUntil = rule.validUntil?.toISOString().slice(0, 10);
    const ruleStart = rule.startLocalTime.toISOString().slice(11, 16);
    const ruleEnd = rule.endLocalTime.toISOString().slice(11, 16);
    return (
      rule.isActive &&
      rule.dayOfWeek === start.dayOfWeek &&
      validFrom <= start.date &&
      (!validUntil || validUntil >= start.date) &&
      ruleStart <= start.time &&
      ruleEnd >= end.time
    );
  });
}

async function activeAllocationCount(
  resourceId: string,
  rightId: string,
  startAt: Date,
  endAt: Date,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  return db.parkingAllocation.count({
    where: {
      parkingSpotId: resourceId,
      parkingRightId: rightId,
      status: {
        in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      OR: [
        { status: ParkingAllocationStatus.BOOKED },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
}

export async function createResource(
  actorUserId: string,
  propertyId: string,
  input: {
    type: ParkingResourceType;
    displayName: string;
    spotCode?: string;
    floor?: string;
    zone?: string;
    capacity: number;
    supportedVehicleTypes: VehicleType[];
    isCovered: boolean;
    hasCctv: boolean;
    hasGuard: boolean;
    maxHeightCm?: number;
    maxWidthCm?: number;
    maxLengthCm?: number;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "property-resource", propertyId);
      await requireEligibleProperty(propertyId, tx);
      const authority = await requireAuthority(
        actorUserId,
        propertyId,
        ManagerDelegationPermission.RESOURCE_MANAGE,
        undefined,
        tx,
      );
      const normalizedSpotCode = input.spotCode
        ? normalizeSpotCode(input.spotCode)
        : null;
      if (normalizedSpotCode) {
        const duplicate = await tx.parkingResourceUnit.findFirst({
          where: {
            parkingSpot: { propertyId },
            normalizedSpotCode,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (duplicate)
          fail(
            409,
            "PARKING_RESOURCE_CODE_CONFLICT",
            "A resource with this spot code already exists",
          );
      }
      const resource = await tx.parkingSpot.create({
        data: {
          propertyId,
          providerMembershipId: authority.membership.id,
          resourceType: input.type,
          displayName: input.displayName,
          spotCode: input.spotCode ?? null,
          normalizedSpotCode,
          floor: input.floor ?? null,
          zone: input.zone ?? null,
          capacity:
            input.type === ParkingResourceType.FIXED_SPACE ? 1 : input.capacity,
          supportedVehicleType: input.supportedVehicleTypes[0]!,
          supportedVehicleTypes: input.supportedVehicleTypes,
          status: ParkingSpotStatus.ACTIVE,
          isCovered: input.isCovered,
          hasCctv: input.hasCctv,
          hasGuard: input.hasGuard,
          maxHeightCm: input.maxHeightCm ?? null,
          maxWidthCm: input.maxWidthCm ?? null,
          maxLengthCm: input.maxLengthCm ?? null,
          ...(input.type === ParkingResourceType.FIXED_SPACE &&
          input.spotCode &&
          normalizedSpotCode
            ? {
                units: {
                  create: {
                    spotCode: input.spotCode,
                    normalizedSpotCode,
                    displayName: input.displayName,
                    status: ParkingSpotStatus.ACTIVE,
                  },
                },
              }
            : {}),
        },
        include: { units: true },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RESOURCE_CREATED,
        actorUserId,
        propertyId,
        "ParkingResource",
        resource.id,
        authority.managed
          ? {
              actorRole: "MANAGER",
              authorityType: "MANAGER_DELEGATION",
              delegationId: authority.delegationId,
              providerUserId: authority.membership.providerUserId,
            }
          : undefined,
      );
      notifyUser(authority.membership.providerUserId, "resource:created", {
        resourceId: resource.id,
        propertyId,
      });
      if (authority.managed) {
        notifyUser(actorUserId, "resource:created", {
          resourceId: resource.id,
          propertyId,
        });
      }
      return serialize(resource);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createBulkFixedResources(
  actorUserId: string,
  propertyId: string,
  input:
    | {
        resource: {
          type: ParkingResourceType;
          displayName: string;
          floor?: string;
          zone?: string;
          supportedVehicleTypes: VehicleType[];
          isCovered: boolean;
          hasCctv: boolean;
          hasGuard: boolean;
          maxHeightCm?: number;
          maxWidthCm?: number;
          maxLengthCm?: number;
        };
        units: Array<{ displayName?: string; spotCode: string }>;
      }
    | {
        spaces: Array<{ displayName: string; spotCode: string }>;
        sharedDefaults: {
          floor?: string;
          zone?: string;
          supportedVehicleTypes: VehicleType[];
          isCovered: boolean;
          hasCctv: boolean;
          hasGuard: boolean;
          maxHeightCm?: number;
          maxWidthCm?: number;
          maxLengthCm?: number;
        };
      },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "property-resource", propertyId);
      await requireEligibleProperty(propertyId, tx);
      const authority = await requireAuthority(
        actorUserId,
        propertyId,
        ManagerDelegationPermission.RESOURCE_MANAGE,
        undefined,
        tx,
      );
      const canonical =
        "resource" in input
          ? input
          : {
              resource: {
                type: ParkingResourceType.FIXED_SPACE,
                displayName: input.sharedDefaults.zone
                  ? `${input.sharedDefaults.zone} fixed parking`
                  : input.sharedDefaults.floor
                    ? `${input.sharedDefaults.floor} fixed parking`
                    : "Fixed parking spaces",
                ...input.sharedDefaults,
              },
              units: input.spaces,
            };
      const rows = canonical.units.map((unit, index) => ({
        ...unit,
        index,
        normalizedSpotCode: normalizeSpotCode(unit.spotCode),
      }));
      const validationErrors: Array<{
        index: number;
        spotCode: string;
        code: string;
        message: string;
      }> = [];
      const seen = new Map<string, number>();
      for (const row of rows) {
        const previous = seen.get(row.normalizedSpotCode);
        if (previous !== undefined) {
          validationErrors.push({
            index: row.index,
            spotCode: row.spotCode,
            code: "DUPLICATE_IN_REQUEST",
            message: `Duplicates row ${previous + 1} after normalization`,
          });
        } else {
          seen.set(row.normalizedSpotCode, row.index);
        }
      }
      const existing = await tx.parkingResourceUnit.findMany({
        where: {
          parkingSpot: { propertyId },
          normalizedSpotCode: { in: rows.map((row) => row.normalizedSpotCode) },
          deletedAt: null,
        },
        select: { normalizedSpotCode: true },
      });
      const existingCodes = new Set(
        existing.map((row) => row.normalizedSpotCode),
      );
      for (const row of rows) {
        if (existingCodes.has(row.normalizedSpotCode)) {
          validationErrors.push({
            index: row.index,
            spotCode: row.spotCode,
            code: "PROPERTY_CODE_CONFLICT",
            message: "This spot code already exists in the Property",
          });
        }
      }
      if (validationErrors.length > 0) {
        fail(
          409,
          "PARKING_RESOURCE_BULK_VALIDATION_FAILED",
          "One or more parking spaces could not be created",
          { errors: validationErrors },
        );
      }

      const resource = await tx.parkingSpot.create({
        data: {
          propertyId,
          providerMembershipId: authority.membership.id,
          resourceType: ParkingResourceType.FIXED_SPACE,
          displayName: canonical.resource.displayName,
          floor: canonical.resource.floor ?? null,
          zone: canonical.resource.zone ?? null,
          capacity: rows.length,
          supportedVehicleType: canonical.resource.supportedVehicleTypes[0]!,
          supportedVehicleTypes: canonical.resource.supportedVehicleTypes,
          status: ParkingSpotStatus.ACTIVE,
          isCovered: canonical.resource.isCovered,
          hasCctv: canonical.resource.hasCctv,
          hasGuard: canonical.resource.hasGuard,
          maxHeightCm: canonical.resource.maxHeightCm ?? null,
          maxWidthCm: canonical.resource.maxWidthCm ?? null,
          maxLengthCm: canonical.resource.maxLengthCm ?? null,
          units: {
            create: rows.map((row) => ({
              spotCode: row.spotCode,
              normalizedSpotCode: row.normalizedSpotCode,
              displayName: row.displayName ?? row.spotCode,
              status: ParkingSpotStatus.ACTIVE,
            })),
          },
        },
        include: { units: { orderBy: { normalizedSpotCode: "asc" } } },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RESOURCE_BULK_CREATED,
        actorUserId,
        propertyId,
        "ParkingResource",
        resource.id,
        {
          createdUnitCount: rows.length,
          ...(authority.managed
            ? {
                actorRole: "MANAGER",
                authorityType: "MANAGER_DELEGATION",
                delegationId: authority.delegationId,
                providerUserId: authority.membership.providerUserId,
              }
            : {}),
        },
      );
      notifyUser(authority.membership.providerUserId, "resource:created", {
        resourceId: resource.id,
        propertyId,
      });
      if (authority.managed) {
        notifyUser(actorUserId, "resource:created", {
          resourceId: resource.id,
          propertyId,
        });
      }
      return serialize({
        resource,
        units: resource.units,
        resources: [resource],
        createdCount: rows.length,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function listResources(actorUserId: string, propertyId: string) {
  const authority = await requireAuthority(
    actorUserId,
    propertyId,
    ManagerDelegationPermission.RESOURCE_VIEW,
  );
  const resources = await prisma.parkingSpot.findMany({
    where: {
      propertyId,
      deletedAt: null,
      ...(authority.managed
        ? { providerMembershipId: authority.membership.id }
        : {}),
    },
    include: {
      parkingRights: true,
      listings: true,
      units: {
        where: { deletedAt: null },
        orderBy: { normalizedSpotCode: "asc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return serialize(resources);
}

export async function getResource(actorUserId: string, resourceId: string) {
  const resource = await prisma.parkingSpot.findFirst({
    where: { id: resourceId, deletedAt: null },
    include: {
      parkingRights: true,
      listings: true,
      units: {
        where: { deletedAt: null },
        orderBy: { normalizedSpotCode: "asc" },
      },
      availabilityRules: true,
      availabilityExceptions: true,
    },
  });
  if (!resource)
    fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
  await requireAuthority(
    actorUserId,
    resource.propertyId,
    ManagerDelegationPermission.RESOURCE_VIEW,
    resourceId,
  );
  return serialize(resource);
}

export async function updateResource(
  actorUserId: string,
  resourceId: string,
  input: JsonObject,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-resource", resourceId);
      const resource = await tx.parkingSpot.findFirst({
        where: { id: resourceId, deletedAt: null },
      });
      if (!resource)
        fail(
          404,
          "PARKING_RESOURCE_NOT_FOUND",
          "Parking resource was not found",
        );
      const authority = await requireAuthority(
        actorUserId,
        resource.propertyId,
        ManagerDelegationPermission.RESOURCE_MANAGE,
        resourceId,
        tx,
      );
      if (
        resource.resourceType === ParkingResourceType.FIXED_SPACE &&
        input.capacity !== undefined
      ) {
        if (input.capacity !== 1 && input.capacity !== resource.capacity) {
          fail(
            400,
            "PARKING_RESOURCE_CAPACITY_INVALID",
            "Manage fixed-space capacity by adding or removing physical units",
          );
        }
        // Older clients sent capacity=1 for every fixed resource. Capacity is now
        // derived from child units, so that compatibility value must not overwrite it.
        delete input.capacity;
      }
      if (
        typeof input.capacity === "number" &&
        input.capacity < resource.capacity
      ) {
        const entitlement = await tx.parkingRight.aggregate({
          where: { parkingSpotId: resourceId, ...activeRightWhere() },
          _sum: { quantity: true },
        });
        if ((entitlement._sum.quantity ?? 0) > input.capacity) {
          fail(
            409,
            "PARKING_RESOURCE_CAPACITY_IN_USE",
            "Capacity is below verified parking-right entitlement",
          );
        }
      }
      const updated = await tx.parkingSpot.update({
        where: { id: resourceId },
        data: input as Prisma.ParkingSpotUpdateInput,
      });
      if (
        resource.resourceType === ParkingResourceType.FIXED_SPACE &&
        typeof input.status === "string"
      ) {
        await tx.parkingResourceUnit.updateMany({
          where: { parkingSpotId: resourceId, deletedAt: null },
          data: { status: input.status as ParkingSpotStatus },
        });
      }
      notifyUser(authority.membership.providerUserId, "resource:updated", {
        resourceId,
        propertyId: resource.propertyId,
      });
      if (authority.managed) {
        notifyUser(actorUserId, "resource:updated", {
          resourceId,
          propertyId: resource.propertyId,
        });
      }
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function deleteResource(actorUserId: string, resourceId: string) {
  await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource)
      fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    const authority = await requireAuthority(
      actorUserId,
      resource.propertyId,
      ManagerDelegationPermission.RESOURCE_MANAGE,
      resourceId,
      tx,
    );
    const blockers = await tx.booking.count({
      where: {
        parkingSpotId: resourceId,
        status: { notIn: ["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"] },
      },
    });
    if (blockers > 0)
      fail(
        409,
        "PARKING_RESOURCE_DELETE_BLOCKED",
        "Resource has active booking dependencies",
      );
    await tx.parkingListing.updateMany({
      where: { parkingSpotId: resourceId, status: { not: "ENDED" } },
      data: { status: "ENDED", deactivatedAt: new Date() },
    });
    await tx.parkingResourceUnit.updateMany({
      where: { parkingSpotId: resourceId, deletedAt: null },
      data: { deletedAt: new Date(), status: ParkingSpotStatus.INACTIVE },
    });
    await tx.parkingSpot.update({
      where: { id: resourceId },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });
    notifyUser(authority.membership.providerUserId, "resource:updated", {
      resourceId,
      propertyId: resource.propertyId,
    });
    if (authority.managed) {
      notifyUser(actorUserId, "resource:updated", {
        resourceId,
        propertyId: resource.propertyId,
      });
    }
  });
}

export async function claimParkingRight(
  actorUserId: string,
  resourceId: string,
  input: {
    rightType: ParkingRightType;
    quantity: number;
    canUse: boolean;
    canList: boolean;
    canSetPrice: boolean;
    canManageBookings: boolean;
    canDelegateManager: boolean;
    validFrom?: string;
    validUntil?: string;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-resource", resourceId);
      const resource = await tx.parkingSpot.findFirst({
        where: { id: resourceId, deletedAt: null },
      });
      if (!resource)
        fail(
          404,
          "PARKING_RESOURCE_NOT_FOUND",
          "Parking resource was not found",
        );
      await requireEligibleProperty(resource.propertyId, tx);
      const authority = await requireAuthority(
        actorUserId,
        resource.propertyId,
        undefined,
        resourceId,
        tx,
      );
      const existingClaim = await tx.parkingRight.findFirst({
        where: {
          parkingSpotId: resourceId,
          holderUserId: authority.membership.providerUserId,
          status: {
            in: [
              ParkingRightStatus.PENDING_VERIFICATION,
              ParkingRightStatus.VERIFIED,
              ParkingRightStatus.DISPUTED,
            ],
          },
        },
        select: { id: true, status: true },
      });
      if (existingClaim) {
        fail(
          409,
          existingClaim.status === ParkingRightStatus.PENDING_VERIFICATION
            ? "PARKING_RIGHT_PENDING_CLAIM_EXISTS"
            : "PARKING_RIGHT_ACTIVE_CLAIM_EXISTS",
          existingClaim.status === ParkingRightStatus.PENDING_VERIFICATION
            ? "Edit the existing pending parking-right claim instead of creating another one"
            : "An active parking right already exists for this Provider and resource",
          { rightId: existingClaim.id, status: existingClaim.status },
        );
      }
      if (
        resource.resourceType === ParkingResourceType.FIXED_SPACE &&
        input.quantity !== resource.capacity
      ) {
        fail(
          400,
          "PARKING_RIGHT_QUANTITY_INVALID",
          "A resource-wide fixed-space claim must cover the resource capacity",
        );
      }
      if (input.rightType === ParkingRightType.USE_ONLY && input.canList) {
        fail(
          400,
          "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN",
          "USE_ONLY rights cannot list parking commercially",
        );
      }
      if ((input.canSetPrice || input.canManageBookings) && !input.canList) {
        fail(
          400,
          "PARKING_RIGHT_PERMISSION_INVALID",
          "Pricing and booking management require listing permission",
        );
      }
      const validFrom = input.validFrom
        ? new Date(input.validFrom)
        : new Date();
      const validUntil = input.validUntil ? new Date(input.validUntil) : null;
      if (validUntil && validUntil <= validFrom)
        fail(
          400,
          "PARKING_RIGHT_VALIDITY_INVALID",
          "The right end time must be later than its start time",
        );
      const previousResolvedClaim = await tx.parkingRight.findFirst({
        where: {
          parkingSpotId: resourceId,
          holderUserId: authority.membership.providerUserId,
          status: {
            in: [
              ParkingRightStatus.REJECTED,
              ParkingRightStatus.REVOKED,
              ParkingRightStatus.EXPIRED,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      });
      const right = await tx.parkingRight.create({
        data: {
          parkingSpotId: resourceId,
          holderUserId: authority.membership.providerUserId,
          providerMembershipId: authority.membership.id,
          rightType: input.rightType,
          quantity: input.quantity,
          canUse: input.canUse,
          canList:
            input.rightType === ParkingRightType.USE_ONLY
              ? false
              : input.canList,
          canSetPrice:
            input.rightType === ParkingRightType.USE_ONLY
              ? false
              : input.canSetPrice,
          canManageBookings:
            input.rightType === ParkingRightType.USE_ONLY
              ? false
              : input.canManageBookings,
          canDelegateManager: input.canDelegateManager,
          validFrom,
          validUntil,
          grantedByUserId: actorUserId,
        },
      });
      await audit(
        tx,
        previousResolvedClaim
          ? DomainAuditEventType.PARKING_RIGHT_RECLAIMED
          : DomainAuditEventType.PARKING_RIGHT_CLAIMED,
        actorUserId,
        resource.propertyId,
        "ParkingRight",
        right.id,
        previousResolvedClaim
          ? {
              previousRightId: previousResolvedClaim.id,
              previousStatus: previousResolvedClaim.status,
            }
          : undefined,
      );
      return serialize(right);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function updatePendingParkingRight(
  actorUserId: string,
  rightId: string,
  input: {
    expectedVersion: number;
    rightType?: ParkingRightType;
    quantity?: number;
    canUse?: boolean;
    canList?: boolean;
    canSetPrice?: boolean;
    canManageBookings?: boolean;
    canDelegateManager?: boolean;
    validFrom?: string;
    validUntil?: string | null;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right", rightId);
      const right = await tx.parkingRight.findUnique({
        where: { id: rightId },
        include: { parkingSpot: true },
      });
      if (!right)
        fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
      if (right.holderUserId !== actorUserId)
        fail(
          403,
          "PARKING_RIGHT_EDIT_FORBIDDEN",
          "Only the right holder can edit this claim",
        );
      if (right.status !== ParkingRightStatus.PENDING_VERIFICATION)
        fail(
          409,
          "PARKING_RIGHT_IMMUTABLE",
          "Verified or resolved parking rights cannot be edited directly",
        );
      if (right.version !== input.expectedVersion) {
        fail(
          409,
          "PARKING_RIGHT_CLAIM_CHANGED",
          "This claim changed since it was loaded",
          { currentVersion: right.version },
        );
      }
      const rightType = input.rightType ?? right.rightType;
      const quantity = input.quantity ?? right.quantity;
      const canList =
        rightType === ParkingRightType.USE_ONLY
          ? false
          : (input.canList ?? right.canList);
      const canSetPrice =
        rightType === ParkingRightType.USE_ONLY
          ? false
          : (input.canSetPrice ?? right.canSetPrice);
      const canManageBookings =
        rightType === ParkingRightType.USE_ONLY
          ? false
          : (input.canManageBookings ?? right.canManageBookings);
      const validFrom = input.validFrom
        ? new Date(input.validFrom)
        : right.validFrom;
      const validUntil =
        input.validUntil !== undefined
          ? input.validUntil
            ? new Date(input.validUntil)
            : null
          : right.validUntil;
      if (
        right.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE &&
        quantity !== right.parkingSpot.capacity
      ) {
        fail(
          400,
          "PARKING_RIGHT_QUANTITY_INVALID",
          "A resource-wide fixed-space claim must cover the resource capacity",
        );
      }
      if ((canSetPrice || canManageBookings) && !canList)
        fail(
          400,
          "PARKING_RIGHT_PERMISSION_INVALID",
          "Pricing and booking management require listing permission",
        );
      if (validUntil && validUntil <= validFrom)
        fail(
          400,
          "PARKING_RIGHT_VALIDITY_INVALID",
          "The right end time must be later than its start time",
        );
      const updated = await tx.parkingRight.update({
        where: { id: rightId },
        data: {
          ...(input.rightType !== undefined ? { rightType } : {}),
          ...(input.quantity !== undefined ? { quantity } : {}),
          ...(input.canUse !== undefined ? { canUse: input.canUse } : {}),
          ...(input.canList !== undefined || input.rightType !== undefined
            ? { canList }
            : {}),
          ...(input.canSetPrice !== undefined || input.rightType !== undefined
            ? { canSetPrice }
            : {}),
          ...(input.canManageBookings !== undefined ||
          input.rightType !== undefined
            ? { canManageBookings }
            : {}),
          ...(input.canDelegateManager !== undefined
            ? { canDelegateManager: input.canDelegateManager }
            : {}),
          ...(input.validFrom !== undefined ? { validFrom } : {}),
          ...(input.validUntil !== undefined ? { validUntil } : {}),
          version: { increment: 1 },
        },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RIGHT_CLAIM_UPDATED,
        actorUserId,
        right.parkingSpot.propertyId,
        "ParkingRight",
        right.id,
        { previousVersion: right.version, nextVersion: updated.version },
      );
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

type ParkingRightClaimInput = {
  rightType: ParkingRightType;
  quantity: number;
  canUse: boolean;
  canList: boolean;
  canSetPrice: boolean;
  canManageBookings: boolean;
  canDelegateManager: boolean;
  validFrom?: string;
  validUntil?: string;
};

export async function createParkingRightClaimBatch(
  actorUserId: string,
  propertyId: string,
  input: ParkingRightClaimInput & { resourceIds: string[] },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right-claim-batch", propertyId);
      await requireEligibleProperty(propertyId, tx);
      const resources = await tx.parkingSpot.findMany({
        where: { id: { in: input.resourceIds }, propertyId, deletedAt: null },
        orderBy: { id: "asc" },
      });
      if (resources.length !== input.resourceIds.length)
        fail(
          404,
          "PARKING_RESOURCE_NOT_FOUND",
          "One or more selected parking resources were not found",
        );
      const authorities = [];
      for (const resource of resources)
        authorities.push(
          await requireAuthority(
            actorUserId,
            propertyId,
            undefined,
            resource.id,
            tx,
          ),
        );
      const membershipId = authorities[0]?.membership.id;
      const providerUserId = authorities[0]?.membership.providerUserId;
      if (
        !membershipId ||
        !providerUserId ||
        authorities.some(
          (authority) => authority.membership.id !== membershipId,
        )
      )
        fail(
          403,
          "PARKING_RIGHT_BATCH_AUTHORITY_INVALID",
          "All selected resources must belong to the same Provider membership",
        );
      const conflicts = await tx.parkingRight.findMany({
        where: {
          parkingSpotId: { in: input.resourceIds },
          holderUserId: providerUserId,
          status: {
            in: [
              ParkingRightStatus.PENDING_VERIFICATION,
              ParkingRightStatus.VERIFIED,
              ParkingRightStatus.DISPUTED,
            ],
          },
        },
        select: { id: true, parkingSpotId: true, status: true },
      });
      if (conflicts.length)
        fail(
          409,
          "PARKING_RIGHT_BATCH_CONFLICT",
          "One or more selected resources already have an active or pending claim",
          { conflicts },
        );
      if (
        resources.some(
          (resource) =>
            resource.resourceType === ParkingResourceType.FIXED_SPACE &&
            input.quantity !== resource.capacity,
        )
      )
        fail(
          400,
          "PARKING_RIGHT_QUANTITY_INVALID",
          "Each fixed-space claim must cover its resource capacity",
        );
      if (
        input.rightType === ParkingRightType.USE_ONLY &&
        (input.canList || input.canSetPrice || input.canManageBookings)
      )
        fail(
          400,
          "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN",
          "USE_ONLY rights cannot grant commercial permissions",
        );
      if ((input.canSetPrice || input.canManageBookings) && !input.canList)
        fail(
          400,
          "PARKING_RIGHT_PERMISSION_INVALID",
          "Pricing and booking management require listing permission",
        );
      const validFrom = input.validFrom
        ? new Date(input.validFrom)
        : new Date();
      const validUntil = input.validUntil ? new Date(input.validUntil) : null;
      if (validUntil && validUntil <= validFrom)
        fail(
          400,
          "PARKING_RIGHT_VALIDITY_INVALID",
          "The right end time must be later than its start time",
        );
      const batch = await tx.parkingRightClaimBatch.create({
        data: { providerUserId, propertyId, rightType: input.rightType },
      });
      const rights = [];
      for (const resource of resources) {
        rights.push(
          await tx.parkingRight.create({
            data: {
              parkingSpotId: resource.id,
              holderUserId: providerUserId,
              providerMembershipId: membershipId,
              claimBatchId: batch.id,
              rightType: input.rightType,
              quantity: input.quantity,
              canUse: input.canUse,
              canList:
                input.rightType === ParkingRightType.USE_ONLY
                  ? false
                  : input.canList,
              canSetPrice:
                input.rightType === ParkingRightType.USE_ONLY
                  ? false
                  : input.canSetPrice,
              canManageBookings:
                input.rightType === ParkingRightType.USE_ONLY
                  ? false
                  : input.canManageBookings,
              canDelegateManager: input.canDelegateManager,
              validFrom,
              validUntil,
              grantedByUserId: actorUserId,
            },
          }),
        );
      }
      await audit(
        tx,
        DomainAuditEventType.PARKING_RIGHT_CLAIM_BATCH_CREATED,
        actorUserId,
        propertyId,
        "ParkingRightClaimBatch",
        batch.id,
        { rightCount: rights.length, rightType: input.rightType },
      );
      return serialize({ batch, rights });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function listProviderRightClaimBatches(actorUserId: string) {
  return serialize(
    await prisma.parkingRightClaimBatch.findMany({
      where: { providerUserId: actorUserId },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, publicArea: true } },
        rights: {
          include: {
            parkingSpot: {
              select: { id: true, displayName: true, spotCode: true },
            },
          },
        },
        documents: {
          select: {
            id: true,
            category: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    }),
  );
}

export async function listAdminRightClaimBatches(input: {
  page: number;
  limit: number;
  status?: ParkingRightClaimBatchStatus;
}) {
  const where: Prisma.ParkingRightClaimBatchWhereInput = {
    ...(input.status ? { status: input.status } : {}),
  };
  const [batches, total] = await Promise.all([
    prisma.parkingRightClaimBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        provider: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, name: true, publicArea: true } },
        rights: {
          include: {
            parkingSpot: {
              select: { id: true, displayName: true, spotCode: true },
            },
          },
        },
        documents: {
          select: {
            id: true,
            category: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.parkingRightClaimBatch.count({ where }),
  ]);
  return serialize({
    batches,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function reviewParkingRightClaimBatch(
  adminUserId: string,
  batchId: string,
  input: {
    decision: "VERIFIED" | "REJECTED";
    reason?: string;
    rights: Array<{ rightId: string; expectedVersion: number }>;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right-claim-batch", batchId);
      const batch = await tx.parkingRightClaimBatch.findUnique({
        where: { id: batchId },
        include: {
          rights: {
            include: {
              parkingSpot: {
                select: {
                  propertyId: true,
                  resourceType: true,
                  capacity: true,
                },
              },
            },
          },
        },
      });
      if (!batch)
        fail(
          404,
          "PARKING_RIGHT_BATCH_NOT_FOUND",
          "Parking Right claim batch was not found",
        );
      if (
        batch.status !== ParkingRightClaimBatchStatus.PENDING &&
        batch.status !== ParkingRightClaimBatchStatus.PARTIALLY_RESOLVED
      )
        fail(
          409,
          "PARKING_RIGHT_BATCH_STATE_INVALID",
          "This batch has already been resolved",
        );
      const expected = new Map(
        input.rights.map((right) => [right.rightId, right.expectedVersion]),
      );
      const pendingRights = batch.rights.filter(
        (right) => right.status === ParkingRightStatus.PENDING_VERIFICATION,
      );
      if (!pendingRights.length)
        fail(
          409,
          "PARKING_RIGHT_BATCH_STATE_INVALID",
          "This batch has no pending claims",
        );
      if (
        expected.size !== input.rights.length ||
        expected.size !== pendingRights.length
      ) {
        fail(
          400,
          "PARKING_RIGHT_BATCH_REVIEW_INCOMPLETE",
          "Provide each pending claim exactly once when reviewing a batch",
        );
      }
      for (const right of pendingRights) {
        if (expected.get(right.id) !== right.version)
          fail(
            409,
            "PARKING_RIGHT_CLAIM_CHANGED",
            "A claim in this batch changed while it was being reviewed",
            { rightId: right.id, currentVersion: right.version },
          );
      }
      if (input.decision === "REJECTED" && !input.reason)
        fail(
          400,
          "PARKING_RIGHT_REASON_REQUIRED",
          "A rejection reason is required",
        );
      const now = new Date();
      for (const right of pendingRights) {
        if (input.decision === "VERIFIED") {
          await lockEntity(tx, "parking-resource", right.parkingSpotId);
          if (right.rightType === ParkingRightType.USE_ONLY && right.canList) {
            fail(
              409,
              "PARKING_RIGHT_INVALID",
              "A USE_ONLY right cannot be commercially verified",
            );
          }
          const verified = await tx.parkingRight.aggregate({
            where: {
              parkingSpotId: right.parkingSpotId,
              id: { not: right.id },
              ...activeRightWhere(),
            },
            _sum: { quantity: true },
          });
          const alreadyEntitled = verified._sum.quantity ?? 0;
          if (
            right.parkingSpot.resourceType ===
              ParkingResourceType.FIXED_SPACE &&
            alreadyEntitled > 0
          ) {
            fail(
              409,
              "PARKING_RIGHT_CONFLICT",
              "A resource in this batch already has a verified active right",
              { rightId: right.id },
            );
          }
          if (alreadyEntitled + right.quantity > right.parkingSpot.capacity) {
            fail(
              409,
              "PARKING_RIGHT_CAPACITY_EXCEEDED",
              "A claim in this batch would exceed physical capacity",
              { rightId: right.id },
            );
          }
        }
        await tx.parkingRight.update({
          where: { id: right.id },
          data:
            input.decision === "VERIFIED"
              ? {
                  status: ParkingRightStatus.VERIFIED,
                  verifiedByAdminId: adminUserId,
                  verifiedAt: now,
                  rejectionReason: null,
                  version: { increment: 1 },
                }
              : {
                  status: ParkingRightStatus.REJECTED,
                  verifiedByAdminId: adminUserId,
                  rejectionReason: input.reason!,
                  version: { increment: 1 },
                },
        });
        await audit(
          tx,
          input.decision === "VERIFIED"
            ? DomainAuditEventType.PARKING_RIGHT_VERIFIED
            : DomainAuditEventType.PARKING_RIGHT_REJECTED,
          adminUserId,
          right.parkingSpot.propertyId,
          "ParkingRight",
          right.id,
          { batchId },
        );
      }
      const updated = await tx.parkingRightClaimBatch.update({
        where: { id: batch.id },
        data: { status: ParkingRightClaimBatchStatus.COMPLETED },
      });
      await tx.notification.create({
        data: {
          userId: batch.providerUserId,
          type: "PARKING_RIGHT_UPDATED",
          title: `Parking Right batch ${input.decision === "VERIFIED" ? "approved" : "rejected"}`,
          message:
            input.decision === "VERIFIED"
              ? `${pendingRights.length} Parking Right claims were approved.`
              : input.reason!,
          entityType: "ParkingRightClaimBatch",
          entityId: batch.id,
          idempotencyKey: `right-batch:${batch.id}:${input.decision}`,
        },
      });
      return serialize({ batch: updated, reviewedCount: pendingRights.length });
    },
    { isolationLevel: "Serializable" },
  );
}

const acceptedRightDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function validateRightDocument(file: Express.Multer.File) {
  const detected = await fileTypeFromBuffer(file.buffer);
  if (
    !detected ||
    !acceptedRightDocumentTypes.has(detected.mime) ||
    detected.mime !== file.mimetype
  )
    fail(
      400,
      "RIGHT_DOCUMENT_CONTENT_INVALID",
      "Evidence file content does not match its declared type",
    );
  return {
    originalName: basename(file.originalname)
      .replace(/[\x00-\x1F\x7F]/g, "")
      .slice(0, 255),
    mimeType: detected.mime,
    sizeBytes: file.size,
    buffer: file.buffer,
  };
}

type RightDocumentParent = {
  parkingRightId?: string;
  amendmentId?: string;
  claimBatchId?: string;
};

async function requireRightDocumentParent(
  actorUserId: string,
  parent: RightDocumentParent,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  if (parent.parkingRightId) {
    const right = await db.parkingRight.findUnique({
      where: { id: parent.parkingRightId },
      select: { holderUserId: true, status: true },
    });
    if (!right)
      fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking Right was not found");
    if (right.holderUserId !== actorUserId)
      fail(
        403,
        "PARKING_RIGHT_FORBIDDEN",
        "Only the Right holder can manage evidence",
      );
    if (right.status !== ParkingRightStatus.PENDING_VERIFICATION)
      fail(
        409,
        "PARKING_RIGHT_DOCUMENT_STATE_INVALID",
        "Direct evidence changes are allowed only while a claim is pending",
      );
    return parent.parkingRightId;
  }
  if (parent.amendmentId) {
    const amendment = await db.parkingRightAmendment.findUnique({
      where: { id: parent.amendmentId },
      select: { requestedByUserId: true, status: true },
    });
    if (!amendment)
      fail(
        404,
        "PARKING_RIGHT_AMENDMENT_NOT_FOUND",
        "Parking Right change request was not found",
      );
    if (amendment.requestedByUserId !== actorUserId)
      fail(
        403,
        "PARKING_RIGHT_FORBIDDEN",
        "Only the amendment requester can manage evidence",
      );
    if (amendment.status !== ParkingRightAmendmentStatus.PENDING)
      fail(
        409,
        "PARKING_RIGHT_DOCUMENT_STATE_INVALID",
        "Evidence changes are allowed only while an amendment is pending",
      );
    return parent.amendmentId;
  }
  if (parent.claimBatchId) {
    const batch = await db.parkingRightClaimBatch.findUnique({
      where: { id: parent.claimBatchId },
      select: { providerUserId: true, status: true },
    });
    if (!batch)
      fail(
        404,
        "PARKING_RIGHT_BATCH_NOT_FOUND",
        "Parking Right claim batch was not found",
      );
    if (batch.providerUserId !== actorUserId)
      fail(
        403,
        "PARKING_RIGHT_FORBIDDEN",
        "Only the batch Provider can manage evidence",
      );
    if (batch.status !== ParkingRightClaimBatchStatus.PENDING)
      fail(
        409,
        "PARKING_RIGHT_DOCUMENT_STATE_INVALID",
        "Evidence changes are allowed only while a batch is pending",
      );
    return parent.claimBatchId;
  }
  fail(
    400,
    "RIGHT_DOCUMENT_PARENT_REQUIRED",
    "Evidence must belong to a claim, amendment, or batch",
  );
}

async function lockAndRequireRightDocumentParent(
  tx: MarketplaceDb,
  actorUserId: string,
  parent: RightDocumentParent,
) {
  if (parent.parkingRightId)
    await lockEntity(tx, "parking-right", parent.parkingRightId);
  if (parent.amendmentId)
    await lockEntity(tx, "parking-right-amendment", parent.amendmentId);
  if (parent.claimBatchId)
    await lockEntity(tx, "parking-right-claim-batch", parent.claimBatchId);
  return requireRightDocumentParent(actorUserId, parent, tx);
}

export async function uploadParkingRightDocuments(
  actorUserId: string,
  parent: RightDocumentParent,
  category: ParkingRightDocumentCategory,
  files: Express.Multer.File[],
) {
  const parentId = await requireRightDocumentParent(actorUserId, parent);
  if (!files.length)
    fail(400, "RIGHT_DOCUMENT_REQUIRED", "Select at least one evidence file");
  const validated = await Promise.all(files.map(validateRightDocument));
  const existingCount = await prisma.parkingRightDocument.count({
    where: parent,
  });
  if (existingCount + validated.length > 5)
    fail(
      400,
      "RIGHT_DOCUMENT_LIMIT_EXCEEDED",
      "A claim, amendment, or batch can contain at most 5 evidence files",
    );
  const storage = getRightDocumentStorage();
  const uploaded: Array<{
    storageKey: string;
    secureUrl: string;
    mimeType: string;
  }> = [];
  try {
    for (const file of validated)
      uploaded.push({
        ...(await storage.upload(file.buffer, parentId, file.mimeType)),
        mimeType: file.mimeType,
      });
    const documents = await prisma.$transaction(
      async (tx) => {
        await lockEntity(tx, "parking-right-document-parent", parentId);
        await lockAndRequireRightDocumentParent(tx, actorUserId, parent);
        const currentCount = await tx.parkingRightDocument.count({
          where: parent,
        });
        if (currentCount + uploaded.length > 5)
          fail(
            400,
            "RIGHT_DOCUMENT_LIMIT_EXCEEDED",
            "A claim, amendment, or batch can contain at most 5 evidence files",
          );
        const created = [];
        for (const [index, item] of uploaded.entries())
          created.push(
            await tx.parkingRightDocument.create({
              data: {
                ...parent,
                category,
                originalName: validated[index]!.originalName,
                mimeType: item.mimeType,
                sizeBytes: validated[index]!.sizeBytes,
                storageKey: item.storageKey,
                secureUrl: item.secureUrl,
                uploadedByUserId: actorUserId,
              },
            }),
          );
        if (parent.parkingRightId) {
          const right = await tx.parkingRight.update({
            where: { id: parent.parkingRightId },
            data: { version: { increment: 1 } },
            include: { parkingSpot: { select: { propertyId: true } } },
          });
          await audit(
            tx,
            DomainAuditEventType.PARKING_RIGHT_CLAIM_UPDATED,
            actorUserId,
            right.parkingSpot.propertyId,
            "ParkingRight",
            right.id,
            {
              action: "EVIDENCE_ADDED",
              documentCount: created.length,
              nextVersion: right.version,
            },
          );
        }
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    return documents.map(
      ({ storageKey: _storageKey, secureUrl: _secureUrl, ...document }) =>
        document,
    );
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((item) => storage.delete(item.storageKey, item.mimeType)),
    );
    throw error;
  }
}

export async function listParkingRightDocuments(
  actorUserId: string,
  parent: RightDocumentParent,
) {
  await requireRightDocumentParent(actorUserId, parent);
  return prisma.parkingRightDocument.findMany({
    where: parent,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      category: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });
}

export async function deleteParkingRightDocument(
  actorUserId: string,
  documentId: string,
) {
  const document = await prisma.parkingRightDocument.findUnique({
    where: { id: documentId },
  });
  if (!document)
    fail(404, "RIGHT_DOCUMENT_NOT_FOUND", "Evidence document was not found");
  const parent: RightDocumentParent = {
    ...(document.parkingRightId
      ? { parkingRightId: document.parkingRightId }
      : {}),
    ...(document.amendmentId ? { amendmentId: document.amendmentId } : {}),
    ...(document.claimBatchId ? { claimBatchId: document.claimBatchId } : {}),
  };
  const deletedDocument = await prisma.$transaction(async (tx) => {
    const parentId =
      document.parkingRightId ?? document.amendmentId ?? document.claimBatchId;
    if (!parentId)
      fail(
        409,
        "RIGHT_DOCUMENT_PARENT_INVALID",
        "Evidence document has no valid parent",
      );
    await lockEntity(tx, "parking-right-document-parent", parentId);
    await lockAndRequireRightDocumentParent(tx, actorUserId, parent);
    const currentDocument = await tx.parkingRightDocument.findUnique({
      where: { id: documentId },
    });
    if (!currentDocument)
      fail(404, "RIGHT_DOCUMENT_NOT_FOUND", "Evidence document was not found");
    await tx.parkingRightDocument.delete({ where: { id: currentDocument.id } });
    if (currentDocument.parkingRightId) {
      const right = await tx.parkingRight.update({
        where: { id: currentDocument.parkingRightId },
        data: { version: { increment: 1 } },
        include: { parkingSpot: { select: { propertyId: true } } },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RIGHT_CLAIM_UPDATED,
        actorUserId,
        right.parkingSpot.propertyId,
        "ParkingRight",
        right.id,
        { action: "EVIDENCE_REMOVED", nextVersion: right.version },
      );
    }
    return currentDocument;
  });
  try {
    await getRightDocumentStorage().delete(
      deletedDocument.storageKey,
      deletedDocument.mimeType,
    );
  } catch (error) {
    logger.error(
      {
        documentId: deletedDocument.id,
        storageKey: deletedDocument.storageKey,
        errorType: error instanceof Error ? error.name : "UnknownError",
      },
      "Parking Right evidence blob cleanup failed after metadata deletion",
    );
  }
  return { deleted: true };
}

export async function getParkingRightDocumentDownload(
  actorUserId: string,
  documentId: string,
) {
  const document = await prisma.parkingRightDocument.findUnique({
    where: { id: documentId },
    include: {
      parkingRight: { select: { holderUserId: true } },
      amendment: { select: { requestedByUserId: true } },
      claimBatch: { select: { providerUserId: true } },
    },
  });
  if (!document)
    fail(404, "RIGHT_DOCUMENT_NOT_FOUND", "Evidence document was not found");
  const admin = await prisma.userRole.findUnique({
    where: { userId_role: { userId: actorUserId, role: UserRoleType.ADMIN } },
    select: { userId: true },
  });
  const ownerId =
    document.parkingRight?.holderUserId ??
    document.amendment?.requestedByUserId ??
    document.claimBatch?.providerUserId;
  if (!admin && ownerId !== actorUserId)
    fail(
      403,
      "RIGHT_DOCUMENT_FORBIDDEN",
      "You cannot access this evidence document",
    );
  return {
    url: getRightDocumentStorage().signedUrl(
      document.storageKey,
      document.mimeType,
      Math.floor(Date.now() / 1000) + 300,
    ),
    expiresInSeconds: 300,
  };
}

type ParkingRightProposedChanges = {
  rightType?: ParkingRightType;
  quantity?: number;
  canUse?: boolean;
  canList?: boolean;
  canSetPrice?: boolean;
  canManageBookings?: boolean;
  canDelegateManager?: boolean;
  validFrom?: string;
  validUntil?: string | null;
};

function validateRightChanges(
  right: {
    rightType: ParkingRightType;
    quantity: number;
    canList: boolean;
    canSetPrice: boolean;
    canManageBookings: boolean;
    validFrom: Date;
    validUntil: Date | null;
    parkingSpot: { resourceType: ParkingResourceType; capacity: number };
  },
  changes: ParkingRightProposedChanges,
) {
  const next = {
    rightType: changes.rightType ?? right.rightType,
    quantity: changes.quantity ?? right.quantity,
    canList: changes.canList ?? right.canList,
    canSetPrice: changes.canSetPrice ?? right.canSetPrice,
    canManageBookings: changes.canManageBookings ?? right.canManageBookings,
    validFrom: changes.validFrom
      ? new Date(changes.validFrom)
      : right.validFrom,
    validUntil:
      changes.validUntil !== undefined
        ? changes.validUntil
          ? new Date(changes.validUntil)
          : null
        : right.validUntil,
  };
  if (
    right.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE &&
    next.quantity !== right.parkingSpot.capacity
  ) {
    fail(
      400,
      "PARKING_RIGHT_QUANTITY_INVALID",
      "A resource-wide fixed-space right must cover its resource capacity",
    );
  }
  if (
    next.rightType === ParkingRightType.USE_ONLY &&
    (next.canList || next.canSetPrice || next.canManageBookings)
  ) {
    fail(
      400,
      "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN",
      "A use-only right cannot grant commercial permissions",
    );
  }
  if ((next.canSetPrice || next.canManageBookings) && !next.canList) {
    fail(
      400,
      "PARKING_RIGHT_PERMISSION_INVALID",
      "Pricing and booking management require listing permission",
    );
  }
  if (next.validUntil && next.validUntil <= next.validFrom) {
    fail(
      400,
      "PARKING_RIGHT_VALIDITY_INVALID",
      "The right end time must be later than its start time",
    );
  }
  return next;
}

export async function createParkingRightAmendment(
  actorUserId: string,
  rightId: string,
  input: {
    expectedVersion: number;
    proposedChanges: ParkingRightProposedChanges;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right", rightId);
      const right = await tx.parkingRight.findUnique({
        where: { id: rightId },
        include: {
          parkingSpot: {
            select: { propertyId: true, resourceType: true, capacity: true },
          },
        },
      });
      if (!right)
        fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
      if (right.holderUserId !== actorUserId)
        fail(
          403,
          "PARKING_RIGHT_FORBIDDEN",
          "Only the verified right holder can request a change",
        );
      if (right.status !== ParkingRightStatus.VERIFIED)
        fail(
          409,
          "PARKING_RIGHT_AMENDMENT_NOT_ALLOWED",
          "Only a verified parking right can be amended",
        );
      if (right.version !== input.expectedVersion)
        fail(
          409,
          "PARKING_RIGHT_CLAIM_CHANGED",
          "This parking right changed since it was loaded",
          { currentVersion: right.version },
        );
      validateRightChanges(right, input.proposedChanges);
      const pending = await tx.parkingRightAmendment.findFirst({
        where: {
          parkingRightId: right.id,
          status: ParkingRightAmendmentStatus.PENDING,
        },
        select: { id: true },
      });
      if (pending)
        fail(
          409,
          "PARKING_RIGHT_AMENDMENT_PENDING",
          "A pending change request already exists for this parking right",
          { amendmentId: pending.id },
        );
      const amendment = await tx.parkingRightAmendment.create({
        data: {
          parkingRightId: right.id,
          requestedByUserId: actorUserId,
          baseRightVersion: right.version,
          proposedChanges:
            input.proposedChanges as unknown as Prisma.InputJsonObject,
          status: ParkingRightAmendmentStatus.PENDING,
          submittedAt: new Date(),
        },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RIGHT_AMENDMENT_SUBMITTED,
        actorUserId,
        right.parkingSpot.propertyId,
        "ParkingRightAmendment",
        amendment.id,
        {
          parkingRightId: right.id,
          baseRightVersion: right.version,
          changedFields: Object.keys(input.proposedChanges).sort().join(","),
        },
      );
      return serialize(amendment);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function listParkingRightAmendments(
  actorUserId: string,
  rightId: string,
) {
  const right = await prisma.parkingRight.findUnique({
    where: { id: rightId },
    select: { holderUserId: true },
  });
  if (!right)
    fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
  if (right.holderUserId !== actorUserId)
    fail(
      403,
      "PARKING_RIGHT_FORBIDDEN",
      "Only the right holder can view its change requests",
    );
  return prisma.parkingRightAmendment.findMany({
    where: { parkingRightId: rightId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      parkingRightId: true,
      baseRightVersion: true,
      proposedChanges: true,
      status: true,
      submittedAt: true,
      resolvedAt: true,
      reason: true,
      createdAt: true,
      updatedAt: true,
      reviewedBy: { select: { id: true, fullName: true } },
      documents: {
        select: {
          id: true,
          category: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function cancelParkingRightAmendment(
  actorUserId: string,
  amendmentId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-right-amendment", amendmentId);
    const amendment = await tx.parkingRightAmendment.findUnique({
      where: { id: amendmentId },
    });
    if (!amendment)
      fail(
        404,
        "PARKING_RIGHT_AMENDMENT_NOT_FOUND",
        "Parking right change request was not found",
      );
    if (amendment.requestedByUserId !== actorUserId)
      fail(
        403,
        "PARKING_RIGHT_FORBIDDEN",
        "Only the requester can cancel this change request",
      );
    if (amendment.status !== ParkingRightAmendmentStatus.PENDING)
      fail(
        409,
        "PARKING_RIGHT_AMENDMENT_STATE_INVALID",
        "Only a pending change request can be cancelled",
      );
    return tx.parkingRightAmendment.update({
      where: { id: amendment.id },
      data: {
        status: ParkingRightAmendmentStatus.CANCELLED,
        resolvedAt: new Date(),
        reason: "Cancelled by requester",
      },
    });
  });
}

export async function listAdminParkingRightAmendments(input: {
  page: number;
  limit: number;
  status?: ParkingRightAmendmentStatus;
}) {
  const where: Prisma.ParkingRightAmendmentWhereInput = {
    ...(input.status ? { status: input.status } : {}),
  };
  const [amendments, total] = await Promise.all([
    prisma.parkingRightAmendment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        requestedBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        parkingRight: {
          include: {
            parkingSpot: {
              include: {
                property: {
                  select: { id: true, name: true, publicArea: true },
                },
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            category: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.parkingRightAmendment.count({ where }),
  ]);
  return serialize({
    amendments,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function reviewParkingRightAmendment(
  adminUserId: string,
  amendmentId: string,
  input: {
    decision: "APPROVED" | "REJECTED";
    expectedRightVersion: number;
    reason?: string;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right-amendment", amendmentId);
      const amendment = await tx.parkingRightAmendment.findUnique({
        where: { id: amendmentId },
        include: {
          parkingRight: {
            include: {
              parkingSpot: { select: { propertyId: true, resourceType: true } },
            },
          },
        },
      });
      if (!amendment)
        fail(
          404,
          "PARKING_RIGHT_AMENDMENT_NOT_FOUND",
          "Parking right change request was not found",
        );
      if (amendment.status !== ParkingRightAmendmentStatus.PENDING)
        fail(
          409,
          "PARKING_RIGHT_AMENDMENT_STATE_INVALID",
          "This change request has already been resolved",
        );
      await lockEntity(tx, "parking-right", amendment.parkingRightId);
      const right = await tx.parkingRight.findUnique({
        where: { id: amendment.parkingRightId },
        include: {
          parkingSpot: {
            select: { propertyId: true, resourceType: true, capacity: true },
          },
        },
      });
      if (!right)
        fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
      if (
        right.version !== input.expectedRightVersion ||
        right.version !== amendment.baseRightVersion
      )
        fail(
          409,
          "PARKING_RIGHT_CLAIM_CHANGED",
          "The parking right changed after this request was submitted",
          {
            currentVersion: right.version,
            baseRightVersion: amendment.baseRightVersion,
          },
        );
      if (right.status !== ParkingRightStatus.VERIFIED)
        fail(
          409,
          "PARKING_RIGHT_AMENDMENT_NOT_ALLOWED",
          "The original parking right is no longer verified",
        );
      const now = new Date();
      if (input.decision === "REJECTED") {
        const rejected = await tx.parkingRightAmendment.update({
          where: { id: amendment.id },
          data: {
            status: ParkingRightAmendmentStatus.REJECTED,
            reason: input.reason!,
            reviewedByAdminId: adminUserId,
            resolvedAt: now,
          },
        });
        await tx.notification.create({
          data: {
            userId: amendment.requestedByUserId,
            type: "PARKING_RIGHT_UPDATED",
            title: "Parking Right change rejected",
            message: input.reason!,
            entityType: "ParkingRightAmendment",
            entityId: amendment.id,
            idempotencyKey: `right-amendment:${amendment.id}:REJECTED`,
          },
        });
        await audit(
          tx,
          DomainAuditEventType.PARKING_RIGHT_AMENDMENT_REJECTED,
          adminUserId,
          right.parkingSpot.propertyId,
          "ParkingRightAmendment",
          amendment.id,
          { parkingRightId: right.id, reason: input.reason! },
        );
        return serialize({ amendment: rejected, parkingRight: right });
      }
      const changes =
        amendment.proposedChanges as unknown as ParkingRightProposedChanges;
      const next = validateRightChanges(right, changes);
      const updatedRight = await tx.parkingRight.update({
        where: { id: right.id },
        data: {
          ...(changes.rightType !== undefined
            ? { rightType: next.rightType }
            : {}),
          ...(changes.quantity !== undefined
            ? { quantity: next.quantity }
            : {}),
          ...(changes.canUse !== undefined ? { canUse: changes.canUse } : {}),
          ...(changes.canList !== undefined ? { canList: next.canList } : {}),
          ...(changes.canSetPrice !== undefined
            ? { canSetPrice: next.canSetPrice }
            : {}),
          ...(changes.canManageBookings !== undefined
            ? { canManageBookings: next.canManageBookings }
            : {}),
          ...(changes.canDelegateManager !== undefined
            ? { canDelegateManager: changes.canDelegateManager }
            : {}),
          ...(changes.validFrom !== undefined
            ? { validFrom: next.validFrom }
            : {}),
          ...(changes.validUntil !== undefined
            ? { validUntil: next.validUntil }
            : {}),
          version: { increment: 1 },
        },
      });
      if (!updatedRight.canList) {
        await tx.parkingListing.updateMany({
          where: {
            parkingRightId: right.id,
            status: ParkingListingStatus.ACTIVE,
          },
          data: { status: ParkingListingStatus.SUSPENDED, deactivatedAt: now },
        });
      }
      const approved = await tx.parkingRightAmendment.update({
        where: { id: amendment.id },
        data: {
          status: ParkingRightAmendmentStatus.APPROVED,
          reason: input.reason ?? null,
          reviewedByAdminId: adminUserId,
          resolvedAt: now,
        },
      });
      await tx.notification.create({
        data: {
          userId: amendment.requestedByUserId,
          type: "PARKING_RIGHT_UPDATED",
          title: "Parking Right change approved",
          message: "Your requested Parking Right changes were approved.",
          entityType: "ParkingRightAmendment",
          entityId: amendment.id,
          idempotencyKey: `right-amendment:${amendment.id}:APPROVED`,
        },
      });
      await audit(
        tx,
        DomainAuditEventType.PARKING_RIGHT_AMENDMENT_APPROVED,
        adminUserId,
        right.parkingSpot.propertyId,
        "ParkingRightAmendment",
        amendment.id,
        {
          parkingRightId: right.id,
          previousVersion: right.version,
          nextVersion: updatedRight.version,
          changedFields: Object.keys(changes).sort().join(","),
        },
      );
      return serialize({ amendment: approved, parkingRight: updatedRight });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function listParkingRights(actorUserId: string) {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.RESOURCE_VIEW,
  );
  const rights = await prisma.parkingRight.findMany({
    where: {
      providerMembershipId: {
        in: scopes.map((scope) => scope.providerMembershipId),
      },
    },
    include: {
      parkingSpot: {
        include: {
          units: {
            where: { deletedAt: null },
            orderBy: { normalizedSpotCode: "asc" },
          },
        },
      },
      documents: {
        select: {
          id: true,
          category: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const scopeByMembership = new Map(
    scopes.map((scope) => [scope.providerMembershipId, scope]),
  );
  return serialize(
    rights.filter((right) => {
      if (!right.providerMembershipId) return false;
      const resourceIds = scopeByMembership.get(
        right.providerMembershipId,
      )?.resourceIds;
      return resourceIds === null || resourceIds?.includes(right.parkingSpotId);
    }),
  );
}

export async function getParkingRight(actorUserId: string, rightId: string) {
  const right = await prisma.parkingRight.findUnique({
    where: { id: rightId },
    include: {
      parkingSpot: true,
      documents: {
        select: {
          id: true,
          category: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });
  if (!right)
    fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
  if (right.holderUserId !== actorUserId) {
    await requireAuthority(
      actorUserId,
      right.parkingSpot.propertyId,
      ManagerDelegationPermission.RESOURCE_VIEW,
      right.parkingSpotId,
    );
  }
  return serialize(right);
}

export async function listPendingRights() {
  return serialize(
    await prisma.parkingRight.findMany({
      where: { status: ParkingRightStatus.PENDING_VERIFICATION },
      include: {
        parkingSpot: {
          include: {
            property: { select: { id: true, name: true, publicArea: true } },
          },
        },
        holder: { select: { id: true, fullName: true, email: true } },
        documents: {
          select: {
            id: true,
            category: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  );
}

export async function verifyParkingRight(
  adminUserId: string,
  rightId: string,
  input: {
    decision: ParkingRightStatus;
    reason?: string;
    expectedVersion: number;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right", rightId);
      const right = await tx.parkingRight.findUnique({
        where: { id: rightId },
        include: { parkingSpot: true },
      });
      if (!right)
        fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
      if (right.version !== input.expectedVersion) {
        fail(
          409,
          "PARKING_RIGHT_CLAIM_CHANGED",
          "This claim was updated while it was being reviewed",
          { currentVersion: right.version },
        );
      }
      if (right.status === input.decision) return serialize(right);
      const allowedTransitions: Partial<
        Record<ParkingRightStatus, ParkingRightStatus[]>
      > = {
        [ParkingRightStatus.PENDING_VERIFICATION]: [
          ParkingRightStatus.VERIFIED,
          ParkingRightStatus.REJECTED,
          ParkingRightStatus.DISPUTED,
        ],
        [ParkingRightStatus.VERIFIED]: [
          ParkingRightStatus.DISPUTED,
          ParkingRightStatus.REVOKED,
        ],
        [ParkingRightStatus.DISPUTED]: [
          ParkingRightStatus.VERIFIED,
          ParkingRightStatus.REJECTED,
          ParkingRightStatus.REVOKED,
        ],
      };
      if (!allowedTransitions[right.status]?.includes(input.decision)) {
        fail(
          409,
          "RIGHT_INVALID_STATE",
          `A ${right.status.toLowerCase()} right cannot transition to ${input.decision.toLowerCase()}`,
        );
      }
      if (input.decision === ParkingRightStatus.VERIFIED) {
        await lockEntity(tx, "parking-resource", right.parkingSpotId);
        if (right.rightType === ParkingRightType.USE_ONLY && right.canList) {
          fail(
            409,
            "PARKING_RIGHT_INVALID",
            "A USE_ONLY right cannot be commercially verified",
          );
        }
        const verified = await tx.parkingRight.aggregate({
          where: {
            parkingSpotId: right.parkingSpotId,
            id: { not: rightId },
            ...activeRightWhere(),
          },
          _sum: { quantity: true },
        });
        if (
          right.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE &&
          (verified._sum.quantity ?? 0) > 0
        ) {
          fail(
            409,
            "PARKING_RIGHT_CONFLICT",
            "This fixed space already has a verified active right",
          );
        }
        if (
          (verified._sum.quantity ?? 0) + right.quantity >
          right.parkingSpot.capacity
        ) {
          fail(
            409,
            "PARKING_RIGHT_CAPACITY_EXCEEDED",
            "Verified entitlement would exceed physical capacity",
          );
        }
      }
      const now = new Date();
      const updated = await tx.parkingRight.update({
        where: { id: rightId },
        data: {
          status: input.decision,
          verifiedByAdminId:
            input.decision === ParkingRightStatus.VERIFIED ? adminUserId : null,
          verifiedAt:
            input.decision === ParkingRightStatus.VERIFIED ? now : null,
          rejectionReason:
            input.decision === ParkingRightStatus.VERIFIED
              ? null
              : (input.reason ?? null),
          version: { increment: 1 },
        },
      });
      if (input.decision !== ParkingRightStatus.VERIFIED) {
        await tx.parkingListing.updateMany({
          where: { parkingRightId: rightId, status: "ACTIVE" },
          data: { status: "SUSPENDED", deactivatedAt: now },
        });
      }
      const rightEvent =
        input.decision === ParkingRightStatus.VERIFIED
          ? DomainAuditEventType.PARKING_RIGHT_VERIFIED
          : input.decision === ParkingRightStatus.REJECTED
            ? DomainAuditEventType.PARKING_RIGHT_REJECTED
            : input.decision === ParkingRightStatus.REVOKED
              ? DomainAuditEventType.PARKING_RIGHT_REVOKED
              : DomainAuditEventType.PARKING_RIGHT_DISPUTED;
      await audit(
        tx,
        rightEvent,
        adminUserId,
        right.parkingSpot.propertyId,
        "ParkingRight",
        rightId,
        { decision: input.decision, reason: input.reason ?? null },
      );
      await tx.notification.create({
        data: {
          userId: right.holderUserId,
          type: "PARKING_RIGHT_UPDATED",
          title: `Parking Right ${input.decision.toLowerCase().replaceAll("_", " ")}`,
          message:
            input.decision === ParkingRightStatus.VERIFIED
              ? "Your Parking Right was verified."
              : (input.reason ??
                `Your Parking Right is now ${input.decision.toLowerCase()}.`),
          entityType: "ParkingRight",
          entityId: right.id,
          idempotencyKey: `parking-right:${right.id}:${input.decision}:${updated.version}`,
        },
      });
      if (right.claimBatchId) {
        const grouped = await tx.parkingRight.groupBy({
          by: ["status"],
          where: { claimBatchId: right.claimBatchId },
          _count: { _all: true },
        });
        const pendingCount =
          grouped.find(
            (item) => item.status === ParkingRightStatus.PENDING_VERIFICATION,
          )?._count._all ?? 0;
        await tx.parkingRightClaimBatch.update({
          where: { id: right.claimBatchId },
          data: {
            status:
              pendingCount === 0
                ? ParkingRightClaimBatchStatus.COMPLETED
                : ParkingRightClaimBatchStatus.PARTIALLY_RESOLVED,
          },
        });
      }
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createListing(
  actorUserId: string,
  input: {
    parkingRightId: string;
    parkingResourceUnitId?: string;
    title: string;
    description?: string;
    pricePerHourPaisa: bigint;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    allowedVehicleTypes: VehicleType[];
    securityDepositPaisa: bigint;
    overtimeBillingMode?: OvertimeBillingMode;
    overtimeMultiplierBps?: number | null;
    overtimeRatePerHourPaisa?: bigint | null;
    overtimeGracePeriodMinutes?: number;
  },
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-right", input.parkingRightId);
      const right = await tx.parkingRight.findUnique({
        where: { id: input.parkingRightId },
        include: {
          parkingSpot: { include: { property: true } },
          providerMembership: true,
        },
      });
      if (!right || !right.providerMembership)
        fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
      const authority = await requireAuthority(
        actorUserId,
        right.parkingSpot.propertyId,
        ManagerDelegationPermission.LISTING_MANAGE,
        right.parkingSpotId,
        tx,
      );
      if (authority.membership.id !== right.providerMembershipId)
        fail(
          403,
          "PARKING_RIGHT_FORBIDDEN",
          "This right belongs to another Provider",
        );
      if (
        right.parkingSpot.property.status !== PropertyStatus.ACTIVE ||
        right.parkingSpot.property.verificationStatus !==
          VerificationStatus.VERIFIED
      ) {
        fail(
          409,
          "PROPERTY_NOT_MARKETPLACE_ELIGIBLE",
          "Property must be active and verified before a listing can be created",
        );
      }
      const now = new Date();
      if (
        right.status !== ParkingRightStatus.VERIFIED ||
        right.validFrom > now ||
        (right.validUntil && right.validUntil <= now) ||
        !right.canList
      ) {
        fail(
          409,
          "PARKING_RIGHT_NOT_LISTABLE",
          "Parking right is not active and listable",
        );
      }
      if (right.rightType === ParkingRightType.USE_ONLY)
        fail(
          403,
          "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN",
          "USE_ONLY parking cannot be sublet",
        );
      if (!right.canSetPrice)
        fail(
          403,
          "PARKING_RIGHT_PRICE_FORBIDDEN",
          "This right does not permit price management",
        );
      if (
        right.parkingSpot.deletedAt ||
        right.parkingSpot.status === ParkingSpotStatus.BLOCKED
      ) {
        fail(
          409,
          "PARKING_RESOURCE_NOT_LISTABLE",
          "Parking resource is not eligible for listing",
        );
      }
      if (input.parkingResourceUnitId) {
        if (
          right.parkingSpot.resourceType !== ParkingResourceType.FIXED_SPACE
        ) {
          fail(
            400,
            "PARKING_RESOURCE_UNIT_INVALID",
            "Shared-pool listings cannot target a fixed unit",
          );
        }
        const unit = await tx.parkingResourceUnit.findFirst({
          where: {
            id: input.parkingResourceUnitId,
            parkingSpotId: right.parkingSpotId,
            deletedAt: null,
          },
        });
        if (!unit)
          fail(
            404,
            "PARKING_RESOURCE_UNIT_NOT_FOUND",
            "Parking resource unit was not found",
          );
      }
      const supported = new Set(
        right.parkingSpot.supportedVehicleTypes.length > 0
          ? right.parkingSpot.supportedVehicleTypes
          : [right.parkingSpot.supportedVehicleType],
      );
      if (input.allowedVehicleTypes.some((type) => !supported.has(type))) {
        fail(
          400,
          "LISTING_VEHICLE_TYPE_UNSUPPORTED",
          "Listing contains an unsupported vehicle type",
        );
      }
      const wallet = await tx.walletAccount.findUnique({
        where: {
          userId_currency: { userId: right.holderUserId, currency: "BDT" },
        },
      });
      if (!wallet || wallet.status !== "ACTIVE")
        fail(
          409,
          "SETTLEMENT_WALLET_UNAVAILABLE",
          "Provider settlement wallet is unavailable",
        );
      const listing = await tx.parkingListing.create({
        data: {
          parkingSpotId: right.parkingSpotId,
          providerUserId: right.holderUserId,
          providerMembershipId: right.providerMembershipId,
          parkingRightId: right.id,
          parkingResourceUnitId: input.parkingResourceUnitId ?? null,
          title: input.title,
          description: input.description ?? null,
          pricePerHourPaisa: input.pricePerHourPaisa,
          minDurationMinutes: input.minDurationMinutes,
          maxDurationMinutes: input.maxDurationMinutes,
          allowedVehicleTypes: input.allowedVehicleTypes,
          securityDepositPaisa: input.securityDepositPaisa,
          overtimeBillingMode:
            input.overtimeBillingMode ?? OvertimeBillingMode.MULTIPLIER,
          overtimeMultiplierBps:
            input.overtimeBillingMode === OvertimeBillingMode.FIXED_PER_HOUR
              ? null
              : (input.overtimeMultiplierBps ?? 15_000),
          overtimeRatePerHourPaisa:
            input.overtimeBillingMode === OvertimeBillingMode.FIXED_PER_HOUR
              ? (input.overtimeRatePerHourPaisa ?? null)
              : null,
          overtimeGracePeriodMinutes: input.overtimeGracePeriodMinutes ?? 15,
          settlementRecipientUserId: right.holderUserId,
          settlementWalletAccountId: wallet.id,
        },
      });
      await tx.parkingListingPriceHistory.create({
        data: {
          parkingListingId: listing.id,
          previousPricePaisa: null,
          pricePerHourPaisa: listing.pricePerHourPaisa,
          changedByUserId: actorUserId,
        },
      });
      notifyUser(authority.membership.providerUserId, "listing:created", {
        listingId: listing.id,
        propertyId: right.parkingSpot.propertyId,
      });
      if (authority.managed) {
        notifyUser(actorUserId, "listing:created", {
          listingId: listing.id,
          propertyId: right.parkingSpot.propertyId,
        });
      }
      return serialize(listing);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function listListings(actorUserId: string) {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.LISTING_VIEW,
  );
  const listings = await prisma.parkingListing.findMany({
    where: {
      providerMembershipId: {
        in: scopes.map((scope) => scope.providerMembershipId),
      },
    },
    include: { parkingSpot: true, parkingRight: true },
    orderBy: { createdAt: "desc" },
  });
  const scopeByMembership = new Map(
    scopes.map((scope) => [scope.providerMembershipId, scope]),
  );
  return serialize(
    listings.filter((listing) => {
      const resourceIds = scopeByMembership.get(
        listing.providerMembershipId,
      )?.resourceIds;
      return (
        resourceIds === null || resourceIds?.includes(listing.parkingSpotId)
      );
    }),
  );
}

export async function getListing(actorUserId: string, listingId: string) {
  const listing = await prisma.parkingListing.findUnique({
    where: { id: listingId },
    include: {
      parkingSpot: {
        include: { availabilityRules: true, availabilityExceptions: true },
      },
      parkingRight: true,
    },
  });
  if (!listing)
    fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
  if (listing.providerUserId !== actorUserId) {
    await requireAuthority(
      actorUserId,
      listing.parkingSpot.propertyId,
      ManagerDelegationPermission.LISTING_VIEW,
      listing.parkingSpotId,
    );
  }
  return serialize(listing);
}

export async function updateListing(
  actorUserId: string,
  listingId: string,
  input: JsonObject,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-listing", listingId);
    const listing = await tx.parkingListing.findUnique({
      where: { id: listingId },
      include: { parkingSpot: true },
    });
    if (!listing)
      fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    const priceChange =
      input.pricePerHourPaisa !== undefined ||
      input.securityDepositPaisa !== undefined ||
      input.overtimeBillingMode !== undefined ||
      input.overtimeMultiplierBps !== undefined ||
      input.overtimeRatePerHourPaisa !== undefined ||
      input.overtimeGracePeriodMinutes !== undefined;
    const nonPriceChange =
      input.title !== undefined ||
      input.description !== undefined ||
      input.minDurationMinutes !== undefined ||
      input.maxDurationMinutes !== undefined ||
      input.allowedVehicleTypes !== undefined;
    let requiredPermission: ManagerDelegationPermission =
      ManagerDelegationPermission.LISTING_MANAGE;
    if (priceChange && !nonPriceChange) {
      requiredPermission = ManagerDelegationPermission.PRICE_MANAGE;
    }
    const authority = await requireAuthority(
      actorUserId,
      listing.parkingSpot.propertyId,
      requiredPermission,
      listing.parkingSpotId,
      tx,
    );
    if (priceChange && nonPriceChange && authority.managed) {
      await requireAuthority(
        actorUserId,
        listing.parkingSpot.propertyId,
        ManagerDelegationPermission.PRICE_MANAGE,
        listing.parkingSpotId,
        tx,
      );
    }
    if (
      listing.status === ParkingListingStatus.ENDED ||
      listing.status === ParkingListingStatus.SUSPENDED
    ) {
      fail(
        409,
        "PARKING_LISTING_STATE_INVALID",
        "Listing cannot be edited in its current state",
      );
    }
    if (
      input.minDurationMinutes !== undefined ||
      input.maxDurationMinutes !== undefined
    ) {
      const min = Number(
        input.minDurationMinutes ?? listing.minDurationMinutes,
      );
      const max = Number(
        input.maxDurationMinutes ?? listing.maxDurationMinutes,
      );
      if (max < min)
        fail(
          400,
          "LISTING_DURATION_INVALID",
          "Maximum duration must be at least the minimum duration",
        );
    }
    const updateData: JsonObject = { ...input };
    const overtimeMode =
      input.overtimeBillingMode ?? listing.overtimeBillingMode;
    if (overtimeMode === OvertimeBillingMode.MULTIPLIER) {
      updateData.overtimeMultiplierBps =
        input.overtimeMultiplierBps ?? listing.overtimeMultiplierBps ?? 15_000;
      updateData.overtimeRatePerHourPaisa = null;
    } else {
      updateData.overtimeMultiplierBps = null;
      updateData.overtimeRatePerHourPaisa =
        input.overtimeRatePerHourPaisa ?? listing.overtimeRatePerHourPaisa;
      if (
        updateData.overtimeRatePerHourPaisa === null ||
        updateData.overtimeRatePerHourPaisa === undefined
      ) {
        fail(
          400,
          "OVERTIME_RATE_REQUIRED",
          "A fixed overtime rate is required",
        );
      }
    }
    const updated = await tx.parkingListing.update({
      where: { id: listingId },
      data: updateData as Prisma.ParkingListingUpdateInput,
    });
    if (
      input.pricePerHourPaisa !== undefined &&
      BigInt(input.pricePerHourPaisa as string | number | bigint) !==
        listing.pricePerHourPaisa
    ) {
      await tx.parkingListingPriceHistory.create({
        data: {
          parkingListingId: listing.id,
          previousPricePaisa: listing.pricePerHourPaisa,
          pricePerHourPaisa: updated.pricePerHourPaisa,
          changedByUserId: actorUserId,
        },
      });
    }
    notifyUser(authority.membership.providerUserId, "listing:updated", {
      listingId: listing.id,
      propertyId: listing.parkingSpot.propertyId,
    });
    if (priceChange) {
      notifyUser(authority.membership.providerUserId, "listing:price_updated", {
        listingId: listing.id,
        propertyId: listing.parkingSpot.propertyId,
      });
    }
    if (authority.managed) {
      notifyUser(actorUserId, "listing:updated", {
        listingId: listing.id,
        propertyId: listing.parkingSpot.propertyId,
      });
      if (priceChange) {
        notifyUser(actorUserId, "listing:price_updated", {
          listingId: listing.id,
          propertyId: listing.parkingSpot.propertyId,
        });
      }
    }
    return serialize(updated);
  });
}

async function changeListingStatus(
  actorUserId: string,
  listingId: string,
  activate: boolean,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-listing", listingId);
      const listing = await tx.parkingListing.findUnique({
        where: { id: listingId },
        include: {
          parkingSpot: { include: { property: true, availabilityRules: true } },
          parkingRight: true,
          parkingResourceUnit: true,
        },
      });
      if (!listing)
        fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
      const authority = await requireAuthority(
        actorUserId,
        listing.parkingSpot.propertyId,
        ManagerDelegationPermission.LISTING_MANAGE,
        listing.parkingSpotId,
        tx,
      );
      const now = new Date();
      if (activate) {
        if (
          listing.status === ParkingListingStatus.SUSPENDED ||
          listing.status === ParkingListingStatus.ENDED
        ) {
          fail(
            409,
            "PARKING_LISTING_STATE_INVALID",
            "Suspended or ended listing cannot be activated",
          );
        }
        const rightValid =
          listing.parkingRight.status === ParkingRightStatus.VERIFIED &&
          listing.parkingRight.canList &&
          listing.parkingRight.rightType !== ParkingRightType.USE_ONLY &&
          listing.parkingRight.validFrom <= now &&
          (!listing.parkingRight.validUntil ||
            listing.parkingRight.validUntil > now);
        if (
          listing.parkingSpot.property.status !== PropertyStatus.ACTIVE ||
          listing.parkingSpot.property.verificationStatus !==
            VerificationStatus.VERIFIED
        ) {
          fail(
            409,
            "PARKING_LISTING_NOT_ELIGIBLE",
            "Property must be active and verified before activating this listing",
          );
        }
        if (!rightValid) {
          fail(
            409,
            "PARKING_LISTING_NOT_ELIGIBLE",
            "A verified, active commercial parking right is required before activating this listing",
          );
        }
        if (
          listing.parkingSpot.status !== ParkingSpotStatus.ACTIVE ||
          (listing.parkingResourceUnit &&
            listing.parkingResourceUnit.status !== ParkingSpotStatus.ACTIVE)
        ) {
          fail(
            409,
            "PARKING_LISTING_NOT_ELIGIBLE",
            "The parking space or unit must be ACTIVE before activating this listing",
          );
        }
        const hasCurrentAvailability =
          listing.parkingSpot.availabilityRules.some(
            (rule) =>
              rule.isActive &&
              rule.validFrom <= now &&
              (!rule.validUntil || rule.validUntil >= now),
          );
        if (!hasCurrentAvailability) {
          fail(
            409,
            "PARKING_LISTING_AVAILABILITY_REQUIRED",
            "Configure current weekly availability before activating this listing",
          );
        }
        if (
          listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
        ) {
          const conflict = await tx.parkingListing.findFirst({
            where: {
              parkingSpotId: listing.parkingSpotId,
              parkingResourceUnitId: listing.parkingResourceUnitId,
              id: { not: listing.id },
              status: ParkingListingStatus.ACTIVE,
            },
            select: { id: true },
          });
          if (conflict)
            fail(
              409,
              "PARKING_LISTING_CONFLICT",
              "This fixed space already has an active listing",
            );
        }
      }
      const updated = await tx.parkingListing.update({
        where: { id: listing.id },
        data: activate
          ? {
              status: ParkingListingStatus.ACTIVE,
              publishedAt: listing.publishedAt ?? now,
              deactivatedAt: null,
            }
          : { status: ParkingListingStatus.PAUSED, deactivatedAt: now },
      });
      await audit(
        tx,
        activate
          ? DomainAuditEventType.LISTING_ACTIVATED
          : DomainAuditEventType.LISTING_PAUSED,
        actorUserId,
        listing.parkingSpot.propertyId,
        "ParkingListing",
        listing.id,
        authority.managed
          ? {
              actorRole: "MANAGER",
              authorityType: "MANAGER_DELEGATION",
              delegationId: authority.delegationId,
              providerUserId: authority.membership.providerUserId,
            }
          : undefined,
      );
      notifyUser(
        authority.membership.providerUserId,
        "listing:status_changed",
        {
          listingId: listing.id,
          propertyId: listing.parkingSpot.propertyId,
          status: activate ? "ACTIVE" : "PAUSED",
        },
      );
      notifyUser(authority.membership.providerUserId, "listing:updated", {
        listingId: listing.id,
        propertyId: listing.parkingSpot.propertyId,
      });
      if (authority.managed) {
        notifyUser(actorUserId, "listing:status_changed", {
          listingId: listing.id,
          propertyId: listing.parkingSpot.propertyId,
          status: activate ? "ACTIVE" : "PAUSED",
        });
        notifyUser(actorUserId, "listing:updated", {
          listingId: listing.id,
          propertyId: listing.parkingSpot.propertyId,
        });
      }
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export const activateListing = (actorUserId: string, listingId: string) =>
  changeListingStatus(actorUserId, listingId, true);
export const pauseListing = (actorUserId: string, listingId: string) =>
  changeListingStatus(actorUserId, listingId, false);

export async function endListing(actorUserId: string, listingId: string) {
  const listing = await prisma.parkingListing.findUnique({
    where: { id: listingId },
    include: { parkingSpot: true },
  });
  if (!listing)
    fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
  const authority = await requireAuthority(
    actorUserId,
    listing.parkingSpot.propertyId,
    ManagerDelegationPermission.LISTING_MANAGE,
    listing.parkingSpotId,
  );
  const updated = await prisma.parkingListing.update({
    where: { id: listingId },
    data: { status: ParkingListingStatus.ENDED, deactivatedAt: new Date() },
  });
  notifyUser(authority.membership.providerUserId, "listing:status_changed", {
    listingId,
    propertyId: listing.parkingSpot.propertyId,
    status: "ENDED",
  });
  if (authority.managed) {
    notifyUser(actorUserId, "listing:status_changed", {
      listingId,
      propertyId: listing.parkingSpot.propertyId,
      status: "ENDED",
    });
  }
  return serialize(updated);
}

const adminListingInclude = {
  provider: { select: { id: true, fullName: true, email: true, status: true } },
  providerMembership: {
    select: { id: true, status: true, verificationStatus: true },
  },
  parkingRight: {
    select: {
      id: true,
      rightType: true,
      status: true,
      quantity: true,
      validFrom: true,
      validUntil: true,
    },
  },
  parkingResourceUnit: {
    select: { id: true, spotCode: true, displayName: true, status: true },
  },
  priceHistory: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      previousPricePaisa: true,
      pricePerHourPaisa: true,
      createdAt: true,
      changedBy: { select: { id: true, fullName: true } },
    },
  },
  parkingSpot: {
    select: {
      id: true,
      displayName: true,
      spotCode: true,
      resourceType: true,
      status: true,
      property: {
        select: {
          id: true,
          name: true,
          publicArea: true,
          verificationStatus: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.ParkingListingInclude;

export async function listAdminListings(input: {
  page: number;
  limit: number;
  search?: string;
  status?: ParkingListingStatus;
  providerUserId?: string;
  propertyId?: string;
}) {
  const where: Prisma.ParkingListingWhereInput = {
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: "insensitive" } },
            {
              provider: {
                fullName: { contains: input.search, mode: "insensitive" },
              },
            },
            {
              provider: {
                email: { contains: input.search, mode: "insensitive" },
              },
            },
            {
              parkingSpot: {
                property: {
                  name: { contains: input.search, mode: "insensitive" },
                },
              },
            },
            {
              parkingSpot: {
                spotCode: { contains: input.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.providerUserId ? { providerUserId: input.providerUserId } : {}),
    ...(input.propertyId
      ? { parkingSpot: { propertyId: input.propertyId } }
      : {}),
  };
  const [listings, total] = await Promise.all([
    prisma.parkingListing.findMany({
      where,
      include: adminListingInclude,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.parkingListing.count({ where }),
  ]);
  return serialize({
    listings,
    pagination: pagination(input.page, input.limit, total),
  });
}

const adminParkingRightInclude = {
  holder: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
    },
  },
  verifiedByAdmin: { select: { id: true, fullName: true, email: true } },
  providerMembership: {
    select: {
      id: true,
      status: true,
      verificationStatus: true,
      propertyId: true,
    },
  },
  parkingSpot: {
    select: {
      id: true,
      displayName: true,
      spotCode: true,
      resourceType: true,
      capacity: true,
      status: true,
      property: {
        select: {
          id: true,
          name: true,
          publicArea: true,
          verificationStatus: true,
          status: true,
        },
      },
    },
  },
  documents: {
    select: {
      id: true,
      category: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ParkingRightInclude;

export async function listAdminParkingRights(input: {
  page: number;
  limit: number;
  status?: ParkingRightStatus;
  propertyId?: string;
  holderUserId?: string;
}) {
  const where: Prisma.ParkingRightWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.propertyId
      ? { parkingSpot: { propertyId: input.propertyId } }
      : {}),
    ...(input.holderUserId ? { holderUserId: input.holderUserId } : {}),
  };
  const [rights, total] = await Promise.all([
    prisma.parkingRight.findMany({
      where,
      include: adminParkingRightInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.parkingRight.count({ where }),
  ]);
  return serialize({
    rights,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function getAdminListing(listingId: string) {
  const listing = await prisma.parkingListing.findUnique({
    where: { id: listingId },
    include: adminListingInclude,
  });
  if (!listing)
    fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
  return serialize(listing);
}

export async function suspendListing(
  adminUserId: string,
  listingId: string,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-listing", listingId);
    const listing = await tx.parkingListing.findUnique({
      where: { id: listingId },
      include: { parkingSpot: { select: { propertyId: true } } },
    });
    if (!listing)
      fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    if (listing.status === ParkingListingStatus.ENDED) {
      fail(
        409,
        "PARKING_LISTING_STATE_INVALID",
        "An ended listing cannot be suspended",
      );
    }
    if (listing.status === ParkingListingStatus.SUSPENDED)
      return serialize(listing);
    const updated = await tx.parkingListing.update({
      where: { id: listing.id },
      data: {
        status: ParkingListingStatus.SUSPENDED,
        deactivatedAt: new Date(),
      },
    });
    await notification(tx, {
      userId: listing.providerUserId,
      type: "PROPERTY_GOVERNANCE",
      title: "Listing suspended",
      message: `Your listing was suspended: ${reason}`,
      entityType: "ParkingListing",
      entityId: listing.id,
      idempotencyKey: `listing-suspended:${listing.id}:${updated.updatedAt.toISOString()}`,
    });
    await audit(
      tx,
      DomainAuditEventType.LISTING_SUSPENDED,
      adminUserId,
      listing.parkingSpot.propertyId,
      "ParkingListing",
      listing.id,
      { reason },
    );
    return serialize(updated);
  });
}

export async function replaceAvailability(
  actorUserId: string,
  resourceId: string,
  rules: Array<{
    dayOfWeek: number;
    startLocalTime: string;
    endLocalTime: string;
    validFrom: string;
    validUntil?: string;
  }>,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource)
      fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    await requireAuthority(
      actorUserId,
      resource.propertyId,
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
      resourceId,
      tx,
    );
    await tx.availabilityRule.deleteMany({
      where: { parkingSpotId: resourceId },
    });
    if (rules.length > 0) {
      await tx.availabilityRule.createMany({
        data: rules.map((rule) => ({
          parkingSpotId: resourceId,
          dayOfWeek: rule.dayOfWeek,
          startLocalTime: timeValue(rule.startLocalTime),
          endLocalTime: timeValue(rule.endLocalTime),
          validFrom: new Date(`${rule.validFrom}T00:00:00.000Z`),
          validUntil: rule.validUntil
            ? new Date(`${rule.validUntil}T00:00:00.000Z`)
            : null,
        })),
      });
    }
    return tx.availabilityRule.findMany({
      where: { parkingSpotId: resourceId },
      orderBy: [{ dayOfWeek: "asc" }, { startLocalTime: "asc" }],
    });
  });
}

export async function createAvailabilityException(
  actorUserId: string,
  resourceId: string,
  input: {
    startsAt: string;
    endsAt: string;
    exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE";
    reason?: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource)
      fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    await requireAuthority(
      actorUserId,
      resource.propertyId,
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
      resourceId,
      tx,
    );
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    await ensureAvailabilityExceptionAllowed(
      tx,
      resourceId,
      startsAt,
      endsAt,
      input.exceptionType,
    );
    return tx.availabilityException.create({
      data: {
        parkingSpotId: resourceId,
        startsAt,
        endsAt,
        exceptionType: input.exceptionType,
        reason: input.reason ?? null,
        createdByUserId: actorUserId,
      },
    });
  });
}

export async function resumeListing(
  adminUserId: string,
  listingId: string,
  reason: string,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "parking-listing", listingId);
      const listing = await tx.parkingListing.findUnique({
        where: { id: listingId },
        include: {
          provider: { select: { status: true } },
          providerMembership: {
            select: { status: true, verificationStatus: true },
          },
          parkingSpot: { include: { property: true, availabilityRules: true } },
          parkingRight: true,
          parkingResourceUnit: true,
        },
      });
      if (!listing)
        fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
      if (listing.status !== ParkingListingStatus.SUSPENDED)
        fail(
          409,
          "LISTING_NOT_SUSPENDED",
          "Only a suspended listing can be resumed",
        );
      const now = new Date();
      const reasons: string[] = [];
      if (listing.provider.status !== UserStatus.ACTIVE)
        reasons.push("PROVIDER_SUSPENDED");
      if (
        listing.providerMembership.status !== "ACTIVE" ||
        listing.providerMembership.verificationStatus !==
          VerificationStatus.VERIFIED
      )
        reasons.push("PROVIDER_MEMBERSHIP_INACTIVE");
      if (
        listing.parkingSpot.deletedAt ||
        listing.parkingSpot.status !== ParkingSpotStatus.ACTIVE
      )
        reasons.push("RESOURCE_INACTIVE");
      if (
        listing.parkingResourceUnit &&
        (listing.parkingResourceUnit.deletedAt ||
          listing.parkingResourceUnit.status !== ParkingSpotStatus.ACTIVE)
      )
        reasons.push("RESOURCE_UNIT_INACTIVE");
      if (listing.parkingSpot.property.status !== PropertyStatus.ACTIVE)
        reasons.push("PROPERTY_INACTIVE");
      if (
        listing.parkingSpot.property.verificationStatus !==
        VerificationStatus.VERIFIED
      )
        reasons.push("PROPERTY_UNVERIFIED");
      if (listing.parkingRight.status === ParkingRightStatus.REVOKED)
        reasons.push("RIGHT_REVOKED");
      else if (listing.parkingRight.status !== ParkingRightStatus.VERIFIED)
        reasons.push("RIGHT_NOT_VERIFIED");
      if (
        !listing.parkingRight.canList ||
        listing.parkingRight.rightType === ParkingRightType.USE_ONLY
      )
        reasons.push("RIGHT_CANNOT_LIST");
      if (listing.parkingRight.validFrom > now)
        reasons.push("RIGHT_NOT_YET_VALID");
      if (
        listing.parkingRight.validUntil &&
        listing.parkingRight.validUntil <= now
      )
        reasons.push("RIGHT_EXPIRED");
      if (
        !listing.parkingSpot.availabilityRules.some(
          (rule) =>
            rule.isActive &&
            rule.validFrom <= now &&
            (!rule.validUntil || rule.validUntil >= now),
        )
      )
        reasons.push("AVAILABILITY_MISSING");
      if (reasons.length > 0) {
        fail(
          409,
          "LISTING_RESUME_REQUIREMENTS_NOT_MET",
          "The listing cannot be resumed until all dependencies are eligible",
          { eligible: false, reasons },
        );
      }
      const updated = await tx.parkingListing.update({
        where: { id: listing.id },
        data: {
          status: ParkingListingStatus.ACTIVE,
          publishedAt: listing.publishedAt ?? now,
          deactivatedAt: null,
        },
      });
      await notification(tx, {
        userId: listing.providerUserId,
        type: "PROPERTY_GOVERNANCE",
        title: "Listing resumed",
        message: "Your listing is active again after Admin review.",
        entityType: "ParkingListing",
        entityId: listing.id,
        idempotencyKey: `listing-resumed:${listing.id}:${updated.updatedAt.toISOString()}`,
      });
      await audit(
        tx,
        DomainAuditEventType.LISTING_RESUMED,
        adminUserId,
        listing.parkingSpot.propertyId,
        "ParkingListing",
        listing.id,
        { reason },
      );
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function reportListing(
  reporterUserId: string,
  listingId: string,
  input: { reason: string; details?: string },
) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.parkingListing.findUnique({
      where: { id: listingId },
      include: { parkingSpot: { select: { propertyId: true } } },
    });
    if (!listing || listing.status === ParkingListingStatus.ENDED)
      fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    const report = await tx.listingReport.create({
      data: {
        listingId,
        reporterUserId,
        reason: input.reason,
        details: input.details ?? null,
      },
    });
    await audit(
      tx,
      DomainAuditEventType.LISTING_REPORTED,
      reporterUserId,
      listing.parkingSpot.propertyId,
      "ListingReport",
      report.id,
      { listingId, reason: input.reason },
    );
    return report;
  });
}

async function ensureAvailabilityExceptionAllowed(
  tx: MarketplaceDb,
  resourceId: string,
  startsAt: Date,
  endsAt: Date,
  exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE",
  excludeId?: string,
) {
  const existing = await tx.availabilityException.findFirst({
    where: {
      parkingSpotId: resourceId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing)
    fail(
      409,
      "AVAILABILITY_EXCEPTION_OVERLAP",
      "An availability exception already overlaps this period",
    );
  if (exceptionType !== "BLOCKED") return;
  const booking = await tx.booking.findFirst({
    where: {
      parkingSpotId: resourceId,
      status: {
        in: [
          BookingStatus.PAYMENT_PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.CHECKOUT_REQUESTED,
          BookingStatus.PAYMENT_DUE,
          BookingStatus.DISPUTED,
        ],
      },
      startAt: { lt: endsAt },
      effectiveEndAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (booking)
    fail(
      409,
      "AVAILABILITY_EXCEPTION_BOOKING_CONFLICT",
      "This blocked period conflicts with an active booking",
    );
}

export async function updateAvailabilityException(
  actorUserId: string,
  exceptionId: string,
  input: {
    startsAt?: string;
    endsAt?: string;
    exceptionType?: "BLOCKED" | "SPECIAL_AVAILABLE";
    reason?: string | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "availability-exception", exceptionId);
    const existing = await tx.availabilityException.findUnique({
      where: { id: exceptionId },
      include: {
        parkingSpot: { select: { propertyId: true, deletedAt: true } },
      },
    });
    if (!existing || existing.parkingSpot.deletedAt)
      fail(
        404,
        "AVAILABILITY_EXCEPTION_NOT_FOUND",
        "Availability exception was not found",
      );
    await requireAuthority(
      actorUserId,
      existing.parkingSpot.propertyId,
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
      existing.parkingSpotId,
      tx,
    );
    const startsAt = input.startsAt
      ? new Date(input.startsAt)
      : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;
    if (endsAt <= startsAt)
      fail(
        400,
        "AVAILABILITY_EXCEPTION_PERIOD_INVALID",
        "endsAt must be later than startsAt",
      );
    const exceptionType = input.exceptionType ?? existing.exceptionType;
    await ensureAvailabilityExceptionAllowed(
      tx,
      existing.parkingSpotId,
      startsAt,
      endsAt,
      exceptionType,
      existing.id,
    );
    return tx.availabilityException.update({
      where: { id: existing.id },
      data: {
        ...(input.startsAt ? { startsAt } : {}),
        ...(input.endsAt ? { endsAt } : {}),
        ...(input.exceptionType ? { exceptionType } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
      },
    });
  });
}

export async function deleteAvailabilityException(
  actorUserId: string,
  exceptionId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "availability-exception", exceptionId);
    const existing = await tx.availabilityException.findUnique({
      where: { id: exceptionId },
      include: {
        parkingSpot: { select: { propertyId: true, deletedAt: true } },
      },
    });
    if (!existing || existing.parkingSpot.deletedAt)
      fail(
        404,
        "AVAILABILITY_EXCEPTION_NOT_FOUND",
        "Availability exception was not found",
      );
    await requireAuthority(
      actorUserId,
      existing.parkingSpot.propertyId,
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
      existing.parkingSpotId,
      tx,
    );
    await tx.availabilityException.delete({ where: { id: existing.id } });
  });
}

export async function listAvailability(
  actorUserId: string,
  resourceId: string,
) {
  const resource = await prisma.parkingSpot.findFirst({
    where: { id: resourceId, deletedAt: null },
  });
  if (!resource)
    fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
  await requireAuthority(
    actorUserId,
    resource.propertyId,
    ManagerDelegationPermission.RESOURCE_VIEW,
    resourceId,
  );
  const [rules, exceptions] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { parkingSpotId: resourceId },
      orderBy: [{ dayOfWeek: "asc" }, { startLocalTime: "asc" }],
    }),
    prisma.availabilityException.findMany({
      where: { parkingSpotId: resourceId },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  return { timeZone: DHAKA_TIME_ZONE, rules, exceptions };
}

async function loadBookableListing(listingId: string) {
  return prisma.parkingListing.findFirst({
    where: {
      id: listingId,
      status: ParkingListingStatus.ACTIVE,
      provider: { status: UserStatus.ACTIVE, deletedAt: null },
      parkingRight: activeRightWhere(),
      parkingSpot: {
        deletedAt: null,
        status: ParkingSpotStatus.ACTIVE,
        property: {
          deletedAt: null,
          canonicalPropertyId: null,
          status: PropertyStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      OR: [
        { parkingResourceUnitId: null },
        {
          parkingResourceUnit: {
            deletedAt: null,
            status: ParkingSpotStatus.ACTIVE,
          },
        },
      ],
    },
    include: {
      parkingRight: true,
      parkingResourceUnit: true,
      parkingSpot: {
        include: {
          property: true,
          units: {
            where: { deletedAt: null, status: ParkingSpotStatus.ACTIVE },
            orderBy: { normalizedSpotCode: "asc" },
          },
          availabilityRules: true,
          availabilityExceptions: true,
          facilities: { include: { facility: true } },
        },
      },
    },
  });
}

async function ensureListingAvailable(
  listing: NonNullable<Awaited<ReturnType<typeof loadBookableListing>>>,
  startAt: Date,
  endAt: Date,
) {
  if (!(await isResourceAvailable(listing.parkingSpot, startAt, endAt)))
    return false;
  return (await availableListingUnits(listing, startAt, endAt)) > 0;
}

async function availableListingUnits(
  listing: NonNullable<Awaited<ReturnType<typeof loadBookableListing>>>,
  startAt: Date,
  endAt: Date,
) {
  const physicalCapacity =
    listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
      ? listing.parkingResourceUnitId
        ? 1
        : listing.parkingSpot.units.length
      : listing.parkingSpot.capacity;
  const rightCapacity = Math.min(
    physicalCapacity,
    listing.parkingRight.quantity,
  );
  const [rightAllocations, resourceAllocations] = await Promise.all([
    activeAllocationCount(
      listing.parkingSpotId,
      listing.parkingRightId,
      startAt,
      endAt,
    ),
    prisma.parkingAllocation.count({
      where: {
        parkingSpotId: listing.parkingSpotId,
        status: {
          in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED],
        },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        OR: [
          { status: ParkingAllocationStatus.BOOKED },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ]);
  return Math.max(
    0,
    Math.min(
      rightCapacity - rightAllocations,
      listing.parkingSpot.capacity - resourceAllocations,
    ),
  );
}

async function availableUnitsForListings(
  listings: Array<NonNullable<Awaited<ReturnType<typeof loadBookableListing>>>>,
  startAt: Date,
  endAt: Date,
) {
  if (listings.length === 0) return new Map<string, number>();
  const allocations = await prisma.parkingAllocation.findMany({
    where: {
      parkingSpotId: {
        in: [...new Set(listings.map((listing) => listing.parkingSpotId))],
      },
      status: {
        in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      OR: [
        { status: ParkingAllocationStatus.BOOKED },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      parkingSpotId: true,
      parkingRightId: true,
      parkingResourceUnitId: true,
    },
  });
  const resourceCounts = new Map<string, number>();
  const rightCounts = new Map<string, number>();
  const allocatedUnitIds = new Set<string>();
  for (const allocation of allocations) {
    resourceCounts.set(
      allocation.parkingSpotId,
      (resourceCounts.get(allocation.parkingSpotId) ?? 0) + 1,
    );
    const key = `${allocation.parkingSpotId}:${allocation.parkingRightId}`;
    rightCounts.set(key, (rightCounts.get(key) ?? 0) + 1);
    if (allocation.parkingResourceUnitId)
      allocatedUnitIds.add(allocation.parkingResourceUnitId);
  }
  return new Map(
    listings.map((listing) => {
      if (listing.parkingResourceUnitId) {
        return [
          listing.id,
          allocatedUnitIds.has(listing.parkingResourceUnitId) ? 0 : 1,
        ];
      }
      const physicalCapacity =
        listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
          ? listing.parkingSpot.units.length
          : listing.parkingSpot.capacity;
      const rightCapacity = Math.min(
        physicalCapacity,
        listing.parkingRight.quantity,
      );
      const rightCount =
        rightCounts.get(`${listing.parkingSpotId}:${listing.parkingRightId}`) ??
        0;
      const resourceCount = resourceCounts.get(listing.parkingSpotId) ?? 0;
      return [
        listing.id,
        Math.max(
          0,
          Math.min(
            rightCapacity - rightCount,
            physicalCapacity - resourceCount,
          ),
        ),
      ];
    }),
  );
}

export async function browseParking(input: {
  latitude: number;
  longitude: number;
}) {
  const listings = await prisma.parkingListing.findMany({
    where: {
      status: ParkingListingStatus.ACTIVE,
      provider: { status: UserStatus.ACTIVE, deletedAt: null },
      parkingRight: { ...activeRightWhere(), canList: true, canSetPrice: true },
      OR: [
        { parkingResourceUnitId: null },
        {
          parkingResourceUnit: {
            deletedAt: null,
            status: ParkingSpotStatus.ACTIVE,
          },
        },
      ],
      parkingSpot: {
        deletedAt: null,
        status: ParkingSpotStatus.ACTIVE,
        property: {
          deletedAt: null,
          canonicalPropertyId: null,
          status: PropertyStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
    include: {
      parkingRight: true,
      parkingResourceUnit: true,
      parkingSpot: {
        include: {
          property: {
            include: { images: { where: { isCover: true }, take: 1 } },
          },
          units: {
            where: { deletedAt: null, status: ParkingSpotStatus.ACTIVE },
          },
          facilities: { include: { facility: true } },
        },
      },
    },
    take: 500,
  });
  const groups = new Map<
    string,
    {
      property: {
        id: string;
        name: string;
        publicArea: string;
        approximateAddress: string;
        latitude: number;
        longitude: number;
        coverImageUrl: string | null;
      };
      offers: JsonObject[];
      distanceKm: number;
      availableUnits: number;
      availableUnitsByResource: Map<string, number>;
    }
  >();

  for (const listing of listings) {
    const property = listing.parkingSpot.property;
    const physicalCapacity = listing.parkingResourceUnitId
      ? 1
      : listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
        ? listing.parkingSpot.units.length
        : listing.parkingSpot.capacity;
    const availableUnits = Math.max(
      0,
      Math.min(physicalCapacity, listing.parkingRight.quantity),
    );
    if (availableUnits === 0) continue;
    const distanceKm = haversineKm(
      input.latitude,
      input.longitude,
      Number(property.latitude),
      Number(property.longitude),
    );
    const group = groups.get(property.id) ?? {
      property: {
        id: property.id,
        name: property.name,
        publicArea: property.publicArea,
        approximateAddress: property.approximateAddress,
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
        coverImageUrl: property.images[0]?.url ?? null,
      },
      offers: [],
      distanceKm,
      availableUnits: 0,
      availableUnitsByResource: new Map<string, number>(),
    };
    group.offers.push({
      listingId: listing.id,
      resourceType: listing.parkingSpot.resourceType,
      title: listing.title,
      pricePerHourPaisa: listing.pricePerHourPaisa.toString(),
      allowedVehicleTypes: listing.allowedVehicleTypes,
      isCovered: listing.parkingSpot.isCovered,
      facilities: listing.parkingSpot.facilities.map(
        (item) => item.facility.code,
      ),
      availableUnits,
    });
    group.availableUnitsByResource.set(
      listing.parkingSpotId,
      Math.max(
        group.availableUnitsByResource.get(listing.parkingSpotId) ?? 0,
        availableUnits,
      ),
    );
    group.availableUnits = [...group.availableUnitsByResource.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    groups.set(property.id, group);
  }

  return [...groups.values()]
    .map((group) => {
      const prices = group.offers.map((offer) =>
        BigInt(String(offer.pricePerHourPaisa)),
      );
      return {
        ...group.property,
        distanceKm: Number(group.distanceKm.toFixed(2)),
        availableUnits: group.availableUnits,
        minimumPricePaisa: prices.reduce((a, b) => (a < b ? a : b)).toString(),
        maximumPricePaisa: prices.reduce((a, b) => (a > b ? a : b)).toString(),
        offers: group.offers,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function searchParking(input: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  startAt: string;
  endAt: string;
  vehicleType: VehicleType;
  minPricePaisa?: bigint;
  maxPricePaisa?: bigint;
  covered?: boolean;
  hasCctv?: boolean;
  hasGuard?: boolean;
  resourceType?: ParkingResourceType;
  facilityCodes?: string[];
  minAvailableUnits?: number;
}) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const durationMinutes = Math.ceil(
    (endAt.getTime() - startAt.getTime()) / 60_000,
  );
  const listings = await prisma.parkingListing.findMany({
    where: {
      status: ParkingListingStatus.ACTIVE,
      allowedVehicleTypes: { has: input.vehicleType },
      minDurationMinutes: { lte: durationMinutes },
      maxDurationMinutes: { gte: durationMinutes },
      ...(input.minPricePaisa === undefined
        ? {}
        : { pricePerHourPaisa: { gte: input.minPricePaisa } }),
      ...(input.maxPricePaisa === undefined
        ? {}
        : { pricePerHourPaisa: { lte: input.maxPricePaisa } }),
      provider: { status: UserStatus.ACTIVE, deletedAt: null },
      parkingRight: {
        status: ParkingRightStatus.VERIFIED,
        canList: true,
        canSetPrice: true,
        validFrom: { lte: startAt },
        OR: [{ validUntil: null }, { validUntil: { gte: endAt } }],
      },
      OR: [
        { parkingResourceUnitId: null },
        {
          parkingResourceUnit: {
            deletedAt: null,
            status: ParkingSpotStatus.ACTIVE,
          },
        },
      ],
      parkingSpot: {
        deletedAt: null,
        status: ParkingSpotStatus.ACTIVE,
        ...(input.covered === undefined ? {} : { isCovered: input.covered }),
        ...(input.hasCctv === undefined ? {} : { hasCctv: input.hasCctv }),
        ...(input.hasGuard === undefined ? {} : { hasGuard: input.hasGuard }),
        ...(input.resourceType === undefined
          ? {}
          : { resourceType: input.resourceType }),
        ...(input.facilityCodes?.length
          ? {
              facilities: {
                some: { facility: { code: { in: input.facilityCodes } } },
              },
            }
          : {}),
        property: {
          deletedAt: null,
          canonicalPropertyId: null,
          status: PropertyStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
    include: {
      parkingRight: true,
      parkingResourceUnit: true,
      parkingSpot: {
        include: {
          property: {
            include: { images: { where: { isCover: true }, take: 1 } },
          },
          units: {
            where: { deletedAt: null, status: ParkingSpotStatus.ACTIVE },
            orderBy: { normalizedSpotCode: "asc" },
          },
          availabilityRules: true,
          availabilityExceptions: true,
          facilities: { include: { facility: true } },
        },
      },
    },
    take: 500,
  });
  const groups = new Map<
    string,
    {
      property: {
        id: string;
        name: string;
        publicArea: string;
        approximateAddress: string;
        latitude: number;
        longitude: number;
        coverImageUrl: string | null;
      };
      offers: JsonObject[];
      distanceKm: number;
      availableUnits: number;
      availableUnitsByResource: Map<string, number>;
    }
  >();
  const unitsByListing = await availableUnitsForListings(
    listings,
    startAt,
    endAt,
  );
  for (const listing of listings) {
    const property = listing.parkingSpot.property;
    const facilityCodes = new Set(
      listing.parkingSpot.facilities.map((item) => item.facility.code),
    );
    if (input.facilityCodes?.some((code) => !facilityCodes.has(code))) continue;
    const distanceKm = haversineKm(
      input.latitude,
      input.longitude,
      Number(property.latitude),
      Number(property.longitude),
    );
    if (
      distanceKm > input.radiusKm ||
      !(await isResourceAvailable(listing.parkingSpot, startAt, endAt))
    )
      continue;
    const availableUnits = unitsByListing.get(listing.id) ?? 0;
    if (
      availableUnits === 0 ||
      (input.minAvailableUnits !== undefined &&
        availableUnits < input.minAvailableUnits)
    )
      continue;
    const group = groups.get(property.id) ?? {
      property: {
        id: property.id,
        name: property.name,
        publicArea: property.publicArea,
        approximateAddress: property.approximateAddress,
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
        coverImageUrl: property.images[0]?.url ?? null,
      },
      offers: [],
      distanceKm,
      availableUnits: 0,
      availableUnitsByResource: new Map<string, number>(),
    };
    group.offers.push({
      listingId: listing.id,
      resourceType: listing.parkingSpot.resourceType,
      title: listing.title,
      pricePerHourPaisa: listing.pricePerHourPaisa.toString(),
      allowedVehicleTypes: listing.allowedVehicleTypes,
      isCovered: listing.parkingSpot.isCovered,
      facilities: listing.parkingSpot.facilities.map(
        (item) => item.facility.code,
      ),
      availableUnits,
    });
    group.availableUnitsByResource.set(
      listing.parkingSpotId,
      Math.max(
        group.availableUnitsByResource.get(listing.parkingSpotId) ?? 0,
        availableUnits,
      ),
    );
    group.availableUnits = [...group.availableUnitsByResource.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    groups.set(property.id, group);
  }
  return [...groups.values()]
    .map((group) => {
      const prices = group.offers.map((offer) =>
        BigInt(String(offer.pricePerHourPaisa)),
      );
      return {
        ...group.property,
        distanceKm: Number(group.distanceKm.toFixed(2)),
        availableUnits: group.availableUnits,
        minimumPricePaisa: prices.reduce((a, b) => (a < b ? a : b)).toString(),
        maximumPricePaisa: prices.reduce((a, b) => (a > b ? a : b)).toString(),
        offers: group.offers,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getPublicPropertyDetail(
  propertyId: string,
  input: {
    startAt: string;
    endAt: string;
    vehicleType: VehicleType;
  },
) {
  const [property, listings, reviewSummary, reviews, ratingGroups] =
    await Promise.all([
      prisma.property.findFirst({
        where: {
          id: propertyId,
          deletedAt: null,
          canonicalPropertyId: null,
          status: PropertyStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        select: {
          id: true,
          name: true,
          description: true,
          publicArea: true,
          approximateAddress: true,
          latitude: true,
          longitude: true,
          visitorIdentificationRequired: true,
          vehicleHeightLimitCm: true,
          entryCutoffLocalTime: true,
          generalParkingRules: true,
          commonSafetyRules: true,
          temporaryClosureReason: true,
          temporaryClosedAt: true,
          temporaryClosedUntil: true,
          images: {
            select: {
              id: true,
              url: true,
              imageType: true,
              sortOrder: true,
              isCover: true,
            },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          },
        },
      }),
      prisma.parkingListing.findMany({
        where: {
          status: ParkingListingStatus.ACTIVE,
          allowedVehicleTypes: { has: input.vehicleType },
          provider: { status: UserStatus.ACTIVE, deletedAt: null },
          parkingRight: {
            status: ParkingRightStatus.VERIFIED,
            canList: true,
            canSetPrice: true,
          },
          OR: [
            { parkingResourceUnitId: null },
            {
              parkingResourceUnit: {
                deletedAt: null,
                status: ParkingSpotStatus.ACTIVE,
              },
            },
          ],
          parkingSpot: {
            propertyId,
            deletedAt: null,
            status: ParkingSpotStatus.ACTIVE,
            property: {
              deletedAt: null,
              canonicalPropertyId: null,
              status: PropertyStatus.ACTIVE,
              verificationStatus: VerificationStatus.VERIFIED,
            },
          },
        },
        include: {
          parkingRight: true,
          parkingResourceUnit: true,
          parkingSpot: {
            include: {
              property: true,
              units: {
                where: { deletedAt: null, status: ParkingSpotStatus.ACTIVE },
                orderBy: { normalizedSpotCode: "asc" },
              },
              availabilityRules: true,
              availabilityExceptions: true,
              facilities: { include: { facility: true } },
            },
          },
        },
        orderBy: { pricePerHourPaisa: "asc" },
      }),
      prisma.review.aggregate({
        where: { booking: { propertyId }, reportedAt: null },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { booking: { propertyId }, reportedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          rating: true,
          comment: true,
          providerReply: true,
          providerRepliedAt: true,
          createdAt: true,
          driver: { select: { fullName: true } },
        },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { booking: { propertyId }, reportedAt: null },
        _count: { _all: true },
      }),
    ]);
  if (!property) fail(404, "PROPERTY_NOT_FOUND", "Property was not found");

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const durationMinutes = Math.ceil(
    (endAt.getTime() - startAt.getTime()) / 60_000,
  );
  const offers: JsonObject[] = [];
  const facilities = new Map<string, string>();
  const availabilitySchedule = new Map<
    string,
    {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      validFrom: string;
      validUntil: string | null;
    }
  >();
  const unitsByListing = await availableUnitsForListings(
    listings,
    startAt,
    endAt,
  );
  for (const listing of listings) {
    const rightAvailable =
      listing.parkingRight.validFrom <= startAt &&
      (!listing.parkingRight.validUntil ||
        listing.parkingRight.validUntil >= endAt);
    const resourceAvailable =
      rightAvailable &&
      (await isResourceAvailable(listing.parkingSpot, startAt, endAt));
    const durationAllowed =
      durationMinutes >= listing.minDurationMinutes &&
      durationMinutes <= listing.maxDurationMinutes;
    const availableUnits =
      resourceAvailable && durationAllowed
        ? (unitsByListing.get(listing.id) ?? 0)
        : 0;
    for (const item of listing.parkingSpot.facilities) {
      facilities.set(item.facility.code, item.facility.displayName);
    }
    for (const rule of listing.parkingSpot.availabilityRules) {
      if (!rule.isActive) continue;
      const schedule = {
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startLocalTime.toISOString().slice(11, 16),
        endTime: rule.endLocalTime.toISOString().slice(11, 16),
        validFrom: rule.validFrom.toISOString().slice(0, 10),
        validUntil: rule.validUntil?.toISOString().slice(0, 10) ?? null,
      };
      availabilitySchedule.set(
        `${schedule.dayOfWeek}:${schedule.startTime}:${schedule.endTime}:${schedule.validFrom}:${schedule.validUntil ?? ""}`,
        schedule,
      );
    }
    offers.push({
      listingId: listing.id,
      title: listing.title,
      description: listing.description,
      resourceType: listing.parkingSpot.resourceType,
      displayName: listing.parkingSpot.displayName,
      floor: listing.parkingSpot.floor,
      zone: listing.parkingSpot.zone,
      pricePerHourPaisa: listing.pricePerHourPaisa.toString(),
      securityDepositPaisa: listing.securityDepositPaisa.toString(),
      minDurationMinutes: listing.minDurationMinutes,
      maxDurationMinutes: listing.maxDurationMinutes,
      allowedVehicleTypes: listing.allowedVehicleTypes,
      isCovered: listing.parkingSpot.isCovered,
      hasCctv: listing.parkingSpot.hasCctv,
      hasGuard: listing.parkingSpot.hasGuard,
      maxHeightCm: listing.parkingSpot.maxHeightCm,
      maxWidthCm: listing.parkingSpot.maxWidthCm,
      maxLengthCm: listing.parkingSpot.maxLengthCm,
      facilities: listing.parkingSpot.facilities.map((item) => ({
        code: item.facility.code,
        displayName: item.facility.displayName,
      })),
      availableUnits,
    });
  }

  return serialize({
    ...property,
    latitude: Number(property.latitude),
    longitude: Number(property.longitude),
    rating: reviewSummary._avg.rating,
    reviewCount: reviewSummary._count._all,
    ratingDistribution: Object.fromEntries(
      ratingGroups.map((group) => [group.rating, group._count._all]),
    ),
    reviews: reviews.map((review) => {
      const nameParts = review.driver.fullName.trim().split(/\s+/);
      const reviewerName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts.at(-1)?.charAt(0) ?? ""}.`
          : (nameParts[0] ?? "Driver");
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewerName,
        providerReply: review.providerReply,
        providerRepliedAt: review.providerRepliedAt,
        createdAt: review.createdAt,
      };
    }),
    facilities: [...facilities].map(([code, displayName]) => ({
      code,
      displayName,
    })),
    availabilitySchedule: [...availabilitySchedule.values()].sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
    ),
    requestedPeriod: { startAt, endAt, vehicleType: input.vehicleType },
    offers,
  });
}

export async function listDriverFavorites(driverUserId: string) {
  const favorites = await prisma.driverFavoriteProperty.findMany({
    where: {
      userId: driverUserId,
      property: {
        deletedAt: null,
        canonicalPropertyId: null,
        status: PropertyStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      property: {
        select: {
          id: true,
          name: true,
          publicArea: true,
          approximateAddress: true,
          latitude: true,
          longitude: true,
          images: { where: { isCover: true }, select: { url: true }, take: 1 },
        },
      },
    },
  });
  return favorites.map(({ property, ...favorite }) => {
    const { images, ...details } = property;
    return {
      ...favorite,
      property: {
        ...details,
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
        coverImageUrl: images[0]?.url ?? null,
      },
    };
  });
}

export async function addDriverFavorite(
  driverUserId: string,
  propertyId: string,
) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      deletedAt: null,
      canonicalPropertyId: null,
      status: PropertyStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: { id: true },
  });
  if (!property) fail(404, "PROPERTY_NOT_FOUND", "Property was not found");
  return prisma.driverFavoriteProperty.upsert({
    where: { userId_propertyId: { userId: driverUserId, propertyId } },
    update: {},
    create: { userId: driverUserId, propertyId },
  });
}

export async function removeDriverFavorite(
  driverUserId: string,
  propertyId: string,
) {
  await prisma.driverFavoriteProperty.deleteMany({
    where: { userId: driverUserId, propertyId },
  });
  return { deleted: true };
}

export async function listDriverSavedLocations(driverUserId: string) {
  const locations = await prisma.driverSavedLocation.findMany({
    where: { userId: driverUserId },
    orderBy: { updatedAt: "desc" },
  });
  return locations.map((location) => ({
    ...location,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  }));
}

export async function createDriverSavedLocation(
  driverUserId: string,
  input: {
    label: string;
    displayName: string;
    latitude: number;
    longitude: number;
  },
) {
  const location = await prisma.driverSavedLocation.create({
    data: { userId: driverUserId, ...input },
  });
  return {
    ...location,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };
}

export async function updateDriverSavedLocation(
  driverUserId: string,
  locationId: string,
  input: {
    label?: string;
    displayName?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const result = await prisma.driverSavedLocation.updateMany({
    where: { id: locationId, userId: driverUserId },
    data: input,
  });
  if (result.count === 0)
    fail(404, "SAVED_LOCATION_NOT_FOUND", "Saved location was not found");
  const location = await prisma.driverSavedLocation.findUniqueOrThrow({
    where: { id: locationId },
  });
  return {
    ...location,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };
}

export async function deleteDriverSavedLocation(
  driverUserId: string,
  locationId: string,
) {
  const result = await prisma.driverSavedLocation.deleteMany({
    where: { id: locationId, userId: driverUserId },
  });
  if (result.count === 0)
    fail(404, "SAVED_LOCATION_NOT_FOUND", "Saved location was not found");
  return { deleted: true };
}

export async function listDriverSearchHistory(driverUserId: string) {
  const history = await prisma.driverSearchHistory.findMany({
    where: { userId: driverUserId },
    orderBy: { searchedAt: "desc" },
    take: 12,
  });
  return history.map((item) => ({
    ...item,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    radiusKm: Number(item.radiusKm),
  }));
}

export async function addDriverSearchHistory(
  driverUserId: string,
  input: {
    displayName: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    vehicleType: VehicleType;
  },
) {
  const rounded = {
    ...input,
    latitude: Number(input.latitude.toFixed(5)),
    longitude: Number(input.longitude.toFixed(5)),
  };
  return prisma.$transaction(async (tx) => {
    const item = await tx.driverSearchHistory.create({
      data: { userId: driverUserId, ...rounded },
    });
    const stale = await tx.driverSearchHistory.findMany({
      where: { userId: driverUserId },
      orderBy: { searchedAt: "desc" },
      skip: 12,
      select: { id: true },
    });
    if (stale.length)
      await tx.driverSearchHistory.deleteMany({
        where: { id: { in: stale.map(({ id }) => id) } },
      });
    return {
      ...item,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      radiusKm: Number(item.radiusKm),
    };
  });
}

export async function clearDriverSearchHistory(driverUserId: string) {
  const result = await prisma.driverSearchHistory.deleteMany({
    where: { userId: driverUserId },
  });
  return { deleted: result.count };
}

export async function deleteDriverSearchHistoryItem(
  driverUserId: string,
  searchId: string,
) {
  const result = await prisma.driverSearchHistory.deleteMany({
    where: { id: searchId, userId: driverUserId },
  });
  if (result.count === 0)
    fail(404, "SEARCH_HISTORY_NOT_FOUND", "Search history item was not found");
  return { deleted: true };
}

export async function createQuote(
  driverUserId: string,
  input: {
    listingId: string;
    vehicleId: string;
    startAt: string;
    endAt: string;
  },
) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (startAt <= new Date())
    fail(
      400,
      "QUOTE_START_IN_PAST",
      "Booking start time must be in the future",
    );
  await reconcileExpiredPendingBookings({ limit: 50 });
  await prisma.$transaction((tx) => releaseExpiredHolds(tx));
  const [listing, vehicle] = await Promise.all([
    loadBookableListing(input.listingId),
    prisma.vehicle.findFirst({
      where: {
        id: input.vehicleId,
        ownerUserId: driverUserId,
        deletedAt: null,
      },
    }),
  ]);
  if (!listing)
    fail(
      404,
      "PARKING_LISTING_NOT_AVAILABLE",
      "Parking listing is unavailable",
    );
  if (!vehicle) fail(404, "VEHICLE_NOT_FOUND", "Vehicle was not found");
  if (!listing.allowedVehicleTypes.includes(vehicle.vehicleType))
    fail(
      409,
      "VEHICLE_NOT_COMPATIBLE",
      "Vehicle is not compatible with this listing",
    );
  const durationMinutes = Math.ceil(
    (endAt.getTime() - startAt.getTime()) / 60_000,
  );
  if (
    durationMinutes < listing.minDurationMinutes ||
    durationMinutes > listing.maxDurationMinutes
  ) {
    fail(
      400,
      "BOOKING_DURATION_INVALID",
      "Requested duration is outside the listing limits",
    );
  }
  if (!(await ensureListingAvailable(listing, startAt, endAt)))
    fail(
      409,
      "PARKING_NOT_AVAILABLE",
      "Parking is not available for the requested time",
    );
  const baseAmountPaisa = calculateParkingCharge(
    listing.pricePerHourPaisa,
    durationMinutes,
  );
  const resolvedFee = await resolvePlatformFee(
    listing.id,
    baseAmountPaisa,
    new Date(),
  );
  const platformFeePaisa = resolvedFee.amountPaisa;
  const subtotalPaisa = baseAmountPaisa + platformFeePaisa;
  const totalAmountPaisa =
    baseAmountPaisa + platformFeePaisa + listing.securityDepositPaisa;
  const driverWallet = await prisma.walletAccount.findUnique({
    where: { userId_currency: { userId: driverUserId, currency: "BDT" } },
    select: { status: true, availableBalancePaisa: true },
  });
  const driverWalletAvailablePaisa =
    driverWallet?.status === "ACTIVE" ? driverWallet.availableBalancePaisa : 0n;
  const split = calculateWalletSplit(
    totalAmountPaisa,
    driverWalletAvailablePaisa,
  );
  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.bookingQuote.create({
      data: {
        driverUserId,
        listingId: listing.id,
        vehicleId: vehicle.id,
        parkingSpotId: listing.parkingSpotId,
        startAt,
        endAt,
        durationMinutes,
        baseRatePerHourPaisa: listing.pricePerHourPaisa,
        baseAmountPaisa,
        platformFeePaisa,
        subtotalPaisa,
        platformFeeRuleId: resolvedFee.ruleId,
        depositPaisa: listing.securityDepositPaisa,
        totalAmountPaisa,
        driverWalletAvailablePaisa,
        driverWalletAppliedPaisa: split.walletAppliedPaisa,
        gatewayAmountPaisa: split.gatewayAmountPaisa,
        overtimeBillingMode: listing.overtimeBillingMode,
        overtimeMultiplierBps: listing.overtimeMultiplierBps,
        overtimeRatePerHourPaisa: listing.overtimeRatePerHourPaisa,
        overtimeGracePeriodMinutes: listing.overtimeGracePeriodMinutes,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
      },
    });
    await audit(
      tx,
      DomainAuditEventType.QUOTE_CREATED,
      driverUserId,
      listing.parkingSpot.propertyId,
      "BookingQuote",
      created.id,
      {
        platformFeeRuleId: resolvedFee.ruleId,
        platformFeeSource: resolvedFee.source,
      },
    );
    return created;
  });
  return serialize(quote);
}

export async function getQuote(driverUserId: string, quoteId: string) {
  const quote = await prisma.bookingQuote.findFirst({
    where: { id: quoteId, driverUserId },
  });
  if (!quote)
    fail(404, "BOOKING_QUOTE_NOT_FOUND", "Booking quote was not found");
  return serialize({ ...quote, expired: quote.expiresAt <= new Date() });
}

export async function createHold(
  driverUserId: string,
  input: { quoteId: string; idempotencyKey: string },
) {
  const existing = await prisma.reservationHold.findUnique({
    where: {
      driverUserId_idempotencyKey: {
        driverUserId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) return serialize(existing);

  await reconcileExpiredPendingBookings({ limit: 50 });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await releaseExpiredHolds(tx);
          const quote = await tx.bookingQuote.findFirst({
            where: { id: input.quoteId, driverUserId },
            include: {
              listing: {
                include: {
                  provider: true,
                  parkingRight: true,
                  parkingResourceUnit: true,
                  parkingSpot: {
                    include: {
                      property: true,
                      units: {
                        where: {
                          deletedAt: null,
                          status: ParkingSpotStatus.ACTIVE,
                        },
                        orderBy: { normalizedSpotCode: "asc" },
                      },
                      availabilityRules: true,
                      availabilityExceptions: true,
                    },
                  },
                },
              },
            },
          });
          if (!quote)
            fail(404, "BOOKING_QUOTE_NOT_FOUND", "Booking quote was not found");
          if (quote.expiresAt <= new Date())
            fail(409, "BOOKING_QUOTE_EXPIRED", "Booking quote has expired");
          const listing = quote.listing;
          await lockEntity(tx, "parking-resource", listing.parkingSpotId);
          await lockEntity(tx, "parking-right", listing.parkingRightId);
          const now = new Date();
          const eligible =
            listing.status === ParkingListingStatus.ACTIVE &&
            listing.provider.status === UserStatus.ACTIVE &&
            listing.parkingRight.status === ParkingRightStatus.VERIFIED &&
            listing.parkingRight.canList &&
            listing.parkingRight.validFrom <= now &&
            (!listing.parkingRight.validUntil ||
              listing.parkingRight.validUntil > now) &&
            listing.parkingSpot.status === ParkingSpotStatus.ACTIVE &&
            listing.parkingSpot.property.status === PropertyStatus.ACTIVE &&
            listing.parkingSpot.property.verificationStatus ===
              VerificationStatus.VERIFIED;
          if (
            !eligible ||
            !(await isResourceAvailable(
              listing.parkingSpot,
              quote.startAt,
              quote.endAt,
            ))
          ) {
            fail(
              409,
              "PARKING_NOT_AVAILABLE",
              "Parking is no longer available",
            );
          }
          const allocationCount = await activeAllocationCount(
            listing.parkingSpotId,
            listing.parkingRightId,
            quote.startAt,
            quote.endAt,
            tx,
          );
          const physicalCapacity =
            listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
              ? listing.parkingResourceUnitId
                ? 1
                : listing.parkingSpot.units.length
              : listing.parkingSpot.capacity;
          const capacity = Math.min(
            physicalCapacity,
            listing.parkingRight.quantity,
          );
          if (allocationCount >= capacity)
            fail(
              409,
              "PARKING_NOT_AVAILABLE",
              "Parking capacity was reserved by another Driver",
            );

          let capacityUnit = 1;
          let parkingResourceUnitId: string | null = null;
          if (
            listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
          ) {
            const used = await tx.parkingAllocation.findMany({
              where: {
                parkingSpotId: listing.parkingSpotId,
                parkingResourceUnitId: { not: null },
                status: {
                  in: [
                    ParkingAllocationStatus.HELD,
                    ParkingAllocationStatus.BOOKED,
                  ],
                },
                startAt: { lt: quote.endAt },
                endAt: { gt: quote.startAt },
                OR: [
                  { status: ParkingAllocationStatus.BOOKED },
                  { expiresAt: { gt: now } },
                ],
              },
              select: { parkingResourceUnitId: true },
            });
            const usedUnitIds = new Set(
              used.flatMap((item) =>
                item.parkingResourceUnitId ? [item.parkingResourceUnitId] : [],
              ),
            );
            const candidates = listing.parkingResourceUnitId
              ? listing.parkingSpot.units.filter(
                  (unit) => unit.id === listing.parkingResourceUnitId,
                )
              : listing.parkingSpot.units;
            const selectedIndex = candidates.findIndex(
              (unit) => !usedUnitIds.has(unit.id),
            );
            const selectedUnit =
              selectedIndex >= 0 ? candidates[selectedIndex] : undefined;
            if (!selectedUnit)
              fail(
                409,
                "PARKING_NOT_AVAILABLE",
                "No fixed parking unit is available for this time",
              );
            parkingResourceUnitId = selectedUnit.id;
            capacityUnit =
              listing.parkingSpot.units.findIndex(
                (unit) => unit.id === selectedUnit.id,
              ) + 1;
          } else {
            const used = await tx.parkingAllocation.findMany({
              where: {
                parkingSpotId: listing.parkingSpotId,
                status: {
                  in: [
                    ParkingAllocationStatus.HELD,
                    ParkingAllocationStatus.BOOKED,
                  ],
                },
                startAt: { lt: quote.endAt },
                endAt: { gt: quote.startAt },
                OR: [
                  { status: ParkingAllocationStatus.BOOKED },
                  { expiresAt: { gt: now } },
                ],
              },
              select: { capacityUnit: true },
            });
            const usedUnits = new Set(used.map((item) => item.capacityUnit));
            capacityUnit =
              Array.from(
                { length: listing.parkingSpot.capacity },
                (_, index) => index + 1,
              ).find((unit) => !usedUnits.has(unit)) ?? 0;
            if (capacityUnit === 0)
              fail(
                409,
                "PARKING_NOT_AVAILABLE",
                "Parking entitlement is fully reserved",
              );
          }
          const expiresAt = new Date(Date.now() + HOLD_TTL_MS);
          const allocation = await tx.parkingAllocation.create({
            data: {
              parkingSpotId: listing.parkingSpotId,
              parkingRightId: listing.parkingRightId,
              parkingResourceUnitId,
              capacityUnit,
              startAt: quote.startAt,
              endAt: quote.endAt,
              status: ParkingAllocationStatus.HELD,
              expiresAt,
            },
          });
          const hold = await tx.reservationHold.create({
            data: {
              quoteId: quote.id,
              driverUserId,
              listingId: listing.id,
              parkingSpotId: listing.parkingSpotId,
              allocationId: allocation.id,
              expiresAt,
              idempotencyKey: input.idempotencyKey,
            },
          });
          await audit(
            tx,
            DomainAuditEventType.HOLD_CREATED,
            driverUserId,
            listing.parkingSpot.propertyId,
            "ReservationHold",
            hold.id,
          );
          return serialize(hold);
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : null;
      if (code === "P2034" && attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 15));
        continue;
      }
      if (code === "P2002" || code === "P2004" || code === "P2034") {
        fail(
          409,
          "PARKING_NOT_AVAILABLE",
          "Parking capacity was reserved concurrently",
        );
      }
      throw error;
    }
  }
  fail(
    409,
    "PARKING_NOT_AVAILABLE",
    "Parking capacity was reserved concurrently",
  );
}

export async function getHold(driverUserId: string, holdId: string) {
  const hold = await prisma.reservationHold.findFirst({
    where: { id: holdId, driverUserId },
    include: { quote: true },
  });
  if (!hold)
    fail(404, "RESERVATION_HOLD_NOT_FOUND", "Reservation hold was not found");
  return serialize({
    ...hold,
    expired: hold.status === "ACTIVE" && hold.expiresAt <= new Date(),
  });
}

export async function releaseHold(driverUserId: string, holdId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "reservation-hold", holdId);
    const hold = await tx.reservationHold.findFirst({
      where: { id: holdId, driverUserId },
    });
    if (!hold)
      fail(404, "RESERVATION_HOLD_NOT_FOUND", "Reservation hold was not found");
    if (hold.status === "CONSUMED")
      fail(
        409,
        "RESERVATION_HOLD_CONSUMED",
        "Consumed hold cannot be released",
      );
    if (hold.status === "RELEASED" || hold.status === "EXPIRED")
      return serialize(hold);
    await tx.parkingAllocation.updateMany({
      where: { id: hold.allocationId, status: "HELD" },
      data: { status: "RELEASED" },
    });
    return serialize(
      await tx.reservationHold.update({
        where: { id: hold.id },
        data: { status: "RELEASED" },
      }),
    );
  });
}

function bookingCode() {
  return `PK${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`.slice(
    0,
    20,
  );
}

export async function createBooking(
  driverUserId: string,
  input: { holdId: string; idempotencyKey: string },
) {
  const existing = await prisma.booking.findUnique({
    where: {
      driverUserId_idempotencyKey: {
        driverUserId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) return serialize(existing);
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "reservation-hold", input.holdId);
      const hold = await tx.reservationHold.findFirst({
        where: { id: input.holdId, driverUserId },
        include: {
          quote: true,
          allocation: { include: { parkingResourceUnit: true } },
          listing: { include: { parkingRight: true, parkingSpot: true } },
        },
      });
      if (!hold)
        fail(
          404,
          "RESERVATION_HOLD_NOT_FOUND",
          "Reservation hold was not found",
        );
      if (hold.status === "CONSUMED") {
        const booking = await tx.booking.findUnique({
          where: { holdId: hold.id },
        });
        if (booking) return serialize(booking);
      }
      if (
        hold.status !== "ACTIVE" ||
        hold.expiresAt <= new Date() ||
        hold.allocation.status !== "HELD"
      ) {
        fail(
          409,
          "RESERVATION_HOLD_EXPIRED",
          "Reservation hold is no longer active",
        );
      }
      const listing = hold.listing;
      const booking = await tx.booking.create({
        data: {
          bookingCode: bookingCode(),
          holdId: hold.id,
          allocationId: hold.allocationId,
          driverUserId,
          vehicleId: hold.quote.vehicleId,
          propertyId: listing.parkingSpot.propertyId,
          parkingSpotId: listing.parkingSpotId,
          listingId: listing.id,
          parkingRightId: listing.parkingRightId,
          parkingResourceUnitId: hold.allocation.parkingResourceUnitId,
          assignedUnitCode:
            hold.allocation.parkingResourceUnit?.spotCode ?? null,
          providerUserId: listing.providerUserId,
          settlementRecipientUserId: listing.settlementRecipientUserId,
          settlementWalletAccountId: listing.settlementWalletAccountId,
          startAt: hold.quote.startAt,
          scheduledEndAt: hold.quote.endAt,
          effectiveEndAt: hold.quote.endAt,
          baseAmountPaisa: hold.quote.baseAmountPaisa,
          platformFeePaisa: hold.quote.platformFeePaisa,
          depositPaisa: hold.quote.depositPaisa,
          totalAmountPaisa: hold.quote.totalAmountPaisa,
          baseRatePerHourPaisa: hold.quote.baseRatePerHourPaisa,
          subtotalPaisa: hold.quote.subtotalPaisa,
          driverWalletAppliedPaisa: hold.quote.driverWalletAppliedPaisa,
          gatewayAmountPaisa: hold.quote.gatewayAmountPaisa,
          overtimeBillingMode: hold.quote.overtimeBillingMode,
          overtimeMultiplierBps: hold.quote.overtimeMultiplierBps,
          overtimeRatePerHourPaisa: hold.quote.overtimeRatePerHourPaisa,
          overtimeGracePeriodMinutes: hold.quote.overtimeGracePeriodMinutes,
          cancellationPolicyVersion: hold.quote.cancellationPolicyVersion,
          idempotencyKey: input.idempotencyKey,
        },
      });
      await tx.reservationHold.update({
        where: { id: hold.id },
        data: { status: "CONSUMED" },
      });
      await tx.parkingAllocation.update({
        where: { id: hold.allocationId },
        data: { status: "BOOKED", expiresAt: null },
      });
      await audit(
        tx,
        DomainAuditEventType.BOOKING_CREATED,
        driverUserId,
        booking.propertyId,
        "Booking",
        booking.id,
      );
      return serialize(booking);
    },
    { isolationLevel: "Serializable" },
  );
}

const bookingInclude = {
  vehicle: {
    select: { id: true, vehicleType: true, registrationNumber: true },
  },
  property: {
    select: {
      id: true,
      name: true,
      publicArea: true,
      approximateAddress: true,
    },
  },
  parkingSpot: {
    select: {
      id: true,
      displayName: true,
      spotCode: true,
      resourceType: true,
      floor: true,
      zone: true,
    },
  },
  parkingResourceUnit: {
    select: { id: true, spotCode: true, displayName: true, status: true },
  },
  listing: { select: { id: true, title: true } },
  payments: { orderBy: { createdAt: "desc" as const } },
  driver: { select: { id: true, fullName: true, phone: true, email: true } },
} satisfies Prisma.BookingInclude;

const ACCESS_CREDENTIAL_PREFIX = "parkease-access:";

function accessCredentialPayload(id: string) {
  return `${ACCESS_CREDENTIAL_PREFIX}${id}`;
}

function credentialLookup(
  credential: string,
  tokenHash: string,
): Prisma.AccessCredentialWhereUniqueInput {
  const trimmed = credential.trim();
  const id = trimmed.startsWith(ACCESS_CREDENTIAL_PREFIX)
    ? trimmed.slice(ACCESS_CREDENTIAL_PREFIX.length).trim()
    : trimmed;
  return id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? { id }
    : { tokenHash };
}

const activeCheckoutStatuses: PaymentStatus[] = [
  PaymentStatus.CREATED,
  PaymentStatus.SESSION_CREATED,
  PaymentStatus.PENDING,
  PaymentStatus.VALIDATING,
];

function hasLiveCheckout(
  booking: {
    payments?: Array<{
      status: PaymentStatus;
      sessionExpiresAt: Date | null;
      initiatedAt: Date | null;
      createdAt: Date;
    }>;
  },
  now = new Date(),
) {
  return (
    booking.payments?.some((payment) => {
      if (!activeCheckoutStatuses.includes(payment.status)) return false;
      const expiresAt =
        payment.sessionExpiresAt ??
        new Date(
          (payment.initiatedAt ?? payment.createdAt).getTime() +
            PAYMENT_SESSION_TTL_MS,
        );
      return expiresAt.getTime() + PAYMENT_CALLBACK_GRACE_MS > now.getTime();
    }) ?? false
  );
}

function canCancelBooking(
  booking: {
    status: BookingStatus;
    startAt: Date;
    payments?: Array<{
      status: PaymentStatus;
      sessionExpiresAt: Date | null;
      initiatedAt: Date | null;
      createdAt: Date;
    }>;
  },
  now = new Date(),
) {
  return (
    (booking.status === BookingStatus.PAYMENT_PENDING &&
      !hasLiveCheckout(booking, now)) ||
    (booking.status === BookingStatus.CONFIRMED && booking.startAt > now)
  );
}

function presentBooking<T extends { status: BookingStatus; startAt: Date }>(
  booking: T,
  now = new Date(),
) {
  return {
    ...booking,
    canCancel: canCancelBooking(booking, now),
    canPay:
      booking.status === BookingStatus.PAYMENT_PENDING && booking.startAt > now,
  };
}

async function expirePendingBooking(bookingId: string, now: Date) {
  const expirablePaymentStatuses: PaymentStatus[] = [
    PaymentStatus.CREATED,
    PaymentStatus.SESSION_CREATED,
    PaymentStatus.PENDING,
    PaymentStatus.VALIDATING,
  ];
  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payments: true, hold: true },
      });
      if (!booking || booking.status !== BookingStatus.PAYMENT_PENDING)
        return null;
      const paymentDeadlines = booking.payments
        .filter((payment) => expirablePaymentStatuses.includes(payment.status))
        .map(
          (payment) =>
            new Date(
              (
                payment.sessionExpiresAt ??
                new Date(
                  (payment.initiatedAt ?? payment.createdAt).getTime() +
                    PAYMENT_SESSION_TTL_MS,
                )
              ).getTime() + PAYMENT_CALLBACK_GRACE_MS,
            ),
        );
      const fallbackDeadline =
        booking.hold?.expiresAt ??
        new Date(booking.createdAt.getTime() + HOLD_TTL_MS);
      const deadline =
        paymentDeadlines.length > 0
          ? paymentDeadlines.reduce(
              (latest, value) => (value > latest ? value : latest),
              new Date(0),
            )
          : fallbackDeadline;
      if (deadline > now) return null;

      for (const payment of booking.payments) {
        await releasePaymentWalletHolds(tx, payment.id, booking.driverUserId);
      }
      await tx.paymentAttempt.updateMany({
        where: {
          payment: { bookingId },
          status: { in: expirablePaymentStatuses },
        },
        data: { status: PaymentStatus.EXPIRED, completedAt: now },
      });
      await tx.payment.updateMany({
        where: { bookingId, status: { in: expirablePaymentStatuses } },
        data: {
          status: PaymentStatus.EXPIRED,
          expiredAt: now,
          checkoutUrl: null,
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED, financialStatus: "CANCELLED" },
      });
      await tx.parkingAllocation.updateMany({
        where: {
          id: booking.allocationId,
          status: {
            in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED],
          },
        },
        data: { status: ParkingAllocationStatus.RELEASED },
      });
      await tx.accessCredential.updateMany({
        where: { bookingId },
        data: { status: "REVOKED" },
      });
      await notification(tx, {
        userId: booking.driverUserId,
        type: "BOOKING_CANCELLED",
        title: "Booking expired",
        message: `Booking ${booking.bookingCode} expired because payment was not completed in time. No payment was collected.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `booking-expired:${booking.id}`,
      });
      await audit(
        tx,
        DomainAuditEventType.BOOKING_CANCELLED,
        booking.driverUserId,
        booking.propertyId,
        "Booking",
        booking.id,
        { automated: true, reason: "PAYMENT_TIMEOUT" },
      );
      return {
        driverUserId: booking.driverUserId,
        providerUserId: booking.providerUserId,
      };
    },
    { isolationLevel: "Serializable" },
  );

  if (result) {
    notifyUser(result.driverUserId, "booking:expired", { bookingId });
    notifyUser(result.providerUserId, "booking:expired", { bookingId });
    notifyUser(result.driverUserId, "wallet:balance_changed", { bookingId });
  }
  return result !== null;
}

async function settleNoShowBooking(bookingId: string, now: Date) {
  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { settlement: true },
      });
      if (
        !booking ||
        booking.settlement ||
        booking.status !== BookingStatus.CONFIRMED ||
        booking.checkedInAt ||
        booking.scheduledEndAt > now
      )
        return null;

      const driverWallet = await getOrCreateWallet(tx, booking.driverUserId);
      await lockEntity(tx, "wallet", driverWallet.id);
      await lockEntity(tx, "wallet", booking.settlementWalletAccountId);
      const settlementValue = calculateSettlement({
        baseChargePaisa: booking.baseAmountPaisa,
        platformFeePaisa: booking.platformFeePaisa,
        depositPaisa: booking.depositPaisa,
        overtimeChargePaisa: 0n,
        driverAvailablePaisa: 0n,
      });
      const settlement = await tx.bookingSettlement.create({
        data: {
          bookingId: booking.id,
          scheduledStartAt: booking.startAt,
          scheduledEndAt: booking.scheduledEndAt,
          actualCheckInAt: null,
          actualCheckOutAt: booking.scheduledEndAt,
          baseChargePaisa: booking.baseAmountPaisa,
          platformFeePaisa: booking.platformFeePaisa,
          depositPaisa: booking.depositPaisa,
          overtimeMinutes: 0,
          overtimeChargePaisa: 0n,
          depositUsedPaisa: settlementValue.depositUsedPaisa,
          depositReturnedPaisa: settlementValue.depositReturnedPaisa,
          providerGrossPaisa: settlementValue.providerGrossPaisa,
          providerNetPaisa: settlementValue.providerNetPaisa,
          platformRevenuePaisa: settlementValue.platformRevenuePaisa,
          driverRefundCreditPaisa: settlementValue.driverRefundCreditPaisa,
          driverWalletChargedPaisa: 0n,
          outstandingPaisa: 0n,
          status: "COMPLETED",
          idempotencyKey: `booking-no-show-settlement:${booking.id}`,
          completedAt: now,
        },
      });
      const entries = [
        {
          accountCode: "BOOKING_HELD_FUNDS",
          entrySide: "DEBIT" as const,
          amountPaisa: booking.totalAmountPaisa,
        },
        ...(settlementValue.providerNetPaisa > 0n
          ? [
              {
                accountCode: "PROVIDER_PAYABLE",
                walletAccountId: booking.settlementWalletAccountId,
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.providerNetPaisa,
              },
            ]
          : []),
        ...(settlementValue.platformRevenuePaisa > 0n
          ? [
              {
                accountCode: "PLATFORM_REVENUE",
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.platformRevenuePaisa,
              },
            ]
          : []),
        ...(settlementValue.driverRefundCreditPaisa > 0n
          ? [
              {
                accountCode: "DRIVER_REFUND_LIABILITY",
                walletAccountId: driverWallet.id,
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.driverRefundCreditPaisa,
              },
            ]
          : []),
      ];
      const debit = entries
        .filter((entry) => entry.entrySide === "DEBIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      const credit = entries
        .filter((entry) => entry.entrySide === "CREDIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      if (debit !== credit)
        fail(
          500,
          "LEDGER_UNBALANCED",
          "No-show settlement ledger is not balanced",
        );
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "BOOKING_SETTLEMENT",
          referenceId: settlement.id,
          description: `Automatic no-show settlement for booking ${booking.bookingCode}`,
          actorUserId: booking.driverUserId,
          entries: { create: entries.filter((e) => e.amountPaisa > 0n) },
        },
      });
      if (settlementValue.providerNetPaisa > 0n)
        await tx.walletAccount.update({
          where: { id: booking.settlementWalletAccountId },
          data: {
            availableBalancePaisa: {
              increment: settlementValue.providerNetPaisa,
            },
            balanceVersion: { increment: 1 },
          },
        });
      if (settlementValue.driverRefundCreditPaisa > 0n)
        await tx.walletAccount.update({
          where: { id: driverWallet.id },
          data: {
            availableBalancePaisa: {
              increment: settlementValue.driverRefundCreditPaisa,
            },
            balanceVersion: { increment: 1 },
          },
        });
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "NO_SHOW",
          financialStatus: "SETTLED",
          effectiveEndAt: booking.scheduledEndAt,
        },
      });
      await tx.parkingAllocation.update({
        where: { id: booking.allocationId },
        data: { status: "RELEASED", endAt: booking.scheduledEndAt },
      });
      await tx.accessCredential.updateMany({
        where: { bookingId },
        data: { status: "REVOKED" },
      });
      await notification(tx, {
        userId: booking.driverUserId,
        type: "REFUND_PROCESSED",
        title: "Booking closed as a no-show",
        message: `Booking ${booking.bookingCode} ended without check-in. Your refundable deposit was added to Refund Balance.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `booking-no-show-driver:${booking.id}`,
      });
      await notification(tx, {
        userId: booking.providerUserId,
        type: "PAYOUT_UPDATED",
        title: "No-show booking settled",
        message: `Booking ${booking.bookingCode} ended without check-in. Parking earnings are now available.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `booking-no-show-provider:${booking.id}`,
      });
      const auditMetadata = { automated: true, noShow: true };
      await audit(
        tx,
        DomainAuditEventType.PROVIDER_EARNINGS_RELEASED,
        booking.driverUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          ...auditMetadata,
          providerNetPaisa: settlementValue.providerNetPaisa.toString(),
        },
      );
      await audit(
        tx,
        DomainAuditEventType.DRIVER_REFUND_CREDITED,
        booking.driverUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          ...auditMetadata,
          driverRefundCreditPaisa:
            settlementValue.driverRefundCreditPaisa.toString(),
        },
      );
      await audit(
        tx,
        DomainAuditEventType.PLATFORM_REVENUE_RECOGNIZED,
        booking.driverUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          ...auditMetadata,
          platformRevenuePaisa: settlementValue.platformRevenuePaisa.toString(),
        },
      );
      await audit(
        tx,
        DomainAuditEventType.BOOKING_SETTLED,
        booking.driverUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        auditMetadata,
      );
      return {
        driverUserId: booking.driverUserId,
        providerUserId: booking.providerUserId,
      };
    },
    { isolationLevel: "Serializable" },
  );

  if (result) {
    notifyUser(result.driverUserId, "booking:settlement_completed", {
      bookingId,
    });
    notifyUser(result.providerUserId, "booking:settlement_completed", {
      bookingId,
    });
    notifyUser(result.driverUserId, "wallet:balance_changed", { bookingId });
    notifyUser(result.providerUserId, "wallet:balance_changed", { bookingId });
  }
  return result !== null;
}

export async function reconcilePastDueConfirmedBookings(
  input: {
    bookingId?: string;
    driverUserId?: string;
    limit?: number;
    throwOnError?: boolean;
  } = {},
) {
  const now = new Date();
  const candidates = await prisma.booking.findMany({
    where: {
      ...(input.bookingId ? { id: input.bookingId } : {}),
      ...(input.driverUserId ? { driverUserId: input.driverUserId } : {}),
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
      scheduledEndAt: { lte: now },
      settlement: { is: null },
    },
    select: { id: true },
    orderBy: { scheduledEndAt: "asc" },
    take: input.limit ?? 50,
  });
  let processed = 0;
  for (const candidate of candidates) {
    try {
      if (await settleNoShowBooking(candidate.id, now)) processed += 1;
    } catch (error) {
      logger.error(
        { error, bookingId: candidate.id },
        "No-show booking settlement failed",
      );
      if (input.throwOnError) throw error;
    }
  }
  return { candidates: candidates.length, processed };
}

export async function reconcileExpiredPendingBookings(
  input: {
    bookingId?: string;
    driverUserId?: string;
    limit?: number;
    throwOnError?: boolean;
  } = {},
) {
  const now = new Date();
  const candidates = await prisma.booking.findMany({
    where: {
      ...(input.bookingId
        ? { id: input.bookingId }
        : {
            OR: [
              { hold: { expiresAt: { lte: now } } },
              { createdAt: { lte: new Date(now.getTime() - HOLD_TTL_MS) } },
            ],
          }),
      ...(input.driverUserId ? { driverUserId: input.driverUserId } : {}),
      status: BookingStatus.PAYMENT_PENDING,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: input.limit ?? 50,
  });
  let processed = 0;
  for (const candidate of candidates) {
    try {
      if (await expirePendingBooking(candidate.id, now)) processed += 1;
    } catch (error) {
      logger.error(
        { error, bookingId: candidate.id },
        "Pending booking expiration failed",
      );
      if (input.throwOnError) throw error;
    }
  }
  return { candidates: candidates.length, processed };
}

export async function reconcileMarketplaceLifecycle() {
  const now = new Date();
  const expiredHolds = await prisma.$transaction((tx) =>
    releaseExpiredHolds(tx, now),
  );
  const [expiredBookings, noShows, expiredCredentials] = await Promise.all([
    reconcileExpiredPendingBookings(),
    reconcilePastDueConfirmedBookings(),
    prisma.accessCredential.updateMany({
      where: { status: "ACTIVE", expiresAt: { lte: now } },
      data: { status: "EXPIRED" },
    }),
  ]);
  return {
    expiredHolds,
    expiredBookings,
    noShows,
    expiredCredentials: expiredCredentials.count,
  };
}

export async function listDriverBookings(driverUserId: string) {
  await Promise.all([
    reconcileExpiredPendingBookings({ driverUserId }),
    reconcilePastDueConfirmedBookings({ driverUserId }),
  ]);
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { driverUserId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  return serialize(bookings.map((booking) => presentBooking(booking, now)));
}

export async function getDriverBooking(
  driverUserId: string,
  bookingId: string,
) {
  await reconcileExpiredPendingBookings({
    bookingId,
    driverUserId,
    throwOnError: true,
  });
  await reconcilePastDueConfirmedBookings({
    bookingId,
    driverUserId,
    throwOnError: true,
  });
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, driverUserId },
    include: {
      ...bookingInclude,
      credential: { select: { id: true, status: true, expiresAt: true } },
    },
  });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  const { credential, ...details } = booking;
  const accessCredential =
    credential?.status === "ACTIVE" && credential.expiresAt > new Date()
      ? accessCredentialPayload(credential.id)
      : null;

  const isPaidOrActive =
    (
      [
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN,
        BookingStatus.CHECKOUT_REQUESTED,
        BookingStatus.COMPLETED,
        BookingStatus.NO_SHOW,
        BookingStatus.PAYMENT_DUE,
        BookingStatus.DISPUTED,
      ] as BookingStatus[]
    ).includes(booking.status) || booking.confirmedAt !== null;

  let exactAddress: string | null = null;
  let accessInstructions: string | null = null;

  if (isPaidOrActive && booking.propertyId) {
    try {
      const propertySensitive = await prisma.property.findUnique({
        where: { id: booking.propertyId },
        select: {
          exactAddressCiphertext: true,
          exactAddressIv: true,
          exactAddressTag: true,
          accessInstructionsCiphertext: true,
          accessInstructionsIv: true,
          accessInstructionsTag: true,
        },
      });
      if (propertySensitive) {
        const decrypted = decryptPropertySensitiveData(
          propertySensitive as any,
        );
        exactAddress = decrypted.exactAddress;
        accessInstructions = decrypted.accessInstructions;
      }
    } catch (err) {
      logger.warn(
        { err, bookingId, propertyId: booking.propertyId },
        "Failed to decrypt property address for driver booking",
      );
    }
  }

  const presented = presentBooking(details);
  if (presented.property && (exactAddress || accessInstructions)) {
    (presented.property as any).exactAddress = exactAddress;
    (presented.property as any).accessInstructions = accessInstructions;
  }

  return serialize({ ...presented, accessCredential });
}

export async function listProviderBookings(
  actorUserId: string,
  filters: { propertyId?: string; status?: BookingStatus } = {},
) {
  await reconcileMarketplaceLifecycle();
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        providerMembershipId: {
          in: scopes.map((scope) => scope.providerMembershipId),
        },
      },
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      ...bookingInclude,
      listing: {
        select: { id: true, title: true, providerMembershipId: true },
      },
    },
    orderBy: { startAt: "desc" },
  });
  const scopeByMembership = new Map(
    scopes.map((scope) => [scope.providerMembershipId, scope]),
  );
  return serialize(
    bookings.filter((booking) => {
      const resourceIds = scopeByMembership.get(
        booking.listing.providerMembershipId,
      )?.resourceIds;
      return (
        resourceIds === null || resourceIds?.includes(booking.parkingSpotId)
      );
    }),
  );
}

export async function getProviderBooking(
  actorUserId: string,
  bookingId: string,
) {
  await reconcileExpiredPendingBookings({ bookingId, throwOnError: true });
  await reconcilePastDueConfirmedBookings({ bookingId, throwOnError: true });
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  const scopeByMembership = new Map(
    scopes.map((scope) => [scope.providerMembershipId, scope]),
  );
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: {
        providerMembershipId: {
          in: scopes.map((scope) => scope.providerMembershipId),
        },
      },
    },
    include: {
      ...bookingInclude,
      listing: {
        select: { id: true, title: true, providerMembershipId: true },
      },
    },
  });

  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  const resourceIds = scopeByMembership.get(
    booking.listing.providerMembershipId,
  )?.resourceIds;
  if (resourceIds !== null && !resourceIds?.includes(booking.parkingSpotId)) {
    fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  }
  return serialize(booking);
}

const guardBookingSelect = {
  id: true,
  bookingCode: true,
  status: true,
  startAt: true,
  scheduledEndAt: true,
  effectiveEndAt: true,
  confirmedAt: true,
  checkedInAt: true,
  checkoutRequestedAt: true,
  checkedOutAt: true,
  createdAt: true,
  driver: { select: { id: true, fullName: true } },
  vehicle: {
    select: {
      id: true,
      vehicleType: true,
      registrationNumber: true,
      brand: true,
      model: true,
      color: true,
    },
  },
  property: {
    select: {
      id: true,
      name: true,
      publicArea: true,
      approximateAddress: true,
    },
  },
  parkingSpot: {
    select: {
      id: true,
      displayName: true,
      spotCode: true,
      resourceType: true,
      floor: true,
      zone: true,
    },
  },
  listing: { select: { id: true, title: true } },
} satisfies Prisma.BookingSelect;

async function guardBookingScope(guardUserId: string) {
  const memberships = await prisma.propertyGuardMembership.findMany({
    where: { guardUserId, status: "ACTIVE" },
    select: {
      propertyId: true,
      assignments: {
        where: { status: "ACTIVE" },
        select: { providerMembership: { select: { providerUserId: true } } },
      },
    },
  });
  return memberships.flatMap((membership) =>
    membership.assignments.map((assignment) => ({
      propertyId: membership.propertyId,
      providerUserId: assignment.providerMembership.providerUserId,
    })),
  );
}

export async function listGuardBookings(
  guardUserId: string,
  input: {
    page: number;
    limit: number;
    status?: BookingStatus;
  },
) {
  await reconcileMarketplaceLifecycle();
  const scope = await guardBookingScope(guardUserId);
  if (scope.length === 0)
    return { bookings: [], pagination: pagination(input.page, input.limit, 0) };
  const statuses = input.status
    ? [input.status]
    : [
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN,
        BookingStatus.CHECKOUT_REQUESTED,
      ];
  const now = Date.now();
  const where: Prisma.BookingWhereInput = {
    OR: scope,
    status: { in: statuses },
    startAt: { lte: new Date(now + 24 * 60 * 60 * 1000) },
    effectiveEndAt: { gte: new Date(now - 12 * 60 * 60 * 1000) },
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: guardBookingSelect,
      orderBy: { startAt: "asc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, pagination: pagination(input.page, input.limit, total) };
}

export async function getGuardBooking(guardUserId: string, bookingId: string) {
  await reconcileExpiredPendingBookings({ bookingId, throwOnError: true });
  await reconcilePastDueConfirmedBookings({ bookingId, throwOnError: true });
  if (!(await isGuardAuthorizedForBooking(guardUserId, bookingId))) {
    fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: guardBookingSelect,
  });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  return booking;
}

export async function previewBookingCancellation(
  driverUserId: string,
  bookingId: string,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, driverUserId },
    include: { payments: true },
  });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  const cancellableStatuses: BookingStatus[] = [
    BookingStatus.PAYMENT_PENDING,
    BookingStatus.CONFIRMED,
  ];
  if (!cancellableStatuses.includes(booking.status)) {
    fail(
      409,
      "BOOKING_TRANSITION_INVALID",
      "Booking cannot be cancelled in its current state",
    );
  }
  if (
    booking.status === BookingStatus.CONFIRMED &&
    booking.startAt <= new Date()
  )
    fail(
      409,
      "BOOKING_CANCELLATION_WINDOW_CLOSED",
      "Started bookings cannot be cancelled",
    );
  if (
    booking.status === BookingStatus.PAYMENT_PENDING &&
    hasLiveCheckout(booking)
  ) {
    fail(
      409,
      "PAYMENT_CHECKOUT_IN_PROGRESS",
      "Cancel or finish the secure payment checkout before cancelling this booking",
    );
  }
  if (booking.status === BookingStatus.PAYMENT_PENDING)
    return serialize({
      paid: false,
      policyVersion: booking.cancellationPolicyVersion,
      minutesBeforeStart: Math.floor(
        (booking.startAt.getTime() - Date.now()) / 60_000,
      ),
      bookingChargePaisa: booking.baseAmountPaisa,
      bookingRefundPaisa: 0n,
      depositReturnPaisa: 0n,
      platformFeePaisa: booking.platformFeePaisa,
      platformFeeRefundPaisa: 0n,
      driverWalletCreditPaisa: 0n,
    });
  return serialize({
    paid: true,
    bookingChargePaisa: booking.baseAmountPaisa,
    ...calculateCancellation({
      startAt: booking.startAt,
      cancelledAt: new Date(),
      bookingChargePaisa: booking.baseAmountPaisa,
      platformFeePaisa: booking.platformFeePaisa,
      depositPaisa: booking.depositPaisa,
    }),
  });
}

export async function cancelBooking(
  driverUserId: string,
  bookingId: string,
  input: { reason?: string; idempotencyKey: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, driverUserId },
      include: { cancellation: true, payments: true },
    });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.cancellation)
      return serialize({ booking, cancellation: booking.cancellation });
    if (
      booking.status !== BookingStatus.PAYMENT_PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      fail(
        409,
        "BOOKING_TRANSITION_INVALID",
        "Booking cannot be cancelled in its current state",
      );
    }
    if (
      booking.status === BookingStatus.CONFIRMED &&
      booking.startAt <= new Date()
    ) {
      fail(
        409,
        "BOOKING_CANCELLATION_WINDOW_CLOSED",
        "Started bookings cannot be cancelled",
      );
    }
    if (
      booking.status === BookingStatus.PAYMENT_PENDING &&
      hasLiveCheckout(booking)
    ) {
      fail(
        409,
        "PAYMENT_CHECKOUT_IN_PROGRESS",
        "Cancel or finish the secure payment checkout before cancelling this booking",
      );
    }
    const now = new Date();
    if (booking.status === BookingStatus.PAYMENT_PENDING) {
      for (const payment of booking.payments) {
        await lockEntity(tx, "payment", payment.id);
        await releasePaymentWalletHolds(tx, payment.id, driverUserId);
      }
      await tx.paymentAttempt.updateMany({
        where: {
          payment: { bookingId },
          status: { in: activeCheckoutStatuses },
        },
        data: { status: PaymentStatus.CANCELLED, completedAt: now },
      });
      await tx.payment.updateMany({
        where: { bookingId, status: { in: activeCheckoutStatuses } },
        data: {
          status: PaymentStatus.CANCELLED,
          cancelledAt: now,
          checkoutUrl: null,
          sessionExpiresAt: null,
        },
      });
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          financialStatus: "CANCELLED",
          cancelledAt: now,
        },
      });
      await tx.parkingAllocation.update({
        where: { id: booking.allocationId },
        data: { status: "RELEASED" },
      });
      await audit(
        tx,
        DomainAuditEventType.BOOKING_CANCELLED,
        driverUserId,
        booking.propertyId,
        "Booking",
        booking.id,
      );
      return serialize({ booking: updated, cancellation: null });
    }

    const policy = calculateCancellation({
      startAt: booking.startAt,
      cancelledAt: now,
      bookingChargePaisa: booking.baseAmountPaisa,
      platformFeePaisa: booking.platformFeePaisa,
      depositPaisa: booking.depositPaisa,
    });
    const driverWallet = await getOrCreateWallet(tx, driverUserId);
    await lockEntity(tx, "wallet", driverWallet.id);
    await lockEntity(tx, "wallet", booking.settlementWalletAccountId);
    const entries = [
      {
        accountCode: "BOOKING_HELD_FUNDS",
        entrySide: "DEBIT" as const,
        amountPaisa: booking.totalAmountPaisa,
      },
      ...(policy.driverWalletCreditPaisa > 0n
        ? [
            {
              accountCode: "DRIVER_REFUND_LIABILITY",
              walletAccountId: driverWallet.id,
              entrySide: "CREDIT" as const,
              amountPaisa: policy.driverWalletCreditPaisa,
            },
          ]
        : []),
      ...(policy.providerCancellationPaisa > 0n
        ? [
            {
              accountCode: "PROVIDER_PAYABLE",
              walletAccountId: booking.settlementWalletAccountId,
              entrySide: "CREDIT" as const,
              amountPaisa: policy.providerCancellationPaisa,
            },
          ]
        : []),
      ...(booking.platformFeePaisa > 0n
        ? [
            {
              accountCode: "PLATFORM_REVENUE",
              entrySide: "CREDIT" as const,
              amountPaisa: booking.platformFeePaisa,
            },
          ]
        : []),
    ];
    const debit = entries
      .filter((entry) => entry.entrySide === "DEBIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    const credit = entries
      .filter((entry) => entry.entrySide === "CREDIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    if (debit !== credit)
      fail(500, "LEDGER_UNBALANCED", "Cancellation ledger is not balanced");
    const cancellation = await tx.bookingCancellation.create({
      data: {
        bookingId: booking.id,
        driverUserId,
        policyVersion: booking.cancellationPolicyVersion,
        hoursBeforeStartMinutes: policy.minutesBeforeStart,
        bookingRefundBps: policy.bookingRefundBps,
        bookingRefundPaisa: policy.bookingRefundPaisa,
        depositReturnPaisa: policy.depositReturnPaisa,
        platformFeeRefundPaisa: 0n,
        driverWalletCreditPaisa: policy.driverWalletCreditPaisa,
        providerCancellationPaisa: policy.providerCancellationPaisa,
        reason: input.reason ?? null,
        idempotencyKey: input.idempotencyKey,
      },
    });
    await tx.ledgerTransaction.create({
      data: {
        referenceType: "BOOKING_CANCELLATION",
        referenceId: cancellation.id,
        description: `Cancellation settlement for booking ${booking.bookingCode}`,
        actorUserId: driverUserId,
        entries: { create: entries.filter((e) => e.amountPaisa > 0n) },
      },
    });
    if (policy.driverWalletCreditPaisa > 0n)
      await tx.walletAccount.update({
        where: { id: driverWallet.id },
        data: {
          availableBalancePaisa: { increment: policy.driverWalletCreditPaisa },
          balanceVersion: { increment: 1 },
        },
      });
    if (policy.providerCancellationPaisa > 0n)
      await tx.walletAccount.update({
        where: { id: booking.settlementWalletAccountId },
        data: {
          availableBalancePaisa: {
            increment: policy.providerCancellationPaisa,
          },
          balanceVersion: { increment: 1 },
        },
      });
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        financialStatus: "CANCELLED",
        cancelledAt: now,
      },
    });
    await tx.parkingAllocation.update({
      where: { id: booking.allocationId },
      data: { status: "RELEASED" },
    });
    await tx.accessCredential.updateMany({
      where: { bookingId },
      data: { status: "REVOKED" },
    });
    await notification(tx, {
      userId: booking.providerUserId,
      type: "BOOKING_CANCELLED",
      title: "Booking cancelled",
      message: `Booking ${booking.bookingCode} was cancelled.`,
      entityType: "Booking",
      entityId: booking.id,
      idempotencyKey: `booking-cancelled:${booking.id}`,
    });
    await audit(
      tx,
      DomainAuditEventType.BOOKING_CANCELLATION_REFUND_CALCULATED,
      driverUserId,
      booking.propertyId,
      "BookingCancellation",
      cancellation.id,
      {
        driverWalletCreditPaisa: policy.driverWalletCreditPaisa.toString(),
        bookingRefundBps: policy.bookingRefundBps,
      },
    );
    await audit(
      tx,
      DomainAuditEventType.BOOKING_CANCELLED,
      driverUserId,
      booking.propertyId,
      "Booking",
      booking.id,
    );
    return serialize({ booking: updated, cancellation });
  });
  notifyUser(driverUserId, "booking:cancelled", { bookingId });
  notifyUser(result.booking.providerUserId, "booking:cancelled", { bookingId });
  notifyUser(driverUserId, "wallet:balance_changed", { bookingId });
  return result;
}

export async function captureSimulatedPayment(
  driverUserId: string,
  input: { bookingId: string; idempotencyKey: string },
) {
  if (!env.SIMULATED_PAYMENTS_ENABLED)
    fail(404, "SIMULATED_PAYMENT_DISABLED", "Simulated payments are disabled");
  const previous = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { booking: true },
  });
  if (previous) {
    if (
      previous.payerUserId !== driverUserId ||
      previous.bookingId !== input.bookingId
    ) {
      fail(
        409,
        "IDEMPOTENCY_KEY_REUSED",
        "Idempotency key belongs to another payment",
      );
    }
    return serialize({
      payment: previous,
      booking: previous.booking,
      accessCredential: null,
      credentialAlreadyIssued: true,
    });
  }
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", input.bookingId);
      const booking = await tx.booking.findFirst({
        where: { id: input.bookingId, driverUserId },
      });
      if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
      if (booking.status !== BookingStatus.PAYMENT_PENDING)
        fail(
          409,
          "BOOKING_TRANSITION_INVALID",
          "Booking is not awaiting payment",
        );
      if (booking.startAt <= new Date())
        fail(
          409,
          "BOOKING_PAYMENT_WINDOW_CLOSED",
          "Payment must be completed before the booking starts",
        );
      const credentialId = randomUUID();
      const rawCredential = accessCredentialPayload(credentialId);
      const tokenHash = createHash("sha256")
        .update(rawCredential)
        .digest("hex");
      const now = new Date();
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          payerUserId: driverUserId,
          amountPaisa: booking.totalAmountPaisa,
          grossAmountPaisa: booking.totalAmountPaisa,
          status: "CAPTURED",
          providerReference: `SIM-${randomBytes(10).toString("hex")}`,
          idempotencyKey: input.idempotencyKey,
          capturedAt: now,
        },
      });
      const funding = await postSuccessfulBookingPayment(tx, {
        paymentId: payment.id,
        bookingId: booking.id,
        actorUserId: driverUserId,
        propertyId: booking.propertyId,
        bookingCode: booking.bookingCode,
        grossAmountPaisa: booking.totalAmountPaisa,
        gatewayAmountPaisa: booking.totalAmountPaisa,
      });
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED", confirmedAt: now },
      });
      await tx.accessCredential.create({
        data: {
          id: credentialId,
          bookingId: booking.id,
          tokenHash,
          expiresAt: new Date(
            booking.effectiveEndAt.getTime() + 24 * 60 * 60 * 1000,
          ),
        },
      });
      await notification(tx, {
        userId: driverUserId,
        type: "PAYMENT_SUCCEEDED",
        title: "Payment successful",
        message: `Payment for booking ${booking.bookingCode} succeeded.`,
        entityType: "Payment",
        entityId: payment.id,
        idempotencyKey: `payment-success:${payment.id}:driver`,
      });
      await notification(tx, {
        userId: booking.providerUserId,
        type: "BOOKING_CONFIRMED",
        title: "New confirmed booking",
        message: `Booking ${booking.bookingCode} is confirmed.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `booking-confirmed:${booking.id}:provider`,
      });
      await audit(
        tx,
        DomainAuditEventType.PAYMENT_SUCCEEDED,
        driverUserId,
        booking.propertyId,
        "Payment",
        payment.id,
        { ledgerTransactionId: funding.ledgerTransactionId },
      );
      await audit(
        tx,
        DomainAuditEventType.BOOKING_CONFIRMED,
        driverUserId,
        booking.propertyId,
        "Booking",
        booking.id,
      );
      return serialize({
        payment,
        booking: updatedBooking,
        accessCredential: rawCredential,
        credentialAlreadyIssued: false,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function verifyAccessCredential(
  guardUserId: string,
  credential: string,
) {
  const tokenHash = createHash("sha256").update(credential).digest("hex");
  const record = await prisma.accessCredential.findUnique({
    where: credentialLookup(credential, tokenHash),
    select: {
      id: true,
      bookingId: true,
      status: true,
      expiresAt: true,
      booking: { select: guardBookingSelect },
    },
  });
  const now = new Date();
  if (!record || record.status !== "ACTIVE" || record.expiresAt <= now) {
    fail(
      404,
      "ACCESS_CREDENTIAL_INVALID",
      "Access credential is invalid or expired",
    );
  }
  if (!(await isGuardAuthorizedForBooking(guardUserId, record.bookingId))) {
    fail(
      403,
      "GUARD_BOOKING_FORBIDDEN",
      "Guard is not assigned to this Provider at this Property",
    );
  }
  if (
    record.booking.status !== BookingStatus.CONFIRMED ||
    now < new Date(record.booking.startAt.getTime() - 60 * 60 * 1000) ||
    now > record.booking.effectiveEndAt
  ) {
    fail(
      409,
      "BOOKING_CHECK_IN_WINDOW_INVALID",
      "Booking is outside the allowed check-in window",
    );
  }
  return serialize({ valid: true, booking: record.booking });
}

export async function checkInBooking(
  guardUserId: string,
  bookingId: string,
  credential: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const tokenHash = createHash("sha256").update(credential).digest("hex");
    const lookup = credentialLookup(credential, tokenHash);
    const record = await tx.accessCredential.findFirst({
      where: { bookingId, ...(lookup.id ? { id: lookup.id } : { tokenHash }) },
      include: { booking: true },
    });
    if (
      !record ||
      record.status !== "ACTIVE" ||
      record.expiresAt <= new Date()
    ) {
      fail(
        400,
        "ACCESS_CREDENTIAL_INVALID",
        "Access credential is invalid or expired",
      );
    }
    if (!(await isGuardAuthorizedForBooking(guardUserId, bookingId, tx)))
      fail(
        403,
        "GUARD_BOOKING_FORBIDDEN",
        "Guard is not authorized for this booking",
      );
    if (record.booking.status === BookingStatus.CHECKED_IN)
      return serialize(record.booking);
    if (record.booking.status !== BookingStatus.CONFIRMED)
      fail(
        409,
        "BOOKING_TRANSITION_INVALID",
        "Only confirmed bookings can check in",
      );
    const now = new Date();
    if (
      now < new Date(record.booking.startAt.getTime() - 60 * 60 * 1000) ||
      now > record.booking.effectiveEndAt
    ) {
      fail(
        409,
        "BOOKING_CHECK_IN_WINDOW_INVALID",
        "Booking is outside the allowed check-in window",
      );
    }
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN", checkedInAt: now },
    });
    await tx.accessCredential.update({
      where: { id: record.id },
      data: { status: "USED", usedAt: now },
    });
    await audit(
      tx,
      DomainAuditEventType.BOOKING_CHECKED_IN,
      guardUserId,
      booking.propertyId,
      "Booking",
      booking.id,
    );
    return serialize(booking);
  });
}

export async function requestCheckout(driverUserId: string, bookingId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, driverUserId },
    });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.status === BookingStatus.CHECKOUT_REQUESTED)
      return serialize(booking);
    if (booking.status !== BookingStatus.CHECKED_IN)
      fail(
        409,
        "BOOKING_TRANSITION_INVALID",
        "Only checked-in bookings can request checkout",
      );
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CHECKOUT_REQUESTED", checkoutRequestedAt: new Date() },
    });
    await audit(
      tx,
      DomainAuditEventType.BOOKING_CHECKOUT_REQUESTED,
      driverUserId,
      booking.propertyId,
      "Booking",
      booking.id,
    );
    return serialize(updated);
  });
}

export async function checkOutBooking(guardUserId: string, bookingId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { settlement: true, allocation: true },
    });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (!(await isGuardAuthorizedForBooking(guardUserId, bookingId, tx)))
      fail(
        403,
        "GUARD_BOOKING_FORBIDDEN",
        "Guard is not authorized for this booking",
      );
    if (booking.settlement)
      return serialize({ ...booking, settlement: booking.settlement });
    if (
      booking.status !== BookingStatus.CHECKED_IN &&
      booking.status !== BookingStatus.CHECKOUT_REQUESTED
    ) {
      fail(
        409,
        "BOOKING_TRANSITION_INVALID",
        "Booking cannot check out in its current state",
      );
    }
    const now = new Date();
    const effectiveEndAt =
      now > booking.startAt ? now : new Date(booking.startAt.getTime() + 1);
    const overtime = calculateOvertime({
      scheduledEndAt: booking.scheduledEndAt,
      actualCheckOutAt: effectiveEndAt,
      baseRatePerHourPaisa: booking.baseRatePerHourPaisa,
      policy:
        booking.overtimeBillingMode === OvertimeBillingMode.FIXED_PER_HOUR
          ? {
              mode: "FIXED_PER_HOUR",
              fixedRatePerHourPaisa: booking.overtimeRatePerHourPaisa ?? 0n,
              graceMinutes: booking.overtimeGracePeriodMinutes,
            }
          : {
              mode: "MULTIPLIER",
              multiplierBps: booking.overtimeMultiplierBps ?? 15_000,
              graceMinutes: booking.overtimeGracePeriodMinutes,
            },
    });
    const driverWallet = await getOrCreateWallet(tx, booking.driverUserId);
    await lockEntity(tx, "wallet", driverWallet.id);
    await lockEntity(tx, "wallet", booking.settlementWalletAccountId);
    const currentDriverWallet = await tx.walletAccount.findUniqueOrThrow({
      where: { id: driverWallet.id },
    });
    const settlementValue = calculateSettlement({
      baseChargePaisa: booking.baseAmountPaisa,
      platformFeePaisa: booking.platformFeePaisa,
      depositPaisa: booking.depositPaisa,
      overtimeChargePaisa: overtime.overtimeChargePaisa,
      driverAvailablePaisa: currentDriverWallet.availableBalancePaisa,
    });
    const payableNow = settlementValue.outstandingPaisa === 0n;
    const settlement = await tx.bookingSettlement.create({
      data: {
        bookingId: booking.id,
        scheduledStartAt: booking.startAt,
        scheduledEndAt: booking.scheduledEndAt,
        actualCheckInAt: booking.checkedInAt,
        actualCheckOutAt: effectiveEndAt,
        baseChargePaisa: booking.baseAmountPaisa,
        platformFeePaisa: booking.platformFeePaisa,
        depositPaisa: booking.depositPaisa,
        overtimeMinutes: overtime.overtimeMinutes,
        overtimeChargePaisa: overtime.overtimeChargePaisa,
        depositUsedPaisa: settlementValue.depositUsedPaisa,
        depositReturnedPaisa: settlementValue.depositReturnedPaisa,
        providerGrossPaisa: settlementValue.providerGrossPaisa,
        providerNetPaisa: settlementValue.providerNetPaisa,
        platformRevenuePaisa: settlementValue.platformRevenuePaisa,
        driverRefundCreditPaisa: settlementValue.driverRefundCreditPaisa,
        driverWalletChargedPaisa: settlementValue.driverWalletChargedPaisa,
        outstandingPaisa: settlementValue.outstandingPaisa,
        status: payableNow ? "COMPLETED" : "PAYMENT_DUE",
        idempotencyKey: `booking-settlement:${booking.id}`,
        completedAt: payableNow ? now : null,
      },
    });

    let updated;
    if (payableNow) {
      const entries = [
        {
          accountCode: "BOOKING_HELD_FUNDS",
          entrySide: "DEBIT" as const,
          amountPaisa: booking.totalAmountPaisa,
        },
        ...(settlementValue.driverWalletChargedPaisa > 0n
          ? [
              {
                accountCode: "DRIVER_REFUND_LIABILITY",
                walletAccountId: driverWallet.id,
                entrySide: "DEBIT" as const,
                amountPaisa: settlementValue.driverWalletChargedPaisa,
              },
            ]
          : []),
        ...(settlementValue.providerNetPaisa > 0n
          ? [
              {
                accountCode: "PROVIDER_PAYABLE",
                walletAccountId: booking.settlementWalletAccountId,
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.providerNetPaisa,
              },
            ]
          : []),
        ...(settlementValue.platformRevenuePaisa > 0n
          ? [
              {
                accountCode: "PLATFORM_REVENUE",
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.platformRevenuePaisa,
              },
            ]
          : []),
        ...(settlementValue.driverRefundCreditPaisa > 0n
          ? [
              {
                accountCode: "DRIVER_REFUND_LIABILITY",
                walletAccountId: driverWallet.id,
                entrySide: "CREDIT" as const,
                amountPaisa: settlementValue.driverRefundCreditPaisa,
              },
            ]
          : []),
      ];
      const debit = entries
        .filter((entry) => entry.entrySide === "DEBIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      const credit = entries
        .filter((entry) => entry.entrySide === "CREDIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      if (debit !== credit)
        fail(
          500,
          "LEDGER_UNBALANCED",
          "Final settlement ledger is not balanced",
        );
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "BOOKING_SETTLEMENT",
          referenceId: settlement.id,
          description: `Final settlement for booking ${booking.bookingCode}`,
          actorUserId: guardUserId,
          entries: { create: entries.filter((e) => e.amountPaisa > 0n) },
        },
      });
      await tx.walletAccount.update({
        where: { id: booking.settlementWalletAccountId },
        data: {
          availableBalancePaisa: {
            increment: settlementValue.providerNetPaisa,
          },
          balanceVersion: { increment: 1 },
        },
      });
      if (
        settlementValue.driverWalletChargedPaisa > 0n ||
        settlementValue.driverRefundCreditPaisa > 0n
      )
        await tx.walletAccount.update({
          where: { id: driverWallet.id },
          data: {
            availableBalancePaisa: {
              increment:
                settlementValue.driverRefundCreditPaisa -
                settlementValue.driverWalletChargedPaisa,
            },
            balanceVersion: { increment: 1 },
          },
        });
      updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "COMPLETED",
          financialStatus: "SETTLED",
          checkedOutAt: now,
          effectiveEndAt,
        },
      });
    } else {
      if (settlementValue.driverWalletChargedPaisa > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            referenceType: "BOOKING_SETTLEMENT_WALLET_FUNDING",
            referenceId: settlement.id,
            description: `Refund Balance reserved for booking ${booking.bookingCode} settlement`,
            actorUserId: booking.driverUserId,
            entries: {
              create: [
                {
                  accountCode: "DRIVER_REFUND_LIABILITY",
                  walletAccountId: driverWallet.id,
                  entrySide: "DEBIT",
                  amountPaisa: settlementValue.driverWalletChargedPaisa,
                },
                {
                  accountCode: "BOOKING_HELD_FUNDS",
                  entrySide: "CREDIT",
                  amountPaisa: settlementValue.driverWalletChargedPaisa,
                },
              ],
            },
          },
        });
        await tx.walletAccount.update({
          where: { id: driverWallet.id },
          data: {
            availableBalancePaisa: {
              decrement: settlementValue.driverWalletChargedPaisa,
            },
            balanceVersion: { increment: 1 },
          },
        });
      }
      updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "PAYMENT_DUE",
          financialStatus: "SETTLEMENT_PENDING",
          checkedOutAt: now,
          effectiveEndAt,
        },
      });
    }
    const allocationStartAt = booking.allocation?.startAt ?? booking.startAt;
    const allocationEndAt =
      effectiveEndAt > allocationStartAt
        ? effectiveEndAt
        : new Date(allocationStartAt.getTime() + 1000);
    await tx.parkingAllocation.update({
      where: { id: booking.allocationId },
      data: { status: "RELEASED", endAt: allocationEndAt },
    });
    if (overtime.overtimeChargePaisa > 0n)
      await audit(
        tx,
        DomainAuditEventType.OVERTIME_CHARGED,
        guardUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          overtimeMinutes: overtime.overtimeMinutes,
          overtimeChargePaisa: overtime.overtimeChargePaisa.toString(),
        },
      );
    if (payableNow) {
      await audit(
        tx,
        DomainAuditEventType.PROVIDER_EARNINGS_RELEASED,
        guardUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        { providerNetPaisa: settlementValue.providerNetPaisa.toString() },
      );
      await audit(
        tx,
        DomainAuditEventType.DRIVER_REFUND_CREDITED,
        guardUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          driverRefundCreditPaisa:
            settlementValue.driverRefundCreditPaisa.toString(),
        },
      );
      await audit(
        tx,
        DomainAuditEventType.PLATFORM_REVENUE_RECOGNIZED,
        guardUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
        {
          platformRevenuePaisa: settlementValue.platformRevenuePaisa.toString(),
        },
      );
      await audit(
        tx,
        DomainAuditEventType.BOOKING_SETTLED,
        guardUserId,
        booking.propertyId,
        "BookingSettlement",
        settlement.id,
      );
    }
    await audit(
      tx,
      DomainAuditEventType.BOOKING_CHECKED_OUT,
      guardUserId,
      booking.propertyId,
      "Booking",
      booking.id,
    );
    return serialize({ ...updated, settlement });
  });
  const event =
    result.settlement.status === "COMPLETED"
      ? "booking:settlement_completed"
      : "booking:payment_due";
  notifyUser(result.driverUserId, event, { bookingId });
  notifyUser(result.providerUserId, event, { bookingId });
  notifyUser(result.driverUserId, "wallet:balance_changed", { bookingId });
  notifyUser(result.providerUserId, "wallet:balance_changed", { bookingId });
  return result;
}

export async function getDriverBookingSettlement(
  driverUserId: string,
  bookingId: string,
) {
  const settlement = await prisma.bookingSettlement.findFirst({
    where: { bookingId, booking: { driverUserId } },
  });
  if (!settlement)
    fail(
      404,
      "BOOKING_SETTLEMENT_NOT_FOUND",
      "Booking settlement was not found",
    );
  return serialize(settlement);
}

export async function getProviderBookingSettlement(
  actorUserId: string,
  bookingId: string,
) {
  await getProviderBooking(actorUserId, bookingId);
  const settlement = await prisma.bookingSettlement.findUnique({
    where: { bookingId },
  });
  if (!settlement)
    fail(
      404,
      "BOOKING_SETTLEMENT_NOT_FOUND",
      "Booking settlement was not found",
    );
  return serialize(settlement);
}

export async function getWallet(userId: string) {
  const wallet = await prisma.walletAccount.findUnique({
    where: { userId_currency: { userId, currency: "BDT" } },
  });
  if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
  return serialize(wallet);
}

export async function listWalletTransactions(userId: string) {
  const wallet = await prisma.walletAccount.findUnique({
    where: { userId_currency: { userId, currency: "BDT" } },
    select: { id: true },
  });
  if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
  return serialize(
    await prisma.ledgerEntry.findMany({
      where: { walletAccountId: wallet.id },
      select: {
        id: true,
        accountCode: true,
        entrySide: true,
        amountPaisa: true,
        createdAt: true,
        ledgerTransaction: {
          select: {
            id: true,
            referenceType: true,
            referenceId: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function getEarningsSummary(actorUserId: string) {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.EARNINGS_VIEW,
  );
  const providerIds = new Set(
    scopes
      .filter((scope) => scope.resourceIds === null)
      .map((scope) => scope.providerUserId),
  );
  const providerUserIds = [...providerIds];
  const [wallets, unsettled] = await Promise.all([
    prisma.walletAccount.findMany({
      where: { userId: { in: providerUserIds }, currency: "BDT" },
    }),
    prisma.booking.aggregate({
      where: {
        providerUserId: { in: providerUserIds },
        financialStatus: "HELD",
      },
      _sum: { baseAmountPaisa: true },
      _count: true,
    }),
  ]);
  return serialize({
    currency: "BDT",
    availableBalancePaisa: wallets.reduce(
      (sum, wallet) => sum + wallet.availableBalancePaisa,
      0n,
    ),
    pendingBalancePaisa: wallets.reduce(
      (sum, wallet) => sum + wallet.pendingBalancePaisa,
      0n,
    ),
    unsettledBalancePaisa: unsettled._sum.baseAmountPaisa ?? 0n,
    unsettledBookingCount: unsettled._count,
    heldBalancePaisa: wallets.reduce(
      (sum, wallet) => sum + wallet.heldBalancePaisa,
      0n,
    ),
    providerCount: providerIds.size,
  });
}

export async function listEarningsTransactions(actorUserId: string) {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.EARNINGS_VIEW,
  );
  const providerIds = scopes
    .filter((scope) => scope.resourceIds === null)
    .map((scope) => scope.providerUserId);
  const wallets = await prisma.walletAccount.findMany({
    where: { userId: { in: providerIds }, currency: "BDT" },
    select: { id: true },
  });
  return serialize(
    await prisma.ledgerEntry.findMany({
      where: {
        walletAccountId: { in: wallets.map((wallet) => wallet.id) },
        accountCode: "PROVIDER_PAYABLE",
        ledgerTransaction: {
          referenceType: {
            notIn: ["BOOKING_PAYMENT", "LEGACY_BOOKING_PAYMENT_CORRECTION"],
          },
        },
      },
      select: {
        id: true,
        accountCode: true,
        entrySide: true,
        amountPaisa: true,
        createdAt: true,
        ledgerTransaction: {
          select: {
            id: true,
            referenceType: true,
            referenceId: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function createRefund(
  requestedByUserId: string,
  paymentId: string,
  input: { amountPaisa: bigint; reason: string; idempotencyKey: string },
) {
  const previous = await prisma.refund.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (previous) return serialize(previous);
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "payment", paymentId);
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true, refunds: { where: { status: "SUCCEEDED" } } },
      });
      if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
      const requesterAdminRole = await tx.userRole.findUnique({
        where: {
          userId_role: { userId: requestedByUserId, role: UserRoleType.ADMIN },
        },
        select: { userId: true },
      });
      const authorized =
        payment.payerUserId === requestedByUserId ||
        payment.booking.providerUserId === requestedByUserId ||
        Boolean(requesterAdminRole);
      if (!authorized)
        fail(403, "REFUND_FORBIDDEN", "You cannot refund this payment");
      const refundablePaymentStatuses: PaymentStatus[] = [
        PaymentStatus.CAPTURED,
        PaymentStatus.PARTIALLY_REFUNDED,
      ];
      if (!refundablePaymentStatuses.includes(payment.status))
        fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
      const refunded = payment.refunds.reduce(
        (sum, refund) => sum + refund.amountPaisa,
        0n,
      );
      const remaining = payment.amountPaisa - refunded;
      if (input.amountPaisa > remaining)
        fail(
          409,
          "REFUND_AMOUNT_EXCEEDED",
          "Refund exceeds the remaining refundable amount",
        );
      const providerComponent =
        (input.amountPaisa * payment.booking.baseAmountPaisa) /
        payment.amountPaisa;
      const wallet = await tx.walletAccount.findUnique({
        where: { id: payment.booking.settlementWalletAccountId },
      });
      if (!wallet)
        fail(
          409,
          "SETTLEMENT_WALLET_UNAVAILABLE",
          "Settlement wallet is unavailable",
        );
      const fromPending =
        wallet.pendingBalancePaisa < providerComponent
          ? wallet.pendingBalancePaisa
          : providerComponent;
      const fromAvailable = providerComponent - fromPending;
      if (fromAvailable > wallet.availableBalancePaisa)
        fail(
          409,
          "REFUND_BALANCE_UNAVAILABLE",
          "Provider balance is insufficient for this refund",
        );
      const refund = await tx.refund.create({
        data: {
          paymentId,
          requestedByUserId,
          amountPaisa: input.amountPaisa,
          reason: input.reason,
          idempotencyKey: input.idempotencyKey,
          status: "SUCCEEDED",
          processedAt: new Date(),
        },
      });
      const nonProviderComponent = input.amountPaisa - providerComponent;
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "PAYMENT_REFUND",
          referenceId: refund.id,
          description: `Refund for booking ${payment.booking.bookingCode}`,
          actorUserId: requestedByUserId,
          entries: {
            create: [
              ...(providerComponent > 0n
                ? [
                    {
                      accountCode: "PROVIDER_PAYABLE",
                      walletAccountId: wallet.id,
                      entrySide: "DEBIT" as const,
                      amountPaisa: providerComponent,
                    },
                  ]
                : []),
              ...(nonProviderComponent > 0n
                ? [
                    {
                      accountCode: "PLATFORM_REFUND",
                      entrySide: "DEBIT" as const,
                      amountPaisa: nonProviderComponent,
                    },
                  ]
                : []),
              {
                accountCode: "EXTERNAL_PAYMENT_CLEARING",
                entrySide: "CREDIT",
                amountPaisa: input.amountPaisa,
              },
            ],
          },
        },
      });
      if (providerComponent > 0n) {
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: {
            pendingBalancePaisa: { decrement: fromPending },
            availableBalancePaisa: { decrement: fromAvailable },
            balanceVersion: { increment: 1 },
          },
        });
      }
      const totalRefunded = refunded + input.amountPaisa;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:
            totalRefunded === payment.amountPaisa
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED",
        },
      });
      await notification(tx, {
        userId: payment.payerUserId,
        type: "REFUND_PROCESSED",
        title: "Refund processed",
        message: `Refund for booking ${payment.booking.bookingCode} was processed.`,
        entityType: "Refund",
        entityId: refund.id,
        idempotencyKey: `refund:${refund.id}:payer`,
      });
      await audit(
        tx,
        DomainAuditEventType.REFUND_CREATED,
        requestedByUserId,
        payment.booking.propertyId,
        "Refund",
        refund.id,
      );
      return serialize(refund);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function cancelBookingAsAdmin(
  adminUserId: string,
  bookingId: string,
  reason: string,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payments: true },
      });
      if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
      const cancellableStatuses: BookingStatus[] = [
        BookingStatus.PAYMENT_PENDING,
        BookingStatus.CONFIRMED,
      ];
      if (!cancellableStatuses.includes(booking.status))
        fail(
          409,
          "BOOKING_INVALID_STATE",
          "Booking cannot be cancelled in its current state",
        );
      if (booking.startAt <= new Date())
        fail(
          409,
          "BOOKING_CANCELLATION_WINDOW_CLOSED",
          "Started bookings cannot be cancelled",
        );
      if (
        booking.status === BookingStatus.PAYMENT_PENDING &&
        hasLiveCheckout(booking)
      ) {
        fail(
          409,
          "PAYMENT_CHECKOUT_IN_PROGRESS",
          "Cancel or finish the secure payment checkout before cancelling this booking",
        );
      }
      const unsettledPaymentStatuses: PaymentStatus[] = [
        PaymentStatus.SUCCEEDED,
        PaymentStatus.CAPTURED,
        PaymentStatus.REFUND_PENDING,
        PaymentStatus.PARTIALLY_REFUNDED,
      ];
      if (
        booking.status === BookingStatus.CONFIRMED &&
        booking.payments.some((payment) =>
          unsettledPaymentStatuses.includes(payment.status),
        )
      ) {
        fail(
          409,
          "ADMIN_BOOKING_REFUND_REQUIRED",
          "Refund all captured payment value before cancelling a confirmed booking",
        );
      }
      const now = new Date();
      if (booking.status === BookingStatus.PAYMENT_PENDING) {
        for (const payment of booking.payments) {
          await lockEntity(tx, "payment", payment.id);
          await releasePaymentWalletHolds(tx, payment.id, booking.driverUserId);
        }
        await tx.paymentAttempt.updateMany({
          where: {
            payment: { bookingId },
            status: { in: activeCheckoutStatuses },
          },
          data: { status: PaymentStatus.CANCELLED, completedAt: now },
        });
        await tx.payment.updateMany({
          where: { bookingId, status: { in: activeCheckoutStatuses } },
          data: {
            status: PaymentStatus.CANCELLED,
            cancelledAt: now,
            checkoutUrl: null,
            sessionExpiresAt: null,
          },
        });
      }
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          financialStatus: "CANCELLED",
          cancelledAt: now,
        },
      });
      await tx.parkingAllocation.update({
        where: { id: booking.allocationId },
        data: { status: ParkingAllocationStatus.RELEASED },
      });
      await tx.accessCredential.updateMany({
        where: { bookingId },
        data: { status: "REVOKED" },
      });
      await notification(tx, {
        userId: booking.driverUserId,
        type: "BOOKING_CANCELLED",
        title: "Booking cancelled by support",
        message: `Booking ${booking.bookingCode} was cancelled after an Admin review.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `admin-booking-cancelled:${booking.id}:driver`,
      });
      await notification(tx, {
        userId: booking.providerUserId,
        type: "BOOKING_CANCELLED",
        title: "Booking cancelled by support",
        message: `Booking ${booking.bookingCode} was cancelled after an Admin review.`,
        entityType: "Booking",
        entityId: booking.id,
        idempotencyKey: `admin-booking-cancelled:${booking.id}:provider`,
      });
      await audit(
        tx,
        DomainAuditEventType.ADMIN_BOOKING_CANCELLED,
        adminUserId,
        booking.propertyId,
        "Booking",
        booking.id,
        { reason },
      );
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createAdminBookingRefund(
  adminUserId: string,
  bookingId: string,
  input: { amountPaisa: bigint; reason: string; idempotencyKey: string },
) {
  const payment = await prisma.payment.findFirst({
    where: {
      bookingId,
      status: {
        in: [
          PaymentStatus.SUCCEEDED,
          PaymentStatus.CAPTURED,
          PaymentStatus.PARTIALLY_REFUNDED,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!payment)
    fail(
      409,
      "PAYMENT_NOT_REFUNDABLE",
      "This booking has no refundable payment",
    );
  return requestAdminRefund(adminUserId, payment.id, input);
}

const driverRefundInclude = {
  payment: {
    select: {
      id: true,
      amountPaisa: true,
      currency: true,
      status: true,
      capturedAt: true,
      booking: {
        select: {
          id: true,
          bookingCode: true,
          status: true,
          property: { select: { id: true, name: true, publicArea: true } },
        },
      },
    },
  },
} satisfies Prisma.RefundInclude;

export async function listDriverRefunds(
  driverUserId: string,
  input: {
    page: number;
    limit: number;
    status?: RefundStatus;
  },
) {
  const where: Prisma.RefundWhereInput = {
    payment: { payerUserId: driverUserId },
    ...(input.status ? { status: input.status } : {}),
  };
  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: driverRefundInclude,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.refund.count({ where }),
  ]);
  return serialize({
    refunds,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function getDriverRefund(driverUserId: string, refundId: string) {
  const refund = await prisma.refund.findFirst({
    where: { id: refundId, payment: { payerUserId: driverUserId } },
    include: driverRefundInclude,
  });
  if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund was not found");
  return serialize(refund);
}

const payoutMethodPublicSelect = {
  id: true,
  type: true,
  accountHolderName: true,
  maskedAccountIdentifier: true,
  bankName: true,
  branchName: true,
  routingNumber: true,
  isDefault: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProviderPayoutMethodSelect;

function maskPayoutIdentifier(value: string): string {
  const compact = value.replace(/\s+/g, "");
  const visible = compact.slice(-4);
  return `${"*".repeat(Math.max(4, Math.min(12, compact.length - visible.length)))}${visible}`;
}

export async function listProviderPayoutMethods(providerUserId: string) {
  return prisma.providerPayoutMethod.findMany({
    where: { providerUserId },
    select: payoutMethodPublicSelect,
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createProviderPayoutMethod(
  providerUserId: string,
  input: {
    type: PayoutMethodType;
    accountHolderName: string;
    accountIdentifier: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
    isDefault: boolean;
  },
) {
  const encrypted = encryptSensitiveText(input.accountIdentifier);
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "provider-payout-method", providerUserId);
      const activeCount = await tx.providerPayoutMethod.count({
        where: { providerUserId, status: PayoutMethodStatus.ACTIVE },
      });
      const makeDefault = input.isDefault || activeCount === 0;
      if (makeDefault) {
        await tx.providerPayoutMethod.updateMany({
          where: { providerUserId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const method = await tx.providerPayoutMethod.create({
        data: {
          providerUserId,
          type: input.type,
          accountHolderName: input.accountHolderName,
          accountIdentifierCiphertext: encrypted.ciphertext,
          accountIdentifierIv: encrypted.iv,
          accountIdentifierTag: encrypted.authTag,
          maskedAccountIdentifier: maskPayoutIdentifier(
            input.accountIdentifier,
          ),
          bankName: input.bankName ?? null,
          branchName: input.branchName ?? null,
          routingNumber: input.routingNumber ?? null,
          isDefault: makeDefault,
        },
        select: payoutMethodPublicSelect,
      });
      await audit(
        tx,
        DomainAuditEventType.PAYOUT_METHOD_CREATED,
        providerUserId,
        undefined,
        "ProviderPayoutMethod",
        method.id,
        { type: method.type, isDefault: method.isDefault },
      );
      return method;
    },
    { isolationLevel: "Serializable" },
  );
}

export async function setDefaultProviderPayoutMethod(
  providerUserId: string,
  payoutMethodId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "provider-payout-method", providerUserId);
      const method = await tx.providerPayoutMethod.findFirst({
        where: {
          id: payoutMethodId,
          providerUserId,
          status: PayoutMethodStatus.ACTIVE,
        },
      });
      if (!method)
        fail(
          404,
          "PAYOUT_METHOD_NOT_FOUND",
          "Active payout method was not found",
        );
      await tx.providerPayoutMethod.updateMany({
        where: { providerUserId, isDefault: true, id: { not: method.id } },
        data: { isDefault: false },
      });
      const updated = await tx.providerPayoutMethod.update({
        where: { id: method.id },
        data: { isDefault: true },
        select: payoutMethodPublicSelect,
      });
      await audit(
        tx,
        DomainAuditEventType.PAYOUT_METHOD_DEFAULTED,
        providerUserId,
        undefined,
        "ProviderPayoutMethod",
        method.id,
      );
      return updated;
    },
    { isolationLevel: "Serializable" },
  );
}

export async function deactivateProviderPayoutMethod(
  providerUserId: string,
  payoutMethodId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "provider-payout-method", providerUserId);
      const method = await tx.providerPayoutMethod.findFirst({
        where: { id: payoutMethodId, providerUserId },
      });
      if (!method)
        fail(404, "PAYOUT_METHOD_NOT_FOUND", "Payout method was not found");
      if (method.status === PayoutMethodStatus.INACTIVE)
        return tx.providerPayoutMethod.findUniqueOrThrow({
          where: { id: method.id },
          select: payoutMethodPublicSelect,
        });
      const pendingPayout = await tx.payoutRequest.findFirst({
        where: {
          payoutMethodId: method.id,
          status: {
            in: [
              PayoutStatus.PENDING,
              PayoutStatus.REQUESTED,
              PayoutStatus.ON_HOLD,
              PayoutStatus.APPROVED,
            ],
          },
        },
        select: { id: true },
      });
      if (pendingPayout)
        fail(
          409,
          "PAYOUT_METHOD_IN_USE",
          "This payout method has an unfinished payout request",
        );
      const updated = await tx.providerPayoutMethod.update({
        where: { id: method.id },
        data: { status: PayoutMethodStatus.INACTIVE, isDefault: false },
        select: payoutMethodPublicSelect,
      });
      await audit(
        tx,
        DomainAuditEventType.PAYOUT_METHOD_DEACTIVATED,
        providerUserId,
        undefined,
        "ProviderPayoutMethod",
        method.id,
      );
      return updated;
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createPayout(
  providerUserId: string,
  input: {
    amountPaisa: bigint;
    payoutMethodId: string;
    idempotencyKey: string;
  },
) {
  const previous = await prisma.payoutRequest.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (previous) return serialize(previous);
  const payout = await prisma.$transaction(
    async (tx) => {
      const payoutMethod = await tx.providerPayoutMethod.findFirst({
        where: {
          id: input.payoutMethodId,
          providerUserId,
          status: PayoutMethodStatus.ACTIVE,
        },
      });
      if (!payoutMethod)
        fail(409, "PAYOUT_METHOD_INACTIVE", "Select an active payout method");
      const wallet = await tx.walletAccount.findUnique({
        where: { userId_currency: { userId: providerUserId, currency: "BDT" } },
      });
      if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
      await lockEntity(tx, "wallet", wallet.id);
      const current = await tx.walletAccount.findUniqueOrThrow({
        where: { id: wallet.id },
      });
      if (
        current.status !== "ACTIVE" ||
        current.availableBalancePaisa < input.amountPaisa
      ) {
        fail(
          409,
          "PAYOUT_BALANCE_INSUFFICIENT",
          "Available balance is insufficient for payout",
        );
      }
      const payout = await tx.payoutRequest.create({
        data: {
          providerUserId,
          walletAccountId: wallet.id,
          payoutMethodId: payoutMethod.id,
          amountPaisa: input.amountPaisa,
          status: PayoutStatus.REQUESTED,
          idempotencyKey: input.idempotencyKey,
          destinationSnapshot: {
            type: payoutMethod.type,
            accountHolderName: payoutMethod.accountHolderName,
            maskedAccountIdentifier: payoutMethod.maskedAccountIdentifier,
            bankName: payoutMethod.bankName,
            branchName: payoutMethod.branchName,
            routingNumber: payoutMethod.routingNumber,
          },
          destinationCiphertext: payoutMethod.accountIdentifierCiphertext,
          destinationIv: payoutMethod.accountIdentifierIv,
          destinationTag: payoutMethod.accountIdentifierTag,
        },
      });
      await tx.walletAccount.update({
        where: { id: wallet.id },
        data: {
          availableBalancePaisa: { decrement: input.amountPaisa },
          heldBalancePaisa: { increment: input.amountPaisa },
          balanceVersion: { increment: 1 },
        },
      });
      const membership = await tx.propertyProvider.findFirst({
        where: { providerUserId },
        select: { propertyId: true },
      });
      await audit(
        tx,
        DomainAuditEventType.PAYOUT_REQUESTED,
        providerUserId,
        membership?.propertyId,
        "PayoutRequest",
        payout.id,
      );
      return serialize(payout);
    },
    { isolationLevel: "Serializable" },
  );
  notifyUser(providerUserId, "payout:status_changed", { payoutId: payout.id });
  notifyUser(providerUserId, "wallet:balance_changed", { payoutId: payout.id });
  return payout;
}

export async function listProviderPayouts(
  providerUserId: string,
  input: {
    page: number;
    limit: number;
    status?: PayoutStatus;
  },
) {
  const where: Prisma.PayoutRequestWhereInput = {
    providerUserId,
    ...(input.status ? { status: input.status } : {}),
  };
  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      include: { payoutMethod: { select: payoutMethodPublicSelect } },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.payoutRequest.count({ where }),
  ]);
  return serialize({
    payouts,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function getProviderPayout(
  providerUserId: string,
  payoutId: string,
) {
  const payout = await prisma.payoutRequest.findFirst({
    where: { id: payoutId, providerUserId },
    include: { payoutMethod: { select: payoutMethodPublicSelect } },
  });
  if (!payout) fail(404, "PAYOUT_NOT_FOUND", "Payout request was not found");
  return serialize(payout);
}

export async function listPayouts(input: {
  page: number;
  limit: number;
  status?: PayoutStatus;
}) {
  const where: Prisma.PayoutRequestWhereInput = input.status
    ? { status: input.status }
    : {};
  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      include: {
        provider: { select: { id: true, fullName: true, email: true } },
        payoutMethod: { select: payoutMethodPublicSelect },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.payoutRequest.count({ where }),
  ]);
  return serialize({
    payouts,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function reviewPayout(
  adminUserId: string,
  payoutId: string,
  input: {
    decision: "APPROVED" | "REJECTED" | "PAID";
    note: string;
    externalReference?: string;
  },
) {
  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "payout", payoutId);
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });
      if (!payout)
        fail(404, "PAYOUT_NOT_FOUND", "Payout request was not found");
      if (payout.status === input.decision) return serialize(payout);
      if (
        input.decision === "PAID" &&
        payout.status !== PayoutStatus.APPROVED
      ) {
        fail(
          409,
          "PAYOUT_TRANSITION_INVALID",
          "Only an approved payout can be marked paid",
        );
      }
      if (
        input.decision !== "PAID" &&
        payout.status !== PayoutStatus.PENDING &&
        payout.status !== PayoutStatus.REQUESTED
      ) {
        fail(
          409,
          "PAYOUT_TRANSITION_INVALID",
          "Only a requested payout can be approved or rejected",
        );
      }
      let externalReference: string | null = null;
      if (input.decision === "PAID") {
        if (!input.externalReference) {
          fail(
            400,
            "PAYOUT_EXTERNAL_REFERENCE_REQUIRED",
            "An external transfer reference is required when marking a payout paid",
          );
        }
        externalReference = input.externalReference;
      }
      await lockEntity(tx, "wallet", payout.walletAccountId);
      const wallet = await tx.walletAccount.findUniqueOrThrow({
        where: { id: payout.walletAccountId },
      });
      if (wallet.heldBalancePaisa < payout.amountPaisa) {
        fail(
          409,
          "PAYOUT_HELD_BALANCE_INVALID",
          "Reserved payout balance is unavailable",
        );
      }
      if (input.decision === "REJECTED") {
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: {
            heldBalancePaisa: { decrement: payout.amountPaisa },
            availableBalancePaisa: { increment: payout.amountPaisa },
            balanceVersion: { increment: 1 },
          },
        });
      }
      if (input.decision === "PAID") {
        await tx.ledgerTransaction.create({
          data: {
            referenceType: "PAYOUT",
            referenceId: payout.id,
            description: "Manual payout settlement",
            actorUserId: adminUserId,
            entries: {
              create: [
                {
                  accountCode: "PROVIDER_PAYABLE",
                  walletAccountId: wallet.id,
                  entrySide: "DEBIT",
                  amountPaisa: payout.amountPaisa,
                },
                {
                  accountCode: "EXTERNAL_PAYOUT_CLEARING",
                  entrySide: "CREDIT",
                  amountPaisa: payout.amountPaisa,
                },
              ],
            },
          },
        });
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: {
            heldBalancePaisa: { decrement: payout.amountPaisa },
            balanceVersion: { increment: 1 },
          },
        });
      }
      const now = new Date();
      const updated = await tx.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: input.decision,
          reviewedById: adminUserId,
          reviewNote: input.note,
          reviewedAt: now,
          paidAt: input.decision === "PAID" ? now : null,
          externalReference,
        },
      });
      await notification(tx, {
        userId: payout.providerUserId,
        type: "PAYOUT_UPDATED",
        title: "Payout updated",
        message: `Your payout request is now ${input.decision.toLowerCase()}.`,
        entityType: "PayoutRequest",
        entityId: payout.id,
        idempotencyKey: `payout:${payout.id}:${input.decision}`,
      });
      const payoutEvent =
        input.decision === "APPROVED"
          ? DomainAuditEventType.PAYOUT_APPROVED
          : input.decision === "REJECTED"
            ? DomainAuditEventType.PAYOUT_REJECTED
            : DomainAuditEventType.PAYOUT_PAID;
      await audit(
        tx,
        payoutEvent,
        adminUserId,
        undefined,
        "PayoutRequest",
        payout.id,
        { decision: input.decision, reason: input.note },
      );
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
  notifyUser(result.providerUserId, "payout:status_changed", {
    payoutId: result.id,
  });
  notifyUser(result.providerUserId, "wallet:balance_changed", {
    payoutId: result.id,
  });
  return result;
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
  if (updated.count !== 1)
    fail(404, "NOTIFICATION_NOT_FOUND", "Notification was not found");
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function createReview(
  driverUserId: string,
  bookingId: string,
  input: { rating: number; comment?: string },
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, driverUserId },
  });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  if (booking.status !== BookingStatus.COMPLETED)
    fail(
      409,
      "REVIEW_BOOKING_NOT_COMPLETED",
      "Only completed bookings can be reviewed",
    );
  try {
    return await prisma.review.create({
      data: {
        bookingId,
        driverUserId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });
  } catch {
    fail(
      409,
      "REVIEW_ALREADY_EXISTS",
      "This booking has already been reviewed",
    );
  }
}

export async function listProviderReviews(actorUserId: string) {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  const reviews = await prisma.review.findMany({
    where: {
      booking: {
        listing: {
          providerMembershipId: {
            in: scopes.map((scope) => scope.providerMembershipId),
          },
        },
      },
    },
    include: {
      booking: {
        select: {
          bookingCode: true,
          propertyId: true,
          parkingSpotId: true,
          listing: { select: { providerMembershipId: true } },
        },
      },
      driver: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const unrestrictedResourceIds = new Set(
    scopes
      .filter((scope) => scope.resourceIds === null)
      .map((scope) => scope.providerMembershipId),
  );
  const allowedResourceIds = new Set(
    scopes.flatMap((scope) => scope.resourceIds ?? []),
  );
  return reviews.filter((review) => {
    const membershipId = review.booking.listing.providerMembershipId;
    return (
      unrestrictedResourceIds.has(membershipId) ||
      allowedResourceIds.has(review.booking.parkingSpotId)
    );
  });
}

export async function replyReview(
  actorUserId: string,
  reviewId: string,
  reply: string,
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { booking: true },
  });
  if (!review) fail(404, "REVIEW_NOT_FOUND", "Review was not found");
  if (review.booking.providerUserId !== actorUserId) {
    await requireAuthority(
      actorUserId,
      review.booking.propertyId,
      ManagerDelegationPermission.BOOKING_MANAGE,
      review.booking.parkingSpotId,
    );
  }
  return prisma.review.update({
    where: { id: review.id },
    data: {
      providerReply: reply,
      providerRepliedById: actorUserId,
      providerRepliedAt: new Date(),
    },
  });
}

export async function createDispute(
  openedByUserId: string,
  bookingId: string,
  input: {
    category:
      | "PAYMENT"
      | "ACCESS"
      | "PARKING_CONDITION"
      | "OVERCHARGE"
      | "VEHICLE_DAMAGE"
      | "OTHER";
    description: string;
    evidence?: Array<{ url: string; type: string }>;
  },
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (
      booking.driverUserId !== openedByUserId &&
      booking.providerUserId !== openedByUserId
    ) {
      fail(403, "DISPUTE_FORBIDDEN", "You cannot dispute this booking");
    }
    const existing = await tx.dispute.findUnique({ where: { bookingId } });
    if (existing)
      fail(
        409,
        "DISPUTE_ALREADY_EXISTS",
        "A dispute already exists for this booking",
      );
    const dispute = await tx.dispute.create({
      data: {
        bookingId,
        openedByUserId,
        category: input.category,
        description: input.description,
        ...(input.evidence
          ? { evidence: input.evidence as Prisma.InputJsonValue }
          : {}),
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "DISPUTED" },
    });
    await audit(
      tx,
      DomainAuditEventType.DISPUTE_CREATED,
      openedByUserId,
      booking.propertyId,
      "Dispute",
      dispute.id,
    );
    return dispute;
  });
}

export async function resolveDispute(
  adminUserId: string,
  disputeId: string,
  input: { decision: "RESOLVED" | "REJECTED"; resolution: string },
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "dispute", disputeId);
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });
    if (!dispute) fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
    const resolvableStatuses: DisputeStatus[] = [
      DisputeStatus.OPEN,
      DisputeStatus.UNDER_REVIEW,
    ];
    if (!resolvableStatuses.includes(dispute.status))
      fail(409, "DISPUTE_STATE_INVALID", "Dispute has already been resolved");
    const updated = await tx.dispute.update({
      where: { id: dispute.id },
      data: {
        status: input.decision,
        resolution: input.resolution,
        resolvedByUserId: adminUserId,
        resolvedAt: new Date(),
      },
    });
    await notification(tx, {
      userId: dispute.openedByUserId,
      type: "DISPUTE_UPDATE",
      title: "Dispute updated",
      message: `Your dispute for booking ${dispute.booking.bookingCode} was ${input.decision.toLowerCase()}.`,
      entityType: "Dispute",
      entityId: dispute.id,
      idempotencyKey: `dispute:${dispute.id}:${input.decision}`,
    });
    await audit(
      tx,
      DomainAuditEventType.DISPUTE_RESOLVED,
      adminUserId,
      dispute.booking.propertyId,
      "Dispute",
      dispute.id,
      { decision: input.decision },
    );
    return updated;
  });
}

export async function listDriverReviews(driverUserId: string) {
  return prisma.review.findMany({
    where: { driverUserId },
    include: {
      booking: {
        select: {
          bookingCode: true,
          propertyId: true,
          parkingSpotId: true,
          property: { select: { id: true, name: true, publicArea: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const disputeInclude = {
  booking: {
    select: {
      id: true,
      bookingCode: true,
      status: true,
      startAt: true,
      scheduledEndAt: true,
      property: { select: { id: true, name: true, publicArea: true } },
      parkingSpot: { select: { id: true, displayName: true, spotCode: true } },
      driver: { select: { id: true, fullName: true } },
      provider: { select: { id: true, fullName: true } },
    },
  },
  openedBy: { select: { id: true, fullName: true } },
  resolvedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.DisputeInclude;

export async function listDriverDisputes(
  driverUserId: string,
  input: {
    page: number;
    limit: number;
    status?: DisputeStatus;
  },
) {
  const where: Prisma.DisputeWhereInput = {
    booking: { driverUserId },
    ...(input.status ? { status: input.status } : {}),
  };
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: disputeInclude,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, pagination: pagination(input.page, input.limit, total) };
}

export async function getDriverDispute(
  driverUserId: string,
  disputeId: string,
) {
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, booking: { driverUserId } },
    include: disputeInclude,
  });
  if (!dispute) fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
  return dispute;
}

async function providerDisputeScope(
  actorUserId: string,
): Promise<Prisma.DisputeWhereInput[]> {
  const scopes = await listProviderAccessScopes(
    actorUserId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  return scopes.map((scope) => ({
    booking: {
      listing: { providerMembershipId: scope.providerMembershipId },
      ...(scope.resourceIds === null
        ? {}
        : { parkingSpotId: { in: scope.resourceIds } }),
    },
  }));
}

export async function listProviderDisputes(
  actorUserId: string,
  input: {
    page: number;
    limit: number;
    status?: DisputeStatus;
  },
) {
  const scope = await providerDisputeScope(actorUserId);
  if (scope.length === 0)
    return { disputes: [], pagination: pagination(input.page, input.limit, 0) };
  const where: Prisma.DisputeWhereInput = {
    OR: scope,
    ...(input.status ? { status: input.status } : {}),
  };
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: disputeInclude,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.dispute.count({ where }),
  ]);
  return { disputes, pagination: pagination(input.page, input.limit, total) };
}

export async function getProviderDispute(
  actorUserId: string,
  disputeId: string,
) {
  const scope = await providerDisputeScope(actorUserId);
  if (scope.length === 0)
    fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, OR: scope },
    include: disputeInclude,
  });
  if (!dispute) fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
  return dispute;
}

export async function listDisputes(input: {
  page: number;
  limit: number;
  status?: DisputeStatus;
}) {
  const where: Prisma.DisputeWhereInput = input.status
    ? { status: input.status }
    : {};
  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            status: true,
            propertyId: true,
            driverUserId: true,
            providerUserId: true,
            startAt: true,
            scheduledEndAt: true,
            property: { select: { id: true, name: true, publicArea: true } },
            driver: { select: { id: true, fullName: true } },
            provider: { select: { id: true, fullName: true } },
          },
        },
        openedBy: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.dispute.count({ where }),
  ]);
  return serialize({
    disputes,
    pagination: pagination(input.page, input.limit, total),
  });
}

export async function getPropertyReports(
  actorUserId: string,
  propertyId: string,
) {
  const authority = await requireAuthority(
    actorUserId,
    propertyId,
    ManagerDelegationPermission.REPORTS_VIEW,
  );

  const canEarnings =
    !authority.managed ||
    (await resolveProviderAuthority(
      actorUserId,
      propertyId,
      ManagerDelegationPermission.EARNINGS_VIEW,
    )) !== null;

  const [bookingCounts, resources, activeListings] = await Promise.all([
    prisma.booking.groupBy({
      by: ["status"],
      where: {
        propertyId,
        ...(authority.managed
          ? { providerUserId: authority.membership.providerUserId }
          : {}),
      },
      _count: true,
    }),
    prisma.parkingSpot.findMany({
      where: {
        propertyId,
        deletedAt: null,
        ...(authority.managed
          ? { providerMembershipId: authority.membership.id }
          : {}),
      },
      select: { id: true, status: true, capacity: true },
    }),
    prisma.parkingListing.count({
      where: {
        parkingSpot: { propertyId },
        status: ParkingListingStatus.ACTIVE,
        ...(authority.managed
          ? { providerMembershipId: authority.membership.id }
          : {}),
      },
    }),
  ]);

  const bookingStatusBreakdown: Record<string, number> = {};
  let totalBookings = 0;
  for (const b of bookingCounts) {
    bookingStatusBreakdown[b.status] = b._count;
    totalBookings += b._count;
  }

  let totalCapacity = 0;
  let activeResources = 0;
  for (const r of resources) {
    totalCapacity += r.capacity;
    if (r.status === ParkingSpotStatus.ACTIVE) activeResources++;
  }

  let financialMetrics: {
    totalRevenuePaisa: string;
    settledRevenuePaisa: string;
  } | null = null;

  if (canEarnings) {
    const revenue = await prisma.booking.aggregate({
      where: {
        propertyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        ...(authority.managed
          ? { providerUserId: authority.membership.providerUserId }
          : {}),
      },
      _sum: { totalAmountPaisa: true, baseAmountPaisa: true },
    });
    financialMetrics = {
      totalRevenuePaisa: String(revenue._sum.totalAmountPaisa ?? 0n),
      settledRevenuePaisa: String(revenue._sum.baseAmountPaisa ?? 0n),
    };
  }

  return serialize({
    propertyId,
    totalBookings,
    activeBookings:
      (bookingStatusBreakdown["ACTIVE"] ?? 0) +
      (bookingStatusBreakdown["CONFIRMED"] ?? 0),
    completedBookings: bookingStatusBreakdown["COMPLETED"] ?? 0,
    cancelledBookings: bookingStatusBreakdown["CANCELLED"] ?? 0,
    bookingStatusBreakdown,
    resourceMetrics: {
      totalResources: resources.length,
      activeResources,
      totalCapacity,
    },
    activeListingCount: activeListings,
    financialMetrics,
  });
}
