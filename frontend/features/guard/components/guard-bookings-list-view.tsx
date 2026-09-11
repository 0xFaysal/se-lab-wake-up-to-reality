"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  UserCheck,
  LogOut,
  Car,
  Filter,
} from "lucide-react";
import {
  MOCK_GUARD_STATS,
  MOCK_GUARD_BOOKINGS_LIST,
} from "@/lib/data/mock-guard-data";
import { GuardBookingListItem } from "@/features/guard/types";

type FilterTab = "All" | "Upcoming" | "Active" | "Completed";

export function GuardBookingsListView() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = useMemo(() => {
    return MOCK_GUARD_BOOKINGS_LIST.filter((booking) => {
      // Tab filter
      if (activeTab === "Upcoming" && booking.status !== "upcoming") return false;
      if (activeTab === "Active" && booking.status !== "parked") return false;
      if (activeTab === "Completed" && booking.status !== "completed") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = booking.bookingCode.toLowerCase().includes(query);
        const matchesPlate = (
          booking.vehiclePlateCity +
          " " +
          booking.vehiclePlateNumber
        )
          .toLowerCase()
          .includes(query);
        const matchesDriver = booking.driverName.toLowerCase().includes(query);
        const matchesVehicle = booking.vehicleModel.toLowerCase().includes(query);
        const matchesSlot = booking.slot.toLowerCase().includes(query);

        return matchesCode || matchesPlate || matchesDriver || matchesVehicle || matchesSlot;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Page Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading">
          Bookings
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Manage today&apos;s assigned parking activity.
        </p>
      </div>

      {/* 2. Stats Row (3 Metrics) */}
      <section className="grid grid-cols-3 gap-2.5">
        {/* Upcoming */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-xs">
          <span className="text-2xl font-extrabold text-gray-900 font-heading">
            {MOCK_GUARD_STATS.upcomingToday}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Upcoming
          </span>
        </div>

        {/* Checked In (Highlighted Green) */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-300 bg-[#a7f3d0] p-3 text-center shadow-xs">
          <span className="text-2xl font-extrabold text-[#064E3B] font-heading">
            {MOCK_GUARD_STATS.checkedIn}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#064E3B]">
            Checked In
          </span>
        </div>

        {/* Completed */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-xs">
          <span className="text-2xl font-extrabold text-gray-900 font-heading">
            {MOCK_GUARD_STATS.completedToday}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Completed
          </span>
        </div>
      </section>

      {/* 3. Filter Pills */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(["All", "Upcoming", "Active", "Completed"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0 active:scale-95 [-webkit-tap-highlight-color:transparent] ${
              activeTab === tab
                ? "bg-[#064E3B] text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search booking ID or license plate"
          className="w-full rounded-xl border border-gray-200 bg-[#f0f4ff]/70 py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#064E3B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* 5. Booking List */}
      <section className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            No bookings found matching your search.
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isParked = booking.status === "parked";
            const isUpcoming = booking.status === "upcoming";
            const isCompleted = booking.status === "completed";

            return (
              <div
                key={booking.id}
                className={`relative rounded-2xl bg-white p-4 transition-all shadow-xs ${
                  isParked
                    ? "border-2 border-[#064E3B] shadow-[0_4px_16px_rgba(6,78,59,0.08)]"
                    : "border border-[#E5E7EB]"
                }`}
              >
                {/* Header Row: Badge & Booking ID on Left, Slot Number on Right */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {isUpcoming && (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                        Upcoming
                      </span>
                    )}
                    {isParked && (
                      <span className="flex items-center gap-1 rounded bg-[#064E3B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <span>Parked</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        Completed
                      </span>
                    )}

                    <span className="font-mono text-xs font-bold text-gray-500">
                      {booking.bookingCode}
                    </span>
                  </div>

                  {/* Slot Big Display */}
                  <div className="text-right">
                    <span
                      className={`text-2xl font-black font-heading leading-none ${
                        isParked ? "text-[#064E3B]" : "text-gray-900"
                      }`}
                    >
                      {booking.slot}
                    </span>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">
                      Slot
                    </p>
                  </div>
                </div>

                {/* Driver & Vehicle */}
                <div className="mt-1">
                  <h3 className="text-sm font-bold text-gray-900 font-heading">
                    {booking.driverName}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span>
                      {booking.vehicleModel} • {booking.vehicleColor}
                    </span>
                  </div>
                </div>

                {/* Stylized Bangladesh License Plate Box */}
                <div className="mt-3">
                  <div className="inline-flex flex-col items-center justify-center rounded-md border border-gray-200 bg-[#f0f4ff]/50 px-3 py-1 text-center">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-600">
                      {booking.vehiclePlateCity}
                    </span>
                    <span className="font-mono text-xs font-black tracking-widest text-gray-900">
                      {booking.vehiclePlateNumber}
                    </span>
                  </div>
                </div>

                {/* Footer Row: Timestamp on Left, Action Button on Right */}
                <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {isUpcoming && <Clock className="h-3.5 w-3.5 text-gray-400" />}
                    {isParked && <UserCheck className="h-3.5 w-3.5 text-emerald-700" />}
                    {isCompleted && <LogOut className="h-3.5 w-3.5 text-gray-400" />}

                    <span className={isParked ? "font-semibold text-emerald-800" : ""}>
                      {booking.timeLabel}: {booking.timeValue}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isUpcoming && (
                      <Link
                        href={`/guard/bookings/${booking.id}/upcoming`}
                        className="inline-flex items-center justify-center rounded-lg bg-[#e0e7ff] px-3.5 py-1.5 text-xs font-bold text-indigo-900 transition-colors hover:bg-indigo-200 active:scale-95 [-webkit-tap-highlight-color:transparent]"
                      >
                        View Booking
                      </Link>
                    )}
                    {isParked && (
                      <Link
                        href={`/guard/bookings/${booking.id}/active`}
                        className="inline-flex items-center justify-center rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#053d2e] active:scale-95 [-webkit-tap-highlight-color:transparent]"
                      >
                        Active Session
                      </Link>
                    )}
                    {isCompleted && (
                      <Link
                        href={`/guard/bookings/${booking.id}/checkout-success`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-95 [-webkit-tap-highlight-color:transparent]"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
