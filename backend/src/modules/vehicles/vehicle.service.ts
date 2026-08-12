import { Prisma } from "../../../generated/prisma/client.js";
import {
  formatRegistrationNumberForDisplay,
  normalizeRegistrationNumber,
} from "../../common/vehicles/registration-number.js";
import { prisma } from "../../config/prisma.js";
import { vehicleErrors } from "./vehicle.errors.js";
import { toVehicleResponse } from "./vehicle.mapper.js";
import * as vehicleRepository from "./vehicle.repository.js";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "./vehicle.types.js";

async function lockOwnerVehicles(
  ownerUserId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$queryRaw<Array<{ lockResult: string }>>`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${ownerUserId}, 0)
    )::text AS "lockResult"
  `;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function canDeleteVehicle(
  _vehicleId: string,
  _tx: Prisma.TransactionClient,
): Promise<boolean> {
  // TODO(day-booking): Block deletion for active or future bookings.
  return true;
}

export async function createVehicle(
  ownerUserId: string,
  input: CreateVehicleInput,
) {
  const registrationNumber = formatRegistrationNumberForDisplay(
    input.registrationNumber,
  );
  const normalizedRegistrationNumber =
    normalizeRegistrationNumber(registrationNumber);

  try {
    const vehicle = await prisma.$transaction(async (tx) => {
      await lockOwnerVehicles(ownerUserId, tx);

      const duplicate = await vehicleRepository.findByNormalizedRegistration(
        normalizedRegistrationNumber,
        undefined,
        tx,
      );
      if (duplicate) throw vehicleErrors.registrationConflict();

      const activeVehicleCount = await vehicleRepository.countActiveVehicles(
        ownerUserId,
        tx,
      );
      const isDefault = activeVehicleCount === 0 || input.isDefault;

      if (isDefault) {
        await vehicleRepository.unsetDefaultVehicles(ownerUserId, tx);
      }

      return vehicleRepository.createVehicle(
        {
          ownerUserId,
          vehicleType: input.vehicleType,
          registrationNumber,
          normalizedRegistrationNumber,
          brand: input.brand,
          model: input.model,
          color: input.color,
          ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
          ...(input.widthCm !== undefined ? { widthCm: input.widthCm } : {}),
          ...(input.lengthCm !== undefined ? { lengthCm: input.lengthCm } : {}),
          isDefault,
        },
        tx,
      );
    });

    return toVehicleResponse(vehicle);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw vehicleErrors.registrationConflict();
    }
    throw error;
  }
}

export async function listVehicles(ownerUserId: string) {
  const vehicles = await vehicleRepository.findVehiclesForOwner(ownerUserId);
  return vehicles.map(toVehicleResponse);
}

export async function getVehicle(ownerUserId: string, vehicleId: string) {
  const vehicle = await vehicleRepository.findVehicleByIdForOwner(
    vehicleId,
    ownerUserId,
  );
  if (!vehicle) throw vehicleErrors.notFound();
  return toVehicleResponse(vehicle);
}

export async function updateVehicle(
  ownerUserId: string,
  vehicleId: string,
  input: UpdateVehicleInput,
) {
  try {
    const vehicle = await prisma.$transaction(async (tx) => {
      await lockOwnerVehicles(ownerUserId, tx);

      const existing = await vehicleRepository.findVehicleByIdForOwner(
        vehicleId,
        ownerUserId,
        tx,
      );
      if (!existing) throw vehicleErrors.notFound();

      let registrationFields: Prisma.VehicleUpdateManyMutationInput = {};
      if (input.registrationNumber !== undefined) {
        const registrationNumber = formatRegistrationNumberForDisplay(
          input.registrationNumber,
        );
        const normalizedRegistrationNumber =
          normalizeRegistrationNumber(registrationNumber);
        const duplicate = await vehicleRepository.findByNormalizedRegistration(
          normalizedRegistrationNumber,
          vehicleId,
          tx,
        );
        if (duplicate) throw vehicleErrors.registrationConflict();
        registrationFields = {
          registrationNumber,
          normalizedRegistrationNumber,
        };
      }

      const updated = await vehicleRepository.updateVehicle(
        vehicleId,
        ownerUserId,
        {
          ...registrationFields,
          ...(input.vehicleType !== undefined
            ? { vehicleType: input.vehicleType }
            : {}),
          ...(input.brand !== undefined ? { brand: input.brand } : {}),
          ...(input.model !== undefined ? { model: input.model } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
          ...(input.widthCm !== undefined ? { widthCm: input.widthCm } : {}),
          ...(input.lengthCm !== undefined ? { lengthCm: input.lengthCm } : {}),
        },
        tx,
      );
      if (updated.count !== 1) throw vehicleErrors.invalidState();

      const result = await vehicleRepository.findVehicleByIdForOwner(
        vehicleId,
        ownerUserId,
        tx,
      );
      if (!result) throw vehicleErrors.invalidState();
      return result;
    });

    return toVehicleResponse(vehicle);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw vehicleErrors.registrationConflict();
    }
    throw error;
  }
}

export async function setDefaultVehicle(
  ownerUserId: string,
  vehicleId: string,
) {
  const vehicle = await prisma.$transaction(async (tx) => {
    await lockOwnerVehicles(ownerUserId, tx);

    const existing = await vehicleRepository.findVehicleByIdForOwner(
      vehicleId,
      ownerUserId,
      tx,
    );
    if (!existing) throw vehicleErrors.notFound();
    if (existing.isDefault) return existing;

    await vehicleRepository.unsetDefaultVehicles(ownerUserId, tx);
    const updated = await vehicleRepository.setDefaultVehicle(
      vehicleId,
      ownerUserId,
      tx,
    );
    if (updated.count !== 1) throw vehicleErrors.invalidState();

    const result = await vehicleRepository.findVehicleByIdForOwner(
      vehicleId,
      ownerUserId,
      tx,
    );
    if (!result) throw vehicleErrors.invalidState();
    return result;
  });

  return toVehicleResponse(vehicle);
}

export async function deleteVehicle(
  ownerUserId: string,
  vehicleId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockOwnerVehicles(ownerUserId, tx);

    const existing = await vehicleRepository.findVehicleByIdForOwner(
      vehicleId,
      ownerUserId,
      tx,
    );
    if (!existing) throw vehicleErrors.notFound();

    if (!(await canDeleteVehicle(vehicleId, tx))) {
      throw vehicleErrors.deleteBlocked();
    }

    const deleted = await vehicleRepository.softDeleteVehicle(
      vehicleId,
      ownerUserId,
      tx,
    );
    if (deleted.count !== 1) throw vehicleErrors.invalidState();

    if (existing.isDefault) {
      const replacement = await vehicleRepository.findNewestActiveVehicle(
        ownerUserId,
        tx,
      );
      if (replacement) {
        const updated = await vehicleRepository.setDefaultVehicle(
          replacement.id,
          ownerUserId,
          tx,
        );
        if (updated.count !== 1) throw vehicleErrors.invalidState();
      }
    }
  });
}
