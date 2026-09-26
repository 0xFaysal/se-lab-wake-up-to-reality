import {
  ManagerDelegationPermission,
  ManagerDelegationStatus,
  PropertyProviderStatus,
  VerificationStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

export type MarketplaceDb = Prisma.TransactionClient;

export type ProviderAccessScope = {
  providerMembershipId: string;
  providerUserId: string;
  resourceIds: string[] | null;
};

export async function lockEntity(
  tx: MarketplaceDb,
  namespace: string,
  id: string,
) {
  await tx.$queryRaw<Array<{ lock: string }>>`
    SELECT pg_advisory_xact_lock(hashtextextended(${`${namespace}:${id}`}, 0))::text AS lock
  `;
}

import { permissionsSatisfying } from "../../common/auth/business-actor-context.js";

export async function resolveProviderAuthority(
  actorUserId: string,
  propertyId: string,
  permission?: ManagerDelegationPermission,
  parkingSpotId?: string,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  const direct = await db.propertyProvider.findFirst({
    where: {
      propertyId,
      providerUserId: actorUserId,
      status: PropertyProviderStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
      property: { deletedAt: null, canonicalPropertyId: null },
    },
  });
  if (direct) return { membership: direct, managed: false as const, delegationId: undefined };
  if (!permission) return null;

  const satisfying = permissionsSatisfying(permission);
  const now = new Date();
  const delegation = await db.providerManagerDelegation.findFirst({
    where: {
      managerUserId: actorUserId,
      propertyId,
      status: ManagerDelegationStatus.ACTIVE,
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
        ...(parkingSpotId
          ? [
              {
                OR: [
                  { resources: { none: {} } },
                  { resources: { some: { parkingSpotId } } },
                ],
              },
            ]
          : []),
      ],
      permissions: { some: { permission: { in: satisfying } } },
      grantorProviderMembership: {
        status: PropertyProviderStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    },
    include: { grantorProviderMembership: true },
  });
  return delegation
    ? {
        membership: delegation.grantorProviderMembership,
        managed: true as const,
        delegationId: delegation.id,
      }
    : null;
}

export async function listProviderAccessScopes(
  actorUserId: string,
  permission: ManagerDelegationPermission,
  db: MarketplaceDb | typeof prisma = prisma,
): Promise<ProviderAccessScope[]> {
  const now = new Date();
  const satisfying = permissionsSatisfying(permission);
  const [directMemberships, delegations] = await Promise.all([
    db.propertyProvider.findMany({
      where: {
        providerUserId: actorUserId,
        status: PropertyProviderStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        property: { deletedAt: null, canonicalPropertyId: null },
      },
      select: { id: true, providerUserId: true },
    }),
    db.providerManagerDelegation.findMany({
      where: {
        managerUserId: actorUserId,
        status: ManagerDelegationStatus.ACTIVE,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
        ],
        permissions: { some: { permission: { in: satisfying } } },
        property: { deletedAt: null, canonicalPropertyId: null },
        grantorProviderMembership: {
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      select: {
        grantorProviderMembership: {
          select: { id: true, providerUserId: true },
        },
        resources: { select: { parkingSpotId: true } },
      },
    }),
  ]);

  const scopes = new Map<string, ProviderAccessScope>();
  for (const membership of directMemberships) {
    scopes.set(membership.id, {
      providerMembershipId: membership.id,
      providerUserId: membership.providerUserId,
      resourceIds: null,
    });
  }
  for (const delegation of delegations) {
    const membership = delegation.grantorProviderMembership;
    const resourceIds = delegation.resources.map(
      (resource) => resource.parkingSpotId,
    );
    const existing = scopes.get(membership.id);
    if (existing?.resourceIds === null) continue;
    scopes.set(membership.id, {
      providerMembershipId: membership.id,
      providerUserId: membership.providerUserId,
      resourceIds:
        resourceIds.length === 0
          ? null
          : [...new Set([...(existing?.resourceIds ?? []), ...resourceIds])],
    });
  }
  return [...scopes.values()];
}

export function activeRightWhere(
  now = new Date(),
): Prisma.ParkingRightWhereInput {
  return {
    status: "VERIFIED",
    validFrom: { lte: now },
    OR: [{ validUntil: null }, { validUntil: { gt: now } }],
  };
}

export async function releaseExpiredHolds(tx: MarketplaceDb, now = new Date()) {
  const expired = await tx.reservationHold.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, allocationId: true },
  });
  if (expired.length === 0) return 0;
  await tx.reservationHold.updateMany({
    where: { id: { in: expired.map((item) => item.id) }, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });
  await tx.parkingAllocation.updateMany({
    where: {
      id: { in: expired.map((item) => item.allocationId) },
      status: "HELD",
    },
    data: { status: "RELEASED" },
  });
  return expired.length;
}

export async function isGuardAuthorizedForBooking(
  guardUserId: string,
  bookingId: string,
  db: MarketplaceDb | typeof prisma = prisma,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { propertyId: true, providerUserId: true },
  });
  if (!booking) return false;
  const membership = await db.propertyGuardMembership.findFirst({
    where: {
      propertyId: booking.propertyId,
      guardUserId,
      status: "ACTIVE",
      assignments: {
        some: {
          status: "ACTIVE",
          providerMembership: { providerUserId: booking.providerUserId },
        },
      },
    },
    select: { id: true },
  });
  return membership !== null;
}
