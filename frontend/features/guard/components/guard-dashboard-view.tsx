"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button as CanonicalButton } from "@/components/ui/button";
import { Select as CanonicalSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { guardApi } from "@/lib/api/guard-api";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { GuardBookingDto } from "@/lib/api/marketplace-types";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export function GuardDashboardView() {
  const [propertyId, setPropertyId] = useState("ALL");
  const user = useCurrentUser();
  const assignments = useQuery({
    queryKey: queryKeys.guardAssignments.all({ limit: 100 }),
    queryFn: () => guardApi.listForGuard({ limit: 100 }),
  });
  const memberships = useQuery({
    queryKey: queryKeys.guardMemberships.all({ limit: 100 }),
    queryFn: () => guardApi.listMemberships({ limit: 100 }),
  });
  const bookings = useQuery({
    queryKey: queryKeys.bookings.guard({ limit: 100 }),
    queryFn: () => guardMarketplaceApi.bookings({ limit: 100 }),
    refetchInterval: 60_000,
  });

  const activeAssignments = assignments.data?.assignments.filter((item) => item.status === "ACTIVE") ?? [];
  const uniqueProperties = Array.from(new Map(activeAssignments.map((item) => [item.property.id, item.property])).values());
  const scoped = useMemo(() => (bookings.data?.bookings ?? []).filter((booking) => propertyId === "ALL" || booking.property.id === propertyId), [bookings.data, propertyId]);
  const upcoming = scoped.filter((booking) => booking.status === "CONFIRMED");
  const parked = scoped.filter((booking) => booking.status === "CHECKED_IN");
  const exits = scoped.filter((booking) => booking.status === "CHECKOUT_REQUESTED");
  const firstName = user.data?.fullName.split(/\s+/)[0] ?? "Guard";

  if (user.isPending || assignments.isPending || memberships.isPending || bookings.isPending) return <DashboardSkeleton />;
  if (user.isError || assignments.isError || memberships.isError || bookings.isError) {
    const error = user.error ?? assignments.error ?? memberships.error ?? bookings.error;
    return (
      <section className="guard-panel mx-auto max-w-2xl p-8 text-center" role="alert">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700"><ShieldCheck className="size-6" aria-hidden="true" /></div>
        <h1 className="mt-4 text-xl font-bold">Operations could not be loaded</h1>
        <p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(error)}</p>
        <CanonicalButton type="button" variant="outline" className="mt-5 min-h-11" onClick={() => void Promise.all([user.refetch(), assignments.refetch(), memberships.refetch(), bookings.refetch()])}><RefreshCw className="size-4" />Retry</CanonicalButton>
      </section>
    );
  }

  const pendingMemberships = memberships.data.memberships.filter((item) => item.status === "PENDING_ACCEPTANCE");
  const acceptedMemberships = memberships.data.memberships.filter((item) => item.status === "ACTIVE");
  if (activeAssignments.length === 0) {
    return <GuardAccessSetup firstName={firstName} pendingCount={pendingMemberships.length} acceptedCount={acceptedMemberships.length} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="overflow-hidden rounded-3xl bg-[var(--guard-ink)] p-6 text-white shadow-[0_24px_70px_rgba(6,63,50,0.16)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Live gate desk</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[2.8rem] lg:leading-[1.05]">Good {getDayPart()}, {firstName}. Keep arrivals moving.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Verify the driver first, match the vehicle and assigned space, then confirm the physical gate action.</p>
            </div>
            {uniqueProperties.length > 1 && (
              <label className="min-w-56 space-y-2 text-xs font-semibold text-emerald-100">
                <span>Operating property</span>
                <CanonicalSelect value={propertyId} onValueChange={(value) => value && setPropertyId(value)}>
                  <SelectTrigger className="min-h-11 border-white/15 bg-white/10 text-white hover:bg-white/15"><SelectValue /></SelectTrigger>
                  <SelectContent align="end"><SelectItem value="ALL">All assigned properties</SelectItem>{uniqueProperties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
                </CanonicalSelect>
              </label>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CanonicalButton render={<Link href="/guard/scan" />} size="lg" className="min-h-12 justify-between bg-emerald-300 px-5 text-emerald-950 hover:bg-emerald-200 sm:min-w-64">
              <span className="flex items-center gap-2"><QrCode className="size-5" aria-hidden="true" />Scan booking QR</span><ArrowRight className="size-4" aria-hidden="true" />
            </CanonicalButton>
            <CanonicalButton render={<Link href="/guard/bookings" />} size="lg" variant="outline" className="min-h-12 border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">Open booking queue</CanonicalButton>
          </div>
        </div>

        <div className={cn("guard-panel flex min-h-52 flex-col justify-between p-6", exits.length > 0 && "border-amber-300 bg-amber-50/80")}>
          <div className="flex items-start justify-between gap-3">
            <div className={cn("grid size-11 place-items-center rounded-2xl", exits.length > 0 ? "bg-amber-200 text-amber-950" : "bg-emerald-100 text-emerald-900")}>
              <LogOut className="size-5" aria-hidden="true" />
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", exits.length > 0 ? "bg-amber-200 text-amber-950" : "bg-slate-100 text-slate-600")}>{exits.length} waiting</span>
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Checkout requests</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{exits.length > 0 ? "A driver is ready at the exit. Confirm only after the vehicle has physically left." : "No vehicles are waiting for checkout."}</p>
            <Link href="/guard/bookings?status=CHECKOUT_REQUESTED" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-emerald-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800">Review exit queue <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Today at the gate</p><h2 id="today-heading" className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Operational pulse</h2></div>
          <p className="hidden text-sm text-slate-500 sm:block">Updates automatically when events arrive.</p>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric icon={CalendarClock} label="Expected arrivals" value={upcoming.length} hint="Next 24 hours" tone="blue" />
          <Metric icon={CarFront} label="Currently parked" value={parked.length} hint="Active sessions" tone="green" />
          <Metric icon={LogOut} label="Exit requested" value={exits.length} hint="Needs guard action" tone="amber" />
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <QueuePanel title="Upcoming arrivals" description="Paid bookings approaching the assigned gate." empty="You're all caught up. Upcoming verified bookings will appear here." bookings={upcoming.slice(0, 5)} />
        <QueuePanel title="Currently parked" description="Vehicles inside the property now." empty="No active parking sessions at this property." bookings={[...exits, ...parked].slice(0, 5)} compact />
      </section>
    </div>
  );
}

function GuardAccessSetup({ firstName, pendingCount, acceptedCount }: { firstName: string; pendingCount: number; acceptedCount: number }) {
  const waiting = pendingCount > 0;
  const accepted = !waiting && acceptedCount > 0;
  return <div className="mx-auto max-w-5xl space-y-6"><section className={cn("overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10", waiting ? "border-amber-200 bg-amber-50" : accepted ? "border-sky-200 bg-sky-50" : "border-emerald-900/10 bg-emerald-950 text-white")}><span className={cn("grid size-14 place-items-center rounded-2xl", waiting ? "bg-amber-200 text-amber-950" : accepted ? "bg-sky-100 text-sky-900" : "bg-white/10 text-emerald-200")}><ShieldCheck className="size-7" aria-hidden="true" /></span><p className={cn("mt-6 text-xs font-bold uppercase tracking-[0.18em]", waiting ? "text-amber-800" : accepted ? "text-sky-800" : "text-emerald-300")}>{waiting ? "Action required" : accepted ? "Provider action required" : "Gate access setup"}</p><h1 className={cn("mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl", waiting ? "text-amber-950" : accepted ? "text-sky-950" : "text-white")}>{waiting ? `${firstName}, accept your Property invitation.` : accepted ? `${firstName}, your Property is accepted.` : `${firstName}, you are not assigned to a gate yet.`}</h1><p className={cn("mt-3 max-w-2xl text-sm leading-6 sm:text-base", waiting ? "text-amber-900/75" : accepted ? "text-sky-900/75" : "text-white/65")}>{waiting ? `You have ${pendingCount} pending invitation${pendingCount === 1 ? "" : "s"}. Accept the correct Property first; then the Provider can activate your working shift.` : accepted ? `You are in ${acceptedCount} Property Guard pool${acceptedCount === 1 ? "" : "s"}. The Provider now needs to assign an active shift before bookings and QR operations become available.` : "A Provider must add you to a Property and assign an active shift before bookings or QR operations become available."}</p><CanonicalButton render={<Link href="/guard/assignments" />} size="lg" className={cn("mt-6 min-h-12", waiting && "bg-amber-900 text-white hover:bg-amber-800", accepted && "bg-sky-900 text-white hover:bg-sky-800")}>{waiting ? "Review invitations" : accepted ? "View accepted Properties" : "Check assignments"}<ArrowRight className="size-4" /></CanonicalButton></section><section className="guard-panel p-5 sm:p-6"><h2 className="font-black text-slate-950">How access becomes active</h2><ol className="mt-5 grid gap-3 sm:grid-cols-3"><SetupStep number="1" title="Property invitation" detail="Provider adds your Guard account." done={waiting || accepted} /><SetupStep number="2" title="You accept" detail="Open Assignments and confirm." done={accepted} current={waiting} /><SetupStep number="3" title="Provider shift" detail="Provider activates your gate access." current={accepted} /></ol></section></div>;
}

function SetupStep({ number, title, detail, done = false, current = false }: { number: string; title: string; detail: string; done?: boolean; current?: boolean }) {
  return <li className={cn("rounded-2xl border p-4", current ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white")}><span className={cn("grid size-8 place-items-center rounded-full text-xs font-black", done ? "bg-emerald-800 text-white" : current ? "bg-amber-300 text-amber-950" : "bg-slate-100 text-slate-500")}>{done ? <CheckCircle2 className="size-4" /> : number}</span><strong className="mt-3 block text-sm text-slate-950">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></li>;
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Clock3; label: string; value: number; hint: string; tone: "blue" | "green" | "amber" }) {
  const tones = { blue: "bg-indigo-50 text-indigo-800", green: "bg-emerald-50 text-emerald-900", amber: "bg-amber-50 text-amber-900" };
  return <div className="guard-panel flex items-center gap-4 p-5"><span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", tones[tone])}><Icon className="size-5" aria-hidden="true" /></span><div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{value}</dd><p className="text-[0.7rem] text-slate-400">{hint}</p></div></div>;
}

function QueuePanel({ title, description, empty, bookings, compact = false }: { title: string; description: string; empty: string; bookings: GuardBookingDto[]; compact?: boolean }) {
  return (
    <section className="guard-panel overflow-hidden" aria-labelledby={`${title.replaceAll(" ", "-").toLowerCase()}-heading`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--guard-line)] px-5 py-5 sm:px-6">
        <div><h2 id={`${title.replaceAll(" ", "-").toLowerCase()}-heading`} className="font-bold">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
        <Link href="/guard/bookings" className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800">View all</Link>
      </div>
      {bookings.length === 0 ? (
        <div className="px-6 py-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-5" aria-hidden="true" /></span><p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">{empty}</p></div>
      ) : (
        <ol className="divide-y divide-[var(--guard-line)]">
          {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} compact={compact} />)}
        </ol>
      )}
    </section>
  );
}

function BookingRow({ booking, compact }: { booking: GuardBookingDto; compact: boolean }) {
  const checkout = booking.status === "CHECKOUT_REQUESTED";
  const spot = booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Parking area";
  return (
    <li>
      <Link href={booking.status === "CONFIRMED" ? `/guard/bookings/${booking.id}` : `/guard/bookings/${booking.id}/active`} className="group grid min-h-24 gap-4 px-5 py-4 transition-colors hover:bg-emerald-50/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-800 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <span className={cn("grid size-11 place-items-center rounded-2xl", checkout ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700")}><CarFront className="size-5" aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-950">{booking.vehicle.registrationNumber}</strong><span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-bold", checkout ? "bg-amber-100 text-amber-900" : booking.status === "CHECKED_IN" ? "bg-emerald-100 text-emerald-900" : "bg-indigo-50 text-indigo-800")}>{booking.status.replaceAll("_", " ")}</span></span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>{booking.driver.fullName}</span><span className="flex items-center gap-1"><MapPin className="size-3" aria-hidden="true" />{spot}</span>{!compact && <span className="flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />{formatDateTime(booking.startAt)}</span>}</span>
        </span>
        <span className="hidden items-center gap-1 text-xs font-bold text-emerald-900 sm:flex">Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return <div className="space-y-6" aria-busy="true" aria-label="Loading guard operations"><div className="h-80 animate-pulse rounded-3xl bg-emerald-950/10" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />)}</div><div className="grid gap-5 xl:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />)}</div></div>;
}

function getDayPart() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(new Date()));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
