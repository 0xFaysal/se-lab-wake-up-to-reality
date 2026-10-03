import { apiClient } from "./api-client";
import type { BookingDto, BookingSettlementDto, GuardBookingDto, GuardCredentialResult, PaginationDto } from "./marketplace-types";

export const guardMarketplaceApi = {
  bookings: (filters: { status?: GuardBookingDto["status"]; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.page) query.set("page", String(filters.page));
    if (filters.limit) query.set("limit", String(filters.limit));
    const suffix = query.toString();
    return apiClient.get<{ bookings: GuardBookingDto[]; pagination: PaginationDto }>(`/guard/bookings${suffix ? `?${suffix}` : ""}`);
  },
  booking: (bookingId: string) => apiClient.get<GuardBookingDto>(`/guard/bookings/${bookingId}`),
  verify: (credential: string) => apiClient.post<GuardCredentialResult>("/guard/access/verify", { credential }),
  checkIn: (bookingId: string, credential: string) => apiClient.post<BookingDto>(`/guard/bookings/${bookingId}/check-in`, { credential }),
  checkOut: (bookingId: string, credential?: string) => apiClient.post<BookingDto & { settlement: BookingSettlementDto }>(`/guard/bookings/${bookingId}/check-out`, credential ? { credential } : {}),
};
