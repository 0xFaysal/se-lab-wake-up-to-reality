import { createHash } from "node:crypto";
import {
  AdminSubjectType,
  BookingStatus,
  ContentArticleKind,
  ContentAudience,
  ContentStatus,
  DisputeStatus,
  DomainAuditEventType,
  LegalDocumentType,
  LegalDocumentStatus,
  NotificationCampaignStatus,
  ParkingAllocationStatus,
  ParkingListingStatus,
  ParkingRightStatus,
  ParkingSpotStatus,
  PaymentStatus,
  PlatformFeeRuleStatus,
  PlatformFeeScopeType,
  PlatformFeeType,
  PropertyStatus,
  PayoutStatus,
  RefundStatus,
  RiskLevel,
  UserRoleType,
  UserStatus,
  Prisma,
} from "../../../../generated/prisma/client.js";
import { AppError } from "../../../common/errors/app-error.js";
import { prisma } from "../../../config/prisma.js";
import { createDomainAuditEvent } from "../../property-governance/domain-audit.js";
import { lockEntity } from "../../marketplace/marketplace.repository.js";
import {
  createAdminManagedAccount,
  resendAdminAccountSetup,
} from "../../users/users.service.js";

type Page = { page: number; limit: number };

function fail(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ message, statusCode, code, ...(details === undefined ? {} : { details }) });
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? Number(item) : item)) as T;
}

async function audit(
  tx: Prisma.TransactionClient,
  input: {
    eventType: DomainAuditEventType;
    actorUserId: string;
    entityType: string;
    entityId: string;
    propertyId?: string | undefined;
    requestId?: string | undefined;
    metadata?: Record<string, string | number | boolean | null> | undefined;
  },
) {
  await createDomainAuditEvent(tx, input);
}

async function assertSubjectExists(type: AdminSubjectType, id: string) {
  const exists = await (async () => {
    switch (type) {
      case AdminSubjectType.USER: return prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      case AdminSubjectType.PROPERTY: return prisma.property.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      case AdminSubjectType.PARKING_RESOURCE: return prisma.parkingSpot.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      case AdminSubjectType.PARKING_RIGHT: return prisma.parkingRight.findUnique({ where: { id }, select: { id: true } });
      case AdminSubjectType.LISTING: return prisma.parkingListing.findUnique({ where: { id }, select: { id: true } });
      case AdminSubjectType.BOOKING: return prisma.booking.findUnique({ where: { id }, select: { id: true } });
      case AdminSubjectType.PAYOUT: return prisma.payoutRequest.findUnique({ where: { id }, select: { id: true } });
      case AdminSubjectType.DISPUTE: return prisma.dispute.findUnique({ where: { id }, select: { id: true } });
    }
  })();
  if (!exists) fail(404, "ADMIN_SUBJECT_NOT_FOUND", "The referenced Admin subject was not found");
}

const moderationEvents = {
  suspend: DomainAuditEventType.ADMIN_USER_SUSPENDED,
  unsuspend: DomainAuditEventType.ADMIN_USER_UNSUSPENDED,
  block: DomainAuditEventType.ADMIN_USER_BLOCKED,
  unblock: DomainAuditEventType.ADMIN_USER_UNBLOCKED,
} as const;

export async function createUserByAdmin(
  adminUserId: string,
  input: {
    fullName: string;
    email: string;
    phone: string;
    role:
      | typeof UserRoleType.DRIVER
      | typeof UserRoleType.PROVIDER
      | typeof UserRoleType.MANAGER
      | typeof UserRoleType.GUARD;
  },
  requestId?: string,
) {
  const result = await createAdminManagedAccount({
    actorUserId: adminUserId,
    targetRole: input.role,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
  });
  await prisma.$transaction(async (tx) => {
    await audit(tx, {
      eventType: DomainAuditEventType.USER_CREATED_BY_ADMIN,
      actorUserId: adminUserId,
      entityType: "User",
      entityId: result.user.id,
      requestId,
      metadata: { role: input.role, accountStatus: result.user.status },
    });
  });
  return result;
}

export async function updateUserByAdmin(
  adminUserId: string,
  userId: string,
  input: { fullName?: string; email?: string; phone?: string },
  requestId?: string,
) {
  if (adminUserId === userId) {
    fail(409, "ADMIN_SELF_PROFILE_EDIT_FORBIDDEN", "Use the account profile flow to edit your own Admin account");
  }
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "admin-user", userId);
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, fullName: true, email: true, phone: true, roles: { select: { role: true } } },
    });
    if (!user) fail(404, "ADMIN_USER_NOT_FOUND", "User was not found");
    if (user.roles.some(({ role }) => role === UserRoleType.ADMIN)) {
      fail(403, "ADMIN_PROTECTED_ACCOUNT", "Admin accounts require an out-of-band security review");
    }
    const duplicate = await tx.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(input.email ? [{ email: input.email }] : []),
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
      select: { id: true },
    });
    if (duplicate) fail(409, "EMAIL_OR_PHONE_ALREADY_REGISTERED", "Email or phone is already registered");

    const emailChanged = input.email !== undefined && input.email !== user.email;
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(emailChanged ? { emailVerifiedAt: null, status: UserStatus.PENDING } : {}),
      },
      select: { id: true, fullName: true, email: true, phone: true, status: true, updatedAt: true },
    });
    if (emailChanged) {
      await tx.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await audit(tx, {
      eventType: DomainAuditEventType.ADMIN_USER_PROFILE_UPDATED,
      actorUserId: adminUserId,
      entityType: "User",
      entityId: userId,
      requestId,
      metadata: {
        fullNameChanged: input.fullName !== undefined && input.fullName !== user.fullName,
        emailChanged,
        phoneChanged: input.phone !== undefined && input.phone !== user.phone,
      },
    });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function resendUserSetupByAdmin(
  adminUserId: string,
  userId: string,
  requestId?: string,
) {
  const result = await resendAdminAccountSetup(userId);
  await prisma.$transaction(async (tx) => {
    await audit(tx, {
      eventType: DomainAuditEventType.ADMIN_ACCOUNT_SETUP_RESENT,
      actorUserId: adminUserId,
      entityType: "User",
      entityId: userId,
      requestId,
    });
  });
  return result;
}

export async function moderateUser(
  adminUserId: string,
  userId: string,
  action: keyof typeof moderationEvents,
  reason: string,
  requestId?: string,
) {
  if (adminUserId === userId) fail(409, "ADMIN_SELF_MODERATION_FORBIDDEN", "An Admin cannot moderate their own account");
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "admin-user", userId);
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { roles: { select: { role: true } } },
    });
    if (!user) fail(404, "ADMIN_USER_NOT_FOUND", "User was not found");
    if (user.roles.some(({ role }) => role === UserRoleType.ADMIN)) {
      fail(403, "ADMIN_PROTECTED_ACCOUNT", "Admin accounts require an out-of-band security review");
    }

    const nextStatus = action === "suspend"
      ? UserStatus.SUSPENDED
      : action === "block"
        ? UserStatus.BLOCKED
        : user.emailVerifiedAt
          ? UserStatus.ACTIVE
          : UserStatus.PENDING;
    const expectedStatus = action === "unsuspend" ? UserStatus.SUSPENDED : action === "unblock" ? UserStatus.BLOCKED : undefined;
    if (expectedStatus && user.status !== expectedStatus) {
      fail(409, "USER_MODERATION_STATE_INVALID", `User is not currently ${expectedStatus.toLowerCase()}`);
    }
    const suspendableStatuses: UserStatus[] = [UserStatus.ACTIVE, UserStatus.PENDING];
    if (action === "suspend" && !suspendableStatuses.includes(user.status)) {
      fail(409, "USER_MODERATION_STATE_INVALID", "Only an active or pending account can be suspended");
    }
    if (user.status === nextStatus) fail(409, "USER_MODERATION_STATE_INVALID", `User is already ${nextStatus.toLowerCase()}`);

    const updated = await tx.user.update({
      where: { id: userId },
      data: { status: nextStatus },
      select: { id: true, fullName: true, email: true, status: true, updatedAt: true },
    });
    if (nextStatus === UserStatus.SUSPENDED || nextStatus === UserStatus.BLOCKED) {
      await tx.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await audit(tx, {
      eventType: moderationEvents[action], actorUserId: adminUserId, entityType: "User", entityId: userId,
      requestId, metadata: { reason, previousStatus: user.status, nextStatus },
    });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function revokeAllUserSessions(adminUserId: string, userId: string, reason: string, requestId?: string) {
  if (adminUserId === userId) fail(409, "ADMIN_SELF_SESSION_REVOCATION_FORBIDDEN", "Use the account security screen to sign out this Admin account");
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    if (!user) fail(404, "ADMIN_USER_NOT_FOUND", "User was not found");
    const result = await tx.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.ADMIN_USER_SESSIONS_REVOKED, actorUserId: adminUserId, entityType: "User", entityId: userId, requestId, metadata: { reason, revokedSessions: result.count } });
    return { userId, revokedSessions: result.count };
  });
}

