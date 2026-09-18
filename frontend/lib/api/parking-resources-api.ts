import { apiClient } from "./api-client";
import type { VehicleType } from "./api-types";
import type { AvailabilityDto, AvailabilityExceptionDto, AvailabilityRuleInput, BulkParkingResourceInput, CreateParkingResourceInput, ParkingResourceDto } from "./marketplace-types";

interface UpdateParkingResourceInput {
  displayName?: string;
  floor?: string | null;
  zone?: string | null;
  capacity?: number;
  supportedVehicleTypes?: VehicleType[];
  status?: ParkingResourceDto["status"];
  isCovered?: boolean;
  hasCctv?: boolean;
  hasGuard?: boolean;
  maxHeightCm?: number | null;
  maxWidthCm?: number | null;
  maxLengthCm?: number | null;
}

export const parkingResourcesApi = {
  list: (propertyId: string) => apiClient.get<ParkingResourceDto[]>(`/provider/properties/${propertyId}/parking-resources`),
  detail: (resourceId: string) => apiClient.get<ParkingResourceDto>(`/provider/parking-resources/${resourceId}`),
  create: (propertyId: string, input: CreateParkingResourceInput) => apiClient.post<ParkingResourceDto>(`/provider/properties/${propertyId}/parking-resources`, input),
  createBulk: (propertyId: string, input: BulkParkingResourceInput) => apiClient.post<{ resources: ParkingResourceDto[]; createdCount: number }>(`/provider/properties/${propertyId}/parking-resources/bulk`, input),
  update: (resourceId: string, input: UpdateParkingResourceInput) => apiClient.patch<ParkingResourceDto>(`/provider/parking-resources/${resourceId}`, input),
  remove: (resourceId: string) => apiClient.delete<{ deleted: true }>(`/provider/parking-resources/${resourceId}`),
  availability: (resourceId: string) => apiClient.get<AvailabilityDto>(`/provider/parking-resources/${resourceId}/availability`),
  replaceAvailability: (resourceId: string, rules: AvailabilityRuleInput[]) => apiClient.put<AvailabilityRuleInput[]>(`/provider/parking-resources/${resourceId}/availability`, { rules }),
  addException: (resourceId: string, input: { startsAt: string; endsAt: string; exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE"; reason?: string }) => apiClient.post<AvailabilityExceptionDto>(`/provider/parking-resources/${resourceId}/availability/exceptions`, input),
  updateException: (exceptionId: string, input: Partial<{ startsAt: string; endsAt: string; exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE"; reason: string | null }>) => apiClient.patch<AvailabilityExceptionDto>(`/provider/availability/exceptions/${exceptionId}`, input),
  removeException: (exceptionId: string) => apiClient.delete<{ deleted: true }>(`/provider/availability/exceptions/${exceptionId}`),
};
