import {
  GuardAssignmentStatus,
  Prisma,
  PropertyProviderStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import {
  propertyDistanceMeters,
  propertySearchBounds,
  PROPERTY_MATCH_RADIUS_METERS,
} from "./property-proximity.js";

type PropertyClient = Pick<
  Prisma.TransactionClient,
  | "property"
  | "propertyImage"
  | "parkingSpot"
  | "propertyGuardMembership"
  | "providerGuardAssignment"
  | "propertyProvider"
>;

export const providerPropertySummarySelect = {
  id: true,
  name: true,
  publicArea: true,
  approximateAddress: true,
  latitude: true,
  longitude: true,
  verificationStatus: true,
  status: true,
  rejectionReason: true,
  version: true,
  archivedAt: true,
  canonicalPropertyId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertySelect;

export const ownerPropertySummarySelect = providerPropertySummarySelect;

export type ProviderPropertySummaryRecord = Prisma.PropertyGetPayload<{
  select: typeof providerPropertySummarySelect;
}>;
export type OwnerPropertySummaryRecord = ProviderPropertySummaryRecord;

export async function lockPropertyForMutation(
  propertyId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$queryRaw<Array<{ lockResult: string }>>`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${`property:${propertyId}`}, 0)
    )::text AS "lockResult"
  `;
}

export function createProperty(
  data: Prisma.PropertyUncheckedCreateInput,
  db: PropertyClient = prisma,
) {
  return db.property.create({ data });
}

export function findPropertiesByProvider(
  providerUserId: string,
  db: PropertyClient = prisma,
) {
  return db.property.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      providerMemberships: {
        some: {
          providerUserId,
          status: { not: PropertyProviderStatus.ENDED },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: providerPropertySummarySelect,
  });
}

export const findPropertiesByOwner = findPropertiesByProvider;

export function findPropertyByIdForProvider(
  propertyId: string,
  providerUserId: string,
  db: PropertyClient = prisma,
) {
  return db.property.findFirst({
    where: {
      id: propertyId,
      deletedAt: null,
      archivedAt: null,
      providerMemberships: {
        some: {
          providerUserId,
          status: { not: PropertyProviderStatus.ENDED },
        },
      },
    },
  });
}

export const findPropertyByIdForOwner = findPropertyByIdForProvider;

export function findPropertyById(
  propertyId: string,
  db: PropertyClient = prisma,
) {
  return db.property.findFirst({
    where: { id: propertyId, deletedAt: null, archivedAt: null },
  });
}

export function updatePropertyConditionally(
  propertyId: string,
  expectedVersion: number,
  data: Prisma.PropertyUncheckedUpdateManyInput,
  db: PropertyClient = prisma,
) {
  return db.property.updateMany({
    where: {
      id: propertyId,
      version: expectedVersion,
      deletedAt: null,
      archivedAt: null,
    },
    data: { ...data, version: { increment: 1 } },
  });
}

export function updatePropertyByIdForOwner(
  propertyId: string,
  _providerUserId: string,
  data: Prisma.PropertyUncheckedUpdateManyInput,
  db: PropertyClient = prisma,
) {
  return db.property.updateMany({
    where: { id: propertyId, deletedAt: null, archivedAt: null },
    data,
  });
}

export function softDeleteProperty(
  propertyId: string,
  expectedVersion: number,
  db: PropertyClient = prisma,
) {
  return updatePropertyConditionally(
    propertyId,
    expectedVersion,
    { deletedAt: new Date() },
    db,
  );
}

export async function findPossiblePropertyMatches(
  input: {
    latitude: number;
    longitude: number;
  },
  db: PropertyClient = prisma,
) {
  const { latitudeDelta, longitudeDelta } = propertySearchBounds(
    input.latitude,
  );
  const candidates = await db.property.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      latitude: {
        gte: input.latitude - latitudeDelta,
        lte: input.latitude + latitudeDelta,
      },
      OR:
        input.longitude - longitudeDelta < -180
          ? [
              { longitude: { gte: input.longitude - longitudeDelta + 360 } },
              { longitude: { lte: input.longitude + longitudeDelta } },
            ]
          : input.longitude + longitudeDelta > 180
            ? [
                { longitude: { gte: input.longitude - longitudeDelta } },
                { longitude: { lte: input.longitude + longitudeDelta - 360 } },
              ]
            : [
                {
                  longitude: {
                    gte: input.longitude - longitudeDelta,
                    lte: input.longitude + longitudeDelta,
                  },
                },
              ],
    },
    select: {
      id: true,
      name: true,
      publicArea: true,
      approximateAddress: true,
      latitude: true,
      longitude: true,
    },
  });
  return candidates
    .map((property) => ({
      ...property,
      distanceMeters: propertyDistanceMeters(input, {
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
      }),
    }))
    .filter(
      (property) => property.distanceMeters <= PROPERTY_MATCH_RADIUS_METERS,
    )
    .sort(
      (a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id),
    )
    .slice(0, 10);
}

export async function findPropertyDeleteBlockers(
  propertyId: string,
  db: PropertyClient = prisma,
) {
  const [
    existingPropertyImageCount,
    existingParkingSpotCount,
    blockingGuardAssignmentCount,
    providerCount,
  ] = await Promise.all([
    db.propertyImage.count({ where: { propertyId } }),
    db.parkingSpot.count({ where: { propertyId, deletedAt: null } }),
    db.providerGuardAssignment.count({
      where: {
        propertyGuardMembership: { propertyId },
        status: {
          in: [
            GuardAssignmentStatus.PENDING_ACCEPTANCE,
            GuardAssignmentStatus.ACTIVE,
            GuardAssignmentStatus.SUSPENDED,
          ],
        },
      },
    }),
    db.propertyProvider.count({
      where: { propertyId, status: { not: PropertyProviderStatus.ENDED } },
    }),
  ]);

  return {
    existingPropertyImageCount,
    existingParkingSpotCount,
    blockingGuardAssignmentCount,
    providerCount,
  };
}