export async function listAdminNotes(query: Page & { subjectType?: AdminSubjectType; subjectId?: string }) {
  const where: Prisma.AdminNoteWhereInput = {
    ...(query.subjectType ? { subjectType: query.subjectType } : {}),
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
  };
  const [notes, total] = await Promise.all([
    prisma.adminNote.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { authorAdmin: { select: { id: true, fullName: true, email: true } } } }),
    prisma.adminNote.count({ where }),
  ]);
  return { notes, pagination: pagination(query.page, query.limit, total) };
}

export async function createAdminNote(adminUserId: string, input: { subjectType: AdminSubjectType; subjectId: string; body: string }, requestId?: string) {
  await assertSubjectExists(input.subjectType, input.subjectId);
  return prisma.$transaction(async (tx) => {
    const note = await tx.adminNote.create({ data: { ...input, authorAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.ADMIN_NOTE_CREATED, actorUserId: adminUserId, entityType: "AdminNote", entityId: note.id, requestId, metadata: { subjectType: input.subjectType, subjectId: input.subjectId } });
    return note;
  });
}

export async function updateAdminNote(adminUserId: string, noteId: string, body: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.adminNote.findUnique({ where: { id: noteId } });
    if (!note) fail(404, "ADMIN_NOTE_NOT_FOUND", "Admin note was not found");
    const updated = await tx.adminNote.update({ where: { id: noteId }, data: { body } });
    await audit(tx, { eventType: DomainAuditEventType.ADMIN_NOTE_UPDATED, actorUserId: adminUserId, entityType: "AdminNote", entityId: noteId, requestId, metadata: { subjectType: note.subjectType, subjectId: note.subjectId } });
    return updated;
  });
}

export async function deleteAdminNote(adminUserId: string, noteId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.adminNote.findUnique({ where: { id: noteId } });
    if (!note) fail(404, "ADMIN_NOTE_NOT_FOUND", "Admin note was not found");
    await tx.adminNote.delete({ where: { id: noteId } });
    await audit(tx, { eventType: DomainAuditEventType.ADMIN_NOTE_DELETED, actorUserId: adminUserId, entityType: "AdminNote", entityId: noteId, requestId, metadata: { subjectType: note.subjectType, subjectId: note.subjectId } });
    return { deleted: true };
  });
}

export async function listRiskFlags(query: Page & { targetType?: AdminSubjectType; targetId?: string; level?: RiskLevel; openOnly?: boolean }) {
  const where: Prisma.RiskFlagWhereInput = {
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.targetId ? { targetId: query.targetId } : {}),
    ...(query.level ? { level: query.level } : {}),
    ...(query.openOnly ? { resolvedAt: null } : {}),
  };
  const [flags, total] = await Promise.all([
    prisma.riskFlag.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { createdByAdmin: { select: { id: true, fullName: true } } } }),
    prisma.riskFlag.count({ where }),
  ]);
  return { flags, pagination: pagination(query.page, query.limit, total) };
}

export async function createRiskFlag(adminUserId: string, input: { targetType: AdminSubjectType; targetId: string; level: RiskLevel; reason: string }, requestId?: string) {
  await assertSubjectExists(input.targetType, input.targetId);
  return prisma.$transaction(async (tx) => {
    const flag = await tx.riskFlag.create({ data: { ...input, createdByAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.RISK_FLAG_CREATED, actorUserId: adminUserId, entityType: "RiskFlag", entityId: flag.id, requestId, metadata: { targetType: input.targetType, targetId: input.targetId, level: input.level, reason: input.reason } });
    return flag;
  });
}

export async function resolveRiskFlag(adminUserId: string, flagId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    const flag = await tx.riskFlag.findUnique({ where: { id: flagId } });
    if (!flag) fail(404, "RISK_FLAG_NOT_FOUND", "Risk flag was not found");
    if (flag.resolvedAt) fail(409, "RISK_FLAG_ALREADY_RESOLVED", "Risk flag is already resolved");
    const updated = await tx.riskFlag.update({ where: { id: flagId }, data: { resolvedAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.RISK_FLAG_RESOLVED, actorUserId: adminUserId, entityType: "RiskFlag", entityId: flag.id, requestId, metadata: { targetType: flag.targetType, targetId: flag.targetId, reason } });
    return updated;
  });
}

export async function listParkingResources(query: Page & { search?: string; propertyId?: string; providerUserId?: string; type?: "FIXED_SPACE" | "SHARED_POOL"; status?: ParkingSpotStatus }) {
  const where: Prisma.ParkingSpotWhereInput = {
    deletedAt: null,
    ...(query.search ? { OR: [{ displayName: { contains: query.search, mode: "insensitive" } }, { spotCode: { contains: query.search, mode: "insensitive" } }, { property: { name: { contains: query.search, mode: "insensitive" } } }] } : {}),
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.providerUserId ? { providerMembership: { providerUserId: query.providerUserId } } : {}),
    ...(query.type ? { resourceType: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [resources, total] = await Promise.all([
    prisma.parkingSpot.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, select: { id: true, displayName: true, spotCode: true, resourceType: true, status: true, capacity: true, floor: true, zone: true, supportedVehicleTypes: true, createdAt: true, property: { select: { id: true, name: true, publicArea: true } }, providerMembership: { select: { provider: { select: { id: true, fullName: true, email: true } } } }, _count: { select: { parkingRights: true, listings: true, bookings: true } } } }),
    prisma.parkingSpot.count({ where }),
  ]);
  return { resources, pagination: pagination(query.page, query.limit, total) };
}

export async function setParkingResourceStatus(adminUserId: string, resourceId: string, status: ParkingSpotStatus, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "parking-resource", resourceId);
    const resource = await tx.parkingSpot.findFirst({ where: { id: resourceId, deletedAt: null } });
    if (!resource) fail(404, "PARKING_RESOURCE_NOT_FOUND", "Parking resource was not found");
    if (resource.status === status) fail(409, "PARKING_RESOURCE_STATUS_UNCHANGED", "Parking resource already has this status");
    if (status !== ParkingSpotStatus.ACTIVE) {
      await tx.parkingListing.updateMany({ where: { parkingSpotId: resourceId, status: ParkingListingStatus.ACTIVE }, data: { status: ParkingListingStatus.SUSPENDED, deactivatedAt: new Date() } });
    }
    const updated = await tx.parkingSpot.update({ where: { id: resourceId }, data: { status } });
    await audit(tx, { eventType: DomainAuditEventType.PARKING_RESOURCE_STATUS_CHANGED, actorUserId: adminUserId, propertyId: resource.propertyId, entityType: "ParkingResource", entityId: resourceId, requestId, metadata: { previousStatus: resource.status, nextStatus: status, reason } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function listExpiringRights(days: 7 | 30 | 60) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 86_400_000);
  return prisma.parkingRight.findMany({
    where: { status: ParkingRightStatus.VERIFIED, validUntil: { gt: now, lte: until } },
    orderBy: { validUntil: "asc" },
    include: {
      holder: { select: { id: true, fullName: true, email: true } },
      parkingSpot: { select: { id: true, displayName: true, spotCode: true, resourceType: true, capacity: true, property: { select: { id: true, name: true } } } },
    },
  });
}

