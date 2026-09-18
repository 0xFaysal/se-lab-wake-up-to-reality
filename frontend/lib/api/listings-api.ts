import { apiClient } from "./api-client";
import type { ListingInput, ParkingListingDto } from "./marketplace-types";

export const listingsApi = {
  list: () => apiClient.get<ParkingListingDto[]>("/provider/listings"),
  detail: (listingId: string) => apiClient.get<ParkingListingDto>(`/provider/listings/${listingId}`),
  create: (input: ListingInput) => apiClient.post<ParkingListingDto>("/provider/listings", input),
  update: (listingId: string, input: Partial<Omit<ListingInput, "parkingRightId" | "parkingResourceUnitId">>) => apiClient.patch<ParkingListingDto>(`/provider/listings/${listingId}`, input),
  activate: (listingId: string) => apiClient.post<ParkingListingDto>(`/provider/listings/${listingId}/activate`, {}),
  pause: (listingId: string) => apiClient.post<ParkingListingDto>(`/provider/listings/${listingId}/pause`, {}),
  end: (listingId: string) => apiClient.delete<ParkingListingDto>(`/provider/listings/${listingId}`),
};
