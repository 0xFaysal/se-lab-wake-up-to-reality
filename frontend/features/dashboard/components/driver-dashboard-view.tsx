"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, CalendarDays, Car, CheckCircle2, Clock3, Heart, MapPin, Search, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useVehicles } from "@/hooks/use-vehicles";
import { bookingsApi } from "@/lib/api/bookings-api";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { formatBDTFromPaisa, formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { driverSessionBookings } from "@/lib/driver-session";

export function DriverDashboardView() {
  const user = useCurrentUser();
  const vehicles = useVehicles().query;
  const bookings = useQuery({ queryKey: queryKeys.bookings.driver(), queryFn: bookingsApi.driverList, refetchInterval: 30_000 });
  const notifications = useQuery({ queryKey: queryKeys.notifications.all(), queryFn: notificationsApi.list });
  const favorites = useQuery({ queryKey: queryKeys.driverDiscovery.favorites, queryFn: driverDiscoveryApi.favorites });
  const recent = useQuery({ queryKey: queryKeys.driverDiscovery.recentSearches, queryFn: driverDiscoveryApi.recentSearches });
  const firstName = user.data?.fullName.trim().split(/\s+/)[0] ?? "Driver";
  const savedVehicles = vehicles.data ?? [];
  const defaultVehicle = savedVehicles.find((vehicle) => vehicle.isDefault) ?? savedVehicles[0];
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const allBookings = bookings.data ?? [];
  const sessions = driverSessionBookings(allBookings, now);
  const activeBooking = sessions[0];
  const upcoming = sessions.filter((booking) => booking.status === "CONFIRMED" && new Date(booking.startAt).getTime() > now);
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
    <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-700">Welcome back</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{firstName}, where are you parking today?</h1><p className="mt-1 text-sm text-muted-foreground">Your live bookings, vehicles, and account activity in one place.</p></div><Link href="/driver/parking" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-bold text-white"><Search className="size-4" />Find parking</Link></header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={CalendarDays} label="Upcoming" value={String(upcoming.length)} href="/driver/bookings" />
      <Metric icon={Car} label="Vehicles" value={String(savedVehicles.length)} href="/driver/vehicles" />
      <Metric icon={Heart} label="Favorites" value={String(favorites.data?.length ?? 0)} href="/driver/favorites" />
      <Metric icon={Bell} label="Unread alerts" value={String(unread)} href="/driver/notifications" />
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-6">
        {activeBooking ? <section className="border-l-4 border-emerald-700 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-emerald-700">{activeBooking.status === "CONFIRMED" ? "Next reservation" : "Active parking"}</p><h2 className="mt-1 text-xl font-bold">{activeBooking.property?.name ?? activeBooking.listing?.title}</h2><p className="mt-1 text-sm text-muted-foreground"><MapPin className="mr-1 inline size-4" />{activeBooking.property?.publicArea} · {activeBooking.vehicle?.registrationNumber}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(activeBooking.startAt)} to {formatDateTime(activeBooking.scheduledEndAt)}</p></div><Link href={`/driver/bookings/${activeBooking.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800">Open session<ArrowRight className="size-4" /></Link></div></section> : <section className="border bg-white p-6"><MapPin className="size-6 text-emerald-700" /><h2 className="mt-3 font-bold">No active parking session</h2><p className="mt-1 text-sm text-muted-foreground">Search verified spaces and reserve one with a server-backed hold.</p><Link href="/driver/parking" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">Search parking<ArrowRight className="size-4" /></Link></section>}

        <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Upcoming bookings</h2><Link href="/driver/bookings" className="text-xs font-semibold text-emerald-800">View all</Link></div><div className="divide-y border bg-white">{bookings.isPending ? <p className="p-5 text-sm text-muted-foreground">Loading bookings...</p> : upcoming.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No upcoming bookings. Your next confirmed reservation will appear here.</p> : upcoming.map((booking) => <Link key={booking.id} href={`/driver/bookings/${booking.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"><div><p className="font-semibold">{booking.property?.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(booking.startAt)} · {booking.vehicle?.registrationNumber}</p></div><span className="text-sm font-bold">{formatBDTFromPaisa(booking.totalAmountPaisa)}</span></Link>)}</div></section>

        <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent searches</h2><Link href="/driver/recent-searches" className="text-xs font-semibold text-emerald-800">Manage</Link></div><div className="grid gap-3 sm:grid-cols-2">{recent.data?.slice(0, 4).map((item) => <Link key={item.id} href={`/driver/parking?location=${encodeURIComponent(item.displayName)}&latitude=${item.latitude}&longitude=${item.longitude}&radiusKm=${item.radiusKm}&vehicleType=${item.vehicleType}`} className="border bg-white p-4 hover:border-emerald-700"><p className="line-clamp-1 font-semibold">{item.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{item.radiusKm} km · {vehicleLabels[item.vehicleType]}</p></Link>)}{recent.data?.length === 0 && <p className="text-sm text-muted-foreground">Your successful parking searches will appear here.</p>}</div></section>
      </div>

      <aside className="space-y-5">
        <section className="border bg-white p-5"><h2 className="text-sm font-bold">Account setup</h2><div className="mt-4 space-y-3"><Checklist done={!!user.data?.emailVerified} label="Email verified" href="/driver/profile" /><Checklist done={savedVehicles.length > 0} label="Vehicle added" href="/driver/vehicles" /><Checklist done={!!defaultVehicle} label="Default vehicle selected" href="/driver/vehicles" /></div></section>
        <section className="border bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Default vehicle</h2><Car className="size-4 text-emerald-700" /></div>{defaultVehicle ? <div className="mt-3"><p className="font-semibold">{defaultVehicle.brand} {defaultVehicle.model}</p><p className="mt-1 text-xs text-muted-foreground">{defaultVehicle.registrationNumber} · {vehicleLabels[defaultVehicle.vehicleType]}</p></div> : <p className="mt-3 text-sm text-muted-foreground">Add a vehicle before creating a quote.</p>}<Link href="/driver/vehicles" className="mt-4 inline-flex text-xs font-bold text-emerald-800">Manage vehicles</Link></section>
        <section className="border bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-700" /><h2 className="text-sm font-bold">Verified marketplace</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Search results only include active, admin-verified properties and currently available offers.</p></section>
      </aside>
    </div>
  </div>;
}

function Metric({ icon: Icon, label, value, href }: { icon: typeof Clock3; label: string; value: string; href: string }) { return <Link href={href} className="flex items-center gap-3 border bg-white p-4 hover:border-emerald-700"><div className="grid size-9 place-items-center rounded-md bg-emerald-50 text-emerald-800"><Icon className="size-4" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-extrabold">{value}</p></div></Link>; }
function Checklist({ done, label, href }: { done: boolean; label: string; href: string }) { return <Link href={href} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`size-4 ${done ? "text-emerald-700" : "text-slate-300"}`} /><span className={done ? "text-slate-700" : "font-medium"}>{label}</span></Link>; }
