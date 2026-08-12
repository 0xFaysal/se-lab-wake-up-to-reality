import {
  Prisma,
  PropertyStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import {
  encryptSensitiveText,
  SensitiveDataEncryptionError,
} from "../../common/security/encryption.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { propertyErrors } from "./property.errors.js";
import {
  toOwnerPropertyDetail,
  toOwnerPropertySummary,
} from "./property.mapper.js";
import {
  canDeleteProperty,
  canOwnerEditProperty,
  shouldResetVerification,
} from "./property.policy.js";
import * as propertyRepository from "./property.repository.js";
import { decryptPropertySensitiveData } from "./property-sensitive-data.js";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "./property.types.js";

function throwEncryptionFailure(error: unknown, propertyId?: string): never {
  if (error instanceof SensitiveDataEncryptionError) {
    logger.error(
      {
        ...(propertyId ? { propertyId } : {}),
        errorType: error.name,
      },
      "Protected property data could not be processed",
    );
    throw propertyErrors.encryptionFailed();
  }
  throw error;
}

export async function createProperty(
  ownerUserId: string,
  input: CreatePropertyInput,
) {
  try {
    const encryptedAddress = encryptSensitiveText(input.exactAddress);
    const encryptedAccess = input.accessInstructions
      ? encryptSensitiveText(input.accessInstructions)
      : null;

    const property = await propertyRepository.createProperty({
      ownerUserId,
      name: input.name,
      publicArea: input.publicArea,
      approximateAddress: input.approximateAddress,
      exactAddressCiphertext: encryptedAddress.ciphertext,
      exactAddressIv: encryptedAddress.iv,
      exactAddressTag: encryptedAddress.authTag,
      latitude: input.latitude,
      longitude: input.longitude,
      ...(input.entranceLatitude !== undefined
        ? { entranceLatitude: input.entranceLatitude }
        : {}),
      ...(input.entranceLongitude !== undefined
        ? { entranceLongitude: input.entranceLongitude }
        : {}),
      ...(encryptedAccess
        ? {
            accessInstructionsCiphertext: encryptedAccess.ciphertext,
            accessInstructionsIv: encryptedAccess.iv,
            accessInstructionsTag: encryptedAccess.authTag,
          }
        : {}),
      verificationStatus: VerificationStatus.PENDING,
      status: PropertyStatus.INACTIVE,
    });

    return toOwnerPropertyDetail(property, {
      exactAddress: input.exactAddress,
      accessInstructions: input.accessInstructions ?? null,
    });
  } catch (error) {
    throwEncryptionFailure(error);
  }
}

export async function listProperties(ownerUserId: string) {
  const properties =
    await propertyRepository.findPropertiesByOwner(ownerUserId);
  return properties.map(toOwnerPropertySummary);
}

export async function getProperty(ownerUserId: string, propertyId: string) {
  const property = await propertyRepository.findPropertyByIdForOwner(
    propertyId,
    ownerUserId,
  );
  if (!property) throw propertyErrors.notFound();

  try {
    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
    );
  } catch (error) {
    throwEncryptionFailure(error, propertyId);
  }
}

export async function updateProperty(
  ownerUserId: string,
  propertyId: string,
  input: UpdatePropertyInput,
) {
  try {
    const property = await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);

      const existing = await propertyRepository.findPropertyByIdForOwner(
        propertyId,
        ownerUserId,
        tx,
      );
      if (!existing) throw propertyErrors.notFound();
      if (!canOwnerEditProperty(existing)) throw propertyErrors.invalidState();

      const updateData: Prisma.PropertyUncheckedUpdateManyInput = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.publicArea !== undefined
          ? { publicArea: input.publicArea }
          : {}),
        ...(input.approximateAddress !== undefined
          ? { approximateAddress: input.approximateAddress }
          : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined
          ? { longitude: input.longitude }
          : {}),
        ...(input.entranceLatitude !== undefined
          ? { entranceLatitude: input.entranceLatitude }
          : {}),
        ...(input.entranceLongitude !== undefined
          ? { entranceLongitude: input.entranceLongitude }
          : {}),
      };

      if (input.exactAddress !== undefined) {
        const encryptedAddress = encryptSensitiveText(input.exactAddress);
        Object.assign(updateData, {
          exactAddressCiphertext: encryptedAddress.ciphertext,
          exactAddressIv: encryptedAddress.iv,
          exactAddressTag: encryptedAddress.authTag,
        });
      }

      if (input.accessInstructions !== undefined) {
        if (input.accessInstructions === null) {
          Object.assign(updateData, {
            accessInstructionsCiphertext: null,
            accessInstructionsIv: null,
            accessInstructionsTag: null,
          });
        } else {
          const encryptedAccess = encryptSensitiveText(
            input.accessInstructions,
          );
          Object.assign(updateData, {
            accessInstructionsCiphertext: encryptedAccess.ciphertext,
            accessInstructionsIv: encryptedAccess.iv,
            accessInstructionsTag: encryptedAccess.authTag,
          });
        }
      }

      const changedFields = new Set(Object.keys(input));
      if (shouldResetVerification(existing.verificationStatus, changedFields)) {
        Object.assign(updateData, {
          verificationStatus: VerificationStatus.PENDING,
          status: PropertyStatus.INACTIVE,
          verifiedByAdminId: null,
          verifiedAt: null,
          rejectionReason: null,
        });
      }

      const updated = await propertyRepository.updatePropertyByIdForOwner(
        propertyId,
        ownerUserId,
        updateData,
        tx,
      );
      if (updated.count !== 1) throw propertyErrors.invalidState();

      const result = await propertyRepository.findPropertyByIdForOwner(
        propertyId,
        ownerUserId,
        tx,
      );
      if (!result) throw propertyErrors.invalidState();
      return result;
    });

    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
    );
  } catch (error) {
    throwEncryptionFailure(error, propertyId);
  }
}

export async function deleteProperty(
  ownerUserId: string,
  propertyId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);

    const existing = await propertyRepository.findPropertyByIdForOwner(
      propertyId,
      ownerUserId,
      tx,
    );
    if (!existing) throw propertyErrors.notFound();

    const blockers = await propertyRepository.findPropertyDeleteBlockers(
      propertyId,
      tx,
    );
    // TODO(bookings): Include active and future bookings in this policy check.
    if (!canDeleteProperty(blockers)) throw propertyErrors.deleteBlocked();

    const deleted = await propertyRepository.softDeleteProperty(
      propertyId,
      ownerUserId,
      tx,
    );
    if (deleted.count !== 1) throw propertyErrors.invalidState();
  });
}
