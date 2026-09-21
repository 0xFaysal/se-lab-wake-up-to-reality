"use client";

import { use, useRef } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const idempotencyKey = useRef(crypto.randomUUID());
  const booking = useQuery({ queryKey: queryKeys.bookings.detail(bookingId), queryFn: () => bookingsApi.driverDetail(bookingId) });
  const pay = useMutation({ mutationFn: () => bookingsApi.createPaymentSession(bookingId, idempotencyKey.current), onSuccess: (session) => window.location.assign(session.checkoutUrl) });
  if (booking.isPending) return <div className="py-24 text-center"><Loader2 className="mx-auto size-6 animate-spin" /></div>;
  if (booking.isError) return <div className="py-24 text-center">{getApiErrorMessage(booking.error)}</div>;
  const item = booking.data;
  return <div className="mx-auto max-w-xl space-y-5 px-4 sm:px-6">
    <Link href={`/driver/bookings/${bookingId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Booking details</Link>
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-6 py-5"><p className="text-xs font-bold uppercase text-emerald-700">Secure checkout</p><h1 className="mt-1 text-2xl font-extrabold">Pay for parking</h1><p className="mt-1 font-mono text-sm text-slate-500">{item.bookingCode}</p></div>
      <div className="space-y-5 p-6">
        <div className="flex items-end justify-between"><span className="text-sm text-slate-600">Total due</span><strong className="text-3xl">{formatBDTFromPaisa(item.totalAmountPaisa)}</strong></div>
        <div className="flex gap-3 border-y py-4 text-sm text-slate-600"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-emerald-700" /><p>You will continue to the SSLCOMMERZ hosted checkout. ParkEase never receives or stores your card, bank, or mobile-wallet credentials.</p></div>
        {item.status === "PAYMENT_PENDING" ? <Button className="w-full" size="lg" disabled={pay.isPending} onClick={() => pay.mutate()}>{pay.isPending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}Pay securely with SSLCOMMERZ</Button> : <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">This booking is no longer awaiting payment.</p>}
        {pay.isError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(pay.error)}</p>}
        <p className="text-center text-xs text-slate-500">Payment confirmation happens only after server-side gateway validation.</p>
      </div>
    </section>
  </div>;
}
