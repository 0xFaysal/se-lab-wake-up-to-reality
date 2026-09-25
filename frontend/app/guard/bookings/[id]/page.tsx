"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarClock, CarFront, Clock3, MapPin, QrCode, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { Button as CanonicalButton } from "@/components/ui/button";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function GuardBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({ queryKey: queryKeys.bookings.guardDetail(id), queryFn: () => guardMarketplaceApi.booking(id) });
  if (query.isPending) return <div className="mx-auto max-w-4xl space-y-5" aria-busy="true"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-96 animate-pulse rounded-3xl bg-slate-200/70" /></div>;
  if (query.isError) return <section className="guard-panel mx-auto max-w-xl p-8 text-center" role="alert"><h1 className="text-xl font-bold">Booking could not be loaded</h1><p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(query.error)}</p><CanonicalButton type="button" variant="outline" className="mt-5 min-h-11" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</CanonicalButton></section>;
  const booking = query.data;
  const active = booking.status === "CHECKED_IN" || booking.status === "CHECKOUT_REQUESTED";
  const slot = booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Parking area";
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/guard/bookings" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"><ArrowLeft className="size-4" />Booking queue</Link>
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Arrival manifest</p><h1 className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{booking.bookingCode}</h1><p className="mt-2 text-sm text-slate-500">Review operational details before verification.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800">{booking.status.replaceAll("_", " ")}</span></header>

      <section className="guard-panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="bg-[var(--guard-ink)] p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/70">Assigned space</p><p className="mt-4 text-6xl font-semibold tracking-[-0.07em] text-emerald-200">{booking.parkingSpot.spotCode ?? slot}</p><p className="mt-5 flex items-start gap-2 text-sm text-white/65"><MapPin className="mt-0.5 size-4 shrink-0" />{booking.property.name}<br />{booking.property.publicArea}</p></div>
          <dl className="grid gap-px bg-[var(--guard-line)] sm:grid-cols-2">
            <Info icon={UserRound} label="Driver" value={booking.driver.fullName} />
            <Info icon={CarFront} label="Vehicle" value={`${booking.vehicle.registrationNumber} · ${[booking.vehicle.color, booking.vehicle.brand, booking.vehicle.model, vehicleLabels[booking.vehicle.vehicleType]].filter(Boolean).join(" · ")}`} />
            <Info icon={CalendarClock} label="Scheduled arrival" value={formatDateTime(booking.startAt)} />
            <Info icon={Clock3} label="Scheduled exit" value={formatDateTime(booking.scheduledEndAt)} />
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-indigo-800" /><div><h2 className="font-bold text-indigo-950">Identity and vehicle check required</h2><p className="mt-1 max-w-xl text-sm leading-6 text-indigo-950/65">The manifest is not an entry approval. Scan the driver’s current credential and match the registration before check-in.</p></div></div>{booking.status === "CONFIRMED" && <CanonicalButton render={<Link href="/guard/scan" />} size="lg" className="mt-4 min-h-12 w-full shrink-0 sm:mt-0 sm:w-auto"><QrCode className="size-5" />Verify credential <ArrowRight className="size-4" /></CanonicalButton>}{active && <CanonicalButton render={<Link href={`/guard/bookings/${booking.id}/active`} />} size="lg" className="mt-4 min-h-12 w-full shrink-0 sm:mt-0 sm:w-auto">Open live session <ArrowRight className="size-4" /></CanonicalButton>}</section>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="bg-white p-5 sm:p-6"><Icon className="size-5 text-emerald-800" /><dt className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-950">{value}</dd></div>;
}
