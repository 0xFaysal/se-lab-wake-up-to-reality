import { createHash, randomBytes } from "node:crypto";
import {
  BookingStatus,
  DomainAuditEventType,
  ManagerDelegationPermission,
  ParkingAllocationStatus,
  ParkingListingStatus,
  ParkingResourceType,
  ParkingRightStatus,
  ParkingRightType,
  ParkingSpotStatus,
  PayoutStatus,
  PropertyStatus,
  UserStatus,
  VerificationStatus,
  type Prisma,
  type VehicleType,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../common/errors/app-error.js";
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

const DHAKA_TIME_ZONE = "Asia/Dhaka";
const QUOTE_TTL_MS = 5 * 60 * 1000;
const HOLD_TTL_MS = 5 * 60 * 1000;
const PLATFORM_FEE_BASIS_POINTS = 1_000n;

type JsonObject = Record<string, unknown>;
type AuditMetadata = Record<string, string | number | boolean | null>;

function fail(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ message, statusCode, code, ...(details === undefined ? {} : { details }) });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item),
  ) as T;
}

function normalizeSpotCode(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

function timeValue(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
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
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    dayOfWeek: weekdayMap[get("weekday")] ?? -1,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
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
    type: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "PAYMENT_SUCCEEDED" | "REFUND_PROCESSED" | "PAYOUT_UPDATED" | "DISPUTE_UPDATE" | "PROPERTY_GOVERNANCE";
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    idempotencyKey: string;
  },
) {
  await tx.notification.upsert({
    where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } },
    update: {},
    create: input,
  });
}

async function requireEligibleProperty(propertyId: string, db: MarketplaceDb | typeof prisma = prisma) {
  const property = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, canonicalPropertyId: null },
  });
  if (!property) fail(404, "PROPERTY_NOT_FOUND", "Property was not found");
  return property;
}

async function requireAuthority(
  actorUserId: string,
  propertyId: string,
  permission?: ManagerDelegationPermission,
  resourceId?: string,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  const authority = await resolveProviderAuthority(actorUserId, propertyId, permission, resourceId, db);
  if (!authority) fail(403, "MARKETPLACE_FORBIDDEN", "You do not have authority for this operation");
  return authority;
}

async function isResourceAvailable(
  resource: {
    id: string;
    resourceType: ParkingResourceType;
    capacity: number;
    availabilityRules: Array<{ dayOfWeek: number; startLocalTime: Date; endLocalTime: Date; validFrom: Date; validUntil: Date | null; isActive: boolean }>;
    availabilityExceptions: Array<{ startsAt: Date; endsAt: Date; exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE" }>;
    property: { status: PropertyStatus; temporaryClosedAt: Date | null; temporaryClosedUntil: Date | null };
  },
  startAt: Date,
  endAt: Date,
) {
  if (resource.property.status !== PropertyStatus.ACTIVE) return false;
  if (resource.property.temporaryClosedAt &&
      overlaps(resource.property.temporaryClosedAt, resource.property.temporaryClosedUntil ?? endAt, startAt, endAt)) {
    return false;
  }
  const blocked = resource.availabilityExceptions.some((exception) =>
    exception.exceptionType === "BLOCKED" && overlaps(exception.startsAt, exception.endsAt, startAt, endAt));
  if (blocked) return false;
  const special = resource.availabilityExceptions.some((exception) =>
    exception.exceptionType === "SPECIAL_AVAILABLE" && exception.startsAt <= startAt && exception.endsAt >= endAt);
  if (special) return true;

  const start = dhakaParts(startAt);
  const end = dhakaParts(endAt);
  if (start.date !== end.date) return false;
  return resource.availabilityRules.some((rule) => {
    const validFrom = rule.validFrom.toISOString().slice(0, 10);
    const validUntil = rule.validUntil?.toISOString().slice(0, 10);
    const ruleStart = rule.startLocalTime.toISOString().slice(11, 16);
    const ruleEnd = rule.endLocalTime.toISOString().slice(11, 16);
    return rule.isActive && rule.dayOfWeek === start.dayOfWeek && validFrom <= start.date &&
      (!validUntil || validUntil >= start.date) && ruleStart <= start.time && ruleEnd >= end.time;
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
      status: { in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      OR: [{ status: ParkingAllocationStatus.BOOKED }, { expiresAt: { gt: new Date() } }],
    },
  });
}

export async function createResource(actorUserId: string, propertyId: string, input: {
  type: ParkingResourceType; displayName: string; spotCode?: string; floor?: string; zone?: string;
  capacity: number; supportedVehicleTypes: VehicleType[]; isCovered: boolean; hasCctv: boolean; hasGuard: boolean;
  maxHeightCm?: number; maxWidthCm?: number; maxLengthCm?: number;
}) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "property-resource", propertyId);
    await requireEligibleProperty(propertyId, tx);
    const authority = await requireAuthority(actorUserId, propertyId, undefined, undefined, tx);
    const normalizedSpotCode = input.spotCode ? normalizeSpotCode(input.spotCode) : null;
    if (normalizedSpotCode) {
      const duplicate = await tx.parkingSpot.findFirst({
        where: { propertyId, normalizedSpotCode, deletedAt: null }, select: { id: true },
      });
      if (duplicate) fail(409, "PARKING_RESOURCE_CODE_CONFLICT", "A resource with this spot code already exists");
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
        capacity: input.type === ParkingResourceType.FIXED_SPACE ? 1 : input.capacity,
        supportedVehicleType: input.supportedVehicleTypes[0]!,
        supportedVehicleTypes: input.supportedVehicleTypes,
        status: ParkingSpotStatus.INACTIVE,
        isCovered: input.isCovered,
        hasCctv: input.hasCctv,
        hasGuard: input.hasGuard,
        maxHeightCm: input.maxHeightCm ?? null,
        maxWidthCm: input.maxWidthCm ?? null,
        maxLengthCm: input.maxLengthCm ?? null,
      },
    });
    await audit(tx, DomainAuditEventType.PARKING_RESOURCE_CREATED, actorUserId, propertyId, "ParkingResource", resource.id);
    return serialize(resource);
  }, { isolationLevel: "Serializable" });
}

export async function listResources(actorUserId: string, propertyId: string) {
  const authority = await requireAuthority(actorUserId, propertyId, ManagerDelegationPermission.RESOURCE_VIEW);
  const resources = await prisma.parkingSpot.findMany({
    where: {
      propertyId,
      deletedAt: null,
      ...(authority.managed ? { providerMembershipId: authority.membership.id } : {}),
    },
    include: { parkingRights: true, listings: true },
    orderBy: [{ createdAt: "desc" }],
  });
  return serialize(resources);
}

export async function getResource(actorUserId: string, resourceId: string) {
  const resource = await prisma.parkingSpot.findFirst({
    where: { id: resourceId, deletedAt: null },
    include: { parkingRights: true, listings: true, availabilityRules: true, availabilityExceptions: true },
  });
  if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
  await requireAuthority(actorUserId, resource.propertyId, ManagerDelegationPermission.RESOURCE_VIEW, resourceId);
  return serialize(resource);
}

export async function updateResource(actorUserId: string, resourceId: string, input: JsonObject) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
    if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    await requireAuthority(actorUserId, resource.propertyId, ManagerDelegationPermission.LISTING_MANAGE, resourceId, tx);
    if (resource.resourceType === ParkingResourceType.FIXED_SPACE && input.capacity !== undefined && input.capacity !== 1) {
      fail(400, "PARKING_RESOURCE_CAPACITY_INVALID", "Fixed-space capacity must remain 1");
    }
    if (typeof input.capacity === "number" && input.capacity < resource.capacity) {
      const entitlement = await tx.parkingRight.aggregate({
        where: { parkingSpotId: resourceId, ...activeRightWhere() }, _sum: { quantity: true },
      });
      if ((entitlement._sum.quantity ?? 0) > input.capacity) {
        fail(409, "PARKING_RESOURCE_CAPACITY_IN_USE", "Capacity is below verified parking-right entitlement");
      }
    }
    return serialize(await tx.parkingSpot.update({ where: { id: resourceId }, data: input as Prisma.ParkingSpotUpdateInput }));
  }, { isolationLevel: "Serializable" });
}

