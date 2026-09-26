"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageEmptyState, PageErrorState, PageSkeleton, ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function ProviderBookingsPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.provider(), queryFn: bookingsApi.providerList, refetchInterval: 30_000 });
  return <ProviderPage><ProviderPageHeader title="Bookings" description="Review reservations within your commercial or delegated parking scope." breadcrumbs={[{ label: "Operations" }, { label: "Bookings" }]} />
    {query.isPending ? <PageSkeleton label="Loading bookings" /> : query.isError ? <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} /> : query.data.length === 0 ? <PageEmptyState title="No bookings yet" description="Bookings will appear after an active listing receives a reservation." action={{ label: "View listings", href: "/provider/listings" }} /> : <div className="divide-y border bg-white">{query.data.map((booking) => { const status = bookingStatus[booking.status]; return <Link href={`/provider/bookings/${booking.id}`} key={booking.id} className="grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap gap-2"><strong className="font-mono">{booking.bookingCode}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div><p className="mt-2 text-sm font-semibold">{booking.property?.name} · {booking.parkingSpot?.resourceType === "SHARED_POOL" ? "Shared Parking Area" : booking.parkingSpot?.displayName}</p><p className="mt-1 text-xs text-slate-500">{booking.vehicle?.registrationNumber} · {formatDateTime(booking.startAt)}</p></div><strong>{formatBDTFromPaisa(booking.totalAmountPaisa)}</strong></Link>; })}</div>}
  </ProviderPage>;
}
