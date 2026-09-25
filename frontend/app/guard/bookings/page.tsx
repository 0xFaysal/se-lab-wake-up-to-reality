"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CarFront, ChevronLeft, ChevronRight, MapPin, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { Button as CanonicalButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guardApi } from "@/lib/api/guard-api";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { GuardBookingDto } from "@/lib/api/marketplace-types";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const statuses = ["ALL", "CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"] as const;

function GuardBookingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = statuses.includes(statusParam as typeof statuses[number]) ? statusParam as typeof statuses[number] : "ALL";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const filters = { ...(status !== "ALL" ? { status: status as GuardBookingDto["status"] } : {}), page, limit: 20 };
  const query = useQuery({ queryKey: queryKeys.bookings.guard(filters), queryFn: () => guardMarketplaceApi.bookings(filters) });
  const assignments = useQuery({ queryKey: queryKeys.guardAssignments.all({ limit: 100 }), queryFn: () => guardApi.listForGuard({ limit: 100 }) });
  const memberships = useQuery({ queryKey: queryKeys.guardMemberships.all({ limit: 100 }), queryFn: () => guardApi.listMemberships({ limit: 100 }) });

  const items = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("en-BD");
    if (!needle) return query.data?.bookings ?? [];
    return (query.data?.bookings ?? []).filter((item) => [item.bookingCode, item.driver.fullName, item.vehicle.registrationNumber, item.property.name, item.parkingSpot.spotCode, item.parkingSpot.displayName].filter(Boolean).some((value) => String(value).toLocaleLowerCase("en-BD").includes(needle)));
  }, [query.data, search]);

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Assigned operations</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Booking queue</h1><p className="mt-2 text-sm text-slate-500">Only bookings within your active property and provider assignments are shown.</p></div><CanonicalButton render={<Link href="/guard/scan" />} size="lg" className="min-h-11"><CarFront className="size-4" />Verify arrival</CanonicalButton></header>

      <section className="guard-panel p-4 sm:p-5" aria-label="Booking filters">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter bookings by status">
            {statuses.map((item) => <button type="button" key={item} onClick={() => updateParams({ status: item === "ALL" ? null : item, page: null })} aria-pressed={status === item} className={cn("min-h-10 shrink-0 rounded-xl border px-3 text-xs font-bold transition-colors hover:border-emerald-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800", status === item ? "border-emerald-900 bg-emerald-900 text-white" : "border-[var(--guard-line)] bg-white text-slate-600")}>{statusLabel(item)}</button>)}
          </div>
          <label className="relative block w-full lg:max-w-sm"><span className="sr-only">Search current booking page</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} onBlur={() => updateParams({ q: search.trim() || null })} placeholder="Booking, driver or registration" className="min-h-11 bg-slate-50 pl-10 pr-10" />{search && <button type="button" aria-label="Clear booking search" onClick={() => { setSearch(""); updateParams({ q: null }); }} className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"><X className="size-4" /></button>}</label>
        </div>
      </section>

      {query.isPending || assignments.isPending || memberships.isPending ? <BookingsSkeleton /> : query.isError || assignments.isError || memberships.isError ? (
        <section className="guard-panel p-8 text-center" role="alert"><p className="font-bold text-red-800">Bookings could not be loaded</p><p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(query.error ?? assignments.error ?? memberships.error)}</p><CanonicalButton type="button" variant="outline" className="mt-5 min-h-11" onClick={() => void Promise.all([query.refetch(), assignments.refetch(), memberships.refetch()])}><RefreshCw className="size-4" />Retry</CanonicalButton></section>
      ) : items.length === 0 ? (
        <BookingEmptyState search={search} status={status} activeAssignmentCount={assignments.data.assignments.filter((item) => item.status === "ACTIVE").length} pendingMembershipCount={memberships.data.memberships.filter((item) => item.status === "PENDING_ACCEPTANCE").length} acceptedMembershipCount={memberships.data.memberships.filter((item) => item.status === "ACTIVE").length} onClear={() => { setSearch(""); updateParams({ q: null }); }} />
      ) : (
        <section className="guard-panel overflow-hidden" aria-label="Guard booking results">
          <div className="hidden grid-cols-[9rem_minmax(12rem,1.3fr)_minmax(11rem,1fr)_12rem_9rem] gap-4 border-b border-[var(--guard-line)] bg-slate-50 px-6 py-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500 md:grid"><span>Booking</span><span>Driver & vehicle</span><span>Property</span><span>Time</span><span>Status</span></div>
          <ol className="divide-y divide-[var(--guard-line)]">{items.map((item) => <BookingItem key={item.id} booking={item} />)}</ol>
          {query.data.pagination.totalPages > 1 && <nav aria-label="Booking pages" className="flex items-center justify-between gap-4 border-t border-[var(--guard-line)] px-5 py-4"><p className="text-xs text-slate-500">Page {query.data.pagination.page} of {query.data.pagination.totalPages} · {query.data.pagination.total} bookings</p><div className="flex gap-2"><CanonicalButton type="button" size="icon" variant="outline" aria-label="Previous booking page" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}><ChevronLeft className="size-4" /></CanonicalButton><CanonicalButton type="button" size="icon" variant="outline" aria-label="Next booking page" disabled={page >= query.data.pagination.totalPages} onClick={() => updateParams({ page: String(page + 1) })}><ChevronRight className="size-4" /></CanonicalButton></div></nav>}
        </section>
      )}
    </div>
  );
}

