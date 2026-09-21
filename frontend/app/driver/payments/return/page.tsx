"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleX, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

const finalStatuses = new Set(["SUCCEEDED", "CAPTURED", "FAILED", "CANCELLED", "EXPIRED"]);

export default function PaymentReturnPage() {
  return <Suspense fallback={<div className="py-24 text-center"><Loader2 className="mx-auto size-8 animate-spin text-emerald-700" /></div>}><PaymentReturnContent /></Suspense>;
}

function PaymentReturnContent() {
  const params = useSearchParams();
  const paymentId = params.get("paymentId");
  const result = params.get("result");
  const query = useQuery({ queryKey: ["payment-return", paymentId], queryFn: () => bookingsApi.payment(paymentId!), enabled: Boolean(paymentId), refetchInterval: (state) => state.state.data && finalStatuses.has(state.state.data.status) ? false : 2000, retry: 4 });
  const payment = query.data;
  const succeeded = payment && ["SUCCEEDED", "CAPTURED"].includes(payment.status);
  const failed = result === "failed" || result === "cancelled" || (payment && ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status));
  return <div className="mx-auto max-w-lg px-4 py-16 text-center"><section className="rounded-lg border bg-white p-8 shadow-sm">
    {succeeded ? <CheckCircle2 className="mx-auto size-12 text-emerald-700" /> : failed || query.isError ? <CircleX className="mx-auto size-12 text-red-600" /> : query.isFetching ? <Loader2 className="mx-auto size-12 animate-spin text-emerald-700" /> : <Clock3 className="mx-auto size-12 text-amber-600" />}
    <h1 className="mt-4 text-2xl font-extrabold">{succeeded ? "Payment confirmed" : failed ? "Payment was not completed" : "Verifying your payment"}</h1>
    <p className="mt-2 text-sm text-slate-600">{succeeded ? "The gateway validated your payment and your booking is confirmed." : failed ? "No successful payment was recorded. You can safely try again." : query.isError ? getApiErrorMessage(query.error) : "Please keep this page open while ParkEase checks the gateway response."}</p>
    <Link href={payment?.bookingId ? `/driver/bookings/${payment.bookingId}` : "/driver/bookings"}><Button className="mt-6 w-full">View bookings</Button></Link>
  </section></div>;
}
