"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  Calendar,
  Car,
  QrCode,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Repeat,
  Compass,
  Receipt,
} from "lucide-react";
import {
  MOCK_DRIVER_PROFILE,
  MOCK_VEHICLES,
  MOCK_BOOKINGS,
} from "@/lib/data/mock-driver-data";

export function DriverDashboardView() {
  const router = useRouter();

  // Quick Search Form State
  const [searchLocation, setSearchLocation] = useState("Gulshan 1, Dhaka");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("04:00 PM");

  const defaultVehicle = MOCK_VEHICLES.find((v) => v.isDefault) || MOCK_VEHICLES[0];
  const nextBooking = MOCK_BOOKINGS[0]; // Confirmed upcoming booking
  const pastBookings = MOCK_BOOKINGS.slice(1, 3); // Recent completed bookings

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/parking?query=${encodeURIComponent(searchLocation)}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Header Greeting Section */}
      <section className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#064E3B] border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-[#064E3B] animate-pulse" />
              Active Driver Member
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Gulshan Zone
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-heading sm:text-4xl">
            Good morning, {MOCK_DRIVER_PROFILE.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            • Dhaka, Bangladesh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/parking"
            className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#053d2e] transition-all active:scale-[0.98]"
          >
            <Compass className="h-4 w-4" />
            <span>Find New Parking</span>
          </Link>

          <Link
            href="/driver/bookings"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-2xs hover:bg-muted/40 transition-colors"
          >
            <span>My Bookings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* 2. Responsive 2-Column Desktop Grid (2/3 Main, 1/3 Sidebar) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card A: Quick Search Card */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs urban-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground font-heading">
                    Quick Parking Finder
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Reserve verified parking slots instantly in Dhaka
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 hidden sm:inline-block">
                ⚡ Instant Confirmation
              </span>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Where are you heading in Dhaka? (e.g., Gulshan, Banani, Motijheel)"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-[#064E3B] focus:bg-card focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                />
              </div>

              {/* Time Pickers & Submit Button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Entry Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      aria-label="Select entry time"
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-xs font-semibold text-foreground focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM (Today)</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Exit Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      aria-label="Select exit time"
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-xs font-semibold text-foreground focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                    >
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#064E3B] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#053d2e] transition-colors active:scale-[0.98]"
                  >
                    <span>Find Parking</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Card B: Next Booking Highlight */}
          <section className="rounded-xl border-2 border-emerald-600/30 bg-card p-6 shadow-sm urban-card-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#064E3B]">
                  <Clock className="h-3.5 w-3.5 text-[#064E3B]" />
                  <span>Starts in 2h 15m</span>
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  #{nextBooking.id}
                </span>
              </div>

              <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {nextBooking.spotNumber}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-foreground font-heading">
                  {nextBooking.propertyTitle}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{nextBooking.address}</span>
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>{nextBooking.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>
                      {nextBooking.startTime} – {nextBooking.endTime} ({nextBooking.durationHours} hrs)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>{nextBooking.vehicle.name}</span>
                  </div>
                </div>
              </div>

              {/* View Pass Button */}
              <div className="sm:text-right shrink-0">
                <Link
                  href={`/driver/bookings/${nextBooking.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#053d2e] transition-transform active:scale-95"
                >
                  <QrCode className="h-4 w-4" />
                  <span>View Pass</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Card C: Recent Activity */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground font-heading">
                  Recent Activity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your latest completed parking stays
                </p>
              </div>

              <Link
                href="/driver/bookings"
                className="text-xs font-semibold text-[#064E3B] hover:underline"
              >
                View all bookings
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground font-heading">
                        {booking.propertyTitle}
                      </h4>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase">
                        {booking.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{booking.date}</span>
                      <span>•</span>
                      <span>{booking.spotNumber}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        ৳ {booking.payment.totalPaid}
                      </span>
                    </p>
                  </div>

                  <div>
                    <Link
                      href="/parking"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Book Again</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar (Right 1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sidebar Card 1: Alerts & Warnings */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Alerts &amp; Warnings
            </h3>

            {/* Alert: Payment Due (Overstay fee example) */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Payment Due: ৳ 120</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Overstay fee calculated on booking <span className="font-mono font-semibold">#PKBD-2026-0922-0914</span>.
              </p>
              <Link
                href="/driver/payments"
                className="inline-flex items-center gap-1 font-bold text-rose-900 hover:underline pt-0.5 text-[11px]"
              >
                <span>Pay Outstanding Fee</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Alert: Pending Refund */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Pending Refund: ৳ 100</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Security deposit return is processing via bKash. Expected in 24 hours.
              </p>
              <Link
                href="/driver/refunds"
                className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline pt-0.5 text-[11px]"
              >
                <span>Track Refund Status</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          {/* Sidebar Card 2: Saved Vehicles Summary */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                Default Vehicle
              </h3>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#064E3B] border border-emerald-100">
                Primary
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                <Car className="h-5 w-5" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground font-heading">
                  {defaultVehicle.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {defaultVehicle.color} • {defaultVehicle.type}
                </p>
              </div>
            </div>

            {/* Stylized BD Plate Box */}
            <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-center shadow-inner">
              <span className="font-mono text-xs font-extrabold tracking-widest text-foreground uppercase">
                {defaultVehicle.registrationNumber}
              </span>
            </div>

            <Link
              href="/driver/vehicles"
              className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-2.5 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
            >
              <span>Manage Saved Vehicles ({MOCK_VEHICLES.length})</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </section>

          {/* Sidebar Card 3: Quick Services & Safety */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Quick Shortcuts
            </h3>

            <div className="space-y-2 text-xs">
              <Link
                href="/driver/payments"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Receipt className="h-4 w-4 text-emerald-800" />
                  <span>Payment &amp; Refund Ledger</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/driver/payment-methods"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Payment Methods</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/driver/support"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Safety &amp; Help Desk</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
