import { apiClient } from "./api-client";
import type { EarningsSummaryDto, LedgerEntryDto, PayoutDto, WalletDto } from "./marketplace-types";

export const financeApi = {
  wallet: () => apiClient.get<WalletDto>("/wallet"),
  walletTransactions: () => apiClient.get<LedgerEntryDto[]>("/wallet/transactions"),
  earnings: () => apiClient.get<EarningsSummaryDto>("/provider/earnings/summary"),
  earningsTransactions: () => apiClient.get<LedgerEntryDto[]>("/provider/earnings/transactions"),
  requestPayout: (amountPaisa: string, idempotencyKey: string) => apiClient.post<PayoutDto>("/provider/payouts", { amountPaisa, idempotencyKey }),
};