export async function deleteResource(actorUserId: string, resourceId: string) {
  await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
    if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    await requireAuthority(actorUserId, resource.propertyId, undefined, resourceId, tx);
    const blockers = await tx.booking.count({ where: { parkingSpotId: resourceId, status: { notIn: ["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"] } } });
    if (blockers > 0) fail(409, "PARKING_RESOURCE_DELETE_BLOCKED", "Resource has active booking dependencies");
    await tx.parkingListing.updateMany({ where: { parkingSpotId: resourceId, status: { not: "ENDED" } }, data: { status: "ENDED", deactivatedAt: new Date() } });
    await tx.parkingSpot.update({ where: { id: resourceId }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  });
}

export async function claimParkingRight(actorUserId: string, resourceId: string, input: {
  rightType: ParkingRightType; quantity: number; canUse: boolean; canList: boolean; canSetPrice: boolean;
  canManageBookings: boolean; canDelegateManager: boolean; validFrom?: string; validUntil?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
    if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    const authority = await requireAuthority(actorUserId, resource.propertyId, undefined, resourceId, tx);
    if (resource.resourceType === ParkingResourceType.FIXED_SPACE && input.quantity !== 1) {
      fail(400, "PARKING_RIGHT_QUANTITY_INVALID", "A fixed-space right quantity must be 1");
    }
    if (input.rightType === ParkingRightType.USE_ONLY && input.canList) {
      fail(400, "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN", "USE_ONLY rights cannot list parking commercially");
    }
    const right = await tx.parkingRight.create({
      data: {
        parkingSpotId: resourceId,
        holderUserId: authority.membership.providerUserId,
        providerMembershipId: authority.membership.id,
        rightType: input.rightType,
        quantity: input.quantity,
        canUse: input.canUse,
        canList: input.rightType === ParkingRightType.USE_ONLY ? false : input.canList,
        canSetPrice: input.rightType === ParkingRightType.USE_ONLY ? false : input.canSetPrice,
        canManageBookings: input.rightType === ParkingRightType.USE_ONLY ? false : input.canManageBookings,
        canDelegateManager: input.canDelegateManager,
        validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        grantedByUserId: actorUserId,
      },
    });
    await audit(tx, DomainAuditEventType.PARKING_RIGHT_CLAIMED, actorUserId, resource.propertyId, "ParkingRight", right.id);
    return serialize(right);
  }, { isolationLevel: "Serializable" });
}

export async function listParkingRights(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.RESOURCE_VIEW);
  const rights = await prisma.parkingRight.findMany({
    where: { providerMembershipId: { in: scopes.map((scope) => scope.providerMembershipId) } },
    include: { parkingSpot: { select: { id: true, displayName: true, spotCode: true, resourceType: true, propertyId: true } } },
    orderBy: { createdAt: "desc" },
  });
  const scopeByMembership = new Map(scopes.map((scope) => [scope.providerMembershipId, scope]));
  return serialize(rights.filter((right) => {
    if (!right.providerMembershipId) return false;
    const resourceIds = scopeByMembership.get(right.providerMembershipId)?.resourceIds;
    return resourceIds === null || resourceIds?.includes(right.parkingSpotId);
  }));
}

export async function getParkingRight(actorUserId: string, rightId: string) {
  const right = await prisma.parkingRight.findUnique({ where: { id: rightId }, include: { parkingSpot: true } });
  if (!right) fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
  if (right.holderUserId !== actorUserId) {
    await requireAuthority(actorUserId, right.parkingSpot.propertyId, ManagerDelegationPermission.RESOURCE_VIEW, right.parkingSpotId);
  }
  return serialize(right);
}

export async function listPendingRights() {
  return serialize(await prisma.parkingRight.findMany({
    where: { status: ParkingRightStatus.PENDING_VERIFICATION },
    include: { parkingSpot: { include: { property: { select: { id: true, name: true, publicArea: true } } } }, holder: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  }));
}

export async function verifyParkingRight(adminUserId: string, rightId: string, input: { decision: ParkingRightStatus; reason?: string }) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-right", rightId);
    const right = await tx.parkingRight.findUnique({ where: { id: rightId }, include: { parkingSpot: true } });
    if (!right) fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
    if (input.decision === ParkingRightStatus.VERIFIED) {
      await lockEntity(tx, "parking-resource", right.parkingSpotId);
      if (right.rightType === ParkingRightType.USE_ONLY && right.canList) {
        fail(409, "PARKING_RIGHT_INVALID", "A USE_ONLY right cannot be commercially verified");
      }
      const verified = await tx.parkingRight.aggregate({
        where: { parkingSpotId: right.parkingSpotId, id: { not: rightId }, ...activeRightWhere() },
        _sum: { quantity: true },
      });
      if (right.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE && (verified._sum.quantity ?? 0) > 0) {
        fail(409, "PARKING_RIGHT_CONFLICT", "This fixed space already has a verified active right");
      }
      if ((verified._sum.quantity ?? 0) + right.quantity > right.parkingSpot.capacity) {
        fail(409, "PARKING_RIGHT_CAPACITY_EXCEEDED", "Verified entitlement would exceed physical capacity");
      }
    }
    const now = new Date();
    const updated = await tx.parkingRight.update({
      where: { id: rightId },
      data: {
        status: input.decision,
        verifiedByAdminId: input.decision === ParkingRightStatus.VERIFIED ? adminUserId : null,
        verifiedAt: input.decision === ParkingRightStatus.VERIFIED ? now : null,
        rejectionReason: input.decision === ParkingRightStatus.VERIFIED ? null : input.reason ?? null,
      },
    });
    if (input.decision !== ParkingRightStatus.VERIFIED) {
      await tx.parkingListing.updateMany({ where: { parkingRightId: rightId, status: "ACTIVE" }, data: { status: "SUSPENDED", deactivatedAt: now } });
    }
    await audit(tx, DomainAuditEventType.PARKING_RIGHT_VERIFIED, adminUserId, right.parkingSpot.propertyId, "ParkingRight", rightId, { decision: input.decision });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function createListing(actorUserId: string, input: {
  parkingRightId: string; title: string; description?: string; pricePerHourPaisa: bigint;
  minDurationMinutes: number; maxDurationMinutes: number; allowedVehicleTypes: VehicleType[]; securityDepositPaisa: bigint;
}) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-right", input.parkingRightId);
    const right = await tx.parkingRight.findUnique({
      where: { id: input.parkingRightId },
      include: { parkingSpot: { include: { property: true } }, providerMembership: true },
    });
    if (!right || !right.providerMembership) fail(404, "PARKING_RIGHT_NOT_FOUND", "Parking right was not found");
    const authority = await requireAuthority(actorUserId, right.parkingSpot.propertyId, ManagerDelegationPermission.LISTING_MANAGE, right.parkingSpotId, tx);
    if (authority.membership.id !== right.providerMembershipId) fail(403, "PARKING_RIGHT_FORBIDDEN", "This right belongs to another Provider");
    const now = new Date();
    if (right.status !== ParkingRightStatus.VERIFIED || right.validFrom > now || (right.validUntil && right.validUntil <= now) || !right.canList) {
      fail(409, "PARKING_RIGHT_NOT_LISTABLE", "Parking right is not active and listable");
    }
    if (right.rightType === ParkingRightType.USE_ONLY) fail(403, "PARKING_RIGHT_COMMERCIAL_USE_FORBIDDEN", "USE_ONLY parking cannot be sublet");
    if (!right.canSetPrice) fail(403, "PARKING_RIGHT_PRICE_FORBIDDEN", "This right does not permit price management");
    if (right.parkingSpot.deletedAt || right.parkingSpot.status === ParkingSpotStatus.BLOCKED) {
      fail(409, "PARKING_RESOURCE_NOT_LISTABLE", "Parking resource is not eligible for listing");
    }
    const supported = new Set(right.parkingSpot.supportedVehicleTypes.length > 0
      ? right.parkingSpot.supportedVehicleTypes : [right.parkingSpot.supportedVehicleType]);
    if (input.allowedVehicleTypes.some((type) => !supported.has(type))) {
      fail(400, "LISTING_VEHICLE_TYPE_UNSUPPORTED", "Listing contains an unsupported vehicle type");
    }
    const wallet = await tx.walletAccount.findUnique({
      where: { userId_currency: { userId: right.holderUserId, currency: "BDT" } },
    });
    if (!wallet || wallet.status !== "ACTIVE") fail(409, "SETTLEMENT_WALLET_UNAVAILABLE", "Provider settlement wallet is unavailable");
    const listing = await tx.parkingListing.create({
      data: {
        parkingSpotId: right.parkingSpotId,
        providerUserId: right.holderUserId,
        providerMembershipId: right.providerMembershipId,
        parkingRightId: right.id,
        title: input.title,
        description: input.description ?? null,
        pricePerHourPaisa: input.pricePerHourPaisa,
        minDurationMinutes: input.minDurationMinutes,
        maxDurationMinutes: input.maxDurationMinutes,
        allowedVehicleTypes: input.allowedVehicleTypes,
        securityDepositPaisa: input.securityDepositPaisa,
        settlementRecipientUserId: right.holderUserId,
        settlementWalletAccountId: wallet.id,
      },
    });
    return serialize(listing);
  }, { isolationLevel: "Serializable" });
}

