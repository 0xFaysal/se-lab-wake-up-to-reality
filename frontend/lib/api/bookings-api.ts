import { apiClient } from "./api-client";
import type { BookingDto, PaymentCaptureResult, RefundDto, ReviewDto, DisputeDto, DisputeStatus, PaginationDto } from "./marketplace-types";

export const bookingsApi = {
  create: (holdId: string, idempotencyKey: string) => apiClient.post<BookingDto>("/bookings", { holdId, idempotencyKey }),
  driverList: () => apiClient.get<BookingDto[]>("/bookings"),
  driverDetail: (bookingId: string) => apiClient.get<BookingDto>(`/bookings/${bookingId}`),
  providerList: () => apiClient.get<BookingDto[]>("/provider/bookings"),
  providerDetail: (bookingId: string) => apiClient.get<BookingDto>(`/provider/bookings/${bookingId}`),
  cancel: (bookingId: string) => apiClient.post<BookingDto>(`/bookings/${bookingId}/cancel`, {}),
  requestCheckout: (bookingId: string) => apiClient.post<BookingDto>(`/bookings/${bookingId}/checkout-request`, {}),
  captureSimulatedPayment: (bookingId: string, idempotencyKey: string) => apiClient.post<PaymentCaptureResult>("/payments/simulated/capture", { bookingId, idempotencyKey }),
  refund: (paymentId: string, input: { amountPaisa: string; reason: string; idempotencyKey: string }) => apiClient.post<RefundDto>(`/payments/${paymentId}/refunds`, input),
  review: (bookingId: string, input: { rating: number; comment?: string }) => apiClient.post<ReviewDto>(`/bookings/${bookingId}/reviews`, input),
  driverReviews: () => apiClient.get<ReviewDto[]>("/reviews"),
  dispute: (bookingId: string, input: { category: string; description: string; evidence?: Array<{ url: string; type: string }> }) => apiClient.post<DisputeDto>(`/bookings/${bookingId}/disputes`, input),
  driverDisputes: (status?: DisputeStatus) => apiClient.get<{ disputes: DisputeDto[]; pagination: PaginationDto }>(`/disputes${status ? `?status=${status}` : ""}`),
  driverDispute: (disputeId: string) => apiClient.get<DisputeDto>(`/disputes/${disputeId}`),
  providerDisputes: (status?: DisputeStatus) => apiClient.get<{ disputes: DisputeDto[]; pagination: PaginationDto }>(`/provider/disputes${status ? `?status=${status}` : ""}`),
  providerDispute: (disputeId: string) => apiClient.get<DisputeDto>(`/provider/disputes/${disputeId}`),
};
