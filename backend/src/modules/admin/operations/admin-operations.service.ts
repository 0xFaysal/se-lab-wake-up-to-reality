import {
  BookingStatus,
  ParkingListingStatus,
  ParkingRightStatus,
  PaymentStatus,
  PayoutStatus,
  PropertyStatus,
  RefundStatus,
  UserRoleType,
  VerificationStatus,
  Prisma,
} from "../../../../generated/prisma/client.js";
import { AppError } from "../../../common/errors/app-error.js";
import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { redis } from "../../../config/redis.js";

type Page = { page: number; limit: number };

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function money(value: bigint | null | undefined): number {
  return Number(value ?? 0n);
}

function notFound(resource: string): AppError {
  return new AppError({
    statusCode: 404,
    code: `ADMIN_${resource.toUpperCase()}_NOT_FOUND`,
    message: `${resource} was not found`,
  });
}

export async function getDashboardSummary() {
  const now = new Date();
  const trendFrom = new Date(now.getTime() - 30 * 86_400_000);
  const successfulPaymentStatuses = [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CAPTURED,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ];
  type TrendRow = { bucket: Date; count: number; amountPaisa?: bigint };

  const [
    totalUsers,
    drivers,
    providers,
    managers,
    guards,
    suspendedUsers,
    blockedUsers,
    totalProperties,
    pendingProperties,
    verifiedProperties,
    rejectedProperties,
    inactiveProperties,
    activeResources,
    activeListings,
    upcomingBookings,
    activeSessions,
    checkoutRequested,
    successfulPayments,
    capturedPayments,
    refunds,
    platformRevenue,
    providerLiability,
    pendingPayouts,
    completedPayouts,
    pendingRights,
    openDisputes,
    suspendedListings,
    failedPayments,
    overdueDisputes,
    payoutHolds,
    expiringRights,
    guardCoverageIssues,
    bookingTrend,
    revenueTrend,
    userGrowth,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        roles: { some: { role: UserRoleType.DRIVER } },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        roles: { some: { role: UserRoleType.PROVIDER } },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        roles: { some: { role: UserRoleType.MANAGER } },
      },
    }),
    prisma.user.count({
      where: { deletedAt: null, roles: { some: { role: UserRoleType.GUARD } } },
    }),
    prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    prisma.user.count({ where: { deletedAt: null, status: "BLOCKED" } }),
    prisma.property.count({
      where: { deletedAt: null, canonicalPropertyId: null },
    }),
    prisma.property.count({
      where: {
        deletedAt: null,
        canonicalPropertyId: null,
        verificationStatus: VerificationStatus.PENDING,
      },
    }),
    prisma.property.count({
      where: {
        deletedAt: null,
        canonicalPropertyId: null,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    }),
    prisma.property.count({
      where: {
        deletedAt: null,
        canonicalPropertyId: null,
        verificationStatus: VerificationStatus.REJECTED,
      },
    }),
    prisma.property.count({
      where: { deletedAt: null, canonicalPropertyId: null, status: "INACTIVE" },
    }),
    prisma.parkingSpot.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.parkingListing.count({
      where: { status: ParkingListingStatus.ACTIVE },
    }),
    prisma.booking.count({
      where: { status: BookingStatus.CONFIRMED, startAt: { gt: now } },
    }),
    prisma.booking.count({
      where: {
        status: {
          in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKOUT_REQUESTED],
        },
      },
    }),
    prisma.booking.count({
      where: { status: BookingStatus.CHECKOUT_REQUESTED },
    }),
    prisma.payment.count({
      where: { status: { in: successfulPaymentStatuses } },
    }),
    prisma.payment.aggregate({
      where: { status: { in: successfulPaymentStatuses } },
      _sum: { amountPaisa: true },
    }),
    prisma.refund.aggregate({
      where: { status: RefundStatus.SUCCEEDED },
      _sum: { amountPaisa: true },
    }),
    prisma.$queryRaw<Array<{ amountPaisa: bigint }>>(Prisma.sql`
      SELECT COALESCE(SUM(CASE WHEN "entry_side" = 'CREDIT' THEN "amount_paisa" ELSE -"amount_paisa" END), 0)::bigint AS "amountPaisa"
      FROM "ledger_entries"
      WHERE "account_code" = 'PLATFORM_REVENUE'
    `),
    prisma.walletAccount.aggregate({
      where: { user: { roles: { some: { role: UserRoleType.PROVIDER } } } },
      _sum: {
        availableBalancePaisa: true,
        pendingBalancePaisa: true,
        heldBalancePaisa: true,
      },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.REQUESTED] } },
      _count: true,
      _sum: { amountPaisa: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: PayoutStatus.PAID },
      _sum: { amountPaisa: true },
    }),
    prisma.parkingRight.count({
      where: { status: ParkingRightStatus.PENDING_VERIFICATION },
    }),
    prisma.dispute.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
    prisma.parkingListing.count({
      where: { status: ParkingListingStatus.SUSPENDED },
    }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.dispute.count({
      where: { status: "UNDER_REVIEW", slaDueAt: { lt: now } },
    }),
    prisma.payoutRequest.count({ where: { status: PayoutStatus.ON_HOLD } }),
    prisma.parkingRight.count({
      where: {
        status: ParkingRightStatus.VERIFIED,
        validUntil: { gt: now, lte: new Date(now.getTime() + 30 * 86_400_000) },
      },
    }),
    prisma.property.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        parkingSpots: { some: { deletedAt: null, status: "ACTIVE" } },
        guardMemberships: { none: { status: "ACTIVE" } },
      },
    }),
    prisma.$queryRaw<TrendRow[]>(
      Prisma.sql`SELECT date_trunc('day', "created_at") AS "bucket", COUNT(*)::int AS "count" FROM "bookings" WHERE "created_at" >= ${trendFrom} GROUP BY 1 ORDER BY 1`,
    ),
    prisma.$queryRaw<TrendRow[]>(
      Prisma.sql`SELECT date_trunc('day', "created_at") AS "bucket", COUNT(*)::int AS "count", COALESCE(SUM("amount_paisa"), 0)::bigint AS "amountPaisa" FROM "payments" WHERE "created_at" >= ${trendFrom} AND "status" IN ('SUCCEEDED', 'CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED') GROUP BY 1 ORDER BY 1`,
    ),
    prisma.$queryRaw<TrendRow[]>(
      Prisma.sql`SELECT date_trunc('day', "created_at") AS "bucket", COUNT(*)::int AS "count" FROM "users" WHERE "created_at" >= ${trendFrom} AND "deleted_at" IS NULL GROUP BY 1 ORDER BY 1`,
    ),
    prisma.domainAuditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        eventType: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      drivers,
      providers,
      managers,
      guards,
      suspended: suspendedUsers,
      blocked: blockedUsers,
    },
    properties: {
      total: totalProperties,
      pending: pendingProperties,
      verified: verifiedProperties,
      rejected: rejectedProperties,
      inactive: inactiveProperties,
    },
    marketplace: {
      activeResources,
      activeListings,
      upcomingBookings,
      activeSessions,
      checkoutRequested,
    },
    finance: {
      paymentVolumePaisa: money(capturedPayments._sum.amountPaisa),
      successfulPayments,
      platformRevenuePaisa: money(platformRevenue[0]?.amountPaisa),
      refundedPaisa: money(refunds._sum.amountPaisa),
      pendingProviderEarningsPaisa: money(
        providerLiability._sum.pendingBalancePaisa,
      ),
      providerLiabilityPaisa:
        money(providerLiability._sum.availableBalancePaisa) +
        money(providerLiability._sum.pendingBalancePaisa) +
        money(providerLiability._sum.heldBalancePaisa),
      pendingPayoutPaisa: money(pendingPayouts._sum.amountPaisa),
      completedPayoutPaisa: money(completedPayouts._sum.amountPaisa),
    },
    queues: {
      pendingProperties,
      pendingRights,
      openDisputes,
      pendingPayouts: pendingPayouts._count,
      suspendedListings,
    },
    alerts: {
      failedPayments,
      overdueDisputes,
      payoutHolds,
      expiringRights,
      guardCoverageIssues,
    },
    liveOperations: { upcomingBookings, activeSessions, checkoutRequested },
    trends: {
      bookings: bookingTrend,
      revenue: revenueTrend.map((row) => ({
        ...row,
        amountPaisa: money(row.amountPaisa),
      })),
      users: userGrowth,
    },
    recentActivity,
  };
}

