import { apiClient } from "./api-client";
import type { ParkingRightClaimInput, ParkingRightDto, ParkingRightStatus } from "./marketplace-types";

export const parkingRightsApi = {
  list: () => apiClient.get<ParkingRightDto[]>("/provider/parking-rights"),
  detail: (rightId: string) => apiClient.get<ParkingRightDto>(`/provider/parking-rights/${rightId}`),
  claim: (resourceId: string, input: ParkingRightClaimInput) => apiClient.post<ParkingRightDto>(`/provider/parking-resources/${resourceId}/rights/claims`, input),
  pending: () => apiClient.get<ParkingRightDto[]>("/admin/parking-rights/pending"),
  verify: (rightId: string, input: { decision: Exclude<ParkingRightStatus, "PENDING_VERIFICATION" | "EXPIRED">; reason?: string }) => apiClient.patch<ParkingRightDto>(`/admin/parking-rights/${rightId}/verification`, input),
};
