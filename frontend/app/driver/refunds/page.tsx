"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CheckCircle2, ReceiptText, RefreshCw, ShieldCheck, Undo2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { RefundDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { refundStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

function refundTypeBadge(type?: RefundDto["refundType"]) {
  if (type === "DEPOSIT_RETURN") {
    return { label: "Deposit Return", className: "bg-teal-50 text-teal-800 border border-teal-200" };
  }
  if (type === "CANCELLATION_REFUND") {
    return { label: "Cancellation Refund", className: "bg-amber-50 text-amber-800 border border-amber-200" };
  }
  return { label: "Payment Refund", className: "bg-blue-50 text-blue-800 border border-blue-200" };
}

export default function RefundsPage() {
  const query = useQuery({
    queryKey: queryKeys.refunds.driver(),
    queryFn: () => financeApi.driverRefunds(),
  });

  const refunds = query.data?.refunds ?? [];
  const succeededRefunds = refunds.filter((r) => r.status === "SUCCEEDED");

  const totalRefundedPaisa = succeededRefunds.reduce(
    (acc, r) => acc + BigInt(r.amountPaisa || "0"),
    BigInt(0)
  );

  const totalDepositReturnedPaisa = succeededRefunds.reduce((acc, r) => {
    if (r.depositReturnPaisa !== undefined) {
      return acc + BigInt(r.depositReturnPaisa || "0");
    }
    return r.refundType === "DEPOSIT_RETURN" ? acc + BigInt(r.amountPaisa || "0") : acc;
  }, BigInt(0));

  const totalBookingRefundPaisa = totalRefundedPaisa - totalDepositReturnedPaisa;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-700">Money</p>
          <h1 className="mt-2 text-3xl font-extrabold">Refund History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track returned security deposits, booking cancellation refunds, and payment adjustments credited to your ParkEase Wallet Balance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/driver/wallet" />}>
            <WalletCards className="size-4" />Refund Balance &amp; Wallet
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/driver/payments" />}>
            Payment History<ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* Summary Metrics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border bg-white p-5">
          <Undo2 className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Total Refunded</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-800">
            {formatBDTFromPaisa(totalRefundedPaisa.toString())}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Credited across {succeededRefunds.length} {succeededRefunds.length === 1 ? "refund" : "refunds"}
          </p>
        </div>
        <div className="border bg-white p-5">
          <CheckCircle2 className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Security Deposits Returned</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatBDTFromPaisa(totalDepositReturnedPaisa.toString())}
          </p>
          <p className="mt-2 text-xs text-slate-500">Unused refundable deposits after checkout or settlement</p>
        </div>
        <div className="border bg-white p-5">
          <ReceiptText className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Cancellation &amp; Fee Refunds</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatBDTFromPaisa(totalBookingRefundPaisa.toString())}
          </p>
          <p className="mt-2 text-xs text-slate-500">Refunded parking charges from cancellations or disputes</p>
        </div>
      </section>

      {/* Refund List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Refund Records</h2>
          <span className="text-xs text-slate-500">{refunds.length} records</span>
        </div>

        {query.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-md border bg-slate-100" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="rounded-md border border-rose-200 bg-white p-6 text-center">
            <p role="alert" className="text-sm font-semibold text-rose-700">{getApiErrorMessage(query.error)}</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void query.refetch()}>
              <RefreshCw className="size-4" />Try again
            </Button>
          </div>
        ) : refunds.length === 0 ? (
          <div className="border bg-white p-12 text-center rounded-lg">
            <ReceiptText className="mx-auto size-8 text-slate-400" />
            <h3 className="mt-3 text-base font-bold">No refunds yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              When your refundable security deposit is returned after a session or you cancel an eligible booking, the refund record will appear here.
            </p>
            <Link
              href="/driver/payments"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-bold text-white hover:bg-[#003527]"
            >
              View payments
            </Link>
          </div>
        ) : (
          <div className="divide-y border bg-white rounded-lg overflow-hidden shadow-2xs">
            {refunds.map((refund) => {
              const status = refundStatus[refund.status];
              const category = refundTypeBadge(refund.refundType);

              return (
                <article
                  key={refund.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-sm text-slate-900">
                        {refund.payment?.booking.bookingCode ?? refund.id}
                      </strong>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${category.className}`}>
                        {category.label}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{formatDateTime(refund.createdAt)}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {refund.payment?.booking.property.name ?? "Parking reservation"}
                    </p>

                    <p className="text-xs text-slate-600">{refund.reason}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                        <WalletCards className="size-3 text-emerald-700" />
                        Credited to Wallet Balance
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 border-t pt-3 sm:border-0 sm:pt-0">
                    <div className="sm:text-right">
                      <span className="text-[11px] font-medium text-slate-400 block">Refunded amount</span>
                      <strong className="text-base font-extrabold font-mono text-emerald-800">
                        +{formatBDTFromPaisa(refund.amountPaisa)}
                      </strong>
                    </div>

                    <Link
                      href={`/driver/refunds/${refund.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#064E3B] hover:underline"
                    >
                      View details <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Refund Policy Notice */}
      <aside className="border-l-4 border-emerald-600 bg-emerald-50 p-5 text-sm text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="size-5 shrink-0 text-emerald-700 mt-0.5" />
        <div>
          <h3 className="font-bold">How Refunds &amp; Deposits Work</h3>
          <p className="mt-1 text-xs leading-5 text-emerald-900/90">
            Unused security deposits and eligible cancellation refunds are credited immediately to your ParkEase Wallet Balance. You can use this balance automatically on your next booking or withdraw it anytime to your bank or mobile wallet (bKash, Nagad, Rocket).
          </p>
        </div>
      </aside>
    </div>
  );
}
