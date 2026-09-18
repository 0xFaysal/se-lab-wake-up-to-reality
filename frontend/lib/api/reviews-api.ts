import { apiClient } from "./api-client";
import type { ReviewDto } from "./marketplace-types";

export const reviewsApi = {
  providerList: () => apiClient.get<ReviewDto[]>("/provider/reviews"),
  reply: (reviewId: string, reply: string) => apiClient.post<ReviewDto>(`/provider/reviews/${reviewId}/reply`, { reply }),
};
