import { apiClient } from "./api-client";
import type { AdminListingDto, DisputeDto, PaginationDto, ParkingListingDto, PayoutDto } from "./marketplace-types";

export const adminMarketplaceApi = {
  listings: (filters: { status?: string; providerUserId?: string; propertyId?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    return apiClient.get<{ listings: AdminListingDto[]; pagination: PaginationDto }>(`/admin/listings${query.size ? `?${query}` : ""}`);
  },
  listing: (listingId: string) => apiClient.get<AdminListingDto>(`/admin/listings/${listingId}`),
  suspendListing: (listingId: string, reason: string) => apiClient.post<ParkingListingDto>(`/admin/listings/${listingId}/suspend`, { reason }),
  payouts: (status?: string) => apiClient.get<PayoutDto[]>(`/admin/payouts${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  reviewPayout: (payoutId: string, input: { decision: "APPROVED" | "REJECTED" | "PAID"; note: string }) => apiClient.patch<PayoutDto>(`/admin/payouts/${payoutId}`, input),
  disputes: (status?: string) => apiClient.get<DisputeDto[]>(`/admin/disputes${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  resolveDispute: (disputeId: string, input: { decision: "RESOLVED" | "REJECTED"; resolution: string }) => apiClient.patch<DisputeDto>(`/admin/disputes/${disputeId}`, input),
};
