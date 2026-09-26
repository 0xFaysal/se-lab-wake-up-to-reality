"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Layers,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import type { BookingDto, MarketplaceBookingStatus } from "@/lib/api/marketplace-types";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function formatPaisa(paisa: string | number | undefined | null): string {
  if (!paisa) return "৳0";
  const num = typeof paisa === "string" ? Number(paisa) : paisa;
  return `৳${(num / 100).toLocaleString()}`;
}

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoString;
  }
}

export default function ManagerBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Upcoming" | "Active" | "Completed" | "Cancelled">("All");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
    queryFn: () => bookingsApi.providerList(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
  });

  const rawBookings: BookingDto[] = useMemo(
    () => (Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []),
    [bookingsQuery.data],
  );

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return rawBookings.filter((b) => {
      const driverName = b.driver?.fullName || "Guest Driver";
      const vehicle = `${b.vehicle?.vehicleType || "Car"} · ${b.vehicle?.registrationNumber || "Unregistered"}`;
      const propertyName = b.property?.name || "Assigned Property";
      const spotCode = b.assignedUnitCode || b.parkingResourceUnit?.spotCode || b.parkingSpot?.spotCode || b.parkingSpot?.displayName || "General Slot";

      const matchSearch =
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchProperty =
        propertyFilter === "ALL" || b.propertyId === propertyFilter;

      let matchTab = true;
      if (statusTab === "Upcoming") {
        matchTab = b.status === "CONFIRMED";
      } else if (statusTab === "Active") {
        matchTab = b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED";
      } else if (statusTab === "Completed") {
        matchTab = b.status === "COMPLETED";
      } else if (statusTab === "Cancelled") {
        matchTab = b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "NO_SHOW";
      }

      return matchSearch && matchProperty && matchTab;
    });
  }, [rawBookings, searchTerm, propertyFilter, statusTab]);

  // Live KPI Calculations
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let todayCount = 0;
    let upcomingCount = 0;
    let activeCount = 0;
    let completedToday = 0;

    for (const b of rawBookings) {
      const startTime = new Date(b.startAt).getTime();
      const createdTime = new Date(b.createdAt).getTime();
      if (startTime >= todayStart || createdTime >= todayStart) {
        todayCount++;
      }
      if (b.status === "CONFIRMED" && startTime >= now.getTime()) {
        upcomingCount++;
      }
      if (b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED") {
        activeCount++;
      }
      if (b.status === "COMPLETED" && new Date(b.checkedOutAt || b.effectiveEndAt).getTime() >= todayStart) {
        completedToday++;
      }
    }

    return { todayCount, upcomingCount, activeCount, completedToday };
  }, [rawBookings]);

  // Next arrivals sorted asc
  const nextArrivals = useMemo(() => {
    return rawBookings
      .filter((b) => b.status === "CONFIRMED")
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 4);
  }, [rawBookings]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredBookings.length === 0) {
      toast.info("No bookings available to export");
      return;
    }

    const headers = ["Booking Code", "Driver Name", "Vehicle Plate", "Property", "Spot", "Status", "Start Time", "End Time", "Total Amount"];
    const rows = filteredBookings.map((b) => [
      `"${b.bookingCode}"`,
      `"${b.driver?.fullName || "Guest Driver"}"`,
      `"${b.vehicle?.registrationNumber || "N/A"}"`,
      `"${b.property?.name || "Assigned Facility"}"`,
      `"${b.assignedUnitCode || b.parkingResourceUnit?.spotCode || b.parkingSpot?.displayName || "Standard"}"`,
      `"${b.status}"`,
      `"${formatDate(b.startAt)} ${formatTime(b.startAt)}"`,
      `"${formatDate(b.effectiveEndAt || b.scheduledEndAt)} ${formatTime(b.effectiveEndAt || b.scheduledEndAt)}"`,
      `"${formatPaisa(b.totalAmountPaisa)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manager-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredBookings.length} booking records`);
  };

  const getStatusBadge = (status: MarketplaceBookingStatus) => {
    switch (status) {
      case "CHECKED_IN":
      case "CHECKOUT_REQUESTED":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">● Active On-Site</span>;
      case "CONFIRMED":
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">● Confirmed</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">● Completed</span>;
      case "CANCELLED":
      case "EXPIRED":
      case "NO_SHOW":
        return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">● {status}</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">● {status}</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Bookings"
        subtitle="Manage live reservations across the parking facilities assigned to you."
        badge="Manager View"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Access Notice Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              You can manage bookings only for properties and booking actions delegated by the Property Owner.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-600">
              Assigned by: <strong className="text-slate-800">{primaryOwner}</strong>
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[#064E3B] border border-emerald-200">
              {activeDelegations.length} {activeDelegations.length === 1 ? "Facility" : "Facilities"}
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TODAY&apos;S BOOKINGS
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700">
                <Calendar className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.todayCount}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>Real-time database sync</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                UPCOMING
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.upcomingCount}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
              <span className="size-1.5 rounded-full bg-blue-600" />
              <span>Scheduled reservations</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CURRENTLY PARKED
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#064E3B] font-black text-sm">
                P
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.activeCount}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>Active on-site sessions</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                COMPLETED TODAY
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#064E3B]">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.completedToday}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-slate-400" />
              <span>Departed &amp; verified</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking code, driver, vehicle plate, or space..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Properties ({activeDelegations.length})</option>
              {activeDelegations.map((d) => (
                <option key={d.property.id} value={d.property.id}>
                  {d.property?.name || d.property.id}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Download className="size-3.5" />
              Export Manifest
            </Button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["All", "Upcoming", "Active", "Completed", "Cancelled"] as const).map((tab) => {
              let count = 0;
              if (tab === "All") count = rawBookings.length;
              else if (tab === "Upcoming") count = rawBookings.filter((b) => b.status === "CONFIRMED").length;
              else if (tab === "Active") count = rawBookings.filter((b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED").length;
              else if (tab === "Completed") count = rawBookings.filter((b) => b.status === "COMPLETED").length;
              else if (tab === "Cancelled") count = rawBookings.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "NO_SHOW").length;

              const isActive = statusTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#064E3B] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredBookings.length} of {rawBookings.length} total delegated bookings
          </span>
        </div>

        {/* Two-Column Grid: Bookings Cards (8 cols) vs Sidebar Insights (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Bookings List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Assigned Property Bookings
              </h2>
              <span className="text-xs text-slate-400">Live Backend Feed</span>
            </div>

            {bookingsQuery.isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                Loading live delegated bookings...
              </div>
            )}

            {!bookingsQuery.isLoading && filteredBookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Calendar className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Bookings Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `No bookings matched your search query "${searchTerm}".`
                    : "No bookings currently match this filter criteria across your assigned properties."}
                </p>
                {searchTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filteredBookings.map((b) => {
                const driverName = b.driver?.fullName || "Registered Driver";
                const vehicleStr = `${b.vehicle?.vehicleType || "Car"} · ${b.vehicle?.registrationNumber || "Unspecified"}`;
                const propertyName = b.property?.name || "Assigned Property";
                const spotCode = b.assignedUnitCode || b.parkingResourceUnit?.spotCode || b.parkingSpot?.displayName || b.parkingSpot?.spotCode || "Standard Bay";
                const isActive = b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED";

                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                          #{b.bookingCode}
                        </span>
                        {getStatusBadge(b.status)}
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDate(b.startAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          onClick={() => setSelectedBooking(b)}
                        >
                          View Booking
                        </Button>
                        {isActive && (
                          <Link href="/manager/active-sessions">
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-900 gap-1.5"
                            >
                              <Eye className="size-3.5" />
                              View Session
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* 4 Details Columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          DRIVER
                        </span>
                        <span className="font-bold text-slate-900 mt-1 block truncate">
                          {driverName}
                        </span>
                        {b.driver?.phone && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            {b.driver.phone}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          VEHICLE
                        </span>
                        <span className="text-slate-700 mt-1 block font-medium truncate">
                          {vehicleStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          PROPERTY &amp; SLOT
                        </span>
                        <span className="text-slate-700 mt-1 block font-medium truncate">
                          {propertyName}
                          <strong className="text-emerald-800 block text-[11px] mt-0.5">
                            Slot: {spotCode}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          SCHEDULE &amp; TARIFF
                        </span>
                        <span className="text-slate-700 mt-1 block font-medium">
                          {formatTime(b.startAt)} – {formatTime(b.effectiveEndAt || b.scheduledEndAt)}
                          <span className="text-emerald-800 font-bold block text-[11px] mt-0.5">
                            Total: {formatPaisa(b.totalAmountPaisa)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Today's Booking Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Today&apos;s Booking Summary
                </h3>
                <span className="text-xs text-emerald-700 font-semibold">Real-time</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    TOTAL
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{rawBookings.length}</span>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    ON-SITE
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">{metrics.activeCount}</span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">
                    UPCOMING
                  </span>
                  <span className="text-lg font-extrabold text-blue-700 mt-0.5 block">{metrics.upcomingCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Completed: <strong className="text-slate-800">{metrics.completedToday}</strong>
                </span>
                <span>
                  Cancelled / Exp:{" "}
                  <strong className="text-slate-800">
                    {rawBookings.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "NO_SHOW").length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Property Booking Load */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Property Booking Load
                </h3>
                <span className="text-xs text-slate-400">{activeDelegations.length} Assigned</span>
              </div>

              <div className="space-y-4 text-xs">
                {activeDelegations.map((del) => {
                  const propertyBookings = rawBookings.filter((b) => b.propertyId === del.property.id);
                  const activeCount = propertyBookings.filter((b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED").length;

                  return (
                    <div key={del.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800 truncate pr-2">
                          {del.property?.name || del.property.id}
                        </span>
                        <span className="font-semibold text-emerald-800 shrink-0">
                          {propertyBookings.length} Bookings
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#064E3B] rounded-full"
                          style={{ width: `${Math.min(100, Math.max(15, activeCount * 30))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>{activeCount} active on-site sessions</span>
                        <span>{del.property?.publicArea || "Dhaka"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Arrivals */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Next Arrivals
                </h3>
                <Link
                  href="/manager/active-sessions"
                  className="text-xs font-bold text-[#064E3B] hover:text-emerald-950 cursor-pointer"
                >
                  View Active →
                </Link>
              </div>

              {nextArrivals.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No scheduled arrivals pending.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {nextArrivals.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatTime(b.startAt)}
                        </span>
                        <p className="text-[11px] text-slate-700 font-medium">
                          {b.driver?.fullName || "Reserved Driver"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {b.property?.name || "Facility"} · {b.assignedUnitCode || b.parkingResourceUnit?.spotCode || "Bay"}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {formatDate(b.startAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Access Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Booking Access
                </h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Delegated Scope
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                    ● Can Access:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Assigned property bookings
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Booking details
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Active sessions
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Space assignments
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-red-700 block mb-1">
                    ● Restricted (Owner-Only):
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                      Refunds &amp; Settlements
                    </span>
                    <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                      Bank Payouts
                    </span>
                    <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                      Platform Fee Overrides
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/manager/active-sessions">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
                    <Car className="size-3.5 text-slate-500" />
                    Active Sessions
                  </Button>
                </Link>
                <Link href="/manager/properties">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
                    <Calendar className="size-3.5 text-slate-500" />
                    Properties
                  </Button>
                </Link>
                <Link href="/manager/parking-spaces">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
                    <Layers className="size-3.5 text-slate-500" />
                    Parking Spaces
                  </Button>
                </Link>
                <Link href="/manager/guards">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 h-9">
                    <Users className="size-3.5 text-slate-500" />
                    Manage Guards
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 isolate z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 font-mono">
                    #{selectedBooking.bookingCode}
                  </h3>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Created: {formatDate(selectedBooking.createdAt)} at {formatTime(selectedBooking.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Driver & Vehicle */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
                Driver &amp; Vehicle
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">Driver Full Name</span>
                  <span className="font-bold text-slate-900">{selectedBooking.driver?.fullName || "Guest Driver"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Phone Number</span>
                  <span className="font-medium text-slate-700">{selectedBooking.driver?.phone || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Vehicle Type</span>
                  <span className="font-medium text-slate-700">{selectedBooking.vehicle?.vehicleType || "Car"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Plate Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedBooking.vehicle?.registrationNumber || "Unspecified"}</span>
                </div>
              </div>
            </div>

            {/* Facility & Unit */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
                Location &amp; Space Allocation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">Property</span>
                  <span className="font-bold text-slate-900">{selectedBooking.property?.name || "Assigned Property"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Area</span>
                  <span className="font-medium text-slate-700">{selectedBooking.property?.publicArea || "Dhaka"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Assigned Unit Code</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {selectedBooking.assignedUnitCode || selectedBooking.parkingResourceUnit?.spotCode || selectedBooking.parkingSpot?.displayName || "Standard Bay"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Floor / Zone</span>
                  <span className="font-medium text-slate-700">
                    Floor {selectedBooking.parkingSpot?.floor || "Ground"} · Zone {selectedBooking.parkingSpot?.zone || "A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule & Financial Breakdown */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
                Time Window &amp; Financials
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">Start Time</span>
                  <span className="font-medium text-slate-900">{formatDate(selectedBooking.startAt)} {formatTime(selectedBooking.startAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">End Time</span>
                  <span className="font-medium text-slate-900">{formatDate(selectedBooking.effectiveEndAt || selectedBooking.scheduledEndAt)} {formatTime(selectedBooking.effectiveEndAt || selectedBooking.scheduledEndAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Base Rate / Subtotal</span>
                  <span className="font-medium text-slate-900">{formatPaisa(selectedBooking.baseAmountPaisa || selectedBooking.subtotalPaisa)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Amount</span>
                  <span className="font-extrabold text-[#064E3B] text-sm">{formatPaisa(selectedBooking.totalAmountPaisa)}</span>
                </div>
              </div>
            </div>

            {/* Delegated Scope Note */}
            <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5 text-[11px] text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#064E3B] shrink-0" />
              <span>Delegated manager mode: Operational check-in verification permitted. Financial settlements and refunds are restricted to the Property Owner.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
