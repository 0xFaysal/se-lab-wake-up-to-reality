import { apiClient } from "./api-client";
import type { AdminParkingRightDto, PaginationDto, ParkingResourceDto, ParkingRightAmendmentDto, ParkingRightAmendmentStatus, ParkingRightChangeInput, ParkingRightClaimBatchDto, ParkingRightClaimInput, ParkingRightDocumentDto, ParkingRightDto, ParkingRightStatus } from "./marketplace-types";

function queryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const parkingRightsApi = {
  list: () => apiClient.get<ParkingRightDto[]>("/provider/parking-rights"),
  detail: (rightId: string) => apiClient.get<ParkingRightDto>(`/provider/parking-rights/${rightId}`),
  claim: (resourceId: string, input: ParkingRightClaimInput) => apiClient.post<ParkingRightDto>(`/provider/parking-resources/${resourceId}/rights/claims`, input),
  createBatch: (propertyId: string, input: ParkingRightClaimInput & { resourceIds: string[] }) => apiClient.post<{ batch: ParkingRightClaimBatchDto; rights: ParkingRightDto[] }>(`/provider/properties/${propertyId}/parking-right-claim-batches`, input),
  batches: () => apiClient.get<ParkingRightClaimBatchDto[]>("/provider/parking-right-claim-batches"),
  updatePending: (rightId: string, input: ParkingRightChangeInput & { expectedVersion: number }) => apiClient.patch<ParkingRightDto>(`/provider/parking-rights/${rightId}`, input),
  createAmendment: (rightId: string, input: { expectedVersion: number; proposedChanges: ParkingRightChangeInput }) => apiClient.post<ParkingRightAmendmentDto>(`/provider/parking-rights/${rightId}/amendments`, input),
  amendments: (rightId: string) => apiClient.get<ParkingRightAmendmentDto[]>(`/provider/parking-rights/${rightId}/amendments`),
  cancelAmendment: (amendmentId: string) => apiClient.post<ParkingRightAmendmentDto>(`/provider/parking-right-amendments/${amendmentId}/cancel`, {}),
  pending: () => apiClient.get<ParkingRightDto[]>("/admin/parking-rights/pending"),
  adminList: (filters: { page: number; limit: number; status?: ParkingRightStatus | undefined; propertyId?: string | undefined; holderUserId?: string | undefined }) =>
    apiClient.get<{ rights: AdminParkingRightDto[]; pagination: PaginationDto }>(`/admin/parking-rights${queryString(filters)}`),
  verify: (rightId: string, input: { decision: Exclude<ParkingRightStatus, "PENDING_VERIFICATION" | "EXPIRED">; reason?: string; expectedVersion: number }) => apiClient.patch<ParkingRightDto>(`/admin/parking-rights/${rightId}/verification`, input),
  adminAmendments: (filters: { page: number; limit: number; status?: ParkingRightAmendmentStatus }) => apiClient.get<{ amendments: Array<ParkingRightAmendmentDto & { requestedBy: { id: string; fullName: string; email: string }; parkingRight: ParkingRightDto & { parkingSpot: ParkingResourceDto & { property: { id: string; name: string; publicArea: string } } } }>; pagination: PaginationDto }>(`/admin/parking-right-amendments${queryString(filters)}`),
  reviewAmendment: (amendmentId: string, input: { decision: "APPROVED" | "REJECTED"; expectedRightVersion: number; reason?: string }) => apiClient.patch<{ amendment: ParkingRightAmendmentDto; parkingRight: ParkingRightDto }>(`/admin/parking-right-amendments/${amendmentId}`, input),
  uploadDocuments: (parent: { rightId?: string; amendmentId?: string; batchId?: string }, category: ParkingRightDocumentDto["category"], files: File[]) => {
    const body = new FormData(); body.set("category", category); files.forEach((file) => body.append("documents", file));
    const path = parent.rightId ? `/provider/parking-rights/${parent.rightId}/documents` : parent.amendmentId ? `/provider/parking-right-amendments/${parent.amendmentId}/documents` : `/provider/parking-right-claim-batches/${parent.batchId}/documents`;
    return apiClient.post<ParkingRightDocumentDto[]>(path, body, { timeoutMs: 60_000 });
  },
  documents: (parent: { rightId?: string; amendmentId?: string; batchId?: string }) => apiClient.get<ParkingRightDocumentDto[]>(parent.rightId ? `/provider/parking-rights/${parent.rightId}/documents` : parent.amendmentId ? `/provider/parking-right-amendments/${parent.amendmentId}/documents` : `/provider/parking-right-claim-batches/${parent.batchId}/documents`),
  removeDocument: (documentId: string) => apiClient.delete<{ deleted: true }>(`/provider/parking-right-documents/${documentId}`),
  documentDownload: (documentId: string) => apiClient.get<{ url: string; expiresInSeconds: number }>(`/parking-right-documents/${documentId}/download`),
  adminBatches: (filters: { page: number; limit: number; status?: ParkingRightClaimBatchDto["status"] }) => apiClient.get<{ batches: Array<ParkingRightClaimBatchDto & { provider: { id: string; fullName: string; email: string }; property: { id: string; name: string; publicArea: string } }>; pagination: PaginationDto }>(`/admin/parking-right-claim-batches${queryString(filters)}`),
  reviewBatch: (batchId: string, input: { decision: "VERIFIED" | "REJECTED"; reason?: string; rights: Array<{ rightId: string; expectedVersion: number }> }) => apiClient.patch<{ batch: ParkingRightClaimBatchDto; reviewedCount: number }>(`/admin/parking-right-claim-batches/${batchId}`, input),
};
