"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CircleDollarSign, Clock3, RefreshCw, RotateCcw, WalletCards } from "lucide-react";
import { AdminFinanceMetric } from "@/components/admin/admin-finance-metric";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";

export default function AdminEarningsPage() {
  const query = useQuery({ queryKey: ["admin", "finance", "overview"], queryFn: adminOperationsApi.financeOverview });
  if (query.isPending) return <div className="h-72 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  const data = query.data;
  return <div className="space-y-7">
    <AdminPageHeader eyebrow="Finance" title="Platform earnings" description="Captured payments split into held booking funds, Provider earnings, Driver refunds, and ParkEase revenue." action={<Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" />Refresh</Button>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AdminFinanceMetric icon={CircleDollarSign} label="Captured through gateway" value={data.captured.amountPaisa} detail={`${data.captured.count} successful payment${data.captured.count === 1 ? "" : "s"}`} tone="blue" />
      <AdminFinanceMetric icon={Clock3} label="Booking funds currently held" value={data.ledger.heldBookingFundsPaisa} detail="Paid bookings awaiting cancellation or final settlement" tone="amber" />
      <AdminFinanceMetric icon={Banknote} label="ParkEase revenue earned" value={data.ledger.platformRevenuePaisa} detail="Platform fees recognized by the ledger" />
      <AdminFinanceMetric icon={WalletCards} label="Provider payable" value={data.ledger.providerPayablePaisa} detail={`${formatBDTFromPaisa(data.providerWallets.availablePaisa)} currently available in Provider wallets`} />
      <AdminFinanceMetric icon={RotateCcw} label="Driver refund balance" value={data.ledger.driverRefundLiabilityPaisa} detail={`${formatBDTFromPaisa(data.driverWallets.availablePaisa)} currently available to Drivers`} tone="slate" />
      <AdminFinanceMetric icon={RotateCcw} label="Returned through gateway" value={data.gatewayRefunds.amountPaisa} detail={`${data.gatewayRefunds.count} external refund${data.gatewayRefunds.count === 1 ? "" : "s"}`} tone="slate" />
    </section>
    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Recent settlements</h2><Link href="/admin/ledger" className="text-xs font-bold text-emerald-800 hover:underline">Open ledger</Link></div>
      {data.recentSettlements.length === 0 ? <AdminEmptyState title="No bookings have settled" description="Completed, cancelled, and no-show bookings will appear here after their financial settlement." /> : <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Provider earned</th><th className="px-4 py-3">Platform earned</th><th className="px-4 py-3">Driver returned</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentSettlements.map((row) => <tr key={row.id}><td className="px-4 py-3"><Link href={`/admin/bookings/${row.booking.id}`} className="font-bold text-emerald-800 hover:underline">{row.booking.bookingCode}</Link><span className="mt-1 block text-xs text-slate-500">{row.booking.property.name} · {formatDateTime(row.completedAt ?? row.createdAt)}</span></td><td className="px-4 py-3">{row.booking.provider.fullName}</td><td className="px-4 py-3 font-semibold">{formatBDTFromPaisa(row.providerNetPaisa)}</td><td className="px-4 py-3 font-semibold">{formatBDTFromPaisa(row.platformRevenuePaisa)}</td><td className="px-4 py-3 font-semibold">{formatBDTFromPaisa(row.driverRefundCreditPaisa)}</td><td className="px-4 py-3"><AdminStatus value={row.status} /></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
