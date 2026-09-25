import { apiClient } from "./api-client";
import type { EarningsSummaryDto, LedgerEntryDto, PaginationDto, PayoutDto, PayoutMethodDto, RefundDto, WalletDto } from "./marketplace-types";

export const financeApi = {
  wallet: () => apiClient.get<WalletDto>("/wallet"),
  walletTransactions: () => apiClient.get<LedgerEntryDto[]>("/wallet/transactions"),
  earnings: () => apiClient.get<EarningsSummaryDto>("/provider/earnings/summary"),
  earningsTransactions: () => apiClient.get<LedgerEntryDto[]>("/provider/earnings/transactions"),
  payoutMethods: () => apiClient.get<PayoutMethodDto[]>("/provider/payout-methods"),
  createPayoutMethod: (body: { type: PayoutMethodDto["type"]; accountHolderName: string; accountIdentifier: string; bankName?: string; branchName?: string; routingNumber?: string; isDefault: boolean }) => apiClient.post<PayoutMethodDto>("/provider/payout-methods", body),
  setDefaultPayoutMethod: (id: string) => apiClient.post<PayoutMethodDto>(`/provider/payout-methods/${id}/default`, {}),
  deactivatePayoutMethod: (id: string) => apiClient.post<PayoutMethodDto>(`/provider/payout-methods/${id}/deactivate`, {}),
  requestPayout: (amountPaisa: string, payoutMethodId: string, idempotencyKey: string) => apiClient.post<PayoutDto>("/provider/payouts", { amountPaisa, payoutMethodId, idempotencyKey }),
  providerPayouts: (status?: PayoutDto["status"]) => apiClient.get<{ payouts: PayoutDto[]; pagination: PaginationDto }>(`/provider/payouts${status ? `?status=${status}` : ""}`),
  providerPayout: (payoutId: string) => apiClient.get<PayoutDto>(`/provider/payouts/${payoutId}`),
  driverRefunds: (status?: RefundDto["status"]) => apiClient.get<{ refunds: RefundDto[]; pagination: PaginationDto }>(`/refunds${status ? `?status=${status}` : ""}`),
  driverRefund: (refundId: string) => apiClient.get<RefundDto>(`/refunds/${refundId}`),
  driverPayoutMethods: () => apiClient.get<PayoutMethodDto[]>("/driver/payout-methods"),
  createDriverPayoutMethod: (body: { type: PayoutMethodDto["type"]; accountHolderName: string; accountIdentifier: string; bankName?: string; branchName?: string; routingNumber?: string; isDefault: boolean }) => apiClient.post<PayoutMethodDto>("/driver/payout-methods", body),
  setDefaultDriverPayoutMethod: (id: string) => apiClient.post<PayoutMethodDto>(`/driver/payout-methods/${id}/default`, {}),
  deactivateDriverPayoutMethod: (id: string) => apiClient.post<PayoutMethodDto>(`/driver/payout-methods/${id}/deactivate`, {}),
  requestDriverPayout: (amountPaisa: string, payoutMethodId: string, idempotencyKey: string) => apiClient.post<PayoutDto>("/driver/payouts", { amountPaisa, payoutMethodId, idempotencyKey }),
  driverPayouts: (status?: PayoutDto["status"]) => apiClient.get<{ payouts: PayoutDto[]; pagination: PaginationDto }>(`/driver/payouts${status ? `?status=${status}` : ""}`),
};
