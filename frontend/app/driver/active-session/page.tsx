"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, CheckCircle2, CircleHelp, Clock3, MapPin, Navigation } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { BookingLocation } from "@/features/bookings/components/booking-location";
import { bookingDirectionsUrl, driverSessionBookings } from "@/lib/driver-session";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { bookingsApi } from "@/lib/api/bookings-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function countdown(targetAt: string, now: number) {
  const seconds = Math.ceil(Math.abs(new Date(targetAt).getTime() - now) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function ActiveSessionPage() {
  const [now, setNow] = useState(() => Date.now());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const query = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList, refetchInterval: 30_000 });
  const sessions = driverSessionBookings(query.data ?? [], now);
  const booking = sessions.find((item) => item.id === selectedBookingId) ?? sessions[0];
  const detail = useQuery({ queryKey: queryKeys.bookings.detail(booking?.id ?? ""), queryFn: () => bookingsApi.driverDetail(booking!.id), enabled: Boolean(booking), refetchInterval: 30_000 });
  const directions = bookingDirectionsUrl(detail.data?.exactLocation);
  const isUpcoming = booking ? booking.status === "CONFIRMED" && now < new Date(booking.startAt).getTime() : false;
  const isPastEnd = booking ? now > new Date(booking.scheduledEndAt).getTime() : false;

  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><header><h1 className="text-2xl font-extrabold">Active session</h1><p className="mt-1 text-sm text-slate-600">Live parking status, remaining time, and access controls.</p></header>
    {query.isError ? <div role="alert" className="space-y-3 rounded-md border bg-white p-4"><p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry bookings</Button></div> : query.isPending ? <div className="animate-pulse rounded-md bg-emerald-950 p-6"><div className="h-4 w-24 rounded bg-white/20" /><div className="mt-4 h-7 w-2/3 rounded bg-white/20" /><div className="mt-8 h-12 w-40 rounded bg-white/20" /><div className="mt-7 h-12 rounded bg-white/20" /></div> : !booking ? <MobileEmptyState icon={MapPin} title="No active parking session" description="A confirmed or checked-in booking will appear here with live access and checkout controls." primaryAction={{ label: "Search parking", href: "/driver/parking" }} /> : <>
      {sessions.length > 1 && <section className="space-y-2"><h2 className="text-sm font-bold">Current & upcoming bookings</h2><div className="grid gap-2 sm:grid-cols-2">{sessions.map((item) => <button key={item.id} type="button" aria-pressed={booking.id === item.id} onClick={() => setSelectedBookingId(item.id)} className={cn("min-w-0 rounded-md border p-3 text-left text-sm", booking.id === item.id ? "border-emerald-700 bg-emerald-50" : "bg-white")}><span className="block break-words font-semibold">{item.property?.name ?? item.listing?.title}</span><span className="mt-1 block text-xs text-slate-600">{formatDateTime(item.startAt)}</span><span className="mt-1 block text-xs text-emerald-800">{["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(item.status) ? "Parked" : "Reservation"} · {item.bookingCode}</span></button>)}</div></section>}
      <section className="overflow-hidden rounded-md bg-emerald-950 text-white shadow-lg"><div className="p-5 sm:p-7"><p className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-200"><CheckCircle2 className="size-4" />{isUpcoming ? "Upcoming" : booking.status === "CHECKED_IN" ? "Checked in" : booking.status.replaceAll("_", " ")}</p><h2 className="mt-3 text-2xl font-extrabold">{booking.property?.name ?? booking.listing?.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-100"><MapPin className="size-4" />{booking.property?.publicArea}</p><div className="mt-7"><p className="text-xs font-semibold text-emerald-200">{isUpcoming ? "Parking starts in" : isPastEnd ? "Past scheduled end" : "Parking time remaining"}</p><p className="mt-1 font-mono text-4xl font-bold tabular-nums">{countdown(isUpcoming ? booking.startAt : booking.scheduledEndAt, now)}</p><p className="mt-2 text-xs text-emerald-200">{isUpcoming ? `Starts ${formatDateTime(booking.startAt)}` : `Scheduled until ${formatDateTime(booking.scheduledEndAt)}`}</p></div><div className="mt-6 flex items-center gap-3 border-t border-white/15 pt-5"><div className="grid size-10 place-items-center rounded-full bg-white/10"><Car className="size-5" /></div><div><p className="text-xs text-emerald-200">Vehicle</p><p className="font-bold">{booking.vehicle?.registrationNumber ?? "Registered vehicle"}</p></div></div></div></section>
      <Link href={`/driver/bookings/${booking.id}`} className={cn(buttonVariants(), "h-12 w-full bg-emerald-800 text-base font-bold hover:bg-emerald-900")}>{booking.status === "CHECKED_IN" ? "Request checkout" : "Open booking controls"}</Link>
      <div className="grid grid-cols-2 gap-3">{directions ? <a href={directions} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "h-11")}><Navigation className="size-4" />Directions</a> : <Button disabled variant="outline" className="h-11"><Navigation className="size-4" />Directions</Button>}<Link href="/driver/support" className={cn(buttonVariants({ variant: "outline" }), "h-11")}><CircleHelp className="size-4" />Get help</Link></div>
      {detail.isPending ? <p className="text-sm text-slate-500">Loading your parking location...</p> : detail.isError ? <div role="alert" className="space-y-2"><p className="text-sm text-red-700">{getApiErrorMessage(detail.error)}</p><Button variant="outline" onClick={() => void detail.refetch()}>Retry location</Button></div> : <BookingLocation booking={detail.data} showDirections={false} />}
      <section className="rounded-md border bg-white p-4"><h3 className="text-sm font-bold">Session details</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2"><Info icon={Clock3} label={isUpcoming ? "Starts" : "Started"} value={formatDateTime(booking.startAt)} /><Info icon={MapPin} label="Parking space" value={booking.assignedUnitCode ? `${booking.parkingSpot?.displayName ?? "Fixed parking"} · Unit ${booking.assignedUnitCode}` : booking.parkingSpot?.displayName ?? booking.parkingSpot?.spotCode ?? "Assigned space"} /></dl></section>
    </>}
  </div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 size-4 text-emerald-700" /><div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 text-sm font-semibold">{value}</dd></div></div>; }
