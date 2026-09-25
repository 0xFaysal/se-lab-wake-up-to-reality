"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";

export default function AdminRefundsPage() {
  const overview = useQuery({ queryKey: ["admin", "finance", "overview"], queryFn: adminOperationsApi.financeOverview });
  const gateway = useQuery({ queryKey: ["admin", "refunds", 1], queryFn: () => adminOperationsApi.refunds({ page: 1, limit: 20 }) });
  const error = overview.error ?? gateway.error;
  if (overview.isPending || gateway.isPending) return <div className="h-72 animate-pulse bg-slate-200" />;
  if (error || !overview.data || !gateway.data) return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-800">{getApiErrorMessage(error)}</div>;
  return <div className="space-y-7">
    <AdminPageHeader eyebrow="Finance" title="Refunds and Driver credits" description="External gateway refunds and internal Refund Balance credits are separate money movements." action={<Button variant="outline" size="sm" onClick={() => Promise.all([overview.refetch(), gateway.refetch()])}><RefreshCw className="size-4" />Refresh</Button>} />
    <section><h2 className="mb-3 text-sm font-bold">Driver Refund Balance credits</h2>{overview.data.recentRefundCredits.length === 0 ? <AdminEmptyState title="No Driver credits yet" description="Returned deposits and cancellation credits will appear here." /> : <div className="divide-y border border-slate-200 bg-white">{overview.data.recentRefundCredits.map((row) => <article key={row.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><strong className="text-sm">{row.ledgerTransaction.description}</strong><p className="mt-1 text-xs text-slate-500">{row.walletAccount?.user.fullName ?? "Driver"} · {formatDateTime(row.createdAt)}</p></div><strong className="text-emerald-800">+{formatBDTFromPaisa(row.amountPaisa)}</strong></article>)}</div>}</section>
    <section><h2 className="mb-1 text-sm font-bold">Gateway refunds</h2><p className="mb-3 text-xs text-slate-500">Only money sent back through the external payment provider appears here.</p>{gateway.data.refunds.length === 0 ? <AdminEmptyState title="No gateway refunds" description="This is expected when refunds were credited to the Driver Refund Balance instead." /> : <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Refund</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y">{gateway.data.refunds.map((row) => <tr key={String(row.id)}><td className="px-4 py-3 font-mono text-xs">{String(row.id)}</td><td className="px-4 py-3 font-semibold">{formatBDTFromPaisa(Number(row.amountPaisa ?? 0))}</td><td className="px-4 py-3">{String(row.reason ?? "—")}</td><td className="px-4 py-3"><AdminStatus value={String(row.status ?? "UNKNOWN")} /></td></tr>)}</tbody></table></div>}</section>
  </div>;
}
