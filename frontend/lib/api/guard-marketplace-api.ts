import { apiClient } from "./api-client";
import type { BookingDto, GuardBookingDto, GuardCredentialResult, PaginationDto } from "./marketplace-types";

export const guardMarketplaceApi = {
  bookings: (status?: GuardBookingDto["status"]) => apiClient.get<{ bookings: GuardBookingDto[]; pagination: PaginationDto }>(`/guard/bookings${status ? `?status=${status}` : ""}`),
  booking: (bookingId: string) => apiClient.get<GuardBookingDto>(`/guard/bookings/${bookingId}`),
  verify: (credential: string) => apiClient.post<GuardCredentialResult>("/guard/access/verify", { credential }),
  checkIn: (bookingId: string, credential: string) => apiClient.post<BookingDto>(`/guard/bookings/${bookingId}/check-in`, { credential }),
  checkOut: (bookingId: string) => apiClient.post<BookingDto>(`/guard/bookings/${bookingId}/check-out`, {}),
};