export async function overridePropertyStatus(adminUserId: string, propertyId: string, input: { status: PropertyStatus; reason: string; closedUntil?: string | null }, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "property", propertyId);
    const property = await tx.property.findFirst({ where: { id: propertyId, deletedAt: null, canonicalPropertyId: null } });
    if (!property) fail(404, "PROPERTY_NOT_FOUND", "Property was not found");
    const now = new Date();
    if (input.status !== PropertyStatus.ACTIVE) {
      await tx.parkingListing.updateMany({ where: { parkingSpot: { propertyId }, status: ParkingListingStatus.ACTIVE }, data: { status: ParkingListingStatus.SUSPENDED, deactivatedAt: now } });
    }
    const updated = await tx.property.update({ where: { id: propertyId }, data: { status: input.status, temporaryClosureReason: input.status === PropertyStatus.TEMPORARILY_CLOSED ? input.reason : null, temporaryClosedAt: input.status === PropertyStatus.TEMPORARILY_CLOSED ? now : null, temporaryClosedUntil: input.status === PropertyStatus.TEMPORARILY_CLOSED && input.closedUntil ? new Date(input.closedUntil) : null, version: { increment: 1 } } });
    await audit(tx, { eventType: DomainAuditEventType.PROPERTY_STATUS_OVERRIDDEN, actorUserId: adminUserId, propertyId, entityType: "Property", entityId: propertyId, requestId, metadata: { previousStatus: property.status, nextStatus: input.status, reason: input.reason } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function listConflictingRights() {
  const resources = await prisma.parkingSpot.findMany({
    where: { deletedAt: null, parkingRights: { some: { status: ParkingRightStatus.VERIFIED } } },
    select: {
      id: true, displayName: true, spotCode: true, resourceType: true, capacity: true,
      property: { select: { id: true, name: true } },
      parkingRights: { where: { status: ParkingRightStatus.VERIFIED }, select: { id: true, quantity: true, holder: { select: { id: true, fullName: true } }, validFrom: true, validUntil: true } },
    },
  });
  return resources
    .map((resource) => ({ ...resource, verifiedEntitlement: resource.parkingRights.reduce((sum, right) => sum + right.quantity, 0) }))
    .filter((resource) => resource.verifiedEntitlement > resource.capacity || (resource.resourceType === "FIXED_SPACE" && resource.parkingRights.length > 1));
}

export async function getSharedPoolMonitor() {
  const now = new Date();
  const pools = await prisma.parkingSpot.findMany({
    where: { resourceType: "SHARED_POOL", deletedAt: null },
    select: {
      id: true, displayName: true, status: true, capacity: true,
      property: { select: { id: true, name: true } },
      parkingRights: { where: { status: ParkingRightStatus.VERIFIED, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] }, select: { quantity: true } },
      allocations: { where: { startAt: { lte: now }, endAt: { gt: now }, status: { in: [ParkingAllocationStatus.HELD, ParkingAllocationStatus.BOOKED] } }, select: { status: true, capacityUnit: true } },
      bookings: { where: { status: BookingStatus.CHECKED_IN }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return pools.map((pool) => {
    const entitlement = pool.parkingRights.reduce((sum, right) => sum + right.quantity, 0);
    const held = pool.allocations.filter((allocation) => allocation.status === ParkingAllocationStatus.HELD).reduce((sum, allocation) => sum + allocation.capacityUnit, 0);
    const booked = pool.allocations.filter((allocation) => allocation.status === ParkingAllocationStatus.BOOKED).reduce((sum, allocation) => sum + allocation.capacityUnit, 0);
    return { ...pool, parkingRights: undefined, allocations: undefined, bookings: undefined, verifiedEntitlement: entitlement, held, booked, checkedIn: pool.bookings.length, remaining: Math.max(0, pool.capacity - held - booked) };
  });
}

export async function getParkingOperationsOverview() {
  const now = new Date();
  const operationalStatuses: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKOUT_REQUESTED];
  const [properties, activeBookings, guardCoverage, activeVehicles, entryExitLog, sharedPools] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null, canonicalPropertyId: null },
      select: { id: true, name: true, publicArea: true, status: true, temporaryClosureReason: true, temporaryClosedUntil: true, parkingSpots: { where: { deletedAt: null, status: ParkingSpotStatus.ACTIVE }, select: { capacity: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.booking.groupBy({ by: ["propertyId", "status"], where: { status: { in: operationalStatuses } }, _count: true }),
    prisma.propertyGuardMembership.groupBy({ by: ["propertyId"], where: { status: "ACTIVE" }, _count: true }),
    prisma.booking.findMany({
      where: { status: { in: operationalStatuses } },
      orderBy: [{ scheduledEndAt: "asc" }, { startAt: "asc" }],
      take: 200,
      select: {
        id: true, bookingCode: true, status: true, startAt: true, scheduledEndAt: true,
        checkedInAt: true, checkoutRequestedAt: true,
        vehicle: { select: { id: true, registrationNumber: true, vehicleType: true, brand: true, model: true, color: true } },
        driver: { select: { id: true, fullName: true, phone: true } },
        property: { select: { id: true, name: true, publicArea: true } },
        parkingSpot: { select: { id: true, displayName: true, spotCode: true, resourceType: true } },
      },
    }),
    prisma.domainAuditEvent.findMany({
      where: { eventType: { in: [DomainAuditEventType.BOOKING_CHECKED_IN, DomainAuditEventType.BOOKING_CHECKED_OUT] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, eventType: true, entityId: true, metadata: true, createdAt: true,
        actor: { select: { id: true, fullName: true } },
        property: { select: { id: true, name: true } },
      },
    }),
    getSharedPoolMonitor(),
  ]);
  const bookingMap = new Map<string, Partial<Record<BookingStatus, number>>>();
  activeBookings.forEach((row) => bookingMap.set(row.propertyId, { ...bookingMap.get(row.propertyId), [row.status]: row._count }));
  const guardMap = new Map(guardCoverage.map((row) => [row.propertyId, row._count]));
  const propertyCards = properties.map((property) => {
    const capacity = property.parkingSpots.reduce((sum, resource) => sum + resource.capacity, 0);
    const state = bookingMap.get(property.id) ?? {};
    const occupied = (state[BookingStatus.CHECKED_IN] ?? 0) + (state[BookingStatus.CHECKOUT_REQUESTED] ?? 0);
    const reserved = state[BookingStatus.CONFIRMED] ?? 0;
    return { id: property.id, name: property.name, publicArea: property.publicArea, status: property.status, temporaryClosureReason: property.temporaryClosureReason, temporaryClosedUntil: property.temporaryClosedUntil, capacity, occupied, reserved, available: Math.max(0, capacity - occupied - reserved), utilizationPercent: capacity === 0 ? 0 : Math.round((occupied / capacity) * 100), activeGuards: guardMap.get(property.id) ?? 0, guardCoverageGap: capacity > 0 && (guardMap.get(property.id) ?? 0) === 0 };
  });
  const vehicles = activeVehicles.map((booking) => ({
    ...booking,
    overdue: booking.status !== BookingStatus.CONFIRMED && booking.scheduledEndAt < now,
    overtimeMinutes: booking.status !== BookingStatus.CONFIRMED && booking.scheduledEndAt < now
      ? Math.floor((now.getTime() - booking.scheduledEndAt.getTime()) / 60_000)
      : 0,
  }));
  return {
    generatedAt: now,
    properties: propertyCards,
    activeVehicles: vehicles,
    overstays: vehicles.filter((booking) => booking.overdue),
    entryExitLog,
    sharedPools,
  };
}

export async function searchActiveVehicles(query: string, limit: number) {
  const normalized = query.toUpperCase().replace(/[\s-]+/g, "");
  return prisma.vehicle.findMany({
    where: {
      deletedAt: null,
      OR: [{ normalizedRegistrationNumber: { contains: normalized } }, { registrationNumber: { contains: query, mode: "insensitive" } }],
      bookings: { some: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKOUT_REQUESTED] } } },
    },
    take: limit,
    select: {
      id: true, registrationNumber: true, vehicleType: true, brand: true, model: true, color: true,
      owner: { select: { id: true, fullName: true, phone: true } },
      bookings: { where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKOUT_REQUESTED] } }, orderBy: { startAt: "asc" }, take: 5, select: { id: true, bookingCode: true, status: true, startAt: true, scheduledEndAt: true, property: { select: { id: true, name: true } } } },
    },
  });
}

function analyticsRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 86_400_000);
  if (start >= end) fail(400, "ANALYTICS_RANGE_INVALID", "Analytics start must be before end");
  if (end.getTime() - start.getTime() > 366 * 86_400_000) fail(400, "ANALYTICS_RANGE_TOO_LARGE", "Analytics range cannot exceed 366 days");
  return { start, end };
}

type CountTrendRow = { bucket: Date; count: number };
type MoneyTrendRow = { bucket: Date; count: number; amountPaisa: bigint };