function BookingEmptyState({ search, status, activeAssignmentCount, pendingMembershipCount, acceptedMembershipCount, onClear }: { search: string; status: typeof statuses[number]; activeAssignmentCount: number; pendingMembershipCount: number; acceptedMembershipCount: number; onClear: () => void }) {
  if (!search && activeAssignmentCount === 0) {
    const waiting = pendingMembershipCount > 0;
    const accepted = !waiting && acceptedMembershipCount > 0;
    return <section className={cn("guard-panel border px-6 py-12 text-center", waiting && "border-amber-200 bg-amber-50/70", accepted && "border-sky-200 bg-sky-50/70")}><span className={cn("mx-auto grid size-14 place-items-center rounded-2xl", waiting ? "bg-amber-200 text-amber-950" : accepted ? "bg-sky-100 text-sky-900" : "bg-emerald-50 text-emerald-800")}><ShieldCheck className="size-6" /></span><h2 className="mt-4 text-lg font-black text-slate-950">{waiting ? "Accept your Property invitation first" : accepted ? "Property accepted — waiting for a shift" : "No active gate assignment"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{waiting ? `You have ${pendingMembershipCount} invitation${pendingMembershipCount === 1 ? "" : "s"} waiting. After you accept, the Provider must assign a working shift before bookings appear.` : accepted ? "Your Property membership is active. The Provider must now assign your working shift before bookings appear." : "Ask the Provider to add you to a Property and activate a shift. A Guard account by itself does not grant booking access."}</p><CanonicalButton render={<Link href="/guard/assignments" />} className="mt-5 min-h-11">{waiting ? "Review invitations" : "Open assignments"}<ArrowRight className="size-4" /></CanonicalButton></section>;
  }
  return <section className="guard-panel px-6 py-14 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><CalendarClock className="size-6" /></span><h2 className="mt-4 text-lg font-bold">{search ? "No matching bookings" : status === "CHECKOUT_REQUESTED" ? "No checkout requests" : "No booking operations"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{search ? "Clear the search or check another status." : status === "CHECKOUT_REQUESTED" ? "No vehicles are waiting for checkout." : "Your shift is active. Eligible bookings will appear here when drivers complete payment."}</p>{search && <CanonicalButton type="button" variant="outline" className="mt-5" onClick={onClear}>Clear search</CanonicalButton>}</section>;
}

function BookingItem({ booking }: { booking: GuardBookingDto }) {
  const href = booking.status === "CONFIRMED" ? `/guard/bookings/${booking.id}` : `/guard/bookings/${booking.id}/active`;
  const vehicle = [booking.vehicle.color, booking.vehicle.brand, booking.vehicle.model, vehicleLabels[booking.vehicle.vehicleType]].filter(Boolean).join(" · ");
  return <li><Link href={href} className="group grid gap-3 px-5 py-5 transition-colors hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-800 md:grid-cols-[9rem_minmax(12rem,1.3fr)_minmax(11rem,1fr)_12rem_9rem] md:items-center md:gap-4 md:px-6"><div className="flex items-center justify-between gap-3 md:block"><strong className="font-mono text-sm text-slate-950">{booking.bookingCode}</strong><span className="md:hidden"><StatusBadge status={booking.status} /></span></div><div><p className="font-semibold text-slate-950">{booking.driver.fullName}</p><p className="mt-1 text-xs text-slate-500">{booking.vehicle.registrationNumber} · {vehicle}</p></div><div><p className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="size-3.5 text-emerald-700" />{booking.property.name}</p><p className="mt-1 text-xs text-slate-500">{booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Parking area"}</p></div><p className="flex items-center gap-1.5 text-xs text-slate-600"><CalendarClock className="size-3.5" />{formatDateTime(booking.startAt)}</p><div className="hidden items-center justify-between gap-2 md:flex"><StatusBadge status={booking.status} /><ArrowRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800" /></div></Link></li>;
}

function StatusBadge({ status }: { status: GuardBookingDto["status"] }) {
  const styles = status === "CONFIRMED" ? "bg-indigo-50 text-indigo-800" : status === "CHECKED_IN" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950";
  return <span className={cn("rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide", styles)}>{statusLabel(status)}</span>;
}
function statusLabel(status: typeof statuses[number]) { if (status === "ALL") return "All active"; if (status === "CONFIRMED") return "Expected"; if (status === "CHECKED_IN") return "Parked"; return "Exit requested"; }
function BookingsSkeleton() { return <div className="guard-panel overflow-hidden" aria-busy="true" aria-label="Loading booking queue">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid min-h-24 animate-pulse gap-4 border-b border-[var(--guard-line)] p-5 md:grid-cols-5"><span className="h-4 rounded bg-slate-200" /><span className="h-4 rounded bg-slate-200" /><span className="h-4 rounded bg-slate-200" /><span className="h-4 rounded bg-slate-100" /><span className="h-4 rounded bg-slate-100" /></div>)}</div>; }

export default function GuardBookingsPage() {
  return <Suspense fallback={<BookingsSkeleton />}><GuardBookingsContent /></Suspense>;
}
