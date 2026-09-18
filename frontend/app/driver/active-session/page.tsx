"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function ActiveSessionPage() {
  const query = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList, refetchInterval: 30_000 });
  const booking = query.data?.find((item) => ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"].includes(item.status) && new Date(item.scheduledEndAt).getTime() >= Date.now());
  return <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6"><header><h1 className="text-2xl font-extrabold">Active parking session</h1><p className="mt-1 text-sm text-muted-foreground">Current access, time, vehicle, and checkout state.</p></header>{query.isPending ? <p className="text-sm text-muted-foreground">Checking active bookings...</p> : !booking ? <div className="border bg-white p-10 text-center"><MapPin className="mx-auto size-8 text-slate-400" /><h2 className="mt-3 font-bold">No active session</h2><p className="mt-1 text-sm text-muted-foreground">A confirmed or checked-in booking will appear here.</p><Link href="/driver/parking"><Button className="mt-4">Find parking</Button></Link></div> : <section className="border bg-white p-6"><p className="text-xs font-bold uppercase text-emerald-700">{booking.status.replaceAll("_", " ")}</p><h2 className="mt-2 text-xl font-bold">{booking.property?.name}</h2><p className="mt-1 text-sm text-muted-foreground">{booking.property?.approximateAddress}</p><dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2"><Info label="Booking" value={booking.bookingCode} /><Info label="Vehicle" value={booking.vehicle?.registrationNumber ?? "-"} /><Info label="Starts" value={formatDateTime(booking.startAt)} /><Info label="Scheduled end" value={formatDateTime(booking.scheduledEndAt)} /><Info label="Parking space" value={booking.parkingSpot?.displayName ?? booking.parkingSpot?.spotCode ?? "Assigned space"} /></dl><Link href={`/driver/bookings/${booking.id}`}><Button className="mt-6 w-full">Open booking controls</Button></Link></section>}</div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>; }