export async function listListings(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.LISTING_VIEW);
  const listings = await prisma.parkingListing.findMany({
    where: { providerMembershipId: { in: scopes.map((scope) => scope.providerMembershipId) } },
    include: { parkingSpot: true, parkingRight: true },
    orderBy: { createdAt: "desc" },
  });
  const scopeByMembership = new Map(scopes.map((scope) => [scope.providerMembershipId, scope]));
  return serialize(listings.filter((listing) => {
    const resourceIds = scopeByMembership.get(listing.providerMembershipId)?.resourceIds;
    return resourceIds === null || resourceIds?.includes(listing.parkingSpotId);
  }));
}

export async function getListing(actorUserId: string, listingId: string) {
  const listing = await prisma.parkingListing.findUnique({
    where: { id: listingId }, include: { parkingSpot: { include: { availabilityRules: true, availabilityExceptions: true } }, parkingRight: true },
  });
  if (!listing) fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
  if (listing.providerUserId !== actorUserId) {
    await requireAuthority(actorUserId, listing.parkingSpot.propertyId, ManagerDelegationPermission.LISTING_VIEW, listing.parkingSpotId);
  }
  return serialize(listing);
}

export async function updateListing(actorUserId: string, listingId: string, input: JsonObject) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-listing", listingId);
    const listing = await tx.parkingListing.findUnique({ where: { id: listingId }, include: { parkingSpot: true } });
    if (!listing) fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    const priceChange = input.pricePerHourPaisa !== undefined || input.securityDepositPaisa !== undefined;
    await requireAuthority(
      actorUserId,
      listing.parkingSpot.propertyId,
      priceChange ? ManagerDelegationPermission.PRICE_MANAGE : ManagerDelegationPermission.LISTING_MANAGE,
      listing.parkingSpotId,
      tx,
    );
    if (listing.status === ParkingListingStatus.ENDED || listing.status === ParkingListingStatus.SUSPENDED) {
      fail(409, "PARKING_LISTING_STATE_INVALID", "Listing cannot be edited in its current state");
    }
    if (input.minDurationMinutes !== undefined || input.maxDurationMinutes !== undefined) {
      const min = Number(input.minDurationMinutes ?? listing.minDurationMinutes);
      const max = Number(input.maxDurationMinutes ?? listing.maxDurationMinutes);
      if (max < min) fail(400, "LISTING_DURATION_INVALID", "Maximum duration must be at least the minimum duration");
    }
    return serialize(await tx.parkingListing.update({ where: { id: listingId }, data: input as Prisma.ParkingListingUpdateInput }));
  });
}

async function changeListingStatus(actorUserId: string, listingId: string, activate: boolean) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-listing", listingId);
    const listing = await tx.parkingListing.findUnique({
      where: { id: listingId },
      include: { parkingSpot: { include: { property: true } }, parkingRight: true },
    });
    if (!listing) fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    await requireAuthority(actorUserId, listing.parkingSpot.propertyId, ManagerDelegationPermission.LISTING_MANAGE, listing.parkingSpotId, tx);
    const now = new Date();
    if (activate) {
      if (listing.status === ParkingListingStatus.SUSPENDED || listing.status === ParkingListingStatus.ENDED) {
        fail(409, "PARKING_LISTING_STATE_INVALID", "Suspended or ended listing cannot be activated");
      }
      const rightValid = listing.parkingRight.status === ParkingRightStatus.VERIFIED && listing.parkingRight.canList &&
        listing.parkingRight.rightType !== ParkingRightType.USE_ONLY && listing.parkingRight.validFrom <= now &&
        (!listing.parkingRight.validUntil || listing.parkingRight.validUntil > now);
      if (!rightValid || listing.parkingSpot.status !== ParkingSpotStatus.ACTIVE ||
          listing.parkingSpot.property.status !== PropertyStatus.ACTIVE ||
          listing.parkingSpot.property.verificationStatus !== VerificationStatus.VERIFIED) {
        fail(409, "PARKING_LISTING_NOT_ELIGIBLE", "Property, resource, or parking right is not eligible");
      }
      if (listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE) {
        const conflict = await tx.parkingListing.findFirst({
          where: { parkingSpotId: listing.parkingSpotId, id: { not: listing.id }, status: ParkingListingStatus.ACTIVE },
          select: { id: true },
        });
        if (conflict) fail(409, "PARKING_LISTING_CONFLICT", "This fixed space already has an active listing");
      }
    }
    const updated = await tx.parkingListing.update({
      where: { id: listing.id },
      data: activate
        ? { status: ParkingListingStatus.ACTIVE, publishedAt: listing.publishedAt ?? now, deactivatedAt: null }
        : { status: ParkingListingStatus.PAUSED, deactivatedAt: now },
    });
    await audit(tx, activate ? DomainAuditEventType.LISTING_ACTIVATED : DomainAuditEventType.LISTING_PAUSED,
      actorUserId, listing.parkingSpot.propertyId, "ParkingListing", listing.id);
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export const activateListing = (actorUserId: string, listingId: string) => changeListingStatus(actorUserId, listingId, true);
export const pauseListing = (actorUserId: string, listingId: string) => changeListingStatus(actorUserId, listingId, false);

export async function endListing(actorUserId: string, listingId: string) {
  const listing = await prisma.parkingListing.findUnique({ where: { id: listingId }, include: { parkingSpot: true } });
  if (!listing) fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
  await requireAuthority(actorUserId, listing.parkingSpot.propertyId, ManagerDelegationPermission.LISTING_MANAGE, listing.parkingSpotId);
  return serialize(await prisma.parkingListing.update({
    where: { id: listingId }, data: { status: ParkingListingStatus.ENDED, deactivatedAt: new Date() },
  }));
}

export async function suspendListing(adminUserId: string, listingId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-listing", listingId);
    const listing = await tx.parkingListing.findUnique({
      where: { id: listingId },
      include: { parkingSpot: { select: { propertyId: true } } },
    });
    if (!listing) fail(404, "PARKING_LISTING_NOT_FOUND", "Parking listing was not found");
    if (listing.status === ParkingListingStatus.ENDED) {
      fail(409, "PARKING_LISTING_STATE_INVALID", "An ended listing cannot be suspended");
    }
    if (listing.status === ParkingListingStatus.SUSPENDED) return serialize(listing);
    const updated = await tx.parkingListing.update({
      where: { id: listing.id },
      data: { status: ParkingListingStatus.SUSPENDED, deactivatedAt: new Date() },
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
    await audit(tx, DomainAuditEventType.LISTING_SUSPENDED, adminUserId,
      listing.parkingSpot.propertyId, "ParkingListing", listing.id, { reason });
    return serialize(updated);
  });
}

export async function replaceAvailability(actorUserId: string, resourceId: string, rules: Array<{
  dayOfWeek: number; startLocalTime: string; endLocalTime: string; validFrom: string; validUntil?: string;
}>) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
    if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    await requireAuthority(actorUserId, resource.propertyId, ManagerDelegationPermission.AVAILABILITY_MANAGE, resourceId, tx);
    await tx.availabilityRule.deleteMany({ where: { parkingSpotId: resourceId } });
    if (rules.length > 0) {
      await tx.availabilityRule.createMany({ data: rules.map((rule) => ({
        parkingSpotId: resourceId,
        dayOfWeek: rule.dayOfWeek,
        startLocalTime: timeValue(rule.startLocalTime),
        endLocalTime: timeValue(rule.endLocalTime),
        validFrom: new Date(`${rule.validFrom}T00:00:00.000Z`),
        validUntil: rule.validUntil ? new Date(`${rule.validUntil}T00:00:00.000Z`) : null,
      })) });
    }
    return tx.availabilityRule.findMany({ where: { parkingSpotId: resourceId }, orderBy: [{ dayOfWeek: "asc" }, { startLocalTime: "asc" }] });
  });
}

