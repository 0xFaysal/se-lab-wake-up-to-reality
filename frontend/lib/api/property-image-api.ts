import { apiClient } from "./api-client";
import type { PropertyImageDto } from "./api-types";

export const propertyImageApi = {
  list: async (propertyId: string) => (await apiClient.get<{ images: PropertyImageDto[] }>(`/properties/${propertyId}/images`)).images,
  upload: async (propertyId: string, files: File[]) => {
    const body = new FormData(); files.forEach((file) => body.append("images", file));
    return (await apiClient.post<{ images: PropertyImageDto[] }>(`/properties/${propertyId}/images`, body)).images;
  },
  reorder: async (propertyId: string, imageIds: string[], coverImageId?: string) => (await apiClient.patch<{ images: PropertyImageDto[] }>(`/properties/${propertyId}/images/reorder`, { imageIds, ...(coverImageId ? { coverImageId } : {}) })).images,
  remove: (propertyId: string, imageId: string) => apiClient.delete<void>(`/properties/${propertyId}/images/${imageId}`),
};
