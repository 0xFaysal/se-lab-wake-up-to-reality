import { apiClient } from "./api-client";
import type { EarningsSummaryDto, LedgerEntryDto, PaginationDto, PayoutDto, RefundDto, WalletDto } from "./marketplace-types";

export const financeApi = {
  wallet: () => apiClient.get<WalletDto>("/wallet"),
  walletTransactions: () => apiClient.get<LedgerEntryDto[]>("/wallet/transactions"),
  earnings: () => apiClient.get<EarningsSummaryDto>("/provider/earnings/summary"),
  earningsTransactions: () => apiClient.get<LedgerEntryDto[]>("/provider/earnings/transactions"),
  requestPayout: (amountPaisa: string, idempotencyKey: string) => apiClient.post<PayoutDto>("/provider/payouts", { amountPaisa, idempotencyKey }),
  providerPayouts: (status?: PayoutDto["status"]) => apiClient.get<{ payouts: PayoutDto[]; pagination: PaginationDto }>(`/provider/payouts${status ? `?status=${status}` : ""}`),
  providerPayout: (payoutId: string) => apiClient.get<PayoutDto>(`/provider/payouts/${payoutId}`),
  driverRefunds: (status?: RefundDto["status"]) => apiClient.get<{ refunds: RefundDto[]; pagination: PaginationDto }>(`/refunds${status ? `?status=${status}` : ""}`),
  driverRefund: (refundId: string) => apiClient.get<RefundDto>(`/refunds/${refundId}`),
};