export async function getBookingAnalytics(input: { from?: string; to?: string; granularity: "day" | "week" | "month" }) {
  const { start, end } = analyticsRange(input.from, input.to);
  const bucket = Prisma.raw(`date_trunc('${input.granularity}', "created_at")`);
  const [trend, byStatus, total, cancelled, noShow, disputes] = await Promise.all([
    prisma.$queryRaw<CountTrendRow[]>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(*)::int AS "count" FROM "bookings" WHERE "created_at" >= ${start} AND "created_at" < ${end} GROUP BY 1 ORDER BY 1`),
    prisma.booking.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: true }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end }, status: BookingStatus.CANCELLED } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end }, status: BookingStatus.NO_SHOW } }),
    prisma.dispute.count({ where: { createdAt: { gte: start, lt: end } } }),
  ]);
  return { range: { from: start, to: end, granularity: input.granularity }, trend, byStatus, rates: { cancellationPercent: total ? Math.round(cancelled * 10_000 / total) / 100 : 0, noShowPercent: total ? Math.round(noShow * 10_000 / total) / 100 : 0, disputePercent: total ? Math.round(disputes * 10_000 / total) / 100 : 0 } };
}

export async function getFinanceAnalytics(input: { from?: string; to?: string; granularity: "day" | "week" | "month" }) {
  const { start, end } = analyticsRange(input.from, input.to);
  const bucket = Prisma.raw(`date_trunc('${input.granularity}', "created_at")`);
  const [payments, refunds, captured, refunded] = await Promise.all([
    prisma.$queryRaw<MoneyTrendRow[]>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(*)::int AS "count", COALESCE(SUM("amount_paisa"), 0)::bigint AS "amountPaisa" FROM "payments" WHERE "created_at" >= ${start} AND "created_at" < ${end} AND "status" IN ('SUCCEEDED', 'CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED') GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<MoneyTrendRow[]>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(*)::int AS "count", COALESCE(SUM("amount_paisa"), 0)::bigint AS "amountPaisa" FROM "refunds" WHERE "created_at" >= ${start} AND "created_at" < ${end} AND "status" = 'SUCCEEDED' GROUP BY 1 ORDER BY 1`),
    prisma.payment.aggregate({ where: { createdAt: { gte: start, lt: end }, status: { in: [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED] } }, _sum: { amountPaisa: true }, _count: true }),
    prisma.refund.aggregate({ where: { createdAt: { gte: start, lt: end }, status: RefundStatus.SUCCEEDED }, _sum: { amountPaisa: true }, _count: true }),
  ]);
  const capturedAmount = captured._sum.amountPaisa ?? 0n;
  const refundedAmount = refunded._sum.amountPaisa ?? 0n;
  return serialize({ range: { from: start, to: end, granularity: input.granularity }, paymentTrend: payments, refundTrend: refunds, totals: { paymentVolumePaisa: capturedAmount, refundedPaisa: refundedAmount, netVolumePaisa: capturedAmount - refundedAmount, successfulPayments: captured._count, successfulRefunds: refunded._count, refundPercent: capturedAmount > 0n ? Number((refundedAmount * 10_000n) / capturedAmount) / 100 : 0 } });
}

export async function getUserAnalytics(input: { from?: string; to?: string; granularity: "day" | "week" | "month" }) {
  const { start, end } = analyticsRange(input.from, input.to);
  const bucket = Prisma.raw(`date_trunc('${input.granularity}', u."created_at")`);
  const propertyBucket = Prisma.raw(`date_trunc('${input.granularity}', p."created_at")`);
  const [growth, providerGrowth, propertyGrowth, byRole] = await Promise.all([
    prisma.$queryRaw<Array<{ bucket: Date; count: number }>>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(*)::int AS "count" FROM "users" u WHERE u."created_at" >= ${start} AND u."created_at" < ${end} AND u."deleted_at" IS NULL GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Array<{ bucket: Date; count: number }>>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(DISTINCT u."id")::int AS "count" FROM "users" u INNER JOIN "user_roles" ur ON ur."user_id" = u."id" AND ur."role" = 'PROVIDER' WHERE u."created_at" >= ${start} AND u."created_at" < ${end} AND u."deleted_at" IS NULL GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Array<{ bucket: Date; count: number }>>(Prisma.sql`SELECT ${propertyBucket} AS "bucket", COUNT(*)::int AS "count" FROM "properties" p WHERE p."created_at" >= ${start} AND p."created_at" < ${end} AND p."deleted_at" IS NULL AND p."canonical_property_id" IS NULL GROUP BY 1 ORDER BY 1`),
    prisma.userRole.groupBy({ by: ["role"], _count: true }),
  ]);
  return { range: { from: start, to: end, granularity: input.granularity }, growth, providerGrowth, propertyGrowth, byRole };
}

export async function getOccupancyAnalytics(input: { from?: string; to?: string; granularity: "day" | "week" | "month" }) {
  const { start, end } = analyticsRange(input.from, input.to);
  const bucket = Prisma.raw(`date_trunc('${input.granularity}', "checked_in_at")`);
  const [trend, utilization, peakTimeHeatmap, byResourceType] = await Promise.all([
    prisma.$queryRaw<Array<{ bucket: Date; checkIns: number; completed: number }>>(Prisma.sql`SELECT ${bucket} AS "bucket", COUNT(*)::int AS "checkIns", COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completed" FROM "bookings" WHERE "checked_in_at" >= ${start} AND "checked_in_at" < ${end} GROUP BY 1 ORDER BY 1`),
    prisma.booking.groupBy({ by: ["parkingSpotId"], where: { checkedInAt: { gte: start, lt: end } }, _count: true, orderBy: { _count: { parkingSpotId: "desc" } }, take: 20 }),
    prisma.$queryRaw<Array<{ dayOfWeek: number; hour: number; checkIns: number }>>(Prisma.sql`SELECT EXTRACT(ISODOW FROM "checked_in_at" AT TIME ZONE 'Asia/Dhaka')::int AS "dayOfWeek", EXTRACT(HOUR FROM "checked_in_at" AT TIME ZONE 'Asia/Dhaka')::int AS "hour", COUNT(*)::int AS "checkIns" FROM "bookings" WHERE "checked_in_at" >= ${start} AND "checked_in_at" < ${end} GROUP BY 1, 2 ORDER BY 1, 2`),
    prisma.$queryRaw<Array<{ resourceType: string; checkIns: number; distinctResources: number }>>(Prisma.sql`SELECT ps."resource_type"::text AS "resourceType", COUNT(b."id")::int AS "checkIns", COUNT(DISTINCT ps."id")::int AS "distinctResources" FROM "parking_spots" ps LEFT JOIN "bookings" b ON b."parking_spot_id" = ps."id" AND b."checked_in_at" >= ${start} AND b."checked_in_at" < ${end} WHERE ps."deleted_at" IS NULL GROUP BY ps."resource_type" ORDER BY ps."resource_type"`),
  ]);
  return { range: { from: start, to: end, granularity: input.granularity }, trend, topResources: utilization, peakTimeHeatmap, byResourceType };
}

export async function getAnalyticsOverview(input: { from?: string; to?: string; granularity: "day" | "week" | "month" }) {
  const [bookings, finance, users, occupancy] = await Promise.all([getBookingAnalytics(input), getFinanceAnalytics(input), getUserAnalytics(input), getOccupancyAnalytics(input)]);
  return { bookings, finance, users, occupancy };
}

export async function getFinancialReconciliation() {
  const rows = await prisma.$queryRaw<Array<{ walletAccountId: string; userId: string; projectedPaisa: bigint; ledgerPaisa: bigint; differencePaisa: bigint }>>(Prisma.sql`
    SELECT w."id" AS "walletAccountId", w."user_id" AS "userId",
      (w."available_balance_paisa" + w."pending_balance_paisa" + w."held_balance_paisa")::bigint AS "projectedPaisa",
      COALESCE(SUM(CASE WHEN le."entry_side" = 'CREDIT' THEN le."amount_paisa" ELSE -le."amount_paisa" END), 0)::bigint AS "ledgerPaisa",
      ((w."available_balance_paisa" + w."pending_balance_paisa" + w."held_balance_paisa") - COALESCE(SUM(CASE WHEN le."entry_side" = 'CREDIT' THEN le."amount_paisa" ELSE -le."amount_paisa" END), 0))::bigint AS "differencePaisa"
    FROM "wallet_accounts" w
    LEFT JOIN "ledger_entries" le ON le."wallet_account_id" = w."id"
    GROUP BY w."id"
    HAVING (w."available_balance_paisa" + w."pending_balance_paisa" + w."held_balance_paisa") <> COALESCE(SUM(CASE WHEN le."entry_side" = 'CREDIT' THEN le."amount_paisa" ELSE -le."amount_paisa" END), 0)
    ORDER BY ABS((w."available_balance_paisa" + w."pending_balance_paisa" + w."held_balance_paisa") - COALESCE(SUM(CASE WHEN le."entry_side" = 'CREDIT' THEN le."amount_paisa" ELSE -le."amount_paisa" END), 0)) DESC
  `);
  const [wallets, pendingPayouts, failedPayments, failedRefunds] = await Promise.all([
    prisma.walletAccount.count(),
    prisma.payoutRequest.aggregate({ where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.REQUESTED, PayoutStatus.ON_HOLD, PayoutStatus.APPROVED] } }, _sum: { amountPaisa: true }, _count: true }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.refund.count({ where: { status: RefundStatus.FAILED } }),
  ]);
  return serialize({ checkedWallets: wallets, discrepancyCount: rows.length, discrepancies: rows, reservedPayoutPaisa: pendingPayouts._sum.amountPaisa ?? 0n, pendingPayoutCount: pendingPayouts._count, failedFinancialEvents: { payments: failedPayments, refunds: failedRefunds } });
}