export async function createAvailabilityException(actorUserId: string, resourceId: string, input: {
  startsAt: string; endsAt: string; exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE"; reason?: string;
}) {
  const resource = await prisma.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
  await requireAuthority(actorUserId, resource.propertyId, ManagerDelegationPermission.AVAILABILITY_MANAGE, resourceId);
  return prisma.availabilityException.create({ data: {
    parkingSpotId: resourceId, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt),
    exceptionType: input.exceptionType, reason: input.reason ?? null, createdByUserId: actorUserId,
  } });
}

export async function listAvailability(actorUserId: string, resourceId: string) {
  const resource = await prisma.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
  await requireAuthority(actorUserId, resource.propertyId, ManagerDelegationPermission.RESOURCE_VIEW, resourceId);
  const [rules, exceptions] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { parkingSpotId: resourceId }, orderBy: [{ dayOfWeek: "asc" }, { startLocalTime: "asc" }] }),
    prisma.availabilityException.findMany({ where: { parkingSpotId: resourceId }, orderBy: { startsAt: "asc" } }),
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
        property: { deletedAt: null, canonicalPropertyId: null, status: PropertyStatus.ACTIVE, verificationStatus: VerificationStatus.VERIFIED },
      },
    },
    include: {
      parkingRight: true,
      parkingSpot: { include: { property: true, availabilityRules: true, availabilityExceptions: true, facilities: { include: { facility: true } } } },
    },
  });
}

async function ensureListingAvailable(listing: NonNullable<Awaited<ReturnType<typeof loadBookableListing>>>, startAt: Date, endAt: Date) {
  if (!(await isResourceAvailable(listing.parkingSpot, startAt, endAt))) return false;
  return (await availableListingUnits(listing, startAt, endAt)) > 0;
}

async function availableListingUnits(
  listing: NonNullable<Awaited<ReturnType<typeof loadBookableListing>>>,
  startAt: Date,
  endAt: Date,
) {
  const rightCapacity = listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE
    ? 1
    : listing.parkingRight.quantity;
  const [rightAllocations, resourceAllocations] = await Promise.all([
    activeAllocationCount(listing.parkingSpotId, listing.parkingRightId, startAt, endAt),
    prisma.parkingAllocation.count({
      where: {
        parkingSpotId: listing.parkingSpotId,
        status: { in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        OR: [{ status: ParkingAllocationStatus.BOOKED }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);
  return Math.max(0, Math.min(
    rightCapacity - rightAllocations,
    listing.parkingSpot.capacity - resourceAllocations,
  ));
}

export async function searchParking(input: {
  latitude: number; longitude: number; radiusKm: number; startAt: string; endAt: string; vehicleType: VehicleType;
  minPricePaisa?: bigint; maxPricePaisa?: bigint; covered?: boolean;
}) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const listings = await prisma.parkingListing.findMany({
    where: {
      status: ParkingListingStatus.ACTIVE,
      allowedVehicleTypes: { has: input.vehicleType },
      ...(input.minPricePaisa === undefined ? {} : { pricePerHourPaisa: { gte: input.minPricePaisa } }),
      ...(input.maxPricePaisa === undefined ? {} : { pricePerHourPaisa: { lte: input.maxPricePaisa } }),
      provider: { status: UserStatus.ACTIVE, deletedAt: null },
      parkingRight: activeRightWhere(),
      parkingSpot: {
        deletedAt: null,
        status: ParkingSpotStatus.ACTIVE,
        ...(input.covered === undefined ? {} : { isCovered: input.covered }),
        property: { deletedAt: null, canonicalPropertyId: null, status: PropertyStatus.ACTIVE, verificationStatus: VerificationStatus.VERIFIED },
      },
    },
    include: {
      parkingRight: true,
      parkingSpot: { include: { property: { include: { images: { where: { isCover: true }, take: 1 } } }, availabilityRules: true, availabilityExceptions: true, facilities: { include: { facility: true } } } },
    },
    take: 500,
  });
  const groups = new Map<string, {
    property: {
      id: string; name: string; publicArea: string; approximateAddress: string;
      latitude: number; longitude: number; coverImageUrl: string | null;
    };
    offers: JsonObject[];
    distanceKm: number;
    availableUnits: number;
  }>();
  for (const listing of listings) {
    const property = listing.parkingSpot.property;
    const distanceKm = haversineKm(input.latitude, input.longitude, Number(property.latitude), Number(property.longitude));
    if (distanceKm > input.radiusKm || !(await isResourceAvailable(listing.parkingSpot, startAt, endAt))) continue;
    const availableUnits = await availableListingUnits(listing, startAt, endAt);
    if (availableUnits === 0) continue;
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
    };
    group.offers.push({
      listingId: listing.id,
      resourceType: listing.parkingSpot.resourceType,
      title: listing.title,
      pricePerHourPaisa: listing.pricePerHourPaisa.toString(),
      allowedVehicleTypes: listing.allowedVehicleTypes,
      isCovered: listing.parkingSpot.isCovered,
      facilities: listing.parkingSpot.facilities.map((item) => item.facility.code),
      availableUnits,
    });
    group.availableUnits += availableUnits;
    groups.set(property.id, group);
  }
  return [...groups.values()].map((group) => {
    const prices = group.offers.map((offer) => BigInt(String(offer.pricePerHourPaisa)));
    return {
      ...group.property,
      distanceKm: Number(group.distanceKm.toFixed(2)),
      availableUnits: group.availableUnits,
      minimumPricePaisa: prices.reduce((a, b) => a < b ? a : b).toString(),
      maximumPricePaisa: prices.reduce((a, b) => a > b ? a : b).toString(),
      offers: group.offers,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function createQuote(driverUserId: string, input: { listingId: string; vehicleId: string; startAt: string; endAt: string }) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (startAt <= new Date()) fail(400, "QUOTE_START_IN_PAST", "Booking start time must be in the future");
  const [listing, vehicle] = await Promise.all([
    loadBookableListing(input.listingId),
    prisma.vehicle.findFirst({ where: { id: input.vehicleId, ownerUserId: driverUserId, deletedAt: null } }),
  ]);
  if (!listing) fail(404, "PARKING_LISTING_NOT_AVAILABLE", "Parking listing is unavailable");
  if (!vehicle) fail(404, "VEHICLE_NOT_FOUND", "Vehicle was not found");
  if (!listing.allowedVehicleTypes.includes(vehicle.vehicleType)) fail(409, "VEHICLE_NOT_COMPATIBLE", "Vehicle is not compatible with this listing");
  const durationMinutes = Math.ceil((endAt.getTime() - startAt.getTime()) / 60_000);
  if (durationMinutes < listing.minDurationMinutes || durationMinutes > listing.maxDurationMinutes) {
    fail(400, "BOOKING_DURATION_INVALID", "Requested duration is outside the listing limits");
  }
  if (!(await ensureListingAvailable(listing, startAt, endAt))) fail(409, "PARKING_NOT_AVAILABLE", "Parking is not available for the requested time");
  const baseAmountPaisa = (listing.pricePerHourPaisa * BigInt(durationMinutes) + 59n) / 60n;
  const platformFeePaisa = (baseAmountPaisa * PLATFORM_FEE_BASIS_POINTS + 9_999n) / 10_000n;
  const totalAmountPaisa = baseAmountPaisa + platformFeePaisa + listing.securityDepositPaisa;
  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.bookingQuote.create({ data: {
      driverUserId, listingId: listing.id, vehicleId: vehicle.id, parkingSpotId: listing.parkingSpotId,
      startAt, endAt, durationMinutes, baseAmountPaisa, platformFeePaisa,
      depositPaisa: listing.securityDepositPaisa, totalAmountPaisa,
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
    } });
    await audit(tx, DomainAuditEventType.QUOTE_CREATED, driverUserId, listing.parkingSpot.propertyId, "BookingQuote", created.id);
    return created;
  });
  return serialize(quote);
}

export async function getQuote(driverUserId: string, quoteId: string) {
  const quote = await prisma.bookingQuote.findFirst({ where: { id: quoteId, driverUserId } });
  if (!quote) fail(404, "BOOKING_QUOTE_NOT_FOUND", "Booking quote was not found");
  return serialize({ ...quote, expired: quote.expiresAt <= new Date() });
}

export async function createHold(driverUserId: string, input: { quoteId: string; idempotencyKey: string }) {
  const existing = await prisma.reservationHold.findUnique({
    where: { driverUserId_idempotencyKey: { driverUserId, idempotencyKey: input.idempotencyKey } },
  });
  if (existing) return serialize(existing);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
      await releaseExpiredHolds(tx);
      const quote = await tx.bookingQuote.findFirst({
        where: { id: input.quoteId, driverUserId },
        include: {
          listing: {
            include: {
              provider: true,
              parkingRight: true,
              parkingSpot: { include: { property: true, availabilityRules: true, availabilityExceptions: true } },
            },
          },
        },
      });
      if (!quote) fail(404, "BOOKING_QUOTE_NOT_FOUND", "Booking quote was not found");
      if (quote.expiresAt <= new Date()) fail(409, "BOOKING_QUOTE_EXPIRED", "Booking quote has expired");
      const listing = quote.listing;
      await lockEntity(tx, "parking-resource", listing.parkingSpotId);
      await lockEntity(tx, "parking-right", listing.parkingRightId);
      const now = new Date();
      const eligible = listing.status === ParkingListingStatus.ACTIVE &&
        listing.provider.status === UserStatus.ACTIVE &&
        listing.parkingRight.status === ParkingRightStatus.VERIFIED && listing.parkingRight.canList &&
        listing.parkingRight.validFrom <= now && (!listing.parkingRight.validUntil || listing.parkingRight.validUntil > now) &&
        listing.parkingSpot.status === ParkingSpotStatus.ACTIVE &&
        listing.parkingSpot.property.status === PropertyStatus.ACTIVE &&
        listing.parkingSpot.property.verificationStatus === VerificationStatus.VERIFIED;
      if (!eligible || !(await isResourceAvailable(listing.parkingSpot, quote.startAt, quote.endAt))) {
        fail(409, "PARKING_NOT_AVAILABLE", "Parking is no longer available");
      }
      const allocationCount = await activeAllocationCount(
        listing.parkingSpotId, listing.parkingRightId, quote.startAt, quote.endAt, tx,
      );
      const capacity = listing.parkingSpot.resourceType === ParkingResourceType.FIXED_SPACE ? 1 : listing.parkingRight.quantity;
      if (allocationCount >= capacity) fail(409, "PARKING_NOT_AVAILABLE", "Parking capacity was reserved by another Driver");

      let capacityUnit = 1;
      if (listing.parkingSpot.resourceType === ParkingResourceType.SHARED_POOL) {
        const used = await tx.parkingAllocation.findMany({
          where: {
            parkingSpotId: listing.parkingSpotId,
            status: { in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED] },
            startAt: { lt: quote.endAt }, endAt: { gt: quote.startAt },
            OR: [{ status: ParkingAllocationStatus.BOOKED }, { expiresAt: { gt: now } }],
          },
          select: { capacityUnit: true },
        });
        const usedUnits = new Set(used.map((item) => item.capacityUnit));
        capacityUnit = Array.from({ length: listing.parkingSpot.capacity }, (_, index) => index + 1)
          .find((unit) => !usedUnits.has(unit)) ?? 0;
        if (capacityUnit === 0) fail(409, "PARKING_NOT_AVAILABLE", "Parking entitlement is fully reserved");
      }
      const expiresAt = new Date(Date.now() + HOLD_TTL_MS);
      const allocation = await tx.parkingAllocation.create({ data: {
        parkingSpotId: listing.parkingSpotId,
        parkingRightId: listing.parkingRightId,
        capacityUnit,
        startAt: quote.startAt,
        endAt: quote.endAt,
        status: ParkingAllocationStatus.HELD,
        expiresAt,
      } });
      const hold = await tx.reservationHold.create({ data: {
        quoteId: quote.id,
        driverUserId,
        listingId: listing.id,
        parkingSpotId: listing.parkingSpotId,
        allocationId: allocation.id,
        expiresAt,
        idempotencyKey: input.idempotencyKey,
      } });
      await audit(tx, DomainAuditEventType.HOLD_CREATED, driverUserId, listing.parkingSpot.propertyId, "ReservationHold", hold.id);
      return serialize(hold);
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error instanceof AppError) throw error;
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : null;
      if (code === "P2034" && attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 15));
        continue;
      }
      if (code === "P2002" || code === "P2004" || code === "P2034") {
        fail(409, "PARKING_NOT_AVAILABLE", "Parking capacity was reserved concurrently");
      }
      throw error;
    }
  }
  fail(409, "PARKING_NOT_AVAILABLE", "Parking capacity was reserved concurrently");
}

