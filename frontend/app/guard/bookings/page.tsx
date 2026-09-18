"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2, MapPin } from "lucide-react";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function GuardBookingsPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.guard(), queryFn: () => guardMarketplaceApi.bookings() });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getApiErrorMessage(query.error)}</p>;
  return <div className="space-y-5 pb-24"><div><h1 className="text-2xl font-extrabold text-slate-900">Booking operations</h1><p className="mt-1 text-sm text-slate-500">Active bookings for your assigned properties and providers.</p></div><div className="divide-y overflow-hidden rounded-lg border bg-white">{query.data.bookings.map((booking) => <Link key={booking.id} href={`/guard/bookings/${booking.id}`} className="block p-4 hover:bg-slate-50"><div className="flex items-start justify-between gap-4"><div><strong className="font-mono text-sm">{booking.bookingCode}</strong><p className="mt-1 flex items-center gap-1 text-xs text-slate-600"><MapPin className="size-3" />{booking.property.name} · {booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Parking area"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="size-3" />{formatDateTime(booking.startAt)}</p></div><span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">{booking.status.replaceAll("_", " ")}</span></div></Link>)}{query.data.bookings.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No active booking operations are assigned to you.</p>}</div></div>;
}