export async function getFinanceOverview() {
  const successfulPaymentStatuses = [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED];
  const accountCodes = ["BOOKING_HELD_FUNDS", "PLATFORM_REVENUE", "PROVIDER_PAYABLE", "DRIVER_REFUND_LIABILITY"];
  const [payments, gatewayRefunds, accountRows, providerWallets, driverWallets, settlements, recentRefundCredits] = await Promise.all([
    prisma.payment.aggregate({ where: { status: { in: successfulPaymentStatuses } }, _sum: { amountPaisa: true }, _count: true }),
    prisma.refund.aggregate({ where: { status: RefundStatus.SUCCEEDED }, _sum: { amountPaisa: true }, _count: true }),
    prisma.ledgerEntry.groupBy({
      by: ["accountCode", "entrySide"],
      where: { accountCode: { in: accountCodes } },
      _sum: { amountPaisa: true },
    }),
    prisma.walletAccount.aggregate({
      where: { user: { roles: { some: { role: UserRoleType.PROVIDER } } } },
      _sum: { availableBalancePaisa: true, pendingBalancePaisa: true, heldBalancePaisa: true },
      _count: true,
    }),
    prisma.walletAccount.aggregate({
      where: { user: { roles: { some: { role: UserRoleType.DRIVER } } } },
      _sum: { availableBalancePaisa: true, pendingBalancePaisa: true, heldBalancePaisa: true },
      _count: true,
    }),
    prisma.bookingSettlement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, status: true, providerNetPaisa: true, platformRevenuePaisa: true,
        driverRefundCreditPaisa: true, overtimeChargePaisa: true, completedAt: true, createdAt: true,
        booking: { select: { id: true, bookingCode: true, provider: { select: { id: true, fullName: true } }, property: { select: { id: true, name: true } } } },
      },
    }),
    prisma.ledgerEntry.findMany({
      where: { accountCode: "DRIVER_REFUND_LIABILITY", entrySide: "CREDIT", walletAccountId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, amountPaisa: true, createdAt: true,
        walletAccount: { select: { user: { select: { id: true, fullName: true, email: true } } } },
        ledgerTransaction: { select: { referenceType: true, referenceId: true, description: true } },
      },
    }),
  ]);

  const netAccount = (accountCode: string) => accountRows
    .filter((row) => row.accountCode === accountCode)
    .reduce((sum, row) => sum + (row.entrySide === "CREDIT" ? 1n : -1n) * (row._sum.amountPaisa ?? 0n), 0n);

  return serialize({
    captured: { amountPaisa: payments._sum.amountPaisa ?? 0n, count: payments._count },
    gatewayRefunds: { amountPaisa: gatewayRefunds._sum.amountPaisa ?? 0n, count: gatewayRefunds._count },
    ledger: {
      heldBookingFundsPaisa: netAccount("BOOKING_HELD_FUNDS"),
      platformRevenuePaisa: netAccount("PLATFORM_REVENUE"),
      providerPayablePaisa: netAccount("PROVIDER_PAYABLE"),
      driverRefundLiabilityPaisa: netAccount("DRIVER_REFUND_LIABILITY"),
    },
    providerWallets: {
      count: providerWallets._count,
      availablePaisa: providerWallets._sum.availableBalancePaisa ?? 0n,
      pendingPaisa: providerWallets._sum.pendingBalancePaisa ?? 0n,
      heldPaisa: providerWallets._sum.heldBalancePaisa ?? 0n,
    },
    driverWallets: {
      count: driverWallets._count,
      availablePaisa: driverWallets._sum.availableBalancePaisa ?? 0n,
      pendingPaisa: driverWallets._sum.pendingBalancePaisa ?? 0n,
      heldPaisa: driverWallets._sum.heldBalancePaisa ?? 0n,
    },
    recentSettlements: settlements,
    recentRefundCredits,
  });
}

export async function listLegalDocuments(type?: LegalDocumentType) {
  return prisma.legalDocument.findMany({
    ...(type ? { where: { type } } : {}),
    orderBy: [{ type: "asc" }, { effectiveAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, type: true, version: true, title: true, content: true, contentHash: true, effectiveAt: true, status: true, isActive: true, publishedAt: true, createdAt: true, createdByAdmin: { select: { id: true, fullName: true } }, _count: { select: { acceptances: true } } },
  });
}

export async function getLegalDocument(documentId: string) {
  const document = await prisma.legalDocument.findUnique({
    where: { id: documentId },
    include: {
      createdByAdmin: { select: { id: true, fullName: true, email: true } },
      acceptances: {
        orderBy: { acceptedAt: "desc" },
        take: 50,
        select: { id: true, acceptedAt: true, acceptanceSource: true, user: { select: { id: true, fullName: true, email: true } } },
      },
      _count: { select: { acceptances: true } },
    },
  });
  if (!document) fail(404, "LEGAL_DOCUMENT_NOT_FOUND", "Legal document was not found");
  const versionHistory = await prisma.legalDocument.findMany({
    where: { type: document.type },
    orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, version: true, title: true, status: true, isActive: true, effectiveAt: true, publishedAt: true, createdAt: true, _count: { select: { acceptances: true } } },
  });
  return { ...document, versionHistory };
}

export async function createLegalDraft(adminUserId: string, input: { type: LegalDocumentType; version: string; title: string; content: string; effectiveAt: string }, requestId?: string) {
  const contentHash = createHash("sha256").update(input.content, "utf8").digest("hex");
  try {
    return await prisma.$transaction(async (tx) => {
      const draft = await tx.legalDocument.create({ data: { type: input.type, version: input.version, title: input.title, content: input.content, contentHash, effectiveAt: new Date(input.effectiveAt), status: LegalDocumentStatus.DRAFT, isActive: false, createdByAdminId: adminUserId } });
      await audit(tx, { eventType: DomainAuditEventType.LEGAL_DOCUMENT_DRAFT_CREATED, actorUserId: adminUserId, entityType: "LegalDocument", entityId: draft.id, requestId, metadata: { type: draft.type, version: draft.version } });
      return draft;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(409, "LEGAL_VERSION_CONFLICT", "This legal document version already exists");
    throw error;
  }
}

export async function updateLegalDraft(adminUserId: string, documentId: string, input: { version?: string; title?: string; content?: string; effectiveAt?: string }, requestId?: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      await lockEntity(tx, "legal-document", documentId);
      const document = await tx.legalDocument.findUnique({ where: { id: documentId } });
      if (!document) fail(404, "LEGAL_DOCUMENT_NOT_FOUND", "Legal document was not found");
      if (document.status !== LegalDocumentStatus.DRAFT) fail(409, "LEGAL_DOCUMENT_IMMUTABLE", "Published and archived legal documents are immutable; create a new version instead");
      const updated = await tx.legalDocument.update({
        where: { id: documentId },
        data: {
          ...(input.version !== undefined ? { version: input.version } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.content !== undefined ? { content: input.content, contentHash: createHash("sha256").update(input.content, "utf8").digest("hex") } : {}),
          ...(input.effectiveAt !== undefined ? { effectiveAt: new Date(input.effectiveAt) } : {}),
        },
      });
      await audit(tx, { eventType: DomainAuditEventType.LEGAL_DOCUMENT_DRAFT_UPDATED, actorUserId: adminUserId, entityType: "LegalDocument", entityId: document.id, requestId, metadata: { type: document.type, version: updated.version } });
      return updated;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(409, "LEGAL_VERSION_CONFLICT", "This legal document version already exists");
    throw error;
  }
}

export async function publishLegalDocument(adminUserId: string, documentId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "legal-document", documentId);
    const document = await tx.legalDocument.findUnique({ where: { id: documentId } });
    if (!document) fail(404, "LEGAL_DOCUMENT_NOT_FOUND", "Legal document was not found");
    await lockEntity(tx, "legal-document-type", document.type);
    const currentDocument = await tx.legalDocument.findUnique({ where: { id: documentId } });
    if (!currentDocument) fail(404, "LEGAL_DOCUMENT_NOT_FOUND", "Legal document was not found");
    if (currentDocument.status !== LegalDocumentStatus.DRAFT) fail(409, "LEGAL_DOCUMENT_IMMUTABLE", "Only a draft legal document can be published");
    if (!currentDocument.content) fail(409, "LEGAL_DOCUMENT_CONTENT_REQUIRED", "Legal document content is required before publication");
    const now = new Date();
    if (currentDocument.effectiveAt > now) fail(409, "LEGAL_EFFECTIVE_DATE_IN_FUTURE", "Publish the document when its effective date is reached");
    await tx.legalDocument.updateMany({ where: { type: currentDocument.type, status: LegalDocumentStatus.PUBLISHED, id: { not: currentDocument.id } }, data: { status: LegalDocumentStatus.ARCHIVED, isActive: false } });
    const published = await tx.legalDocument.update({ where: { id: currentDocument.id }, data: { status: LegalDocumentStatus.PUBLISHED, isActive: true, publishedAt: now } });
    await audit(tx, { eventType: DomainAuditEventType.LEGAL_DOCUMENT_PUBLISHED, actorUserId: adminUserId, entityType: "LegalDocument", entityId: currentDocument.id, requestId, metadata: { type: currentDocument.type, version: currentDocument.version } });
    return published;
  }, { isolationLevel: "Serializable" });
}