export async function getHold(driverUserId: string, holdId: string) {
  const hold = await prisma.reservationHold.findFirst({ where: { id: holdId, driverUserId }, include: { quote: true } });
  if (!hold) fail(404, "RESERVATION_HOLD_NOT_FOUND", "Reservation hold was not found");
  return serialize({ ...hold, expired: hold.status === "ACTIVE" && hold.expiresAt <= new Date() });
}

export async function releaseHold(driverUserId: string, holdId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "reservation-hold", holdId);
    const hold = await tx.reservationHold.findFirst({ where: { id: holdId, driverUserId } });
    if (!hold) fail(404, "RESERVATION_HOLD_NOT_FOUND", "Reservation hold was not found");
    if (hold.status === "CONSUMED") fail(409, "RESERVATION_HOLD_CONSUMED", "Consumed hold cannot be released");
    if (hold.status === "RELEASED" || hold.status === "EXPIRED") return serialize(hold);
    await tx.parkingAllocation.updateMany({ where: { id: hold.allocationId, status: "HELD" }, data: { status: "RELEASED" } });
    return serialize(await tx.reservationHold.update({ where: { id: hold.id }, data: { status: "RELEASED" } }));
  });
}

function bookingCode() {
  return `PK${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`.slice(0, 20);
}

export async function createBooking(driverUserId: string, input: { holdId: string; idempotencyKey: string }) {
  const existing = await prisma.booking.findUnique({
    where: { driverUserId_idempotencyKey: { driverUserId, idempotencyKey: input.idempotencyKey } },
  });
  if (existing) return serialize(existing);
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "reservation-hold", input.holdId);
    const hold = await tx.reservationHold.findFirst({
      where: { id: input.holdId, driverUserId },
      include: {
        quote: true,
        allocation: true,
        listing: { include: { parkingRight: true, parkingSpot: true } },
      },
    });
    if (!hold) fail(404, "RESERVATION_HOLD_NOT_FOUND", "Reservation hold was not found");
    if (hold.status === "CONSUMED") {
      const booking = await tx.booking.findUnique({ where: { holdId: hold.id } });
      if (booking) return serialize(booking);
    }
    if (hold.status !== "ACTIVE" || hold.expiresAt <= new Date() || hold.allocation.status !== "HELD") {
      fail(409, "RESERVATION_HOLD_EXPIRED", "Reservation hold is no longer active");
    }
    const listing = hold.listing;
    const booking = await tx.booking.create({ data: {
      bookingCode: bookingCode(),
      holdId: hold.id,
      allocationId: hold.allocationId,
      driverUserId,
      vehicleId: hold.quote.vehicleId,
      propertyId: listing.parkingSpot.propertyId,
      parkingSpotId: listing.parkingSpotId,
      listingId: listing.id,
      parkingRightId: listing.parkingRightId,
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
      idempotencyKey: input.idempotencyKey,
    } });
    await tx.reservationHold.update({ where: { id: hold.id }, data: { status: "CONSUMED" } });
    await tx.parkingAllocation.update({ where: { id: hold.allocationId }, data: { status: "BOOKED", expiresAt: null } });
    await audit(tx, DomainAuditEventType.BOOKING_CREATED, driverUserId, booking.propertyId, "Booking", booking.id);
    return serialize(booking);
  }, { isolationLevel: "Serializable" });
}

