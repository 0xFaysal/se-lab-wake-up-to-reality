"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Car, ChevronRight, Clock, Compass, MapPin, Search, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useVehicles } from "@/hooks/use-vehicles";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { vehicleLabels } from "@/lib/formatters";

function DashboardSkeleton() {
  return <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 sm:px-6 lg:px-8"><div className="h-28 rounded-xl bg-muted" /><div className="grid gap-8 lg:grid-cols-3"><div className="h-72 rounded-xl bg-muted lg:col-span-2" /><div className="h-72 rounded-xl bg-muted" /></div></div>;
}

export function DriverDashboardView() {
  const router = useRouter();
  const user = useCurrentUser();
  const vehicles = useVehicles();
  const [searchLocation, setSearchLocation] = useState("");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("04:00 PM");

  if (user.isPending || vehicles.query.isPending) return <DashboardSkeleton />;
  if (user.isError) return <div className="mx-auto max-w-3xl px-4"><div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"><h1 className="text-xl font-bold">We could not load your account</h1><p className="mt-2 text-sm text-muted-foreground">{getApiErrorMessage(user.error)}</p><button onClick={() => user.refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button></div></div>;

  const currentUser = user.data;
  const savedVehicles = vehicles.query.data ?? [];
  const defaultVehicle = savedVehicles.find((vehicle) => vehicle.isDefault) ?? savedVehicles[0];
  const firstName = currentUser?.fullName.trim().split(/\s+/)[0] || "Driver";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function search(event: React.FormEvent) {
    event.preventDefault();
    const query = searchLocation.trim();
    router.push(query ? `/parking?query=${encodeURIComponent(query)}` : "/parking");
  }

  return <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
    <section className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#064E3B]"><span className="h-2 w-2 rounded-full bg-[#064E3B]" />Active Driver</span><span className="text-xs text-muted-foreground">Account data synced with ParkEase BD</span></div><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}, {firstName}</h1><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("en-BD", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p></div>
      <div className="flex gap-3"><Link href="/parking" className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2.5 text-sm font-bold text-white"><Compass className="h-4 w-4" />Find Parking</Link><Link href="/driver/vehicles" className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold">My Vehicles<ChevronRight className="h-4 w-4" /></Link></div>
    </section>

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <section className="rounded-xl border bg-card p-6 shadow-xs"><div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]"><Search className="h-4 w-4" /></div><div><h2 className="font-bold">Quick Parking Finder</h2><p className="text-xs text-muted-foreground">Search parking by location</p></div></div><form onSubmit={search} className="space-y-4"><div className="relative"><MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)} placeholder="Where are you heading?" className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm focus:border-[#064E3B] focus:outline-none" /></div><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold">ENTRY TIME<select value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2.5"><option>09:00 AM</option><option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option><option>02:00 PM</option></select></label><label className="text-xs font-semibold">EXIT TIME<select value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2.5"><option>01:00 PM</option><option>02:00 PM</option><option>04:00 PM</option><option>06:00 PM</option><option>08:00 PM</option></select></label><button className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#064E3B] p-2.5 text-xs font-bold text-white">Find Parking<ArrowRight className="h-4 w-4" /></button></div></form></section>
      <section className="rounded-xl border bg-card p-6 shadow-xs"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#064E3B]" /><div><h2 className="font-bold">Bookings will appear here when the booking API is available</h2><p className="mt-1 text-sm text-muted-foreground">Your account is connected correctly. The backend currently exposes authentication and vehicle management for Drivers, but it does not yet expose booking, payment, or refund endpoints. No demo booking is being shown.</p></div></div></section>
    </div><aside className="space-y-6">
      <section className="rounded-xl border bg-card p-5 shadow-xs"><div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Vehicle</h2>{defaultVehicle?.isDefault && <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#064E3B]">Primary</span>}</div>{vehicles.query.isError ? <div className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm"><div className="flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 text-destructive" />{getApiErrorMessage(vehicles.query.error)}</div><button onClick={() => vehicles.query.refetch()} className="mt-2 font-semibold text-primary">Try again</button></div> : defaultVehicle ? <div className="mt-4 space-y-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><Car className="h-5 w-5 text-[#064E3B]" /></div><div><p className="font-bold">{defaultVehicle.brand} {defaultVehicle.model}</p><p className="text-xs text-muted-foreground">{defaultVehicle.color} · {vehicleLabels[defaultVehicle.vehicleType]}</p></div></div><div className="rounded-lg border bg-muted/40 p-2.5 text-center font-mono text-xs font-extrabold tracking-widest">{defaultVehicle.registrationNumber}</div></div> : <div className="mt-4 rounded-lg border border-dashed p-4 text-center"><Car className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">No vehicle added yet</p><p className="text-xs text-muted-foreground">Add a vehicle to use it for future parking.</p></div>}<Link href="/driver/vehicles" className="mt-4 flex items-center justify-between rounded-lg border p-2.5 text-xs font-semibold">Manage Saved Vehicles ({savedVehicles.length})<ChevronRight className="h-4 w-4" /></Link></section>
      <section className="rounded-xl border bg-card p-5"><h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h2><div className="mt-3 space-y-2 text-sm"><p className="font-semibold">{currentUser?.fullName}</p><p className="text-muted-foreground">{currentUser?.email}</p><p className="text-muted-foreground">{currentUser?.phone}</p></div><Link href="/driver/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">View profile<ChevronRight className="h-3.5 w-3.5" /></Link></section>
      <section className="rounded-xl border bg-card p-5 text-xs text-muted-foreground"><div className="flex gap-2"><Clock className="h-4 w-4 shrink-0" /><p>Booking and financial alerts are hidden until their backend APIs are implemented.</p></div></section>
    </aside></div>
  </div>;
}