export async function archiveLegalDocument(adminUserId: string, documentId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "legal-document", documentId);
    const document = await tx.legalDocument.findUnique({ where: { id: documentId } });
    if (!document) fail(404, "LEGAL_DOCUMENT_NOT_FOUND", "Legal document was not found");
    if (document.status === LegalDocumentStatus.ARCHIVED) fail(409, "LEGAL_DOCUMENT_STATE_INVALID", "This legal document is already archived");
    if (document.status === LegalDocumentStatus.PUBLISHED && document.isActive) {
      const replacement = await tx.legalDocument.findFirst({
        where: { type: document.type, status: LegalDocumentStatus.PUBLISHED, isActive: true, id: { not: document.id } },
        select: { id: true },
      });
      if (!replacement) fail(409, "LEGAL_ACTIVE_VERSION_REQUIRED", "Publish a replacement version before archiving the active legal document");
    }
    const archived = await tx.legalDocument.update({ where: { id: document.id }, data: { status: LegalDocumentStatus.ARCHIVED, isActive: false } });
    await audit(tx, { eventType: DomainAuditEventType.LEGAL_DOCUMENT_ARCHIVED, actorUserId: adminUserId, entityType: "LegalDocument", entityId: document.id, requestId, metadata: { type: document.type, version: document.version, reason } });
    return archived;
  }, { isolationLevel: "Serializable" });
}

export async function listContentArticles(query: Page & { kind?: ContentArticleKind; audience?: ContentAudience; status?: ContentStatus }) {
  const where: Prisma.HelpArticleWhereInput = {
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.audience ? { audience: query.audience } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [articles, total] = await Promise.all([
    prisma.helpArticle.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], skip: (query.page - 1) * query.limit, take: query.limit, include: { category: true, createdByAdmin: { select: { id: true, fullName: true } } } }),
    prisma.helpArticle.count({ where }),
  ]);
  return { articles, pagination: pagination(query.page, query.limit, total) };
}

export async function listContentCategories() {
  return prisma.contentCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { articles: true } } } });
}

export async function createContentCategory(input: { name: string; slug: string; sortOrder: number }) {
  try {
    return await prisma.contentCategory.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(409, "CONTENT_CATEGORY_SLUG_CONFLICT", "A category already uses this slug");
    throw error;
  }
}

export async function createContentArticle(adminUserId: string, input: { categoryId?: string; kind: ContentArticleKind; title: string; slug: string; body: string; audience: ContentAudience; sortOrder: number }) {
  try {
    return await prisma.helpArticle.create({ data: { ...input, categoryId: input.categoryId ?? null, createdByAdminId: adminUserId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(409, "CONTENT_SLUG_CONFLICT", "An article already uses this slug");
    throw error;
  }
}

export async function updateContentArticle(articleId: string, input: { categoryId?: string | null; title?: string; slug?: string; body?: string; audience?: ContentAudience; sortOrder?: number }) {
  const article = await prisma.helpArticle.findUnique({ where: { id: articleId } });
  if (!article) fail(404, "CONTENT_ARTICLE_NOT_FOUND", "Content article was not found");
  if (article.status === ContentStatus.PUBLISHED) fail(409, "CONTENT_ARTICLE_IMMUTABLE", "Published articles are immutable; archive and create a replacement");
  return prisma.helpArticle.update({ where: { id: articleId }, data: input });
}

export async function publishContentArticle(adminUserId: string, articleId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.helpArticle.findUnique({ where: { id: articleId } });
    if (!article) fail(404, "CONTENT_ARTICLE_NOT_FOUND", "Content article was not found");
    if (article.status !== ContentStatus.DRAFT) fail(409, "CONTENT_ARTICLE_STATE_INVALID", "Only draft content can be published");
    const published = await tx.helpArticle.update({ where: { id: articleId }, data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.CONTENT_ARTICLE_PUBLISHED, actorUserId: adminUserId, entityType: "HelpArticle", entityId: articleId, requestId, metadata: { kind: article.kind, audience: article.audience } });
    return published;
  });
}

export async function listNotificationCampaigns(query: Page & { status?: NotificationCampaignStatus; audience?: ContentAudience }) {
  const where: Prisma.NotificationCampaignWhereInput = { ...(query.status ? { status: query.status } : {}), ...(query.audience ? { audience: query.audience } : {}) };
  const [campaigns, total] = await Promise.all([
    prisma.notificationCampaign.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { createdByAdmin: { select: { id: true, fullName: true } } } }),
    prisma.notificationCampaign.count({ where }),
  ]);
  return { campaigns, pagination: pagination(query.page, query.limit, total) };
}

export async function listNotificationHistory(query: Page & { type?: string; userId?: string; unreadOnly?: boolean }) {
  const where: Prisma.NotificationWhereInput = {
    ...(query.type ? { type: query.type as never } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.unreadOnly ? { readAt: null } : {}),
  };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { user: { select: { id: true, fullName: true, email: true } } } }),
    prisma.notification.count({ where }),
  ]);
  return { notifications, pagination: pagination(query.page, query.limit, total) };
}

export async function createNotificationCampaign(adminUserId: string, input: { title: string; message: string; audience: ContentAudience; scheduledAt?: string }, requestId?: string) {
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt) fail(409, "BROADCAST_SCHEDULING_UNAVAILABLE", "Scheduled delivery requires a durable background worker; create a draft and send it manually");
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.notificationCampaign.create({ data: { title: input.title, message: input.message, audience: input.audience, scheduledAt, status: scheduledAt ? NotificationCampaignStatus.SCHEDULED : NotificationCampaignStatus.DRAFT, createdByAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.BROADCAST_CREATED, actorUserId: adminUserId, entityType: "NotificationCampaign", entityId: campaign.id, requestId, metadata: { audience: input.audience, scheduled: Boolean(scheduledAt) } });
    return campaign;
  });
}

export async function sendNotificationCampaign(adminUserId: string, campaignId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "notification-campaign", campaignId);
    const campaign = await tx.notificationCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) fail(404, "BROADCAST_NOT_FOUND", "Notification campaign was not found");
    const sendableStatuses: NotificationCampaignStatus[] = [
      NotificationCampaignStatus.DRAFT,
      NotificationCampaignStatus.SCHEDULED,
    ];
    if (!sendableStatuses.includes(campaign.status)) fail(409, "BROADCAST_STATE_INVALID", "This campaign can no longer be sent");
    const role = campaign.audience === ContentAudience.ALL ? undefined : campaign.audience as UserRoleType;
    const recipients = await tx.user.findMany({ where: { status: UserStatus.ACTIVE, deletedAt: null, ...(role ? { roles: { some: { role } } } : {}) }, select: { id: true } });
    if (recipients.length) {
      await tx.notification.createMany({ data: recipients.map(({ id }) => ({ userId: id, type: "ADMIN_BROADCAST", title: campaign.title, message: campaign.message, entityType: "NotificationCampaign", entityId: campaign.id, idempotencyKey: `broadcast:${campaign.id}` })), skipDuplicates: true });
    }
    const sent = await tx.notificationCampaign.update({ where: { id: campaign.id }, data: { status: NotificationCampaignStatus.SENT, sentAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.BROADCAST_SENT, actorUserId: adminUserId, entityType: "NotificationCampaign", entityId: campaign.id, requestId, metadata: { audience: campaign.audience, recipientCount: recipients.length } });
    return { ...sent, recipientCount: recipients.length, delivery: "IN_APP" as const };
  }, { isolationLevel: "Serializable" });
}

export async function listPlatformFeeRules(query: Page & { scopeType?: PlatformFeeScopeType; status?: PlatformFeeRuleStatus }) {
  const where: Prisma.PlatformFeeRuleWhereInput = { ...(query.scopeType ? { scopeType: query.scopeType } : {}), ...(query.status ? { status: query.status } : {}) };
  const [rules, total] = await Promise.all([
    prisma.platformFeeRule.findMany({ where, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], skip: (query.page - 1) * query.limit, take: query.limit, include: { createdByAdmin: { select: { id: true, fullName: true } }, _count: { select: { quotes: true } } } }),
    prisma.platformFeeRule.count({ where }),
  ]);
  return serialize({ rules, resolutionPriority: ["LISTING", "PROPERTY", "PROVIDER", "GLOBAL"], pagination: pagination(query.page, query.limit, total) });
}

