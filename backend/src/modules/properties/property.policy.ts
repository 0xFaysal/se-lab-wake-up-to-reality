import {
  VerificationStatus,
  type Property,
} from "../../../generated/prisma/client.js";

export const criticalLocationFields = new Set([
  "name",
  "publicArea",
  "approximateAddress",
  "exactAddress",
  "latitude",
  "longitude",
  "entranceLatitude",
  "entranceLongitude",
]);

export const commonOperationFields = new Set([
  "accessInstructions",
  "visitorIdentificationRequired",
  "vehicleHeightLimitCm",
  "entryCutoffLocalTime",
  "generalParkingRules",
  "commonSafetyRules",
]);

export function canOwnerEditProperty(
  property: Pick<Property, "verificationStatus">,
): boolean {
  return property.verificationStatus !== VerificationStatus.SUSPENDED;
}

export function shouldResetVerification(
  verificationStatus: VerificationStatus,
  changedFields: ReadonlySet<string>,
): boolean {
  if (
    verificationStatus === VerificationStatus.REJECTED ||
    verificationStatus === VerificationStatus.DRAFT
  ) {
    return true;
  }
  return (
    verificationStatus === VerificationStatus.VERIFIED &&
    [...changedFields].some((field) => criticalLocationFields.has(field))
  );
}

export function containsCriticalPropertyChange(fields: ReadonlySet<string>) {
  return [...fields].some((field) => criticalLocationFields.has(field));
}

export function containsOnlyCommonOperationChanges(fields: ReadonlySet<string>) {
  return [...fields].every(
    (field) => field === "version" || commonOperationFields.has(field),
  );
}

export function canDeleteProperty(input: {
  existingPropertyImageCount: number;
  existingParkingSpotCount: number;
  blockingGuardAssignmentCount: number;
  providerCount: number;
}): boolean {
  return (
    input.providerCount <= 1 &&
    input.existingPropertyImageCount === 0 &&
    input.existingParkingSpotCount === 0 &&
    input.blockingGuardAssignmentCount === 0
  );
}
