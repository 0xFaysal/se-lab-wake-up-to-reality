"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { AdminFinanceMetric } from "@/components/admin/admin-finance-metric";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { formatBDTFromPaisa } from "@/lib/formatters";

export default function AdminReconciliationPage() {
  const query = useQuery({ queryKey: ["admin", "finance", "reconciliation"], queryFn: adminOperationsApi.reconciliation });
  if (query.isPending) return <div className="h-72 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  const data = query.data;
  return <div className="space-y-7">
    <AdminPageHeader eyebrow="Finance" title="Financial reconciliation" description="Wallet cache balances are checked against immutable ledger movements without changing money." action={<Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" />Refresh</Button>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminFinanceMetric icon={WalletCards} label="Wallets checked" value={data.checkedWallets} detail="Wallet accounts inspected" tone="blue" format="count" />
      <AdminFinanceMetric icon={data.discrepancyCount ? AlertTriangle : CheckCircle2} label="Balance mismatches" value={data.discrepancyCount} detail={data.discrepancyCount ? "Wallets requiring review" : "All wallet totals match their ledger entries"} tone={data.discrepancyCount ? "amber" : "emerald"} format="count" />
      <AdminFinanceMetric icon={ShieldCheck} label="Reserved for payouts" value={data.reservedPayoutPaisa} detail={`${data.pendingPayoutCount} payout request${data.pendingPayoutCount === 1 ? "" : "s"} in progress`} tone="slate" />
      <AdminFinanceMetric icon={AlertTriangle} label="Failed finance events" value={data.failedFinancialEvents.payments + data.failedFinancialEvents.refunds} detail={`${data.failedFinancialEvents.payments} payments · ${data.failedFinancialEvents.refunds} refunds`} tone={data.failedFinancialEvents.payments + data.failedFinancialEvents.refunds ? "amber" : "slate"} format="count" />
    </section>
    {data.discrepancies.length === 0 ? <AdminEmptyState title="All wallet balances reconcile" description="No difference exists between cached wallet balances and the ledger projection." /> : <div className="overflow-x-auto border border-red-200 bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-red-50 text-[11px] uppercase text-red-800"><tr><th className="px-4 py-3">Wallet</th><th className="px-4 py-3">Cached total</th><th className="px-4 py-3">Ledger total</th><th className="px-4 py-3">Difference</th></tr></thead><tbody className="divide-y">{data.discrepancies.map((row) => <tr key={row.walletAccountId}><td className="px-4 py-3 font-mono text-xs">{row.walletAccountId}</td><td className="px-4 py-3">{formatBDTFromPaisa(row.projectedPaisa)}</td><td className="px-4 py-3">{formatBDTFromPaisa(row.ledgerPaisa)}</td><td className="px-4 py-3 font-bold text-red-700">{formatBDTFromPaisa(row.differencePaisa)}</td></tr>)}</tbody></table></div>}
  </div>;
}
