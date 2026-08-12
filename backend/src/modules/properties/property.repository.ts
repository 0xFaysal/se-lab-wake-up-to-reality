import {
  GuardAssignmentStatus,
  Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type PropertyClient = Pick<
  Prisma.TransactionClient,
  "property" | "propertyImage" | "parkingSpot" | "propertyGuardAssignment"
>;

export const ownerPropertySummarySelect = {
  id: true,
  name: true,
  publicArea: true,
  approximateAddress: true,
  latitude: true,
  longitude: true,
  verificationStatus: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertySelect;

export type OwnerPropertySummaryRecord = Prisma.PropertyGetPayload<{
  select: typeof ownerPropertySummarySelect;
}>;

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

export function findPropertiesByOwner(
  ownerUserId: string,
  db: PropertyClient = prisma,
) {
  return db.property.findMany({
    where: { ownerUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: ownerPropertySummarySelect,
  });
}

export function findPropertyByIdForOwner(
  propertyId: string,
  ownerUserId: string,
  db: PropertyClient = prisma,
) {
  return db.property.findFirst({
    where: { id: propertyId, ownerUserId, deletedAt: null },
  });
}

export function updatePropertyByIdForOwner(
  propertyId: string,
  ownerUserId: string,
  data: Prisma.PropertyUncheckedUpdateManyInput,
  db: PropertyClient = prisma,
) {
  return db.property.updateMany({
    where: { id: propertyId, ownerUserId, deletedAt: null },
    data,
  });
}

export function softDeleteProperty(
  propertyId: string,
  ownerUserId: string,
  db: PropertyClient = prisma,
) {
  return updatePropertyByIdForOwner(
    propertyId,
    ownerUserId,
    { deletedAt: new Date() },
    db,
  );
}

export async function findPropertyDeleteBlockers(
  propertyId: string,
  db: PropertyClient = prisma,
) {
  const [
    existingPropertyImageCount,
    existingParkingSpotCount,
    blockingGuardAssignmentCount,
  ] = await Promise.all([
    db.propertyImage.count({ where: { propertyId } }),
    db.parkingSpot.count({ where: { propertyId, deletedAt: null } }),
    db.propertyGuardAssignment.count({
      where: {
        propertyId,
        status: {
          in: [
            GuardAssignmentStatus.PENDING_ACCEPTANCE,
            GuardAssignmentStatus.ACTIVE,
            GuardAssignmentStatus.SUSPENDED,
          ],
        },
      },
    }),
  ]);

  return {
    existingPropertyImageCount,
    existingParkingSpotCount,
    blockingGuardAssignmentCount,
  };
}