export async function listAdminUsers(
  query: Page & {
    search?: string;
    role?: UserRoleType;
    status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";
    emailVerified?: boolean;
    phoneVerified?: boolean;
    riskFlag?: boolean;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  const flaggedUsers =
    query.riskFlag === undefined
      ? []
      : await prisma.riskFlag.findMany({
          where: { targetType: "USER", resolvedAt: null },
          select: { targetId: true },
          distinct: ["targetId"],
        });
  const flaggedUserIds = flaggedUsers.map(({ targetId }) => targetId);
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query.riskFlag === true ? { id: { in: flaggedUserIds } } : {}),
    ...(query.riskFlag === false && flaggedUserIds.length
      ? { id: { notIn: flaggedUserIds } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.role ? { roles: { some: { role: query.role } } } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.emailVerified !== undefined
      ? { emailVerifiedAt: query.emailVerified ? { not: null } : null }
      : {}),
    ...(query.phoneVerified !== undefined
      ? { phoneVerifiedAt: query.phoneVerified ? { not: null } : null }
      : {}),
    ...(query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
            ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
          },
        }
      : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        accountOrigin: true,
        roles: { select: { role: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    users: users.map((user) => ({
      ...user,
      roles: user.roles.map(({ role }) => role),
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminUser(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      accountOrigin: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      roles: { select: { role: true, createdAt: true } },
      refreshSessions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rememberDevice: true,
          userAgent: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true,
        },
      },
      providerMemberships: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          verificationStatus: true,
          joinedAt: true,
          property: { select: { id: true, name: true } },
        },
      },
      managerDelegations: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          validFrom: true,
          validUntil: true,
          property: { select: { id: true, name: true } },
        },
      },
      propertyGuardMemberships: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          joinedAt: true,
          property: { select: { id: true, name: true } },
        },
      },
      vehicles: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          registrationNumber: true,
          vehicleType: true,
          verificationStatus: true,
          isDefault: true,
        },
      },
      _count: {
        select: {
          driverBookings: true,
          providerBookings: true,
          vehicles: true,
          providerMemberships: true,
          managerDelegations: true,
          propertyGuardMemberships: true,
        },
      },
    },
  });
  if (!user) throw notFound("user");
  const [
    riskFlags,
    adminNotes,
    timeline,
    driverBookingSummary,
    providerBookingSummary,
    providerResources,
    providerRights,
    providerListings,
  ] = await Promise.all([
    prisma.riskFlag.findMany({
      where: { targetType: "USER", targetId: id },
      orderBy: { createdAt: "desc" },
      include: { createdByAdmin: { select: { id: true, fullName: true } } },
    }),
    prisma.adminNote.findMany({
      where: { subjectType: "USER", subjectId: id },
      orderBy: { createdAt: "desc" },
      include: { authorAdmin: { select: { id: true, fullName: true } } },
    }),
    prisma.domainAuditEvent.findMany({
      where: {
        OR: [{ entityType: "User", entityId: id }, { actorUserId: id }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        eventType: true,
        entityType: true,
        entityId: true,
        requestId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, fullName: true } },
      },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { driverUserId: id },
      _count: true,
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { providerUserId: id },
      _count: true,
    }),
    prisma.parkingSpot.findMany({
      where: { providerMembership: { providerUserId: id }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        displayName: true,
        spotCode: true,
        resourceType: true,
        status: true,
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.parkingRight.findMany({
      where: { holderUserId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        parkingSpotId: true,
        rightType: true,
        status: true,
        version: true,
        canList: true,
        validUntil: true,
      },
    }),
    prisma.parkingListing.findMany({
      where: { providerUserId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        parkingSpotId: true,
        createdAt: true,
      },
    }),
  ]);
  return {
    ...user,
    roles: user.roles.map(({ role, createdAt }) => ({ role, createdAt })),
    emailVerified: !!user.emailVerifiedAt,
    phoneVerified: !!user.phoneVerifiedAt,
    activeSessionCount: user.refreshSessions.filter(
      (session) => !session.revokedAt && session.expiresAt > new Date(),
    ).length,
    riskFlags,
    adminNotes,
    timeline,
    bookingSummary: {
      driver: driverBookingSummary,
      provider: providerBookingSummary,
    },
    providerOperations: {
      resources: providerResources,
      rights: providerRights,
      listings: providerListings,
    },
  };
}

export async function listAdminProperties(
  query: Page & {
    search?: string;
    verificationStatus?: VerificationStatus;
    status?: PropertyStatus;
    providerUserId?: string;
    riskFlag?: boolean;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  const flaggedProperties =
    query.riskFlag === undefined
      ? []
      : await prisma.riskFlag.findMany({
          where: { targetType: "PROPERTY", resolvedAt: null },
          select: { targetId: true },
          distinct: ["targetId"],
        });
  const flaggedPropertyIds = flaggedProperties.map(({ targetId }) => targetId);
  const where: Prisma.PropertyWhereInput = {
    deletedAt: null,
    canonicalPropertyId: null,
    ...(query.riskFlag === true ? { id: { in: flaggedPropertyIds } } : {}),
    ...(query.riskFlag === false && flaggedPropertyIds.length
      ? { id: { notIn: flaggedPropertyIds } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { publicArea: { contains: query.search, mode: "insensitive" } },
            {
              approximateAddress: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(query.verificationStatus
      ? { verificationStatus: query.verificationStatus }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.providerUserId
      ? {
          providerMemberships: {
            some: { providerUserId: query.providerUserId },
          },
        }
      : {}),
    ...(query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
            ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
          },
        }
      : {}),
  };
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        name: true,
        publicArea: true,
        approximateAddress: true,
        verificationStatus: true,
        status: true,
        canonicalPropertyId: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        _count: {
          select: {
            images: true,
            providerMemberships: true,
            parkingSpots: true,
            bookings: true,
          },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);
  return { properties, pagination: pagination(query.page, query.limit, total) };
}

const bookingSummarySelect = {
  id: true,
  bookingCode: true,
  status: true,
  startAt: true,
  scheduledEndAt: true,
  totalAmountPaisa: true,
  createdAt: true,
  checkedInAt: true,
  checkoutRequestedAt: true,
  checkedOutAt: true,
  driver: { select: { id: true, fullName: true, email: true } },
  provider: { select: { id: true, fullName: true, email: true } },
  property: { select: { id: true, name: true, publicArea: true } },
  parkingSpot: {
    select: { id: true, displayName: true, spotCode: true, resourceType: true },
  },
  payments: {
    select: { id: true, status: true },
    take: 1,
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.BookingSelect;

export async function listAdminBookings(
  query: Page & {
    search?: string;
    status?: BookingStatus;
    propertyId?: string;
    providerUserId?: string;
    driverUserId?: string;
    createdFrom?: string;
    createdTo?: string;
    paymentStatus?: PaymentStatus;
  },
) {
  const where: Prisma.BookingWhereInput = {
    ...(query.search
      ? {
          OR: [
            { bookingCode: { contains: query.search, mode: "insensitive" } },
            {
              driver: {
                fullName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              provider: {
                fullName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              property: {
                name: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.providerUserId ? { providerUserId: query.providerUserId } : {}),
    ...(query.driverUserId ? { driverUserId: query.driverUserId } : {}),
    ...(query.paymentStatus
      ? { payments: { some: { status: query.paymentStatus } } }
      : {}),
    ...(query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
            ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
          },
        }
      : {}),
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: bookingSummarySelect,
    }),
    prisma.booking.count({ where }),
  ]);
  return {
    bookings: bookings.map((booking) => ({
      ...booking,
      totalAmountPaisa: money(booking.totalAmountPaisa),
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function listAdminSessions(
  query: Page & {
    status?: BookingStatus;
    propertyId?: string;
    providerUserId?: string;
    overdue?: boolean;
  },
) {
  const now = new Date();
  const defaultStatuses: BookingStatus[] = [
    BookingStatus.CHECKED_IN,
    BookingStatus.CHECKOUT_REQUESTED,
    BookingStatus.PAYMENT_DUE,
    BookingStatus.COMPLETED,
  ];
  const activeSessionStatuses: BookingStatus[] = [
    BookingStatus.CHECKED_IN,
    BookingStatus.CHECKOUT_REQUESTED,
  ];
  const where: Prisma.BookingWhereInput = {
    status: query.status ?? { in: defaultStatuses },
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.providerUserId ? { providerUserId: query.providerUserId } : {}),
    ...(query.overdue
      ? { status: { in: activeSessionStatuses }, scheduledEndAt: { lt: now } }
      : {}),
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: bookingSummarySelect,
    }),
    prisma.booking.count({ where }),
  ]);
  return {
    bookings: bookings.map((booking) => ({
      ...booking,
      totalAmountPaisa: money(booking.totalAmountPaisa),
      overdue:
        activeSessionStatuses.includes(booking.status) &&
        booking.scheduledEndAt < now,
      overtimeMinutes:
        booking.scheduledEndAt < now
          ? Math.floor(
              (now.getTime() - booking.scheduledEndAt.getTime()) / 60_000,
            )
          : 0,
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      ...bookingSummarySelect,
      effectiveEndAt: true,
      baseAmountPaisa: true,
      platformFeePaisa: true,
      depositPaisa: true,
      confirmedAt: true,
      cancelledAt: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          pricePerHourPaisa: true,
        },
      },
      parkingRight: { select: { id: true, rightType: true, status: true } },
      payments: {
        select: {
          id: true,
          amountPaisa: true,
          currency: true,
          status: true,
          provider: true,
          capturedAt: true,
          failedAt: true,
          createdAt: true,
          refunds: {
            select: {
              id: true,
              amountPaisa: true,
              status: true,
              reason: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      dispute: {
        select: {
          id: true,
          category: true,
          status: true,
          description: true,
          resolution: true,
          createdAt: true,
          resolvedAt: true,
        },
      },
      credential: { select: { status: true, expiresAt: true, usedAt: true } },
    },
  });
  if (!booking) throw notFound("booking");
  const timeline = await prisma.domainAuditEvent.findMany({
    where: {
      OR: [
        { entityType: "Booking", entityId: booking.id },
        {
          entityType: "Payment",
          entityId: { in: booking.payments.map((payment) => payment.id) },
        },
        ...(booking.dispute
          ? [{ entityType: "Dispute", entityId: booking.dispute.id }]
          : []),
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      eventType: true,
      entityType: true,
      entityId: true,
      requestId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, fullName: true } },
    },
  });
  return {
    ...booking,
    totalAmountPaisa: money(booking.totalAmountPaisa),
    baseAmountPaisa: money(booking.baseAmountPaisa),
    platformFeePaisa: money(booking.platformFeePaisa),
    depositPaisa: money(booking.depositPaisa),
    listing: {
      ...booking.listing,
      pricePerHourPaisa: money(booking.listing.pricePerHourPaisa),
    },
    payments: booking.payments.map((payment) => ({
      ...payment,
      amountPaisa: money(payment.amountPaisa),
      refunds: payment.refunds.map((refund) => ({
        ...refund,
        amountPaisa: money(refund.amountPaisa),
      })),
    })),
    timeline,
  };
}

export async function listAdminPayments(
  query: Page & {
    search?: string;
    status?: PaymentStatus;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  const where: Prisma.PaymentWhereInput = {
    ...(query.search
      ? {
          OR: [
            { id: { equals: query.search } },
            {
              providerReference: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              booking: {
                bookingCode: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              payer: { email: { contains: query.search, mode: "insensitive" } },
            },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
            ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
          },
        }
      : {}),
  };
  const select = {
    id: true,
    amountPaisa: true,
    currency: true,
    status: true,
    provider: true,
    providerReference: true,
    capturedAt: true,
    failedAt: true,
    createdAt: true,
    booking: { select: { id: true, bookingCode: true, status: true } },
    payer: { select: { id: true, fullName: true, email: true } },
    refunds: { select: { amountPaisa: true, status: true } },
  } satisfies Prisma.PaymentSelect;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.payment.count({ where }),
  ]);
  return {
    payments: payments.map((payment) => ({
      ...payment,
      amountPaisa: money(payment.amountPaisa),
      refundedAmountPaisa: payment.refunds
        .filter((refund) => refund.status === RefundStatus.SUCCEEDED)
        .reduce((sum, refund) => sum + money(refund.amountPaisa), 0),
      refunds: undefined,
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminPayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      amountPaisa: true,
      currency: true,
      status: true,
      provider: true,
      providerReference: true,
      capturedAt: true,
      failedAt: true,
      createdAt: true,
      updatedAt: true,
      payer: { select: { id: true, fullName: true, email: true } },
      booking: {
        select: {
          id: true,
          bookingCode: true,
          status: true,
          property: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true } },
        },
      },
      refunds: {
        select: {
          id: true,
          amountPaisa: true,
          reason: true,
          status: true,
          processedAt: true,
          createdAt: true,
          requestedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!payment) throw notFound("payment");
  return {
    ...payment,
    amountPaisa: money(payment.amountPaisa),
    refunds: payment.refunds.map((refund) => ({
      ...refund,
      amountPaisa: money(refund.amountPaisa),
    })),
  };
}

export async function listAdminRefunds(
  query: Page & { status?: RefundStatus },
) {
  const where = query.status ? { status: query.status } : {};
  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        amountPaisa: true,
        reason: true,
        status: true,
        processedAt: true,
        createdAt: true,
        requestedBy: { select: { id: true, fullName: true } },
        payment: {
          select: {
            id: true,
            amountPaisa: true,
            status: true,
            booking: {
              select: {
                id: true,
                bookingCode: true,
                driver: { select: { id: true, fullName: true } },
                provider: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.refund.count({ where }),
  ]);
  return {
    refunds: refunds.map((refund) => ({
      ...refund,
      amountPaisa: money(refund.amountPaisa),
      payment: {
        ...refund.payment,
        amountPaisa: money(refund.payment.amountPaisa),
      },
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function listAdminLedger(
  query: Page & { search?: string; referenceType?: string },
) {
  const where: Prisma.LedgerTransactionWhereInput = {
    ...(query.referenceType ? { referenceType: query.referenceType } : {}),
    ...(query.search
      ? {
          OR: [
            { description: { contains: query.search, mode: "insensitive" } },
            { referenceType: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [transactions, total] = await Promise.all([
    prisma.ledgerTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        referenceType: true,
        referenceId: true,
        description: true,
        createdAt: true,
        actor: { select: { id: true, fullName: true } },
        entries: { select: { entrySide: true, amountPaisa: true } },
      },
    }),
    prisma.ledgerTransaction.count({ where }),
  ]);
  return {
    transactions: transactions.map((transaction) => {
      const debitPaisa = transaction.entries
        .filter((entry) => entry.entrySide === "DEBIT")
        .reduce((sum, entry) => sum + money(entry.amountPaisa), 0);
      const creditPaisa = transaction.entries
        .filter((entry) => entry.entrySide === "CREDIT")
        .reduce((sum, entry) => sum + money(entry.amountPaisa), 0);
      return {
        ...transaction,
        entries: undefined,
        debitPaisa,
        creditPaisa,
        balanced: debitPaisa === creditPaisa,
      };
    }),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getAdminLedgerTransaction(id: string) {
  const transaction = await prisma.ledgerTransaction.findUnique({
    where: { id },
    select: {
      id: true,
      referenceType: true,
      referenceId: true,
      description: true,
      createdAt: true,
      actor: { select: { id: true, fullName: true, email: true } },
      entries: {
        select: {
          id: true,
          accountCode: true,
          entrySide: true,
          amountPaisa: true,
          createdAt: true,
          walletAccount: {
            select: {
              id: true,
              currency: true,
              status: true,
              user: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });
  if (!transaction) throw notFound("ledger transaction");
  const entries = transaction.entries.map((entry) => ({
    ...entry,
    amountPaisa: money(entry.amountPaisa),
  }));
  const debitPaisa = entries
    .filter((entry) => entry.entrySide === "DEBIT")
    .reduce((sum, entry) => sum + entry.amountPaisa, 0);
  const creditPaisa = entries
    .filter((entry) => entry.entrySide === "CREDIT")
    .reduce((sum, entry) => sum + entry.amountPaisa, 0);
  return {
    ...transaction,
    entries,
    debitPaisa,
    creditPaisa,
    balanced: debitPaisa === creditPaisa,
  };
}

export async function listAdminAuditEvents(
  query: Page & {
    actorUserId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  const where: Prisma.DomainAuditEventWhereInput = {
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.action ? { eventType: query.action as never } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
            ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
          },
        }
      : {}),
  };
  const [events, total] = await Promise.all([
    prisma.domainAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        eventType: true,
        entityType: true,
        entityId: true,
        propertyId: true,
        createdAt: true,
        actor: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.domainAuditEvent.count({ where }),
  ]);
  return { events, pagination: pagination(query.page, query.limit, total) };
}

export async function getAdminAuditEvent(id: string) {
  const event = await prisma.domainAuditEvent.findUnique({
    where: { id },
    select: {
      id: true,
      eventType: true,
      entityType: true,
      entityId: true,
      propertyId: true,
      requestId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, fullName: true, email: true } },
      property: { select: { id: true, name: true } },
    },
  });
  if (!event) throw notFound("audit event");
  return event;
}

export async function listAdminReviews(
  query: Page & { reported?: boolean; rating?: number },
) {
  const where: Prisma.ReviewWhereInput = {
    ...(query.reported !== undefined
      ? { reportedAt: query.reported ? { not: null } : null }
      : {}),
    ...(query.rating ? { rating: query.rating } : {}),
  };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        providerReply: true,
        reportedAt: true,
        createdAt: true,
        driver: { select: { id: true, fullName: true } },
        booking: {
          select: {
            id: true,
            bookingCode: true,
            property: { select: { id: true, name: true } },
            provider: { select: { id: true, fullName: true } },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews, pagination: pagination(query.page, query.limit, total) };
}

export async function getAdminSystemHealth() {
  const emailConfigured =
    env.EMAIL_PROVIDER === "resend"
      ? Boolean(env.RESEND_API_KEY && env.EMAIL_FROM_ADDRESS)
      : Boolean(env.EMAIL_HOST && env.EMAIL_USERNAME && env.EMAIL_PASSWORD);
  const checks = {
    api: { status: "operational" as const },
    postgres: { status: "unavailable" as "operational" | "unavailable" },
    redis: { status: "unavailable" as "operational" | "unavailable" },
    email: {
      status: (emailConfigured ? "configured" : "not_configured") as
        "configured" | "not_configured",
    },
    cloudinary: {
      status: (env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
        ? "configured"
        : "not_configured") as "configured" | "not_configured",
    },
    backgroundJobs: { status: "not_configured" as const },
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres.status = "operational";
  } catch {}
  try {
    if ((await redis.ping()) === "PONG") checks.redis.status = "operational";
  } catch {}
  return {
    overall:
      checks.postgres.status === "operational" &&
      checks.redis.status === "operational"
        ? "operational"
        : "degraded",
    checks,
    environment: env.NODE_ENV,
    apiVersion: "0.1.0",
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

export function getAdminCapabilities() {
  return {
    properties: true,
    parkingRights: true,
    listings: true,
    bookings: true,
    sessions: true,
    users: true,
    providers: true,
    managers: true,
    guards: true,
    payments: true,
    ledger: true,
    refunds: true,
    payouts: true,
    disputes: true,
    reviews: true,
    notifications: true,
    auditLogs: true,
    systemHealth: true,
    analytics: true,
    parkingOperations: true,
    riskFlags: true,
    adminNotes: true,
    legalVersioning: true,
    faqAndHelp: true,
    notificationCampaigns: true,
    platformFees: true,
    financialReconciliation: true,
    payoutHolds: true,
    supportTickets: false,
    realtime: true,
    realPaymentGateway: env.SSLCOMMERZ_ENABLED,
    emailCampaignWorker: false,
    advancedOvertimeBilling: false,
    adminTwoFactorAuthentication: false,
    editablePlatformSettings: false,
  };
}
