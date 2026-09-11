"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Search,
  ChevronDown,
  Filter,
  Building2,
  Users,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Car,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_ALL_BOOKINGS,
  MOCK_OWNER_PROPERTIES,
  OwnerBooking,
} from "@/lib/data/mock-owner-data";

export function OwnerBookingsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [managerFilter, setManagerFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  // Counts for Top Metrics Cards
  const allCount = MOCK_ALL_BOOKINGS.length; // 12
  const upcomingCount = MOCK_ALL_BOOKINGS.filter(
    (b) => b.status === "UPCOMING" || b.status === "CONFIRMED"
  ).length; // 3
  const activeCount = MOCK_ALL_BOOKINGS.filter((b) => b.status === "ACTIVE").length; // 2
  const completedCount = MOCK_ALL_BOOKINGS.filter((b) => b.status === "COMPLETED").length; // 7

  // Filter and Sort Logic
  const filteredBookings = useMemo(() => {
    return MOCK_ALL_BOOKINGS.filter((booking) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        booking.id.toLowerCase().includes(q) ||
        booking.driverName.toLowerCase().includes(q) ||
        booking.vehicleModel.toLowerCase().includes(q) ||
        (booking.licensePlate && booking.licensePlate.toLowerCase().includes(q)) ||
        booking.propertyTitle.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = booking.status === "ACTIVE";
      } else if (statusFilter === "UPCOMING") {
        matchesStatus =
          booking.status === "UPCOMING" ||
          booking.status === "CONFIRMED" ||
          booking.status === "PENDING_ENTRY";
      } else if (statusFilter === "COMPLETED") {
        matchesStatus = booking.status === "COMPLETED";
      } else if (statusFilter !== "ALL") {
        matchesStatus = booking.status === statusFilter;
      }

      const matchesProperty =
        propertyFilter === "ALL" || booking.propertyId === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    }).sort((a, b) => {
      if (sortBy === "AMOUNT_HIGH") {
        return b.amountPaid - a.amountPaid;
      }
      if (sortBy === "DRIVER") {
        return a.driverName.localeCompare(b.driverName);
      }
      // Default: NEWEST (preserve defined order)
      return 0;
    });
  }, [searchQuery, statusFilter, propertyFilter, sortBy]);

  // Pagination calculation
  const totalEntries = filteredBookings.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="Bookings"
        subtitle="Manage reservations across your parking properties."
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-7">
        {/* Live Active Sessions Telemetry Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#064E3B]" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 font-heading">
                Live Facility Telemetry: 4 Vehicles Currently Parked
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Monitor real-time gate check-ins, elapsed parking duration counters, and overstay alerts in the live monitor.
              </p>
            </div>
          </div>
          <Link
            href="/owner/sessions"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-xs transition active:scale-95 shrink-0"
          >
            <span>Open Live Monitor</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* ==================================================================== */}
        {/* 1. METRICS ROW (4 Cards)                                             */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: ALL BOOKINGS */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              All Bookings
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {allCount}
            </div>
          </button>

          {/* Card 2: UPCOMING */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("UPCOMING");
              setCurrentPage(1);
            }}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "UPCOMING"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Upcoming
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {upcomingCount}
            </div>
          </button>

          {/* Card 3: ACTIVE NOW (Pulsing Dot) */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ACTIVE");
              setCurrentPage(1);
            }}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer relative ${
              statusFilter === "ACTIVE"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Active Now
              </span>
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-950 font-heading tracking-tight mt-1.5">
              {activeCount}
            </div>
          </button>

          {/* Card 4: COMPLETED */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("COMPLETED");
              setCurrentPage(1);
            }}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "COMPLETED"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Completed
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {completedCount}
            </div>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* 2. FILTER & CONTROLS BAR                                             */}
        {/* ==================================================================== */}
        <div className="space-y-3">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by booking ID, driver, vehicle..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition shadow-2xs"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UPCOMING">Upcoming / Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Listings Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by property listing"
                  value={propertyFilter}
                  onChange={(e) => {
                    setPropertyFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Listings</option>
                  <option value="prop-gulshan-1">Residential Building, Gulshan</option>
                  <option value="prop-banani-2">Office Parking, Banani</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Managed By Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by manager"
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Managed By: All</option>
                  <option value="rahim">Rahim Uddin</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Date Range Dropdown */}
              <div className="relative">
                <select
                  aria-label="Filter by date range"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Date Range</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  aria-label="Sort bookings"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="AMOUNT_HIGH">Highest Amount</option>
                  <option value="DRIVER">Driver Name</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. DATA TABLE                                                        */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading">
                  <th className="py-3.5 px-5">Booking ID</th>
                  <th className="py-3.5 px-5">Driver &amp; Vehicle</th>
                  <th className="py-3.5 px-5">Parking Space</th>
                  <th className="py-3.5 px-5">Schedule</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-5 text-center text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <CalendarDays className="size-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 font-heading">No bookings found</p>
                        <p className="text-xs text-slate-400">
                          Try clearing your filters or search keywords.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => {
                    const cleanId = booking.id.replace("#", "");

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* 1. Booking ID */}
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {booking.id}
                        </td>

                        {/* 2. Driver & Vehicle */}
                        <td className="py-4 px-5 min-w-[190px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 font-heading block">
                              {booking.driverName}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {booking.vehicleModel}
                              {booking.licensePlate && ` (${booking.licensePlate})`}
                            </span>
                          </div>
                        </td>

                        {/* 3. Parking Space */}
                        <td className="py-4 px-5 min-w-[200px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 font-heading block">
                              {booking.propertyTitle}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {booking.spotNumber}
                            </span>
                          </div>
                        </td>

                        {/* 4. Schedule */}
                        <td className="py-4 px-5 min-w-[170px] whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 font-heading block">
                              {booking.dateStr}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {booking.timeStr}
                            </span>
                          </div>
                        </td>

                        {/* 5. Amount */}
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 whitespace-nowrap text-sm">
                          ৳ {booking.amountPaid}
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          {booking.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>Active</span>
                            </span>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              <span className="size-1.5 rounded-full bg-blue-600" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          {booking.status === "UPCOMING" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                              <span className="size-1.5 rounded-full bg-purple-600" />
                              <span>Upcoming</span>
                            </span>
                          )}
                          {booking.status === "PENDING_ENTRY" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="size-1.5 rounded-full bg-amber-600" />
                              <span>Pending Entry</span>
                            </span>
                          )}
                          {booking.status === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="size-1.5 rounded-full bg-slate-500" />
                              <span>Completed</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Action: View Details */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/owner/bookings/${cleanId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-2xs transition-colors"
                          >
                            <span>View Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================================== */}
          {/* 4. PAGINATION FOOTER                                                 */}
          {/* ==================================================================== */}
          <div className="border-t border-[#E5E7EB] px-5 py-3.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{totalEntries === 0 ? 0 : startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(startIndex + pageSize, totalEntries)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{totalEntries}</span> entries
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="size-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`size-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-[#064E3B] text-white shadow-2xs"
                        : "border border-[#E5E7EB] text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="size-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
