import { apiClient } from "./api-client";
import type { BookingDto, PaymentDto, PaymentSessionResult, RefundDto, RefundPreview, ReviewDto, DisputeDto, DisputeStatus, PaginationDto } from "./marketplace-types";

export const bookingsApi = {
  create: (holdId: string, idempotencyKey: string) => apiClient.post<BookingDto>("/bookings", { holdId, idempotencyKey }),
  driverList: () => apiClient.get<BookingDto[]>("/bookings"),
  driverDetail: (bookingId: string) => apiClient.get<BookingDto>(`/bookings/${bookingId}`),
  providerList: () => apiClient.get<BookingDto[]>("/provider/bookings"),
  providerDetail: (bookingId: string) => apiClient.get<BookingDto>(`/provider/bookings/${bookingId}`),
  cancel: (bookingId: string) => apiClient.post<BookingDto>(`/bookings/${bookingId}/cancel`, {}),
  requestCheckout: (bookingId: string) => apiClient.post<BookingDto>(`/bookings/${bookingId}/checkout-request`, {}),
  createPaymentSession: (bookingId: string, idempotencyKey: string) => apiClient.post<PaymentSessionResult>(`/bookings/${bookingId}/payments/sslcommerz/session`, { idempotencyKey }, { headers: { "Idempotency-Key": idempotencyKey } }),
  payment: (paymentId: string) => apiClient.get<PaymentDto>(`/payments/${paymentId}`),
  refundPreview: (paymentId: string) => apiClient.get<RefundPreview>(`/payments/${paymentId}/refunds/preview`),
  refund: (paymentId: string, input: { reason: string; idempotencyKey: string }) => apiClient.post<RefundDto>(`/payments/${paymentId}/refunds`, input),
  review: (bookingId: string, input: { rating: number; comment?: string }) => apiClient.post<ReviewDto>(`/bookings/${bookingId}/reviews`, input),
  driverReviews: () => apiClient.get<ReviewDto[]>("/reviews"),
  dispute: (bookingId: string, input: { category: string; description: string; evidence?: Array<{ url: string; type: string }> }) => apiClient.post<DisputeDto>(`/bookings/${bookingId}/disputes`, input),
  driverDisputes: (status?: DisputeStatus) => apiClient.get<{ disputes: DisputeDto[]; pagination: PaginationDto }>(`/disputes${status ? `?status=${status}` : ""}`),
  driverDispute: (disputeId: string) => apiClient.get<DisputeDto>(`/disputes/${disputeId}`),
  providerDisputes: (status?: DisputeStatus) => apiClient.get<{ disputes: DisputeDto[]; pagination: PaginationDto }>(`/provider/disputes${status ? `?status=${status}` : ""}`),
  providerDispute: (disputeId: string) => apiClient.get<DisputeDto>(`/provider/disputes/${disputeId}`),
};
