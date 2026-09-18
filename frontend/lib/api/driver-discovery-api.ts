import { apiClient } from "./api-client";
import type { VehicleType } from "./api-types";
import type { DriverFavoriteDto, DriverSavedLocationDto, DriverSearchHistoryDto } from "./marketplace-types";

export const driverDiscoveryApi = {
  favorites: () => apiClient.get<DriverFavoriteDto[]>("/driver/favorites"),
  addFavorite: (propertyId: string) => apiClient.post<{ id: string; propertyId: string }>(`/driver/favorites/${propertyId}`, {}),
  removeFavorite: (propertyId: string) => apiClient.delete<{ deleted: true }>(`/driver/favorites/${propertyId}`),
  savedLocations: () => apiClient.get<DriverSavedLocationDto[]>("/driver/saved-locations"),
  createSavedLocation: (input: { label: string; displayName: string; latitude: number; longitude: number }) => apiClient.post<DriverSavedLocationDto>("/driver/saved-locations", input),
  updateSavedLocation: (locationId: string, input: Partial<{ label: string; displayName: string; latitude: number; longitude: number }>) => apiClient.patch<DriverSavedLocationDto>(`/driver/saved-locations/${locationId}`, input),
  deleteSavedLocation: (locationId: string) => apiClient.delete<{ deleted: true }>(`/driver/saved-locations/${locationId}`),
  recentSearches: () => apiClient.get<DriverSearchHistoryDto[]>("/driver/recent-searches"),
  addRecentSearch: (input: { displayName: string; latitude: number; longitude: number; radiusKm: number; vehicleType: VehicleType }) => apiClient.post<DriverSearchHistoryDto>("/driver/recent-searches", input),
  deleteRecentSearch: (searchId: string) => apiClient.delete<{ deleted: true }>(`/driver/recent-searches/${searchId}`),
  clearRecentSearches: () => apiClient.delete<{ deleted: number }>("/driver/recent-searches"),
};
