import { apiClient } from "./api-client";
import type { VehicleDto, VehicleInput } from "./api-types";

export const vehicleApi = {
  list: async () => (await apiClient.get<{ vehicles: VehicleDto[] }>("/vehicles")).vehicles,
  detail: async (id: string) => (await apiClient.get<{ vehicle: VehicleDto }>(`/vehicles/${id}`)).vehicle,
  create: async (input: VehicleInput) => (await apiClient.post<{ vehicle: VehicleDto }>("/vehicles", input)).vehicle,
  update: async (id: string, input: Partial<Omit<VehicleInput, "isDefault">>) => (await apiClient.patch<{ vehicle: VehicleDto }>(`/vehicles/${id}`, input)).vehicle,
  setDefault: async (id: string) => (await apiClient.patch<{ vehicle: VehicleDto }>(`/vehicles/${id}/default`, {})).vehicle,
  remove: (id: string) => apiClient.delete<void>(`/vehicles/${id}`),
};
