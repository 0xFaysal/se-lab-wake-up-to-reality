import { apiClient } from "./api-client";
import type { AdminListingDto, AdminPayoutMethodDto, DisputeDto, PaginationDto, ParkingListingDto, PayoutDto, PayoutMethodDto } from "./marketplace-types";

export const adminMarketplaceApi = {
  listings: (filters: { page?: number; limit?: number; search?: string; status?: string; providerUserId?: string; propertyId?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]));
    return apiClient.get<{ listings: AdminListingDto[]; pagination: PaginationDto }>(`/admin/listings${query.size ? `?${query}` : ""}`);
  },
  listing: (listingId: string) => apiClient.get<AdminListingDto>(`/admin/listings/${listingId}`),
  suspendListing: (listingId: string, reason: string) => apiClient.post<ParkingListingDto>(`/admin/listings/${listingId}/suspend`, { reason }),
  resumeListing: (listingId: string, reason: string) => apiClient.post<ParkingListingDto>(`/admin/listings/${listingId}/resume`, { reason }),
  payouts: (filters: { page: number; limit: number; status?: string }) => { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)])); return apiClient.get<{ payouts: PayoutDto[]; pagination: PaginationDto }>(`/admin/payouts?${query}`); },
  reviewPayout: (payoutId: string, input: { decision: "APPROVED" | "REJECTED" | "PAID"; note: string; externalReference?: string }) => apiClient.patch<PayoutDto>(`/admin/payouts/${payoutId}`, input),
  holdPayout: (payoutId: string, reason: string) => apiClient.post<PayoutDto>(`/admin/payouts/${payoutId}/hold`, { reason }),
  releasePayout: (payoutId: string, reason: string) => apiClient.post<PayoutDto>(`/admin/payouts/${payoutId}/release-hold`, { reason }),
  pendingPayoutMethods: () => apiClient.get<AdminPayoutMethodDto[]>("/admin/payout-methods/pending"),
  reviewPayoutMethod: (payoutMethodId: string, input: { decision: "APPROVED" | "REJECTED"; note: string }) => apiClient.post<PayoutMethodDto>(`/admin/payout-methods/${payoutMethodId}/review`, input),
  disputes: (filters: { page: number; limit: number; status?: string }) => { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)])); return apiClient.get<{ disputes: DisputeDto[]; pagination: PaginationDto }>(`/admin/disputes?${query}`); },
  resolveDispute: (disputeId: string, input: { decision: "RESOLVED" | "REJECTED"; resolution: string }) => apiClient.patch<DisputeDto>(`/admin/disputes/${disputeId}`, input),
  beginDisputeReview: (disputeId: string, input: { reason: string; slaHours: number; escalate: boolean }) => apiClient.post<DisputeDto>(`/admin/disputes/${disputeId}/begin-review`, input),
};
