import type { ParkingListingDto } from "@/lib/api/marketplace-types";

export function listingsInPropertyScope(
  listings: ParkingListingDto[],
  propertyId: string,
  resourceIds: string[],
) {
  return listings.filter((listing) =>
    listing.parkingSpot?.propertyId === propertyId &&
    (resourceIds.length === 0 || resourceIds.includes(listing.parkingSpotId)),
  );
}

export function managerListingControls(
  status: ParkingListingDto["status"],
  canManage: boolean,
  canPrice: boolean,
) {
  const editable = status === "DRAFT" || status === "ACTIVE" || status === "PAUSED";
  return {
    editDetails: canManage && editable,
    editPrice: canPrice && editable,
    activate: canManage && (status === "DRAFT" || status === "PAUSED"),
    pause: canManage && status === "ACTIVE",
  };
}