const bookingInclude = {
  vehicle: { select: { id: true, vehicleType: true, registrationNumber: true } },
  property: { select: { id: true, name: true, publicArea: true, approximateAddress: true } },
  parkingSpot: { select: { id: true, displayName: true, spotCode: true, resourceType: true, floor: true, zone: true } },
  listing: { select: { id: true, title: true } },
  payments: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.BookingInclude;

export async function listDriverBookings(driverUserId: string) {
  return serialize(await prisma.booking.findMany({ where: { driverUserId }, include: bookingInclude, orderBy: { createdAt: "desc" } }));
}

export async function getDriverBooking(driverUserId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, driverUserId }, include: bookingInclude });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  return serialize(booking);
}

export async function listProviderBookings(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.BOOKING_VIEW);
  const bookings = await prisma.booking.findMany({
    where: { listing: { providerMembershipId: { in: scopes.map((scope) => scope.providerMembershipId) } } },
    include: { ...bookingInclude, listing: { select: { id: true, title: true, providerMembershipId: true } } },
    orderBy: { startAt: "desc" },
  });
  const scopeByMembership = new Map(scopes.map((scope) => [scope.providerMembershipId, scope]));
  return serialize(bookings.filter((booking) => {
    const resourceIds = scopeByMembership.get(booking.listing.providerMembershipId)?.resourceIds;
    return resourceIds === null || resourceIds?.includes(booking.parkingSpotId);
  }));
}

export async function cancelBooking(driverUserId: string, bookingId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, driverUserId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.status !== BookingStatus.PAYMENT_PENDING && booking.status !== BookingStatus.CONFIRMED) {
      fail(409, "BOOKING_TRANSITION_INVALID", "Booking cannot be cancelled in its current state");
    }
    if (booking.status === BookingStatus.CONFIRMED && booking.startAt <= new Date()) {
      fail(409, "BOOKING_CANCELLATION_WINDOW_CLOSED", "Started bookings cannot be cancelled");
    }
    const updated = await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    await tx.parkingAllocation.update({ where: { id: booking.allocationId }, data: { status: "RELEASED" } });
    await tx.accessCredential.updateMany({ where: { bookingId }, data: { status: "REVOKED" } });
    await notification(tx, { userId: booking.providerUserId, type: "BOOKING_CANCELLED", title: "Booking cancelled", message: `Booking ${booking.bookingCode} was cancelled.`, entityType: "Booking", entityId: booking.id, idempotencyKey: `booking-cancelled:${booking.id}` });
    await audit(tx, DomainAuditEventType.BOOKING_CANCELLED, driverUserId, booking.propertyId, "Booking", booking.id);
    return serialize(updated);
  });
}

export async function captureSimulatedPayment(driverUserId: string, input: { bookingId: string; idempotencyKey: string }) {
  const previous = await prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { booking: true } });
  if (previous) {
    if (previous.payerUserId !== driverUserId || previous.bookingId !== input.bookingId) {
      fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency key belongs to another payment");
    }
    return serialize({ payment: previous, booking: previous.booking, accessCredential: null, credentialAlreadyIssued: true });
  }
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", input.bookingId);
    const booking = await tx.booking.findFirst({ where: { id: input.bookingId, driverUserId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.status !== BookingStatus.PAYMENT_PENDING) fail(409, "BOOKING_TRANSITION_INVALID", "Booking is not awaiting payment");
    const rawCredential = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawCredential).digest("hex");
    const now = new Date();
    const payment = await tx.payment.create({ data: {
      bookingId: booking.id,
      payerUserId: driverUserId,
      amountPaisa: booking.totalAmountPaisa,
      status: "CAPTURED",
      providerReference: `SIM-${randomBytes(10).toString("hex")}`,
      idempotencyKey: input.idempotencyKey,
      capturedAt: now,
    } });
    const ledger = await tx.ledgerTransaction.create({ data: {
      referenceType: "BOOKING_PAYMENT",
      referenceId: payment.id,
      description: `Simulated payment for booking ${booking.bookingCode}`,
      actorUserId: driverUserId,
      entries: { create: [
        { accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "DEBIT", amountPaisa: booking.totalAmountPaisa },
        { accountCode: "PROVIDER_PAYABLE", walletAccountId: booking.settlementWalletAccountId, entrySide: "CREDIT", amountPaisa: booking.baseAmountPaisa },
        { accountCode: "PLATFORM_REVENUE", entrySide: "CREDIT", amountPaisa: booking.platformFeePaisa },
        { accountCode: "CUSTOMER_DEPOSIT_LIABILITY", entrySide: "CREDIT", amountPaisa: booking.depositPaisa },
      ] },
    } });
    const creditTotal = booking.baseAmountPaisa + booking.platformFeePaisa + booking.depositPaisa;
    if (creditTotal !== booking.totalAmountPaisa) fail(500, "LEDGER_UNBALANCED", "Payment ledger transaction is not balanced");
    await tx.walletAccount.update({
      where: { id: booking.settlementWalletAccountId },
      data: { pendingBalancePaisa: { increment: booking.baseAmountPaisa }, balanceVersion: { increment: 1 } },
    });
    const updatedBooking = await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", confirmedAt: now } });
    await tx.accessCredential.create({ data: {
      bookingId: booking.id,
      tokenHash,
      expiresAt: new Date(booking.effectiveEndAt.getTime() + 24 * 60 * 60 * 1000),
    } });
    await notification(tx, { userId: driverUserId, type: "PAYMENT_SUCCEEDED", title: "Payment successful", message: `Payment for booking ${booking.bookingCode} succeeded.`, entityType: "Payment", entityId: payment.id, idempotencyKey: `payment-success:${payment.id}:driver` });
    await notification(tx, { userId: booking.providerUserId, type: "BOOKING_CONFIRMED", title: "New confirmed booking", message: `Booking ${booking.bookingCode} is confirmed.`, entityType: "Booking", entityId: booking.id, idempotencyKey: `booking-confirmed:${booking.id}:provider` });
    await audit(tx, DomainAuditEventType.PAYMENT_SUCCEEDED, driverUserId, booking.propertyId, "Payment", payment.id, { ledgerTransactionId: ledger.id });
    await audit(tx, DomainAuditEventType.BOOKING_CONFIRMED, driverUserId, booking.propertyId, "Booking", booking.id);
    return serialize({ payment, booking: updatedBooking, accessCredential: rawCredential, credentialAlreadyIssued: false });
  }, { isolationLevel: "Serializable" });
}

export async function verifyAccessCredential(guardUserId: string, credential: string) {
  const tokenHash = createHash("sha256").update(credential).digest("hex");
  const record = await prisma.accessCredential.findUnique({
    where: { tokenHash },
    include: { booking: { include: { vehicle: true, property: { select: { id: true, name: true } }, parkingSpot: true } } },
  });
  if (!record || record.status !== "ACTIVE" || record.expiresAt <= new Date()) {
    fail(404, "ACCESS_CREDENTIAL_INVALID", "Access credential is invalid or expired");
  }
  if (!(await isGuardAuthorizedForBooking(guardUserId, record.bookingId))) {
    fail(403, "GUARD_BOOKING_FORBIDDEN", "Guard is not assigned to this Provider at this Property");
  }
  return serialize({ valid: true, booking: record.booking });
}

export async function checkInBooking(guardUserId: string, bookingId: string, credential: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const tokenHash = createHash("sha256").update(credential).digest("hex");
    const record = await tx.accessCredential.findFirst({ where: { bookingId, tokenHash }, include: { booking: true } });
    if (!record || record.status !== "ACTIVE" || record.expiresAt <= new Date()) {
      fail(400, "ACCESS_CREDENTIAL_INVALID", "Access credential is invalid or expired");
    }
    if (!(await isGuardAuthorizedForBooking(guardUserId, bookingId, tx))) fail(403, "GUARD_BOOKING_FORBIDDEN", "Guard is not authorized for this booking");
    if (record.booking.status === BookingStatus.CHECKED_IN) return serialize(record.booking);
    if (record.booking.status !== BookingStatus.CONFIRMED) fail(409, "BOOKING_TRANSITION_INVALID", "Only confirmed bookings can check in");
    const now = new Date();
    if (now < new Date(record.booking.startAt.getTime() - 60 * 60 * 1000) || now > record.booking.effectiveEndAt) {
      fail(409, "BOOKING_CHECK_IN_WINDOW_INVALID", "Booking is outside the allowed check-in window");
    }
    const booking = await tx.booking.update({ where: { id: bookingId }, data: { status: "CHECKED_IN", checkedInAt: now } });
    await tx.accessCredential.update({ where: { id: record.id }, data: { status: "USED", usedAt: now } });
    await audit(tx, DomainAuditEventType.BOOKING_CHECKED_IN, guardUserId, booking.propertyId, "Booking", booking.id);
    return serialize(booking);
  });
}

