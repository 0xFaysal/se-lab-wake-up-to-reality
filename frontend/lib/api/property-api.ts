import { apiClient } from "./api-client";
import type { PropertyDetailDto, PropertyInput, PropertySummaryDto, PropertyUpdateInput } from "./api-types";

export const propertyApi = {
  list: async () => (await apiClient.get<{ properties: PropertySummaryDto[] }>("/provider/properties")).properties,
  detail: async (id: string) => (await apiClient.get<{ property: PropertyDetailDto }>(`/provider/properties/${id}`)).property,
  create: async (input: PropertyInput) => (await apiClient.post<{ property: PropertyDetailDto }>("/provider/properties", input)).property,
  update: async (id: string, input: PropertyUpdateInput) => (await apiClient.patch<{ property: PropertyDetailDto }>(`/provider/properties/${id}`, input)).property,
  remove: (id: string) => apiClient.delete<void>(`/provider/properties/${id}`),
  possibleMatches: async (input: Pick<PropertyInput, "name" | "publicArea" | "exactAddress" | "latitude" | "longitude">) => (await apiClient.post<{ possibleMatches: PropertySummaryDto[] }>("/provider/properties/possible-matches", input)).possibleMatches,
  requestMembership: (propertyId: string) => apiClient.post(`/provider/properties/${propertyId}/membership`, {}),
};
