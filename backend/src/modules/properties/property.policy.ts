import {
  VerificationStatus,
  type Property,
} from "../../../generated/prisma/client.js";

const criticalLocationFields = new Set([
  "exactAddress",
  "latitude",
  "longitude",
  "entranceLatitude",
  "entranceLongitude",
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

export function canDeleteProperty(input: {
  existingParkingSpotCount: number;
  blockingGuardAssignmentCount: number;
}): boolean {
  return (
    input.existingParkingSpotCount === 0 &&
    input.blockingGuardAssignmentCount === 0
  );
}
