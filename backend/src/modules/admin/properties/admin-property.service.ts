import {
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../../generated/prisma/client.js";
import { SensitiveDataEncryptionError } from "../../../common/security/encryption.js";
import { logger } from "../../../config/logger.js";
import { prisma } from "../../../config/prisma.js";
import { propertyErrors } from "../../properties/property.errors.js";
import * as propertyRepository from "../../properties/property.repository.js";
import { decryptPropertySensitiveData } from "../../properties/property-sensitive-data.js";
import { adminPropertyErrors } from "./admin-property.errors.js";
import {
  toAdminPropertyDetail,
  toAdminPropertySummary,
  toPropertyVerificationResult,
} from "./admin-property.mapper.js";
import * as adminPropertyRepository from "./admin-property.repository.js";
import type { AdminPropertyDetailRecord } from "./admin-property.repository.js";
import type {
  PendingAdminPropertiesQuery,
  VerifyAdminPropertyInput,
} from "./admin-property.types.js";

function throwAdminDecryptionFailure(
  error: unknown,
  propertyId: string,
): never {
  if (error instanceof SensitiveDataEncryptionError) {
    logger.error(
      { propertyId, errorType: error.name },
      "Admin Property review data could not be decrypted",
    );
    throw propertyErrors.encryptionFailed();
  }
  throw error;
}

export async function listPendingProperties(
  query: PendingAdminPropertiesQuery,
) {
  const skip = (query.page - 1) * query.limit;
  const [total, properties] = await prisma.$transaction([
    adminPropertyRepository.countPendingProperties(),
    adminPropertyRepository.findPendingProperties(skip, query.limit),
  ]);
  return {
    properties: properties.map(toAdminPropertySummary),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getAdminProperty(propertyId: string) {
  const property =
    await adminPropertyRepository.findAdminPropertyById(propertyId);
  if (!property) throw propertyErrors.notFound();
  try {
    return toAdminPropertyDetail(
      property,
      decryptPropertySensitiveData(property),
    );
  } catch (error) {
    throwAdminDecryptionFailure(error, propertyId);
  }
}

function propertyMeetsApprovalRequirements(
  property: AdminPropertyDetailRecord,
): boolean {
  const latitude = property.latitude.toNumber();
  const longitude = property.longitude.toNumber();
  return (
    property.exactAddressCiphertext.length > 0 &&
    Boolean(property.exactAddressIv) &&
    Boolean(property.exactAddressTag) &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    property.images.length > 0 &&
    property.owner.status === UserStatus.ACTIVE &&
    property.owner.deletedAt === null &&
    property.owner.emailVerifiedAt !== null &&
    property.owner.phoneVerifiedAt !== null &&
    !property.owner.mustChangePassword &&
    property.owner.roles.some(
      (role) => role.role === UserRoleType.PARKING_OWNER,
    )
  );
}

export async function verifyProperty(
  adminUserId: string,
  propertyId: string,
  input: VerifyAdminPropertyInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const property = await adminPropertyRepository.findAdminPropertyById(
        propertyId,
        tx,
      );
      if (!property) throw propertyErrors.notFound();

      if (
        property.verificationStatus === VerificationStatus.VERIFIED &&
        input.decision === "APPROVE"
      ) {
        throw adminPropertyErrors.alreadyVerified();
      }
      if (property.verificationStatus !== VerificationStatus.PENDING) {
        throw adminPropertyErrors.conflict();
      }
      if (input.decision === "APPROVE") {
        decryptPropertySensitiveData(property);
        if (!propertyMeetsApprovalRequirements(property)) {
          throw adminPropertyErrors.requirementsNotMet();
        }
      }

      const reviewedAt = new Date();
      const updated =
        await adminPropertyRepository.updatePendingPropertyVerification(
          propertyId,
          input.decision === "APPROVE"
            ? {
                verificationStatus: VerificationStatus.VERIFIED,
                status: PropertyStatus.ACTIVE,
                verifiedByAdminId: adminUserId,
                verifiedAt: reviewedAt,
                rejectionReason: null,
              }
            : {
                verificationStatus: VerificationStatus.REJECTED,
                status: PropertyStatus.INACTIVE,
                verifiedByAdminId: adminUserId,
                verifiedAt: null,
                rejectionReason: input.reason,
              },
          tx,
        );
      if (updated.count !== 1) throw adminPropertyErrors.conflict();

      const result = await adminPropertyRepository.findAdminPropertyById(
        propertyId,
        tx,
      );
      if (!result) throw adminPropertyErrors.conflict();
      return toPropertyVerificationResult(result);
    });
  } catch (error) {
    throwAdminDecryptionFailure(error, propertyId);
  }
}