async function assertFeeScopeExists(scopeType: PlatformFeeScopeType, scopeId?: string | null) {
  if (scopeType === PlatformFeeScopeType.GLOBAL) return;
  if (!scopeId) fail(400, "FEE_SCOPE_REQUIRED", "A scope ID is required");
  const exists = scopeType === PlatformFeeScopeType.PROVIDER
    ? await prisma.user.findFirst({ where: { id: scopeId, deletedAt: null, roles: { some: { role: UserRoleType.PROVIDER } } }, select: { id: true } })
    : scopeType === PlatformFeeScopeType.PROPERTY
      ? await prisma.property.findFirst({ where: { id: scopeId, deletedAt: null }, select: { id: true } })
      : await prisma.parkingListing.findUnique({ where: { id: scopeId }, select: { id: true } });
  if (!exists) fail(404, "FEE_SCOPE_NOT_FOUND", "The fee rule scope was not found");
}

export async function createPlatformFeeRule(adminUserId: string, input: { scopeType: PlatformFeeScopeType; scopeId?: string | null; feeType: PlatformFeeType; percentageBps?: number | null; fixedAmountPaisa?: number | null; effectiveFrom: string; effectiveUntil?: string | null; reason: string }, requestId?: string) {
  await assertFeeScopeExists(input.scopeType, input.scopeId);
  const effectiveFrom = new Date(input.effectiveFrom);
  const effectiveUntil = input.effectiveUntil ? new Date(input.effectiveUntil) : null;
  return prisma.$transaction(async (tx) => {
    const rule = await tx.platformFeeRule.create({ data: { scopeType: input.scopeType, scopeId: input.scopeId ?? null, feeType: input.feeType, percentageBps: input.feeType === PlatformFeeType.PERCENTAGE ? input.percentageBps ?? 0 : null, fixedAmountPaisa: input.feeType === PlatformFeeType.FIXED ? BigInt(input.fixedAmountPaisa ?? 0) : null, effectiveFrom, effectiveUntil, reason: input.reason, status: PlatformFeeRuleStatus.DRAFT, createdByAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_CREATED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { scopeType: rule.scopeType, scopeId: rule.scopeId, feeType: rule.feeType, version: rule.version, reason: rule.reason } });
    return serialize(rule);
  }, { isolationLevel: "Serializable" });
}

type FeeDraftInput = { scopeType?: PlatformFeeScopeType; scopeId?: string | null; feeType?: PlatformFeeType; percentageBps?: number | null; fixedAmountPaisa?: number | null; effectiveFrom?: string; effectiveUntil?: string | null; reason?: string };

function validateFeeValues(input: { scopeType: PlatformFeeScopeType; scopeId: string | null; feeType: PlatformFeeType; percentageBps: number | null; fixedAmountPaisa: bigint | null; effectiveFrom: Date; effectiveUntil: Date | null }) {
  if ((input.scopeType === PlatformFeeScopeType.GLOBAL) !== (input.scopeId === null)) fail(400, "FEE_SCOPE_REQUIRED", "Global rules cannot have a scope ID; scoped rules require one");
  if (input.feeType === PlatformFeeType.PERCENTAGE && (input.percentageBps === null || input.percentageBps < 0 || input.percentageBps > 10_000 || input.fixedAmountPaisa !== null)) fail(400, "FEE_VALUE_INVALID", "Percentage fee rules require basis points only");
  if (input.feeType === PlatformFeeType.FIXED && (input.fixedAmountPaisa === null || input.fixedAmountPaisa < 0n || input.percentageBps !== null)) fail(400, "FEE_VALUE_INVALID", "Fixed fee rules require a fixed paisa amount only");
  if (input.effectiveUntil && input.effectiveUntil <= input.effectiveFrom) fail(400, "FEE_EFFECTIVE_RANGE_INVALID", "Fee rule end time must be after its start time");
}

export async function updatePlatformFeeDraft(adminUserId: string, ruleId: string, input: FeeDraftInput, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status !== PlatformFeeRuleStatus.DRAFT) fail(409, "FEE_RULE_IMMUTABLE", "Only draft fee rules can be edited; clone a historical rule instead");
    const scopeType = input.scopeType ?? rule.scopeType;
    const scopeId = input.scopeId !== undefined ? input.scopeId : rule.scopeId;
    const feeType = input.feeType ?? rule.feeType;
    const percentageBps = feeType === PlatformFeeType.PERCENTAGE ? input.percentageBps !== undefined ? input.percentageBps : rule.percentageBps : null;
    const fixedAmountPaisa = feeType === PlatformFeeType.FIXED ? input.fixedAmountPaisa !== undefined ? input.fixedAmountPaisa === null ? null : BigInt(input.fixedAmountPaisa) : rule.fixedAmountPaisa : null;
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : rule.effectiveFrom;
    const effectiveUntil = input.effectiveUntil !== undefined ? input.effectiveUntil ? new Date(input.effectiveUntil) : null : rule.effectiveUntil;
    validateFeeValues({ scopeType, scopeId, feeType, percentageBps, fixedAmountPaisa, effectiveFrom, effectiveUntil });
    await assertFeeScopeExists(scopeType, scopeId);
    const updated = await tx.platformFeeRule.update({ where: { id: rule.id }, data: { scopeType, scopeId, feeType, percentageBps, fixedAmountPaisa, effectiveFrom, effectiveUntil, ...(input.reason ? { reason: input.reason } : {}) } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_CHANGED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { action: "DRAFT_UPDATED", version: rule.version } });
    return serialize(updated);
  });
}

export async function clonePlatformFeeRule(adminUserId: string, ruleId: string, input: { effectiveFrom: string; effectiveUntil?: string | null; reason: string }, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const source = await tx.platformFeeRule.findUnique({ where: { id: ruleId }, include: { replacements: { select: { version: true } } } });
    if (!source) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveUntil = input.effectiveUntil ? new Date(input.effectiveUntil) : null;
    validateFeeValues({ scopeType: source.scopeType, scopeId: source.scopeId, feeType: source.feeType, percentageBps: source.percentageBps, fixedAmountPaisa: source.fixedAmountPaisa, effectiveFrom, effectiveUntil });
    const version = Math.max(source.version, ...source.replacements.map((item) => item.version)) + 1;
    const clone = await tx.platformFeeRule.create({ data: { scopeType: source.scopeType, scopeId: source.scopeId, feeType: source.feeType, percentageBps: source.percentageBps, fixedAmountPaisa: source.fixedAmountPaisa, effectiveFrom, effectiveUntil, reason: input.reason, version, supersedesRuleId: source.id, status: PlatformFeeRuleStatus.DRAFT, createdByAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_CREATED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: clone.id, requestId, metadata: { action: "CLONED", supersedesRuleId: source.id, version } });
    return serialize(clone);
  });
}

async function assertFeeActivationAvailable(tx: Prisma.TransactionClient, rule: { id: string; scopeType: PlatformFeeScopeType; scopeId: string | null; supersedesRuleId: string | null; effectiveFrom: Date; effectiveUntil: Date | null }) {
  const overlap = await tx.platformFeeRule.findFirst({ where: { id: { notIn: [rule.id, ...(rule.supersedesRuleId ? [rule.supersedesRuleId] : [])] }, scopeType: rule.scopeType, scopeId: rule.scopeId, status: { in: [PlatformFeeRuleStatus.ACTIVE, PlatformFeeRuleStatus.SCHEDULED] }, effectiveFrom: { lt: rule.effectiveUntil ?? new Date("9999-12-31T23:59:59.999Z") }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: rule.effectiveFrom } }] }, select: { id: true } });
  if (overlap) fail(409, "FEE_RULE_OVERLAP", "Another active or scheduled fee rule overlaps this scope and period");
}

export async function schedulePlatformFeeRule(adminUserId: string, ruleId: string, input: { effectiveFrom: string; reason: string }, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status !== PlatformFeeRuleStatus.DRAFT) fail(409, "FEE_RULE_STATE_INVALID", "Only a draft fee rule can be scheduled");
    const effectiveFrom = new Date(input.effectiveFrom);
    if (effectiveFrom <= new Date()) fail(400, "FEE_SCHEDULE_TIME_INVALID", "Scheduled activation must be in the future");
    const candidate = { ...rule, effectiveFrom };
    await assertFeeActivationAvailable(tx, candidate);
    const scheduled = await tx.platformFeeRule.update({ where: { id: rule.id }, data: { status: PlatformFeeRuleStatus.SCHEDULED, effectiveFrom, reason: input.reason } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_CHANGED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { action: "SCHEDULED", effectiveFrom: effectiveFrom.toISOString(), reason: input.reason } });
    return serialize(scheduled);
  }, { isolationLevel: "Serializable" });
}

