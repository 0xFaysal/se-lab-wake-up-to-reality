import { apiClient } from "./api-client";
import type { BookingQuoteDto, ParkingSearchParams, ParkingSearchResultDto, PublicPropertyDetailDto, ReservationHoldDto } from "./marketplace-types";

function query(input: ParkingSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined) params.set(key, String(value));
  return params.toString();
}

export const parkingSearchApi = {
  browse: (input: Pick<ParkingSearchParams, "latitude" | "longitude">) => apiClient.get<ParkingSearchResultDto[]>(`/parking/browse?${query(input as ParkingSearchParams)}`),
  search: (input: ParkingSearchParams) => apiClient.get<ParkingSearchResultDto[]>(`/parking/search?${query(input)}`),
  propertyDetail: (propertyId: string, input: Pick<ParkingSearchParams, "startAt" | "endAt" | "vehicleType">) =>
    apiClient.get<PublicPropertyDetailDto>(`/parking/properties/${propertyId}?${query(input as ParkingSearchParams)}`),
  createQuote: (input: { listingId: string; vehicleId: string; startAt: string; endAt: string }) => apiClient.post<BookingQuoteDto>("/parking/quotes", input),
  quote: (quoteId: string) => apiClient.get<BookingQuoteDto>(`/parking/quotes/${quoteId}`),
  createHold: (quoteId: string, idempotencyKey: string) => apiClient.post<ReservationHoldDto>("/parking/holds", { quoteId, idempotencyKey }),
  hold: (holdId: string) => apiClient.get<ReservationHoldDto>(`/parking/holds/${holdId}`),
  releaseHold: (holdId: string) => apiClient.delete<ReservationHoldDto>(`/parking/holds/${holdId}`),
  reportListing: (listingId: string, input: { reason: string; details?: string }) =>
    apiClient.post<{ report: Record<string, unknown> }>(`/listings/${listingId}/reports`, input),
};
