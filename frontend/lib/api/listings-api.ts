import { apiClient } from "./api-client";
import type { ListingInput, ParkingListingDto } from "./marketplace-types";

export const listingsApi = {
  list: () => apiClient.get<ParkingListingDto[]>("/provider/listings"),
  detail: (listingId: string) => apiClient.get<ParkingListingDto>(`/provider/listings/${listingId}`),
  create: (input: ListingInput) => apiClient.post<ParkingListingDto>("/provider/listings", input),
  update: (listingId: string, input: Partial<Omit<ListingInput, "parkingRightId" | "parkingResourceUnitId">> & { expectedUpdatedAt?: string }) => apiClient.patch<ParkingListingDto>(`/provider/listings/${listingId}`, input),
  updateVehicleRates: (listingId: string, input: { expectedUpdatedAt: string; settings: Partial<Omit<ListingInput, "parkingRightId" | "parkingResourceUnitId">>; rates: Array<{ vehicleType: import("./api-types").VehicleType; pricePerHourPaisa: string }> }) => apiClient.post<ParkingListingDto>(`/provider/listings/${listingId}/vehicle-rates`, input),
  activate: (listingId: string) => apiClient.post<ParkingListingDto>(`/provider/listings/${listingId}/activate`, {}),
  pause: (listingId: string) => apiClient.post<ParkingListingDto>(`/provider/listings/${listingId}/pause`, {}),
  end: (listingId: string) => apiClient.delete<ParkingListingDto>(`/provider/listings/${listingId}`),
};
