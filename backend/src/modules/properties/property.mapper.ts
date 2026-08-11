import type { Property } from "../../../generated/prisma/client.js";
import type { OwnerPropertySummaryRecord } from "./property.repository.js";

function coordinate(value: Property["latitude"]): number {
  return value.toNumber();
}

export function toOwnerPropertySummary(property: OwnerPropertySummaryRecord) {
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
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

export function toOwnerPropertyDetail(
  property: Property,
  sensitive: {
    exactAddress: string;
    accessInstructions: string | null;
  },
) {
  return {
    ...toOwnerPropertySummary(property),
    exactAddress: sensitive.exactAddress,
    entranceLatitude: property.entranceLatitude
      ? coordinate(property.entranceLatitude)
      : null,
    entranceLongitude: property.entranceLongitude
      ? coordinate(property.entranceLongitude)
      : null,
    accessInstructions: sensitive.accessInstructions,
    verifiedAt: property.verifiedAt,
  };
}

export function toPublicPropertySummary(property: OwnerPropertySummaryRecord) {
  return {
    id: property.id,
    name: property.name,
    publicArea: property.publicArea,
    approximateAddress: property.approximateAddress,
    latitude: coordinate(property.latitude),
    longitude: coordinate(property.longitude),
  };
}
