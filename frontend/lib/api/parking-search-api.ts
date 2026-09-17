import { apiClient } from "./api-client";
import type { BookingQuoteDto, ParkingSearchParams, ParkingSearchResultDto, ReservationHoldDto } from "./marketplace-types";

function query(input: ParkingSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined) params.set(key, String(value));
  return params.toString();
}

export const parkingSearchApi = {
  search: (input: ParkingSearchParams) => apiClient.get<ParkingSearchResultDto[]>(`/parking/search?${query(input)}`),
  createQuote: (input: { listingId: string; vehicleId: string; startAt: string; endAt: string }) => apiClient.post<BookingQuoteDto>("/parking/quotes", input),
  quote: (quoteId: string) => apiClient.get<BookingQuoteDto>(`/parking/quotes/${quoteId}`),
  createHold: (quoteId: string, idempotencyKey: string) => apiClient.post<ReservationHoldDto>("/parking/holds", { quoteId, idempotencyKey }),
  hold: (holdId: string) => apiClient.get<ReservationHoldDto>(`/parking/holds/${holdId}`),
  releaseHold: (holdId: string) => apiClient.delete<ReservationHoldDto>(`/parking/holds/${holdId}`),
};