export async function requestCheckout(driverUserId: string, bookingId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, driverUserId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.status === BookingStatus.CHECKOUT_REQUESTED) return serialize(booking);
    if (booking.status !== BookingStatus.CHECKED_IN) fail(409, "BOOKING_TRANSITION_INVALID", "Only checked-in bookings can request checkout");
    return serialize(await tx.booking.update({ where: { id: booking.id }, data: { status: "CHECKOUT_REQUESTED", checkoutRequestedAt: new Date() } }));
  });
}

export async function checkOutBooking(guardUserId: string, bookingId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (!(await isGuardAuthorizedForBooking(guardUserId, bookingId, tx))) fail(403, "GUARD_BOOKING_FORBIDDEN", "Guard is not authorized for this booking");
    if (booking.status === BookingStatus.COMPLETED) return serialize(booking);
    if (booking.status !== BookingStatus.CHECKED_IN && booking.status !== BookingStatus.CHECKOUT_REQUESTED) {
      fail(409, "BOOKING_TRANSITION_INVALID", "Booking cannot check out in its current state");
    }
    const now = new Date();
    const effectiveEndAt = now > booking.startAt
      ? now
      : new Date(booking.startAt.getTime() + 1);
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", checkedOutAt: now, effectiveEndAt },
    });
    await tx.parkingAllocation.update({
      where: { id: booking.allocationId },
      data: { status: "RELEASED", endAt: effectiveEndAt },
    });
    await tx.walletAccount.update({
      where: { id: booking.settlementWalletAccountId },
      data: {
        pendingBalancePaisa: { decrement: booking.baseAmountPaisa },
        availableBalancePaisa: { increment: booking.baseAmountPaisa },
        balanceVersion: { increment: 1 },
      },
    });
    await audit(tx, DomainAuditEventType.BOOKING_CHECKED_OUT, guardUserId, booking.propertyId, "Booking", booking.id);
    return serialize(updated);
  });
}

export async function getWallet(userId: string) {
  const wallet = await prisma.walletAccount.findUnique({ where: { userId_currency: { userId, currency: "BDT" } } });
  if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
  return serialize(wallet);
}

export async function listWalletTransactions(userId: string) {
  const wallet = await prisma.walletAccount.findUnique({ where: { userId_currency: { userId, currency: "BDT" } }, select: { id: true } });
  if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
  return serialize(await prisma.ledgerEntry.findMany({
    where: { walletAccountId: wallet.id },
    select: {
      id: true, accountCode: true, entrySide: true, amountPaisa: true, createdAt: true,
      ledgerTransaction: { select: { id: true, referenceType: true, referenceId: true, description: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  }));
}

export async function getEarningsSummary(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.EARNINGS_VIEW);
  const providerIds = new Set(scopes
    .filter((scope) => scope.resourceIds === null)
    .map((scope) => scope.providerUserId));
  const wallets = await prisma.walletAccount.findMany({ where: { userId: { in: [...providerIds] }, currency: "BDT" } });
  return serialize({
    currency: "BDT",
    availableBalancePaisa: wallets.reduce((sum, wallet) => sum + wallet.availableBalancePaisa, 0n),
    pendingBalancePaisa: wallets.reduce((sum, wallet) => sum + wallet.pendingBalancePaisa, 0n),
    heldBalancePaisa: wallets.reduce((sum, wallet) => sum + wallet.heldBalancePaisa, 0n),
    providerCount: providerIds.size,
  });
}

export async function listEarningsTransactions(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.EARNINGS_VIEW);
  const providerIds = scopes
    .filter((scope) => scope.resourceIds === null)
    .map((scope) => scope.providerUserId);
  const wallets = await prisma.walletAccount.findMany({
    where: { userId: { in: providerIds }, currency: "BDT" },
    select: { id: true },
  });
  return serialize(await prisma.ledgerEntry.findMany({
    where: { walletAccountId: { in: wallets.map((wallet) => wallet.id) } },
    select: {
      id: true, accountCode: true, entrySide: true, amountPaisa: true, createdAt: true,
      ledgerTransaction: { select: { id: true, referenceType: true, referenceId: true, description: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  }));
}

export async function createRefund(requestedByUserId: string, paymentId: string, input: { amountPaisa: bigint; reason: string; idempotencyKey: string }) {
  const previous = await prisma.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (previous) return serialize(previous);
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payment", paymentId);
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { booking: true, refunds: { where: { status: "SUCCEEDED" } } } });
    if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
    const authorized = payment.payerUserId === requestedByUserId || payment.booking.providerUserId === requestedByUserId;
    if (!authorized) fail(403, "REFUND_FORBIDDEN", "You cannot refund this payment");
    if (!['CAPTURED', 'PARTIALLY_REFUNDED'].includes(payment.status)) fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
    const refunded = payment.refunds.reduce((sum, refund) => sum + refund.amountPaisa, 0n);
    const remaining = payment.amountPaisa - refunded;
    if (input.amountPaisa > remaining) fail(409, "REFUND_AMOUNT_EXCEEDED", "Refund exceeds the remaining refundable amount");
    const providerComponent = (input.amountPaisa * payment.booking.baseAmountPaisa) / payment.amountPaisa;
    const wallet = await tx.walletAccount.findUnique({ where: { id: payment.booking.settlementWalletAccountId } });
    if (!wallet) fail(409, "SETTLEMENT_WALLET_UNAVAILABLE", "Settlement wallet is unavailable");
    const fromPending = wallet.pendingBalancePaisa < providerComponent ? wallet.pendingBalancePaisa : providerComponent;
    const fromAvailable = providerComponent - fromPending;
    if (fromAvailable > wallet.availableBalancePaisa) fail(409, "REFUND_BALANCE_UNAVAILABLE", "Provider balance is insufficient for this refund");
    const refund = await tx.refund.create({ data: {
      paymentId, requestedByUserId, amountPaisa: input.amountPaisa, reason: input.reason,
      idempotencyKey: input.idempotencyKey, status: "SUCCEEDED", processedAt: new Date(),
    } });
    const nonProviderComponent = input.amountPaisa - providerComponent;
    await tx.ledgerTransaction.create({ data: {
      referenceType: "PAYMENT_REFUND", referenceId: refund.id,
      description: `Refund for booking ${payment.booking.bookingCode}`, actorUserId: requestedByUserId,
      entries: { create: [
        ...(providerComponent > 0n ? [{ accountCode: "PROVIDER_PAYABLE", walletAccountId: wallet.id, entrySide: "DEBIT" as const, amountPaisa: providerComponent }] : []),
        ...(nonProviderComponent > 0n ? [{ accountCode: "PLATFORM_REFUND", entrySide: "DEBIT" as const, amountPaisa: nonProviderComponent }] : []),
        { accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "CREDIT", amountPaisa: input.amountPaisa },
      ] },
    } });
    if (providerComponent > 0n) {
      await tx.walletAccount.update({ where: { id: wallet.id }, data: {
        pendingBalancePaisa: { decrement: fromPending },
        availableBalancePaisa: { decrement: fromAvailable },
        balanceVersion: { increment: 1 },
      } });
    }
    const totalRefunded = refunded + input.amountPaisa;
    await tx.payment.update({ where: { id: payment.id }, data: {
      status: totalRefunded === payment.amountPaisa ? "REFUNDED" : "PARTIALLY_REFUNDED",
    } });
    await notification(tx, { userId: payment.payerUserId, type: "REFUND_PROCESSED", title: "Refund processed", message: `Refund for booking ${payment.booking.bookingCode} was processed.`, entityType: "Refund", entityId: refund.id, idempotencyKey: `refund:${refund.id}:payer` });
    await audit(tx, DomainAuditEventType.REFUND_CREATED, requestedByUserId, payment.booking.propertyId, "Refund", refund.id);
    return serialize(refund);
  }, { isolationLevel: "Serializable" });
}

