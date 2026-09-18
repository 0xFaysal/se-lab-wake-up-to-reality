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
    creator: property.createdBy,
    owner: property.createdBy,
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
    version: property.version,
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
    creator: {
      id: property.createdBy.id,
      fullName: property.createdBy.fullName,
      email: property.createdBy.email,
      phone: property.createdBy.phone,
      status: property.createdBy.status,
      emailVerified: property.createdBy.emailVerifiedAt !== null,
      phoneVerified: property.createdBy.phoneVerifiedAt !== null,
    },
    providers: property.providerMemberships.map((membership) => ({
      id: membership.id,
      status: membership.status,
      verificationStatus: membership.verificationStatus,
      rejectionReason: membership.rejectionReason,
      joinedAt: membership.joinedAt,
      verifiedAt: membership.verifiedAt,
      provider: {
        id: membership.provider.id,
        fullName: membership.provider.fullName,
        email: membership.provider.email,
        phone: membership.provider.phone,
        status: membership.provider.status,
        emailVerified: membership.provider.emailVerifiedAt !== null,
        phoneVerified: membership.provider.phoneVerifiedAt !== null,
      },
    })),
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
