import { apiClient } from "./api-client";
import type { AdminPropertyDetailDto, AdminPropertySummaryDto, PaginationDto } from "./api-types";

export const adminApi = {
  pendingProperties: (page = 1, limit = 20) => apiClient.get<{ properties: AdminPropertySummaryDto[]; pagination: PaginationDto }>(`/admin/properties/pending?page=${page}&limit=${limit}`),
  propertyDetail: async (id: string) => (await apiClient.get<{ property: AdminPropertyDetailDto }>(`/admin/properties/${id}`)).property,
  verifyProperty: (id: string, input: { decision: "APPROVE" } | { decision: "REJECT"; reason: string }) => apiClient.patch(`/admin/properties/${id}/verification`, input),
  mergePreview: async (duplicateId: string, canonicalPropertyId: string) => (await apiClient.get<{ preview: Record<string, unknown> }>(`/admin/properties/${duplicateId}/merge-preview?canonicalPropertyId=${encodeURIComponent(canonicalPropertyId)}`)).preview,
  mergeProperty: (duplicateId: string, input: { canonicalPropertyId: string; canonicalVersion: number; duplicateVersion: number; reason: string }) => apiClient.post<{ merge: Record<string, unknown> }>(`/admin/properties/${duplicateId}/merge`, input),
};
