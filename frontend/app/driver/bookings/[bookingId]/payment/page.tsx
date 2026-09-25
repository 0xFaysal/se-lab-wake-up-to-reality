"use client";

import { use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const booking = useQuery({ queryKey: queryKeys.bookings.detail(bookingId), queryFn: () => bookingsApi.driverDetail(bookingId) });
  const pay = useMutation({ mutationFn: () => bookingsApi.createPaymentSession(bookingId, idempotencyKey.current), onSuccess: (session) => {
    if (session.checkoutUrl) window.location.assign(session.checkoutUrl);
    else router.push(`/driver/payments/return?paymentId=${encodeURIComponent(session.paymentId)}`);
  }, onError: () => { idempotencyKey.current = crypto.randomUUID(); } });
  if (booking.isPending) return <div className="py-24 text-center"><Loader2 className="mx-auto size-6 animate-spin" /></div>;
  if (booking.isError) return <div className="py-24 text-center">{getApiErrorMessage(booking.error)}</div>;
  const item = booking.data;
  return <div className="mx-auto max-w-xl space-y-5 px-4 sm:px-6">
    <Link href={`/driver/bookings/${bookingId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Booking details</Link>
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-6 py-5"><p className="text-xs font-bold uppercase text-emerald-700">Secure checkout</p><h1 className="mt-1 text-2xl font-extrabold">Pay for parking</h1><p className="mt-1 font-mono text-sm text-slate-500">{item.bookingCode}</p></div>
      <div className="space-y-5 p-6">
        <div className="space-y-3 border-y py-4 text-sm"><MoneyRow label="Parking" value={item.baseAmountPaisa} /><MoneyRow label="Platform fee" value={item.platformFeePaisa} /><MoneyRow label="Refundable deposit" value={item.depositPaisa} /><MoneyRow label="Refund Balance applied" value={item.driverWalletAppliedPaisa} negative /><div className="flex items-end justify-between border-t pt-3"><span className="font-semibold">Remaining to pay</span><strong className="text-2xl">{formatBDTFromPaisa(item.gatewayAmountPaisa)}</strong></div></div>
        <div className="flex gap-3 bg-emerald-50 p-4 text-sm text-emerald-950"><LockKeyhole className="mt-0.5 size-5 shrink-0" /><p>Refund Balance is reserved only when you continue. Any gateway failure or cancellation releases it automatically.</p></div>
        {item.canPay ? <Button className="w-full" size="lg" disabled={pay.isPending} onClick={() => pay.mutate()}>{pay.isPending ? <Loader2 className="size-4 animate-spin" /> : item.gatewayAmountPaisa === "0" ? <LockKeyhole className="size-4" /> : <ExternalLink className="size-4" />}{item.gatewayAmountPaisa === "0" ? "Confirm with Refund Balance" : `Pay ${formatBDTFromPaisa(item.gatewayAmountPaisa)} with SSLCOMMERZ`}</Button> : <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">The payment window has closed or this booking is no longer awaiting payment.</p>}
        {pay.isError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(pay.error)}</p>}
        <p className="text-center text-xs text-slate-500">Payment confirmation happens only after server-side gateway validation.</p>
      </div>
    </section>
  </div>;
}

function MoneyRow({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return <div className="flex justify-between gap-4 text-slate-600"><span>{label}</span><span className={negative && value !== "0" ? "font-semibold text-emerald-700" : "font-semibold text-slate-900"}>{negative && value !== "0" ? "-" : ""}{formatBDTFromPaisa(value)}</span></div>;
}
