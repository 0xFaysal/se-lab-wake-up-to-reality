import type { Property } from "../../../../generated/prisma/client.js";
import { toPropertyImageDto } from "../../property-images/property-image.mapper.js";
import type {
  AdminPropertyDetailRecord,
  AdminPropertySummaryRecord,
} from "./admin-property.repository.js";

function coordinate(value: Property["latitude"]): number {
  return value.toNumber();
}

export function toAdminPropertySummary(property: AdminPropertySummaryRecord) {
  return {
    id: property.id,
    name: property.name,
    publicArea: property.publicArea,
    approximateAddress: property.approximateAddress,
    latitude: coordinate(property.latitude),
    longitude: coordinate(property.longitude),
    verificationStatus: property.verificationStatus,
    status: property.status,
    rejectionReason: property.rejectionReason,
    imageCount: property._count.images,
    owner: property.owner,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

export function toAdminPropertyDetail(
  property: AdminPropertyDetailRecord,
  sensitive: {
    exactAddress: string;
    accessInstructions: string | null;
  },
) {
  return {
    id: property.id,
    name: property.name,
    description: property.description,
    publicArea: property.publicArea,
    approximateAddress: property.approximateAddress,
    exactAddress: sensitive.exactAddress,
    latitude: coordinate(property.latitude),
    longitude: coordinate(property.longitude),
    entranceLatitude: property.entranceLatitude
      ? coordinate(property.entranceLatitude)
      : null,
    entranceLongitude: property.entranceLongitude
      ? coordinate(property.entranceLongitude)
      : null,
    accessInstructions: sensitive.accessInstructions,
    verificationStatus: property.verificationStatus,
    status: property.status,
    verifiedAt: property.verifiedAt,
    rejectionReason: property.rejectionReason,
    reviewedBy: property.verifiedByAdmin,
    owner: {
      id: property.owner.id,
      fullName: property.owner.fullName,
      email: property.owner.email,
      phone: property.owner.phone,
      status: property.owner.status,
      emailVerified: property.owner.emailVerifiedAt !== null,
      phoneVerified: property.owner.phoneVerifiedAt !== null,
    },
    images: property.images.map(toPropertyImageDto),
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

export function toPropertyVerificationResult(
  property: Pick<
    Property,
    | "id"
    | "verificationStatus"
    | "status"
    | "verifiedByAdminId"
    | "verifiedAt"
    | "rejectionReason"
    | "updatedAt"
  >,
) {
  return {
    propertyId: property.id,
    verificationStatus: property.verificationStatus,
    status: property.status,
    reviewedByAdminId: property.verifiedByAdminId,
    verifiedAt: property.verifiedAt,
    rejectionReason: property.rejectionReason,
    updatedAt: property.updatedAt,
  };
}
