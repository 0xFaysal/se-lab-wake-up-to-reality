import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type VehicleClient = Pick<Prisma.TransactionClient, "vehicle">;

export function createVehicle(
  data: Prisma.VehicleUncheckedCreateInput,
  db: VehicleClient = prisma,
) {
  return db.vehicle.create({ data });
}

export function findVehicleByIdForOwner(
  vehicleId: string,
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      id: vehicleId,
      ownerUserId,
      deletedAt: null,
    },
  });
}

export function findVehiclesForOwner(
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.findMany({
    where: { ownerUserId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function findByNormalizedRegistration(
  normalizedRegistrationNumber: string,
  excludeVehicleId?: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      normalizedRegistrationNumber,
      ...(excludeVehicleId ? { id: { not: excludeVehicleId } } : {}),
    },
    select: { id: true },
  });
}

export function updateVehicle(
  vehicleId: string,
  ownerUserId: string,
  data: Prisma.VehicleUpdateManyMutationInput,
  db: VehicleClient = prisma,
) {
  return db.vehicle.updateMany({
    where: { id: vehicleId, ownerUserId, deletedAt: null },
    data,
  });
}

export function softDeleteVehicle(
  vehicleId: string,
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return updateVehicle(
    vehicleId,
    ownerUserId,
    { deletedAt: new Date(), isDefault: false },
    db,
  );
}

export function unsetDefaultVehicles(
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.updateMany({
    where: { ownerUserId, deletedAt: null, isDefault: true },
    data: { isDefault: false },
  });
}

export function setDefaultVehicle(
  vehicleId: string,
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return updateVehicle(vehicleId, ownerUserId, { isDefault: true }, db);
}

export function countActiveVehicles(
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.count({ where: { ownerUserId, deletedAt: null } });
}

export function findNewestActiveVehicle(
  ownerUserId: string,
  db: VehicleClient = prisma,
) {
  return db.vehicle.findFirst({
    where: { ownerUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}
