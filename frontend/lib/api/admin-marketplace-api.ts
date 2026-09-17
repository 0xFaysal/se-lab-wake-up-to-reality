import { apiClient } from "./api-client";
import type { DisputeDto, ParkingListingDto, PayoutDto } from "./marketplace-types";

export const adminMarketplaceApi = {
  suspendListing: (listingId: string, reason: string) => apiClient.post<ParkingListingDto>(`/admin/listings/${listingId}/suspend`, { reason }),
  payouts: (status?: string) => apiClient.get<PayoutDto[]>(`/admin/payouts${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  reviewPayout: (payoutId: string, input: { decision: "APPROVED" | "REJECTED" | "PAID"; note: string }) => apiClient.patch<PayoutDto>(`/admin/payouts/${payoutId}`, input),
  disputes: (status?: string) => apiClient.get<DisputeDto[]>(`/admin/disputes${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  resolveDispute: (disputeId: string, input: { decision: "RESOLVED" | "REJECTED"; resolution: string }) => apiClient.patch<DisputeDto>(`/admin/disputes/${disputeId}`, input),
};