export async function createPayout(providerUserId: string, input: { amountPaisa: bigint; idempotencyKey: string }) {
  const previous = await prisma.payoutRequest.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (previous) return serialize(previous);
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.walletAccount.findUnique({ where: { userId_currency: { userId: providerUserId, currency: "BDT" } } });
    if (!wallet) fail(404, "WALLET_NOT_FOUND", "Wallet was not found");
    await lockEntity(tx, "wallet", wallet.id);
    const current = await tx.walletAccount.findUniqueOrThrow({ where: { id: wallet.id } });
    if (current.status !== "ACTIVE" || current.availableBalancePaisa < input.amountPaisa) {
      fail(409, "PAYOUT_BALANCE_INSUFFICIENT", "Available balance is insufficient for payout");
    }
    const payout = await tx.payoutRequest.create({ data: {
      providerUserId, walletAccountId: wallet.id, amountPaisa: input.amountPaisa, idempotencyKey: input.idempotencyKey,
    } });
    await tx.walletAccount.update({ where: { id: wallet.id }, data: {
      availableBalancePaisa: { decrement: input.amountPaisa }, heldBalancePaisa: { increment: input.amountPaisa }, balanceVersion: { increment: 1 },
    } });
    const membership = await tx.propertyProvider.findFirst({
      where: { providerUserId }, select: { propertyId: true },
    });
    await audit(tx, DomainAuditEventType.PAYOUT_REQUESTED, providerUserId,
      membership?.propertyId, "PayoutRequest", payout.id);
    return serialize(payout);
  }, { isolationLevel: "Serializable" });
}

export async function listPayouts(status?: PayoutStatus) {
  return serialize(await prisma.payoutRequest.findMany({
    ...(status ? { where: { status } } : {}),
    include: { provider: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  }));
}

export async function reviewPayout(
  adminUserId: string,
  payoutId: string,
  input: { decision: "APPROVED" | "REJECTED" | "PAID"; note: string },
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payout", payoutId);
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) fail(404, "PAYOUT_NOT_FOUND", "Payout request was not found");
    if (payout.status === input.decision) return serialize(payout);
    if (input.decision === "PAID" && payout.status !== PayoutStatus.APPROVED) {
      fail(409, "PAYOUT_TRANSITION_INVALID", "Only an approved payout can be marked paid");
    }
    if (input.decision !== "PAID" && payout.status !== PayoutStatus.PENDING) {
      fail(409, "PAYOUT_TRANSITION_INVALID", "Only a pending payout can be approved or rejected");
    }
    await lockEntity(tx, "wallet", payout.walletAccountId);
    const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: payout.walletAccountId } });
    if (wallet.heldBalancePaisa < payout.amountPaisa) {
      fail(409, "PAYOUT_HELD_BALANCE_INVALID", "Reserved payout balance is unavailable");
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
      await tx.ledgerTransaction.create({ data: {
        referenceType: "PAYOUT",
        referenceId: payout.id,
        description: "Simulated Provider payout settlement",
        actorUserId: adminUserId,
        entries: { create: [
          { accountCode: "PROVIDER_PAYABLE", walletAccountId: wallet.id, entrySide: "DEBIT", amountPaisa: payout.amountPaisa },
          { accountCode: "EXTERNAL_PAYOUT_CLEARING", entrySide: "CREDIT", amountPaisa: payout.amountPaisa },
        ] },
      } });
      await tx.walletAccount.update({
        where: { id: wallet.id },
        data: { heldBalancePaisa: { decrement: payout.amountPaisa }, balanceVersion: { increment: 1 } },
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
    await audit(tx, DomainAuditEventType.PAYOUT_REVIEWED, adminUserId,
      undefined, "PayoutRequest", payout.id, { decision: input.decision });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const updated = await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  if (updated.count !== 1) fail(404, "NOTIFICATION_NOT_FOUND", "Notification was not found");
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function createReview(driverUserId: string, bookingId: string, input: { rating: number; comment?: string }) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, driverUserId } });
  if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
  if (booking.status !== BookingStatus.COMPLETED) fail(409, "REVIEW_BOOKING_NOT_COMPLETED", "Only completed bookings can be reviewed");
  try {
    return await prisma.review.create({ data: { bookingId, driverUserId, rating: input.rating, comment: input.comment ?? null } });
  } catch {
    fail(409, "REVIEW_ALREADY_EXISTS", "This booking has already been reviewed");
  }
}

export async function listProviderReviews(actorUserId: string) {
  const scopes = await listProviderAccessScopes(actorUserId, ManagerDelegationPermission.BOOKING_VIEW);
  const reviews = await prisma.review.findMany({
    where: { booking: { listing: { providerMembershipId: { in: scopes.map((scope) => scope.providerMembershipId) } } } },
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
  const unrestrictedResourceIds = new Set(scopes.filter((scope) => scope.resourceIds === null).map((scope) => scope.providerMembershipId));
  const allowedResourceIds = new Set(scopes.flatMap((scope) => scope.resourceIds ?? []));
  return reviews.filter((review) => {
    const membershipId = review.booking.listing.providerMembershipId;
    return unrestrictedResourceIds.has(membershipId) || allowedResourceIds.has(review.booking.parkingSpotId);
  });
}

export async function replyReview(actorUserId: string, reviewId: string, reply: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { booking: true } });
  if (!review) fail(404, "REVIEW_NOT_FOUND", "Review was not found");
  if (review.booking.providerUserId !== actorUserId) {
    await requireAuthority(actorUserId, review.booking.propertyId, ManagerDelegationPermission.BOOKING_MANAGE, review.booking.parkingSpotId);
  }
  return prisma.review.update({ where: { id: review.id }, data: { providerReply: reply, providerRepliedById: actorUserId, providerRepliedAt: new Date() } });
}

export async function createDispute(openedByUserId: string, bookingId: string, input: {
  category: "PAYMENT" | "ACCESS" | "PARKING_CONDITION" | "OVERCHARGE" | "VEHICLE_DAMAGE" | "OTHER";
  description: string; evidence?: Array<{ url: string; type: string }>;
}) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.driverUserId !== openedByUserId && booking.providerUserId !== openedByUserId) {
      fail(403, "DISPUTE_FORBIDDEN", "You cannot dispute this booking");
    }
    const existing = await tx.dispute.findUnique({ where: { bookingId } });
    if (existing) fail(409, "DISPUTE_ALREADY_EXISTS", "A dispute already exists for this booking");
    const dispute = await tx.dispute.create({ data: {
      bookingId, openedByUserId, category: input.category, description: input.description,
      ...(input.evidence ? { evidence: input.evidence as Prisma.InputJsonValue } : {}),
    } });
    await tx.booking.update({ where: { id: booking.id }, data: { status: "DISPUTED" } });
    await audit(tx, DomainAuditEventType.DISPUTE_CREATED, openedByUserId, booking.propertyId, "Dispute", dispute.id);
    return dispute;
  });
}

export async function resolveDispute(adminUserId: string, disputeId: string, input: { decision: "RESOLVED" | "REJECTED"; resolution: string }) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "dispute", disputeId);
    const dispute = await tx.dispute.findUnique({ where: { id: disputeId }, include: { booking: true } });
    if (!dispute) fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
    if (!["OPEN", "UNDER_REVIEW"].includes(dispute.status)) fail(409, "DISPUTE_STATE_INVALID", "Dispute has already been resolved");
    const updated = await tx.dispute.update({ where: { id: dispute.id }, data: {
      status: input.decision, resolution: input.resolution, resolvedByUserId: adminUserId, resolvedAt: new Date(),
    } });
    await notification(tx, { userId: dispute.openedByUserId, type: "DISPUTE_UPDATE", title: "Dispute updated", message: `Your dispute for booking ${dispute.booking.bookingCode} was ${input.decision.toLowerCase()}.`, entityType: "Dispute", entityId: dispute.id, idempotencyKey: `dispute:${dispute.id}:${input.decision}` });
    await audit(tx, DomainAuditEventType.DISPUTE_RESOLVED, adminUserId, dispute.booking.propertyId, "Dispute", dispute.id, { decision: input.decision });
    return updated;
  });
}

export async function listDisputes(status?: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED") {
  return prisma.dispute.findMany({
    ...(status ? { where: { status } } : {}),
    include: {
      booking: { select: { id: true, bookingCode: true, propertyId: true, driverUserId: true, providerUserId: true } },
      openedBy: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}
