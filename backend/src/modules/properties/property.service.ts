import {
  Prisma,
  PropertyProviderStatus,
  PropertyStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import {
  encryptSensitiveText,
  SensitiveDataEncryptionError,
} from "../../common/security/encryption.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import * as governanceRepository from "../property-governance/property-governance.repository.js";
import {
  canReadProviderProperty,
  canManagePropertyCommonRules,
  governanceModeFromCount,
} from "../property-governance/property-governance.policy.js";
import { propertyErrors } from "./property.errors.js";
import {
  fingerprintPropertyAddress,
  normalizePropertyName,
} from "./property-identity.js";
import {
  toOwnerPropertyDetail,
  toOwnerPropertySummary,
  toPublicPropertySummary,
} from "./property.mapper.js";
import {
  canDeleteProperty,
  canOwnerEditProperty,
  containsCriticalPropertyChange,
  shouldResetVerification,
} from "./property.policy.js";
import * as propertyRepository from "./property.repository.js";
import { decryptPropertySensitiveData } from "./property-sensitive-data.js";
import type {
  CreatePropertyInput,
  PropertyDuplicateMatchInput,
  UpdatePropertyInput,
} from "./property.types.js";

function throwEncryptionFailure(error: unknown, propertyId?: string): never {
  if (error instanceof SensitiveDataEncryptionError) {
    logger.error(
      { ...(propertyId ? { propertyId } : {}), errorType: error.name },
      "Protected property data could not be processed",
    );
    throw propertyErrors.encryptionFailed();
  }
  throw error;
}

function timeToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function duplicateMatchInput(input: PropertyDuplicateMatchInput) {
  return {
    normalizedName: normalizePropertyName(input.name),
    publicArea: input.publicArea,
    addressFingerprint: fingerprintPropertyAddress(input.exactAddress),
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export async function findPossiblePropertyMatches(
  input: PropertyDuplicateMatchInput,
) {
  const matches = await propertyRepository.findPossiblePropertyMatches(
    duplicateMatchInput(input),
  );
  return matches.map(toPublicPropertySummary);
}

export async function createProperty(
  providerUserId: string,
  input: CreatePropertyInput,
) {
  try {
    const encryptedAddress = encryptSensitiveText(input.exactAddress);
    const encryptedAccess = input.accessInstructions
      ? encryptSensitiveText(input.accessInstructions)
      : null;
    const possibleMatches = await findPossiblePropertyMatches(input);

    const property = await prisma.$transaction(async (tx) => {
      const created = await propertyRepository.createProperty(
        {
          createdByUserId: providerUserId,
          name: input.name,
          normalizedName: normalizePropertyName(input.name),
          publicArea: input.publicArea,
          approximateAddress: input.approximateAddress,
          exactAddressCiphertext: encryptedAddress.ciphertext,
          exactAddressIv: encryptedAddress.iv,
          exactAddressTag: encryptedAddress.authTag,
          addressFingerprint: fingerprintPropertyAddress(input.exactAddress),
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
          visitorIdentificationRequired:
            input.visitorIdentificationRequired ?? false,
          ...(input.vehicleHeightLimitCm !== undefined
            ? { vehicleHeightLimitCm: input.vehicleHeightLimitCm }
            : {}),
          ...(input.entryCutoffLocalTime
            ? { entryCutoffLocalTime: timeToDate(input.entryCutoffLocalTime) }
            : {}),
          ...(input.generalParkingRules
            ? { generalParkingRules: input.generalParkingRules }
            : {}),
          ...(input.commonSafetyRules
            ? { commonSafetyRules: input.commonSafetyRules }
            : {}),
          verificationStatus: VerificationStatus.PENDING,
          status: PropertyStatus.INACTIVE,
        },
        tx,
      );

      await tx.propertyProvider.create({
        data: {
          propertyId: created.id,
          providerUserId,
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.PENDING,
        },
      });
      return created;
    });

    return {
      ...toOwnerPropertyDetail(
        property,
        {
          exactAddress: input.exactAddress,
          accessInstructions: input.accessInstructions ?? null,
        },
        "SINGLE_PROVIDER",
      ),
      possibleMatches,
    };
  } catch (error) {
    throwEncryptionFailure(error);
  }
}

export async function listProperties(providerUserId: string) {
  const properties =
    await propertyRepository.findPropertiesByProvider(providerUserId);
  if (properties.length === 0) return [];
  const counts = await prisma.propertyProvider.groupBy({
    by: ["propertyId"],
    where: {
      propertyId: { in: properties.map((property) => property.id) },
      ...governanceRepository.activeVerifiedProviderWhere,
    },
    _count: { _all: true },
  });
  const byProperty = new Map(
    counts.map((row) => [row.propertyId, row._count._all]),
  );
  return properties.map((property) =>
    toOwnerPropertySummary(
      property,
      governanceModeFromCount(byProperty.get(property.id) ?? 0),
    ),
  );
}

export async function getProperty(providerUserId: string, propertyId: string) {
  const property = await propertyRepository.findPropertyByIdForProvider(
    propertyId,
    providerUserId,
  );
  if (
    !property ||
    !(await canReadProviderProperty(providerUserId, propertyId))
  ) {
    throw propertyErrors.notFound();
  }
  const providerCount =
    await governanceRepository.getActiveVerifiedProviderCount(propertyId);
  try {
    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
      governanceModeFromCount(providerCount),
    );
  } catch (error) {
    throwEncryptionFailure(error, propertyId);
  }
}

export async function updateProperty(
  providerUserId: string,
  propertyId: string,
  input: UpdatePropertyInput,
) {
  try {
    const property = await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const existing = await propertyRepository.findPropertyByIdForProvider(
        propertyId,
        providerUserId,
        tx,
      );
      if (!existing) throw propertyErrors.notFound();
      if (!canOwnerEditProperty(existing)) throw propertyErrors.invalidState();

      const changedFields = new Set(Object.keys(input));
      changedFields.delete("version");
      const providerCount =
        await governanceRepository.getActiveVerifiedProviderCount(propertyId, tx);
      const verifiedMembership = await governanceRepository.findActiveVerifiedProviderMembership(
        providerUserId,
        propertyId,
        tx,
      );
      const isInitialCreator = Boolean(
        await governanceRepository.findInitialCreatorMembership(
          providerUserId,
          propertyId,
          tx,
        ),
      );
      if (!verifiedMembership && !isInitialCreator) throw propertyErrors.notFound();
      if (providerCount >= 2) {
        throw propertyErrors.sharedPropertyOperationForbidden();
      }
      if (
        !containsCriticalPropertyChange(changedFields) &&
        !(await canManagePropertyCommonRules(providerUserId, propertyId, tx))
      ) {
        throw propertyErrors.sharedPropertyOperationForbidden();
      }

      const updateData: Prisma.PropertyUncheckedUpdateManyInput = {
        ...(input.name !== undefined
          ? { name: input.name, normalizedName: normalizePropertyName(input.name) }
          : {}),
        ...(input.publicArea !== undefined ? { publicArea: input.publicArea } : {}),
        ...(input.approximateAddress !== undefined
          ? { approximateAddress: input.approximateAddress }
          : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        ...(input.entranceLatitude !== undefined
          ? { entranceLatitude: input.entranceLatitude }
          : {}),
        ...(input.entranceLongitude !== undefined
          ? { entranceLongitude: input.entranceLongitude }
          : {}),
        ...(input.visitorIdentificationRequired !== undefined
          ? { visitorIdentificationRequired: input.visitorIdentificationRequired }
          : {}),
        ...(input.vehicleHeightLimitCm !== undefined
          ? { vehicleHeightLimitCm: input.vehicleHeightLimitCm }
          : {}),
        ...(input.entryCutoffLocalTime !== undefined
          ? {
              entryCutoffLocalTime: input.entryCutoffLocalTime
                ? timeToDate(input.entryCutoffLocalTime)
                : null,
            }
          : {}),
        ...(input.generalParkingRules !== undefined
          ? { generalParkingRules: input.generalParkingRules }
          : {}),
        ...(input.commonSafetyRules !== undefined
          ? { commonSafetyRules: input.commonSafetyRules }
          : {}),
      };

      if (input.exactAddress !== undefined) {
        const encryptedAddress = encryptSensitiveText(input.exactAddress);
        Object.assign(updateData, {
          exactAddressCiphertext: encryptedAddress.ciphertext,
          exactAddressIv: encryptedAddress.iv,
          exactAddressTag: encryptedAddress.authTag,
          addressFingerprint: fingerprintPropertyAddress(input.exactAddress),
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
          const encryptedAccess = encryptSensitiveText(input.accessInstructions);
          Object.assign(updateData, {
            accessInstructionsCiphertext: encryptedAccess.ciphertext,
            accessInstructionsIv: encryptedAccess.iv,
            accessInstructionsTag: encryptedAccess.authTag,
          });
        }
      }
      if (shouldResetVerification(existing.verificationStatus, changedFields)) {
        Object.assign(updateData, {
          verificationStatus: VerificationStatus.PENDING,
          status: PropertyStatus.INACTIVE,
          verifiedByAdminId: null,
          verifiedAt: null,
          rejectionReason: null,
        });
      }

      const updated = await propertyRepository.updatePropertyConditionally(
        propertyId,
        input.version,
        updateData,
        tx,
      );
      if (updated.count !== 1) throw propertyErrors.staleVersion();
      const result = await propertyRepository.findPropertyByIdForProvider(
        propertyId,
        providerUserId,
        tx,
      );
      if (!result) throw propertyErrors.invalidState();
      return result;
    });

    const providerCount =
      await governanceRepository.getActiveVerifiedProviderCount(propertyId);
    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
      governanceModeFromCount(providerCount),
    );
  } catch (error) {
    throwEncryptionFailure(error, propertyId);
  }
}

export async function deleteProperty(
  providerUserId: string,
  propertyId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const existing = await propertyRepository.findPropertyByIdForProvider(
      propertyId,
      providerUserId,
      tx,
    );
    if (!existing) throw propertyErrors.notFound();
    const membership = await governanceRepository.findActiveVerifiedProviderMembership(
      providerUserId,
      propertyId,
      tx,
    );
    const initialCreator = await governanceRepository.findInitialCreatorMembership(
      providerUserId,
      propertyId,
      tx,
    );
    if (!membership && !initialCreator) throw propertyErrors.notFound();
    const blockers = await propertyRepository.findPropertyDeleteBlockers(
      propertyId,
      tx,
    );
    if (!canDeleteProperty(blockers)) throw propertyErrors.deleteBlocked();
    const deleted = await propertyRepository.softDeleteProperty(
      propertyId,
      existing.version,
      tx,
    );
    if (deleted.count !== 1) throw propertyErrors.staleVersion();
  });
}
