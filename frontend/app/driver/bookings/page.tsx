"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function MyBookingsPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList });
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold">My Bookings</h1><p className="mt-1 text-sm text-muted-foreground">Live reservations and parking activity.</p></div><Link href="/driver/parking" className="rounded-md bg-emerald-800 px-4 py-2 text-center text-sm font-bold text-white">Find parking</Link></div>{query.isPending ? <State loading text="Loading bookings" /> : query.isError ? <State text={getApiErrorMessage(query.error)} action={() => query.refetch()} /> : query.data.length === 0 ? <State text="You do not have any bookings yet." /> : <div className="divide-y overflow-hidden rounded-lg border bg-white">{query.data.map((booking) => { const status = bookingStatus[booking.status]; return <Link key={booking.id} href={`/driver/bookings/${booking.id}`} className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono">{booking.bookingCode}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div><p className="mt-2 font-semibold">{booking.property?.name ?? booking.listing?.title}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(booking.startAt)} to {formatDateTime(booking.scheduledEndAt)} · {booking.vehicle?.registrationNumber}</p></div><strong>{formatBDTFromPaisa(booking.totalAmountPaisa)}</strong></Link>; })}</div>}</div>;
}

function State({ text, loading, action }: { text: string; loading?: boolean; action?: () => void }) {
  return <div className="rounded-lg border bg-white p-12 text-center"><CalendarDays className="mx-auto size-7 text-slate-400" />{loading && <Loader2 className="mx-auto mt-3 size-5 animate-spin" />}<p className="mt-3 text-sm text-slate-600">{text}</p>{action && <Button className="mt-4" variant="outline" onClick={action}><RefreshCw className="size-4" />Retry</Button>}</div>;
}
