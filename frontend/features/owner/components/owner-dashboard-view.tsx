"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Users,
  Zap,
  Plus,
  ArrowRight,
  UserCheck,
  Banknote,
  LayoutGrid,
  Sparkles,
  Ticket,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_METRICS,
  MOCK_OWNER_PROPERTIES,
  MOCK_UPCOMING_BOOKINGS,
  MOCK_OWNER_ACTIVITIES,
} from "@/lib/data/mock-owner-data";
import safetyGarageImg from "@/assets/safety-garage.jpg";

export function OwnerDashboardView() {
  const primaryProperty = MOCK_OWNER_PROPERTIES[0];

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="Overview"
        subtitle="Welcome back, here is your property portfolio summary"
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* ==================================================================== */}
        {/* 1. TOP METRICS ROW (4 Cards)                                         */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Active Listings */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Active Listings
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.activeListings.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{MOCK_OWNER_METRICS.activeListings.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Building2 className="size-5" />
            </div>
          </div>

          {/* Metric 2: Upcoming Bookings */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Upcoming Bookings
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.upcomingBookings.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Clock className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{MOCK_OWNER_METRICS.upcomingBookings.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Ticket className="size-5" />
            </div>
          </div>

          {/* Metric 3: Occupied Spaces */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Occupied Spaces
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.occupiedSpaces.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Car className="size-3.5 text-amber-600" />
                <span>{MOCK_OWNER_METRICS.occupiedSpaces.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
              <Car className="size-5" />
            </div>
          </div>

          {/* Metric 4: Available Spaces */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Available Spaces
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.availableSpaces.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{MOCK_OWNER_METRICS.availableSpaces.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100 font-bold font-mono text-base">
              P
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. MIDDLE SECTION (Split: My Parking Spaces & Quick Actions)        */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): My Parking Spaces */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  My Parking Spaces
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                1 Facility Live
              </span>
            </div>

            {/* Inner Property Card */}
            <div className="rounded-xl border border-[#E5E7EB] p-4 sm:p-5 bg-white hover:border-emerald-700/40 transition-all flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Thumbnail with overlay tag */}
              <div className="relative w-full sm:w-36 h-32 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-[#E5E7EB] bg-slate-100">
                <Image
                  src={safetyGarageImg}
                  alt={primaryProperty.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {primaryProperty.area}
                </span>
              </div>

              {/* Property Details */}
              <div className="flex-1 min-w-0 space-y-2.5 w-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 truncate">
                      {primaryProperty.title}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{primaryProperty.address}</span>
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold font-mono text-[#064E3B]">
                      ৳{primaryProperty.ratePerHour}
                    </span>
                    <span className="text-xs text-slate-500">/hr</span>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    <Car className="size-3.5 text-slate-500" />
                    <span>{primaryProperty.totalSpaces} Car Spaces</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    <Users className="size-3.5 text-slate-500" />
                    <span>Manager: {primaryProperty.managerName}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Guard On Duty</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E5E7EB]">
              <span className="text-slate-500 font-medium">
                Managing {primaryProperty.totalSpaces} registered parking bays
              </span>
              <Link
                href="/owner/properties"
                className="font-bold text-[#064E3B] hover:text-[#064E3B]/80 inline-flex items-center gap-1 transition-colors"
              >
                <span>Manage Listings</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): Quick Actions */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Quick Actions
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Frequent Tasks
              </span>
            </div>

            {/* 2x3 Grid of Action Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Add Space */}
              <Link
                href="/owner/properties/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="size-4 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  Add Space
                </span>
              </Link>

              {/* 2. Manage Listings */}
              <Link
                href="/owner/properties"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  Manage Listings
                </span>
              </Link>

              {/* 3. View Bookings */}
              <Link
                href="/owner/bookings"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarDays className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  View Bookings
                </span>
              </Link>

              {/* 4. Manage Guards */}
              <Link
                href="/owner/guards"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  Manage Guards
                </span>
              </Link>

              {/* 5. Manage Managers */}
              <Link
                href="/owner/managers"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  Manage Managers
                </span>
              </Link>

              {/* 6. View Earnings */}
              <Link
                href="/owner/earnings"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
              >
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Banknote className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                  View Earnings
                </span>
              </Link>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E5E7EB]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                System operational
              </span>
              <span className="text-slate-400">All permissions active</span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. BOTTOM SECTION (Split: Upcoming Bookings & Recent Activity)       */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Upcoming Bookings */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Upcoming Bookings
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                3 Scheduled
              </span>
            </div>

            {/* Bookings List */}
            <div className="space-y-3">
              {MOCK_UPCOMING_BOOKINGS.map((booking) => {
                const isPending = booking.status === "PENDING_ENTRY";

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] hover:border-slate-300 bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Initials Avatar */}
                      <div
                        className={`size-10 rounded-xl font-bold font-heading text-xs flex items-center justify-center shrink-0 ${
                          isPending
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-[#064E3B]"
                        }`}
                      >
                        {booking.driverInitials}
                      </div>

                      {/* Driver & Schedule */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 font-heading truncate">
                          {booking.driverName}
                        </h4>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="size-3 text-slate-400 shrink-0" />
                          <span>
                            {booking.dateStr}, {booking.timeStr}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 ml-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isPending
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isPending ? "Pending Entry" : "Confirmed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-end text-xs border-t border-[#E5E7EB]">
              <Link
                href="/owner/bookings"
                className="font-bold text-[#064E3B] hover:text-[#064E3B]/80 inline-flex items-center gap-1 transition-colors"
              >
                <span>View All Bookings</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): Recent Activity Timeline */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-[#064E3B]" />
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Recent Activity
              </h2>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-5 space-y-5 border-l-2 border-slate-100 ml-2">
              {MOCK_OWNER_ACTIVITIES.map((activity, index) => {
                const isEmerald =
                  activity.type === "manager" || activity.type === "booking";

                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline Node Dot */}
                    <span
                      className={`absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-white ${
                        isEmerald ? "bg-emerald-600" : "bg-slate-400"
                      }`}
                    />

                    {/* Activity Content */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-heading">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {activity.description}
                        </p>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-end text-xs border-t border-[#E5E7EB]">
              <Link
                href="/owner/notifications"
                className="font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
              >
                <span>Full Log</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
