import {
  BuildingManagerAssignmentStatus,
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
import type { PropertyGovernanceMode } from "../property-governance/property-governance.policy.js";
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
import type { ProviderPropertyRelationshipContext } from "./property.mapper.js";
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

async function loadProviderPropertyRelationshipContexts(
  providerUserId: string,
  propertyIds: string[],
): Promise<
  Map<
    string,
    {
      governanceMode: PropertyGovernanceMode;
      relationship: ProviderPropertyRelationshipContext;
    }
  >
> {
  if (propertyIds.length === 0) {
    return new Map<
      string,
      {
        governanceMode: PropertyGovernanceMode;
        relationship: ProviderPropertyRelationshipContext;
      }
    >();
  }

  const [counts, memberships, managerAssignments] = await Promise.all([
    prisma.propertyProvider.groupBy({
      by: ["propertyId"],
      where: {
        propertyId: { in: propertyIds },
        ...governanceRepository.activeVerifiedProviderWhere,
      },
      _count: { _all: true },
    }),
    prisma.propertyProvider.findMany({
      where: {
        propertyId: { in: propertyIds },
        providerUserId,
        status: { not: PropertyProviderStatus.ENDED },
      },
    }),
    prisma.propertyBuildingManagerAssignment.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: {
          in: [
            BuildingManagerAssignmentStatus.ACTIVE,
            BuildingManagerAssignmentStatus.PENDING_APPROVAL,
            BuildingManagerAssignmentStatus.PENDING_RECONFIRMATION,
          ],
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        propertyId: true,
        status: true,
        candidate: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  const countByProperty = new Map(
    counts.map((row) => [row.propertyId, row._count._all]),
  );
  const membershipByProperty = new Map(
    memberships.map((membership) => [membership.propertyId, membership]),
  );
  const managerByProperty = new Map<
    string,
    (typeof managerAssignments)[number]
  >();
  for (const assignment of managerAssignments) {
    if (!managerByProperty.has(assignment.propertyId)) {
      managerByProperty.set(assignment.propertyId, assignment);
    }
  }

  return new Map(
    propertyIds.map((propertyId) => {
      const providerCount = countByProperty.get(propertyId) ?? 0;
      const membership = membershipByProperty.get(propertyId) ?? null;
      return [
        propertyId,
        {
          governanceMode: governanceModeFromCount(providerCount),
          relationship: {
            providerMembership: membership
              ? {
                  id: membership.id,
                  status: membership.status,
                  verificationStatus: membership.verificationStatus,
                  joinedAt: membership.joinedAt,
                  verifiedAt: membership.verifiedAt,
                }
              : null,
            isSoleController:
              providerCount === 1 &&
              membership?.status === PropertyProviderStatus.ACTIVE &&
              membership.verificationStatus === VerificationStatus.VERIFIED,
            buildingManager: managerByProperty.get(propertyId) ?? null,
          },
        },
      ] as const;
    }),
  );
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

    const { property, membership } = await prisma.$transaction(async (tx) => {
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

      const createdMembership = await tx.propertyProvider.create({
        data: {
          propertyId: created.id,
          providerUserId,
          status: PropertyProviderStatus.ACTIVE,
          verificationStatus: VerificationStatus.PENDING,
        },
      });
      return { property: created, membership: createdMembership };
    });

    return {
      ...toOwnerPropertyDetail(
        property,
        {
          exactAddress: input.exactAddress,
          accessInstructions: input.accessInstructions ?? null,
        },
        "SINGLE_PROVIDER",
        {
          providerMembership: {
            id: membership.id,
            status: membership.status,
            verificationStatus: membership.verificationStatus,
            joinedAt: membership.joinedAt,
            verifiedAt: membership.verifiedAt,
          },
          isSoleController: false,
          buildingManager: null,
        },
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
  const contexts = await loadProviderPropertyRelationshipContexts(
    providerUserId,
    properties.map((property) => property.id),
  );
  return properties.map((property) => {
    const context = contexts.get(property.id);
    return toOwnerPropertySummary(
      property,
      context?.governanceMode,
      context?.relationship,
    );
  });
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
  const contexts = await loadProviderPropertyRelationshipContexts(
    providerUserId,
    [propertyId],
  );
  const context = contexts.get(propertyId);
  try {
    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
      context?.governanceMode,
      context?.relationship,
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
      const [verifiedMembership, provisionalMembership] = await Promise.all([
        governanceRepository.findActiveVerifiedProviderMembership(
          providerUserId,
          propertyId,
          tx,
        ),
        governanceRepository.findProvisionalProviderMembership(
          providerUserId,
          propertyId,
          tx,
        ),
      ]);
      if (!verifiedMembership && !provisionalMembership) {
        throw propertyErrors.notFound();
      }
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

    const contexts = await loadProviderPropertyRelationshipContexts(
      providerUserId,
      [propertyId],
    );
    const context = contexts.get(propertyId);
    return toOwnerPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
      context?.governanceMode,
      context?.relationship,
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
    const [verifiedMembership, provisionalMembership] = await Promise.all([
      governanceRepository.findActiveVerifiedProviderMembership(
        providerUserId,
        propertyId,
        tx,
      ),
      governanceRepository.findProvisionalProviderMembership(
        providerUserId,
        propertyId,
        tx,
      ),
    ]);
    if (!verifiedMembership && !provisionalMembership) {
      throw propertyErrors.notFound();
    }
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
