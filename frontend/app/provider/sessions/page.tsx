"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageEmptyState, PageErrorState, PageSkeleton, ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import type { BookingDto } from "@/lib/api/marketplace-types";

const activeStatuses = new Set(["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"]);
export default function OwnerSessionsPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.provider({ active: true }), queryFn: () => bookingsApi.providerList(), refetchInterval: 30_000 });
  const rawBookings: BookingDto[] = Array.isArray(query.data) ? query.data : [];
  const sessions = rawBookings.filter((booking: BookingDto) => activeStatuses.has(booking.status));
  return <ProviderPage><ProviderPageHeader title="Live sessions" description="Monitor confirmed and in-progress parking stays." breadcrumbs={[{ label: "Operations" }, { label: "Live sessions" }]} />
    {query.isPending ? <PageSkeleton label="Loading live sessions" /> : query.isError ? <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} /> : sessions.length === 0 ? <PageEmptyState title="No live sessions" description="Confirmed and checked-in bookings will appear here automatically." action={{ label: "View all bookings", href: "/provider/bookings" }} /> : <div className="divide-y border bg-white">{sessions.map((booking) => <Link key={booking.id} href={`/provider/bookings/${booking.id}`} className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50"><div><strong className="font-mono text-sm">{booking.bookingCode}</strong><p className="mt-1 text-xs text-slate-500">{booking.property?.name} · {formatDateTime(booking.startAt)} to {formatDateTime(booking.effectiveEndAt)}</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{booking.status.replaceAll("_", " ")}</span></Link>)}</div>}
  </ProviderPage>;
}
