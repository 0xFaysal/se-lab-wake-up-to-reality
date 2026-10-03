"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { refundStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function RefundDetailPage({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = use(params);
  const query = useQuery({ queryKey: queryKeys.refunds.detail(refundId), queryFn: () => financeApi.driverRefund(refundId) });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="mx-auto max-w-3xl rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  const refund = query.data;
  const status = refundStatus[refund.status];
  const typeLabel =
    refund.refundType === "DEPOSIT_RETURN"
      ? "Security Deposit Return"
      : refund.refundType === "CANCELLATION_REFUND"
        ? "Booking Cancellation Refund"
        : "Payment Adjustment / Refund";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
      <Link href="/driver/refunds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
        <ArrowLeft className="size-4" />Back to Refund History
      </Link>

      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-700">{typeLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              +{formatBDTFromPaisa(refund.amountPaisa)}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Credited to your ParkEase Wallet Balance · {formatDateTime(refund.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {refund.payment?.booking.id && (
            <Button variant="outline" nativeButton={false} render={<Link href={`/driver/bookings/${refund.payment.booking.id}`} />}>
              View Booking<ArrowUpRight className="size-4" />
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/driver/wallet" />}>
            <WalletCards className="size-4" />Open Wallet
          </Button>
        </div>
      </header>

      <section className="grid gap-6 rounded-lg border bg-white p-6 sm:grid-cols-2">
        <Info label="Booking Code" value={refund.payment?.booking.bookingCode ?? "Unavailable"} mono />
        <Info label="Property" value={refund.payment?.booking.property.name ?? "Unavailable"} />
        <Info label="Refund Type" value={typeLabel} />
        <Info label="Destination" value="ParkEase Wallet Balance (Ready to use or withdraw)" />
        {refund.depositReturnPaisa !== undefined && BigInt(refund.depositReturnPaisa || "0") > BigInt(0) && (
          <Info label="Security Deposit Returned" value={formatBDTFromPaisa(refund.depositReturnPaisa)} />
        )}
        {refund.bookingRefundPaisa !== undefined && BigInt(refund.bookingRefundPaisa || "0") > BigInt(0) && (
          <Info label="Parking Charge Refunded" value={formatBDTFromPaisa(refund.bookingRefundPaisa)} />
        )}
        <Info label="Initiated At" value={formatDateTime(refund.createdAt)} />
        <Info label="Completed At" value={refund.processedAt ? formatDateTime(refund.processedAt) : "Pending"} />
        <div className="sm:col-span-2 border-t pt-4">
          <Info label="Refund Reason & Details" value={refund.reason} />
        </div>
      </section>

      <aside className="flex items-start gap-3 border-l-4 border-emerald-600 bg-emerald-50 p-4 text-xs leading-5 text-emerald-950">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
        <p>
          This refund has been credited to your ParkEase Wallet Balance. It will be automatically applied to your next parking reservation, or you can withdraw it directly to your bank or MFS account from the Wallet page.
        </p>
      </aside>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-800 ${mono ? "font-mono font-bold" : ""}`}>{value}</p>
    </div>
  );
}
