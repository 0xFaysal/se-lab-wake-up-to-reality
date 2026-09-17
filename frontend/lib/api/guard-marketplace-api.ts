import { apiClient } from "./api-client";
import type { BookingDto, GuardCredentialResult } from "./marketplace-types";

export const guardMarketplaceApi = {
  verify: (credential: string) => apiClient.post<GuardCredentialResult>("/guard/access/verify", { credential }),
  checkIn: (bookingId: string, credential: string) => apiClient.post<BookingDto>(`/guard/bookings/${bookingId}/check-in`, { credential }),
  checkOut: (bookingId: string) => apiClient.post<BookingDto>(`/guard/bookings/${bookingId}/check-out`, {}),
};