export async function activatePlatformFeeRule(adminUserId: string, ruleId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status !== PlatformFeeRuleStatus.DRAFT && rule.status !== PlatformFeeRuleStatus.SCHEDULED) fail(409, "FEE_RULE_STATE_INVALID", "Only a draft or scheduled fee rule can be activated");
    if (rule.effectiveFrom > new Date()) fail(409, "FEE_RULE_NOT_EFFECTIVE", "Use schedule for a fee rule with a future effective time");
    await assertFeeActivationAvailable(tx, rule);
    if (rule.supersedesRuleId) await tx.platformFeeRule.updateMany({ where: { id: rule.supersedesRuleId, status: PlatformFeeRuleStatus.ACTIVE }, data: { status: PlatformFeeRuleStatus.INACTIVE, effectiveUntil: new Date() } });
    const active = await tx.platformFeeRule.update({ where: { id: rule.id }, data: { status: PlatformFeeRuleStatus.ACTIVE, activatedAt: new Date(), reason } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_ACTIVATED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { reason, version: rule.version } });
    return serialize(active);
  }, { isolationLevel: "Serializable" });
}

export async function deactivatePlatformFeeRule(adminUserId: string, ruleId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status !== PlatformFeeRuleStatus.ACTIVE && rule.status !== PlatformFeeRuleStatus.SCHEDULED) fail(409, "FEE_RULE_STATE_INVALID", "Only an active or scheduled fee rule can be deactivated");
    const now = new Date();
    const effectiveUntil = rule.effectiveFrom > now
      ? null
      : rule.effectiveUntil && rule.effectiveUntil < now
        ? rule.effectiveUntil
        : now;
    const updated = await tx.platformFeeRule.update({ where: { id: ruleId }, data: { status: PlatformFeeRuleStatus.INACTIVE, effectiveUntil } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_DEACTIVATED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: ruleId, requestId, metadata: { reason, version: rule.version } });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function archivePlatformFeeRule(adminUserId: string, ruleId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status === PlatformFeeRuleStatus.ACTIVE) fail(409, "FEE_RULE_STATE_INVALID", "Deactivate an active fee rule before archiving it");
    if (rule.status === PlatformFeeRuleStatus.ARCHIVED) fail(409, "FEE_RULE_STATE_INVALID", "This fee rule is already archived");
    const archived = await tx.platformFeeRule.update({ where: { id: rule.id }, data: { status: PlatformFeeRuleStatus.ARCHIVED, archivedAt: new Date(), reason } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_ARCHIVED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { reason, version: rule.version } });
    return serialize(archived);
  });
}

export async function deletePlatformFeeDraft(adminUserId: string, ruleId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "platform-fee-rule", ruleId);
    const rule = await tx.platformFeeRule.findUnique({ where: { id: ruleId }, include: { _count: { select: { quotes: true, replacements: true } } } });
    if (!rule) fail(404, "FEE_RULE_NOT_FOUND", "Platform fee rule was not found");
    if (rule.status !== PlatformFeeRuleStatus.DRAFT || rule._count.quotes > 0 || rule._count.replacements > 0) fail(409, "FEE_RULE_DELETE_FORBIDDEN", "Only a never-used draft without replacement versions can be deleted");
    await tx.platformFeeRule.delete({ where: { id: rule.id } });
    await audit(tx, { eventType: DomainAuditEventType.PLATFORM_FEE_CHANGED, actorUserId: adminUserId, entityType: "PlatformFeeRule", entityId: rule.id, requestId, metadata: { action: "DRAFT_DELETED", version: rule.version } });
    return { deleted: true };
  });
}

export async function holdPayout(adminUserId: string, payoutId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payout", payoutId);
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) fail(404, "PAYOUT_NOT_FOUND", "Payout request was not found");
    if (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.REQUESTED) fail(409, "PAYOUT_TRANSITION_INVALID", "Only a requested payout can be held");
    const updated = await tx.payoutRequest.update({ where: { id: payoutId }, data: { status: PayoutStatus.ON_HOLD, heldAt: new Date(), holdReason: reason, reviewedById: adminUserId, reviewNote: reason, reviewedAt: new Date() } });
    await tx.notification.create({ data: { userId: payout.providerUserId, type: "PAYOUT_UPDATED", title: "Payout review on hold", message: "Your payout request requires additional review.", entityType: "PayoutRequest", entityId: payout.id, idempotencyKey: `payout:${payout.id}:ON_HOLD` } });
    await audit(tx, { eventType: DomainAuditEventType.PAYOUT_HELD, actorUserId: adminUserId, entityType: "PayoutRequest", entityId: payout.id, requestId, metadata: { reason } });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function releasePayoutHold(adminUserId: string, payoutId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payout", payoutId);
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) fail(404, "PAYOUT_NOT_FOUND", "Payout request was not found");
    if (payout.status !== PayoutStatus.ON_HOLD) fail(409, "PAYOUT_TRANSITION_INVALID", "Only a held payout can be released");
    const updated = await tx.payoutRequest.update({ where: { id: payoutId }, data: { status: PayoutStatus.REQUESTED, heldAt: null, holdReason: null, reviewedById: adminUserId, reviewNote: reason, reviewedAt: new Date() } });
    await tx.notification.create({ data: { userId: payout.providerUserId, type: "PAYOUT_UPDATED", title: "Payout review resumed", message: "Your payout request was released from hold and returned to review.", entityType: "PayoutRequest", entityId: payout.id, idempotencyKey: `payout:${payout.id}:RELEASED` } });
    await audit(tx, { eventType: DomainAuditEventType.PAYOUT_RELEASED, actorUserId: adminUserId, entityType: "PayoutRequest", entityId: payout.id, requestId, metadata: { reason } });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function beginDisputeReview(adminUserId: string, disputeId: string, input: { reason: string; slaHours: number; escalate: boolean }, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "dispute", disputeId);
    const dispute = await tx.dispute.findUnique({ where: { id: disputeId }, include: { booking: { select: { propertyId: true } } } });
    if (!dispute) fail(404, "DISPUTE_NOT_FOUND", "Dispute was not found");
    if (dispute.status !== DisputeStatus.OPEN) fail(409, "DISPUTE_STATE_INVALID", "Only an open dispute can enter review");
    const now = new Date();
    const updated = await tx.dispute.update({ where: { id: disputeId }, data: { status: DisputeStatus.UNDER_REVIEW, reviewStartedAt: now, slaDueAt: new Date(now.getTime() + input.slaHours * 3_600_000), escalatedAt: input.escalate ? now : null } });
    await tx.adminNote.create({ data: { authorAdminId: adminUserId, subjectType: AdminSubjectType.DISPUTE, subjectId: dispute.id, body: input.reason } });
    await audit(tx, { eventType: DomainAuditEventType.DISPUTE_REVIEW_STARTED, actorUserId: adminUserId, propertyId: dispute.booking.propertyId, entityType: "Dispute", entityId: dispute.id, requestId, metadata: { reason: input.reason, slaHours: input.slaHours, escalated: input.escalate } });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function listListingReports(query: Page & { status?: "OPEN" | "RESOLVED" | "DISMISSED" }) {
  const where: Prisma.ListingReportWhereInput = query.status ? { status: query.status } : {};
  const [reports, total] = await Promise.all([
    prisma.listingReport.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { reporter: { select: { id: true, fullName: true } }, listing: { select: { id: true, title: true, status: true, provider: { select: { id: true, fullName: true } }, parkingSpot: { select: { property: { select: { id: true, name: true } } } } } } } }),
    prisma.listingReport.count({ where }),
  ]);
  return { reports, pagination: pagination(query.page, query.limit, total) };
}

export async function resolveListingReport(
  adminUserId: string,
  reportId: string,
  input: { decision: "RESOLVED" | "DISMISSED"; reason: string },
  requestId?: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "listing-report", reportId);
    const report = await tx.listingReport.findUnique({
      where: { id: reportId },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            parkingSpot: { select: { propertyId: true } },
          },
        },
      },
    });
    if (!report) fail(404, "LISTING_REPORT_NOT_FOUND", "Listing report was not found");
    if (report.status !== "OPEN") {
      fail(409, "LISTING_REPORT_ALREADY_REVIEWED", "Only an open listing report can be reviewed");
    }

    const updated = await tx.listingReport.update({
      where: { id: report.id },
      data: { status: input.decision, resolvedAt: new Date() },
    });
    await audit(tx, {
      eventType: input.decision === "RESOLVED"
        ? DomainAuditEventType.LISTING_REPORT_RESOLVED
        : DomainAuditEventType.LISTING_REPORT_DISMISSED,
      actorUserId: adminUserId,
      propertyId: report.listing.parkingSpot.propertyId,
      entityType: "ListingReport",
      entityId: report.id,
      requestId,
      metadata: {
        decision: input.decision,
        reason: input.reason,
        listingId: report.listing.id,
        listingStatus: report.listing.status,
      },
    });
    return updated;
  }, { isolationLevel: "Serializable" });
}
