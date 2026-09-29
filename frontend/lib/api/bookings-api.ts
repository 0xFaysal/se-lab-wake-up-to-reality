import { apiClient } from "./api-client";
import type { BookingCancellationPreview, BookingDto, BookingSettlementDto, PaymentDto, PaymentSessionResult, RefundDto, RefundPreview, ReviewDto, DisputeDto, DisputeStatus, PaginationDto } from "./marketplace-types";

export const bookingsApi = {
  create: (holdId: string, idempotencyKey: string) => apiClient.post<BookingDto>("/bookings", { holdId, idempotencyKey }),
  driverList: () => apiClient.get<BookingDto[]>("/bookings"),
  driverDetail: (bookingId: string) => apiClient.get<BookingDto>(`/bookings/${bookingId}`),
  providerList: (filters?: { propertyId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (filters?.propertyId) query.set("propertyId", filters.propertyId);
    if (filters?.status) query.set("status", filters.status);
    const q = query.toString();
    return apiClient.get<BookingDto[]>(`/provider/bookings${q ? `?${q}` : ""}`);
  },
  providerDetail: (bookingId: string) => apiClient.get<BookingDto>(`/provider/bookings/${bookingId}`),
  cancellationPreview: (bookingId: string) => apiClient.get<BookingCancellationPreview>(`/bookings/${bookingId}/cancellation-preview`),
  cancel: (bookingId: string, input: { reason?: string; idempotencyKey: string }) => apiClient.post<{ booking: BookingDto }>(`/bookings/${bookingId}/cancel`, input),
  settlement: (bookingId: string) => apiClient.get<BookingSettlementDto>(`/bookings/${bookingId}/settlement`),
  providerSettlement: (bookingId: string) => apiClient.get<BookingSettlementDto>(`/provider/bookings/${bookingId}/settlement`),
  requestCheckout: (bookingId: string) => apiClient.post<BookingDto>(`/bookings/${bookingId}/checkout-request`, {}),
  createPaymentSession: (bookingId: string, idempotencyKey: string, payload?: { useWallet?: boolean }) => apiClient.post<PaymentSessionResult>(`/bookings/${bookingId}/payments/sslcommerz/session`, { idempotencyKey, ...(payload ?? {}) }, { headers: { "Idempotency-Key": idempotencyKey } }),
  createSettlementPaymentSession: (bookingId: string, idempotencyKey: string) => apiClient.post<PaymentSessionResult>(`/bookings/${bookingId}/settlement/payments/sslcommerz/session`, { idempotencyKey }, { headers: { "Idempotency-Key": idempotencyKey } }),
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
