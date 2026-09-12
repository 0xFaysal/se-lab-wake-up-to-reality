import type {
  BuildingManagerAssignmentStatus,
  Property,
  PropertyProviderStatus,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import type { PropertyGovernanceMode } from "../property-governance/property-governance.policy.js";
import type { OwnerPropertySummaryRecord } from "./property.repository.js";

function coordinate(value: Property["latitude"]): number {
  return value.toNumber();
}

export interface ProviderPropertyRelationshipContext {
  providerMembership: {
    id: string;
    status: PropertyProviderStatus;
    verificationStatus: VerificationStatus;
    joinedAt: Date;
    verifiedAt: Date | null;
  } | null;
  isSoleController: boolean;
  buildingManager: {
    id: string;
    status: BuildingManagerAssignmentStatus;
    candidate: { id: string; fullName: string };
  } | null;
}

export function toOwnerPropertySummary(
  property: OwnerPropertySummaryRecord,
  governanceMode?: PropertyGovernanceMode,
  relationship?: ProviderPropertyRelationshipContext,
) {
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
    version: property.version,
    governanceMode: governanceMode ?? null,
    ...(relationship
      ? {
          providerMembership: relationship.providerMembership,
          isSoleController: relationship.isSoleController,
          buildingManager: relationship.buildingManager,
        }
      : {}),
    canonicalPropertyId: property.canonicalPropertyId,
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
  governanceMode?: PropertyGovernanceMode,
  relationship?: ProviderPropertyRelationshipContext,
) {
  return {
    ...toOwnerPropertySummary(property, governanceMode, relationship),
    exactAddress: sensitive.exactAddress,
    entranceLatitude: property.entranceLatitude
      ? coordinate(property.entranceLatitude)
      : null,
    entranceLongitude: property.entranceLongitude
      ? coordinate(property.entranceLongitude)
      : null,
    accessInstructions: sensitive.accessInstructions,
    visitorIdentificationRequired: property.visitorIdentificationRequired,
    vehicleHeightLimitCm: property.vehicleHeightLimitCm,
    entryCutoffLocalTime: property.entryCutoffLocalTime
      ? property.entryCutoffLocalTime.toISOString().slice(11, 16)
      : null,
    generalParkingRules: property.generalParkingRules,
    commonSafetyRules: property.commonSafetyRules,
    temporaryClosureReason: property.temporaryClosureReason,
    temporaryClosedAt: property.temporaryClosedAt,
    temporaryClosedUntil: property.temporaryClosedUntil,
    verifiedAt: property.verifiedAt,
  };
}

export function toPublicPropertySummary(property: Pick<
  Property,
  "id" | "name" | "publicArea" | "approximateAddress" | "latitude" | "longitude"
>) {
  return {
    id: property.id,
    name: property.name,
    publicArea: property.publicArea,
    approximateAddress: property.approximateAddress,
    latitude: coordinate(property.latitude),
    longitude: coordinate(property.longitude),
  };
}
