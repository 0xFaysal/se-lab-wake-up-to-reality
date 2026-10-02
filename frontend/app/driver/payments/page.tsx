"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CheckCircle2, CreditCard, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function DriverPaymentsPage() {
  const query = useQuery({
    queryKey: queryKeys.bookings.driver(),
    queryFn: bookingsApi.driverList,
  });

  const bookings = query.data ?? [];
  const paidBookings = bookings.filter((b) =>
    ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED", "COMPLETED", "NO_SHOW"].includes(b.status)
  );

  const totalSpentPaisa = paidBookings.reduce(
    (acc, b) => acc + BigInt(b.totalAmountPaisa || "0"),
    BigInt(0)
  );

  const totalGatewayPaisa = paidBookings.reduce(
    (acc, b) => acc + BigInt(b.gatewayAmountPaisa || "0"),
    BigInt(0)
  );

  const totalWalletPaisa = paidBookings.reduce(
    (acc, b) => acc + BigInt(b.driverWalletAppliedPaisa || "0"),
    BigInt(0)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-700">Money</p>
          <h1 className="mt-2 text-3xl font-extrabold">Payment History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review all completed transactions, gateway payments, and balance deductions for your parking reservations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/driver/wallet" />}>
            <WalletCards className="size-4" />Refund Balance &amp; Wallet
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/driver/payment-methods" />}>
            Payout methods<ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* Summary Metrics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border bg-white p-5">
          <CreditCard className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Total Paid</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBDTFromPaisa(totalSpentPaisa.toString())}</p>
          <p className="mt-2 text-xs text-slate-500">
            Combined total across {paidBookings.length} paid {paidBookings.length === 1 ? "booking" : "bookings"}
          </p>
        </div>
        <div className="border bg-white p-5">
          <CheckCircle2 className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Total Paid via SSLCOMMERZ</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBDTFromPaisa(totalGatewayPaisa.toString())}</p>
          <p className="mt-2 text-xs text-slate-500">Portion paid via card / MFS gateway</p>
        </div>
        <div className="border bg-white p-5">
          <WalletCards className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Total Paid via Wallet Balance</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatBDTFromPaisa(totalWalletPaisa.toString())}
          </p>
          <p className="mt-2 text-xs text-slate-500">Portion paid using your Refund / Wallet credit</p>
        </div>
      </section>

      {/* Payment Transactions List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Booking Payments</h2>
          <span className="text-xs text-slate-500">{paidBookings.length} records</span>
        </div>

        {query.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse border bg-slate-100 rounded-md" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="rounded-md border border-rose-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-rose-700">{getApiErrorMessage(query.error)}</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}>
              <RefreshCw className="size-4" />Try again
            </Button>
          </div>
        ) : paidBookings.length === 0 ? (
          <div className="border bg-white p-12 text-center rounded-lg">
            <CreditCard className="mx-auto size-8 text-slate-400" />
            <h3 className="mt-3 text-base font-bold">No payment records yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Once you reserve and pay for parking, your receipts and transaction breakdowns will appear here.
            </p>
            <Link
              href="/driver/parking"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2 text-sm font-bold text-white hover:bg-[#003527]"
            >
              Search parking spaces
            </Link>
          </div>
        ) : (
          <div className="divide-y border bg-white rounded-lg overflow-hidden shadow-2xs">
            {paidBookings.map((booking) => {
              const status = bookingStatus[booking.status];
              const hasWalletApplied = BigInt(booking.driverWalletAppliedPaisa || "0") > BigInt(0);
              const hasGatewayPaid = BigInt(booking.gatewayAmountPaisa || "0") > BigInt(0);

              return (
                <article
                  key={booking.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <strong className="font-mono text-sm text-slate-900">{booking.bookingCode}</strong>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{formatDateTime(booking.createdAt)}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {booking.property?.name ?? booking.listing?.title ?? "Parking reservation"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                      <span className="text-slate-400 font-medium">Paid via:</span>
                      {hasGatewayPaid && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <CreditCard className="size-3 text-slate-500" />
                          SSLCOMMERZ {formatBDTFromPaisa(booking.gatewayAmountPaisa)}
                        </span>
                      )}
                      {hasGatewayPaid && hasWalletApplied && (
                        <span className="text-slate-400 font-bold">+</span>
                      )}
                      {hasWalletApplied && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <WalletCards className="size-3 text-slate-500" />
                          Wallet Balance {formatBDTFromPaisa(booking.driverWalletAppliedPaisa)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 border-t pt-3 sm:border-0 sm:pt-0">
                    <div className=" sm:text-right">
                      <span className="text-[11px] font-medium text-slate-400 block">Total paid</span>
                      <strong className="text-base font-extrabold font-mono text-slate-900">
                        {formatBDTFromPaisa(booking.totalAmountPaisa)}
                      </strong>
                    </div>

                    <Link
                      href={`/driver/bookings/${booking.id}`}
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

      {/* Security Notice */}
      <aside className="border-l-4 border-emerald-600 bg-emerald-50 p-5 text-sm text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="size-5 shrink-0 text-emerald-700 mt-0.5" />
        <div>
          <h3 className="font-bold">Payment Protection &amp; Guarantees</h3>
          <p className="mt-1 text-xs leading-5 text-emerald-900/90">
            All gateway payments are processed over TLS encryption via SSLCOMMERZ. Unused refundable deposits and cancellation credits return directly to your Refund Balance upon checkout.
          </p>
        </div>
      </aside>
    </div>
  );
}
