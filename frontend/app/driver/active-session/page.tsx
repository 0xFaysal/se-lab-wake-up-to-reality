"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, CheckCircle2, CircleHelp, Clock3, MapPin, Navigation } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function remaining(endAt: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(endAt).getTime() - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function ActiveSessionPage() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const query = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList, refetchInterval: 30_000 });
  const booking = query.data?.find((item) => ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"].includes(item.status) && new Date(item.scheduledEndAt).getTime() >= now);

  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><header><h1 className="text-2xl font-extrabold">Active session</h1><p className="mt-1 text-sm text-slate-600">Live parking status, remaining time, and access controls.</p></header>
    {query.isPending ? <div className="animate-pulse rounded-md bg-emerald-950 p-6"><div className="h-4 w-24 rounded bg-white/20" /><div className="mt-4 h-7 w-2/3 rounded bg-white/20" /><div className="mt-8 h-12 w-40 rounded bg-white/20" /><div className="mt-7 h-12 rounded bg-white/20" /></div> : !booking ? <MobileEmptyState icon={MapPin} title="No active parking session" description="A confirmed or checked-in booking will appear here with live access and checkout controls." primaryAction={{ label: "Search parking", href: "/driver/parking" }} /> : <>
      <section className="overflow-hidden rounded-md bg-emerald-950 text-white shadow-lg"><div className="p-5 sm:p-7"><p className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-200"><CheckCircle2 className="size-4" />{booking.status === "CHECKED_IN" ? "Checked in" : booking.status.replaceAll("_", " ")}</p><h2 className="mt-3 text-2xl font-extrabold">{booking.property?.name ?? booking.listing?.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-100"><MapPin className="size-4" />{booking.property?.publicArea}</p><div className="mt-7"><p className="text-xs font-semibold text-emerald-200">Time remaining</p><p className="mt-1 font-mono text-4xl font-bold tabular-nums">{remaining(booking.scheduledEndAt, now)}</p><p className="mt-2 text-xs text-emerald-200">Scheduled until {formatDateTime(booking.scheduledEndAt)}</p></div><div className="mt-6 flex items-center gap-3 border-t border-white/15 pt-5"><div className="grid size-10 place-items-center rounded-full bg-white/10"><Car className="size-5" /></div><div><p className="text-xs text-emerald-200">Vehicle</p><p className="font-bold">{booking.vehicle?.registrationNumber ?? "Registered vehicle"}</p></div></div></div></section>
      <Link href={`/driver/bookings/${booking.id}`} className={cn(buttonVariants(), "h-12 w-full bg-emerald-800 text-base font-bold hover:bg-emerald-900")}>{booking.status === "CHECKED_IN" ? "Request checkout" : "Open booking controls"}</Link>
      <div className="grid grid-cols-2 gap-3"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.property?.approximateAddress ?? booking.property?.publicArea ?? "")}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "h-11")}><Navigation className="size-4" />Directions</a><Link href="/driver/support" className={cn(buttonVariants({ variant: "outline" }), "h-11")}><CircleHelp className="size-4" />Get help</Link></div>
      <section className="rounded-md border bg-white p-4"><h3 className="text-sm font-bold">Session details</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2"><Info icon={Clock3} label="Started" value={formatDateTime(booking.startAt)} /><Info icon={MapPin} label="Parking space" value={booking.assignedUnitCode ? `${booking.parkingSpot?.displayName ?? "Fixed parking"} · Unit ${booking.assignedUnitCode}` : booking.parkingSpot?.displayName ?? booking.parkingSpot?.spotCode ?? "Assigned space"} /></dl></section>
    </>}
  </div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 size-4 text-emerald-700" /><div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 text-sm font-semibold">{value}</dd></div></div>; }
