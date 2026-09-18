"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, Search } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

function BookingSkeleton() { return <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="animate-pulse rounded-md border bg-white p-4"><div className="h-4 w-28 rounded bg-slate-200" /><div className="mt-3 h-5 w-2/3 rounded bg-slate-200" /><div className="mt-2 h-4 w-full rounded bg-slate-100" /></div>)}</div>; }

export default function MyBookingsPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList });
  return <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold">Bookings</h1><p className="mt-1 text-sm text-slate-600">Your upcoming reservations and parking activity.</p></div><Link href="/driver/parking" className="hidden rounded-md bg-emerald-800 px-4 py-2 text-sm font-bold text-white sm:block">Find parking</Link></header>
    {query.isPending ? <BookingSkeleton /> : query.isError ? <div className="rounded-md border border-rose-200 bg-white p-6 text-center"><p className="text-sm font-semibold text-rose-700">{getApiErrorMessage(query.error)}</p><Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}><RefreshCw className="size-4" />Try again</Button></div> : query.data.length === 0 ? <MobileEmptyState icon={CalendarDays} title="No bookings yet" description="Reserve a verified parking space and your booking details will appear here." primaryAction={{ label: "Search parking", href: "/driver/parking", icon: Search }} /> : <div className="space-y-3">{query.data.map((booking) => { const status = bookingStatus[booking.status]; return <Link key={booking.id} href={`/driver/bookings/${booking.id}`} className="block rounded-md border bg-white p-4 shadow-sm transition hover:border-emerald-200 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"><div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm">{booking.bookingCode}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div><p className="mt-3 font-extrabold">{booking.property?.name ?? booking.listing?.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{formatDateTime(booking.startAt)} to {formatDateTime(booking.scheduledEndAt)}</p><p className="mt-1 text-xs text-slate-500">Vehicle {booking.vehicle?.registrationNumber}</p></div><div className="mt-4 flex items-end justify-between border-t pt-3 sm:mt-0 sm:block sm:border-0 sm:pt-0 sm:text-right"><span className="text-xs text-slate-500 sm:hidden">Total</span><strong>{formatBDTFromPaisa(booking.totalAmountPaisa)}</strong></div></Link>; })}</div>}
  </div>;
}
