"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Keyboard,
  Clock,
  Car,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  MOCK_GUARD_PROFILE,
  MOCK_GUARD_STATS,
  MOCK_UPCOMING_ARRIVALS,
  MOCK_CURRENTLY_PARKED,
} from "@/lib/data/mock-guard-data";
import { GuardOtpModal } from "./guard-otp-modal";

export function GuardDashboardView() {
  const [isOnDuty, setIsOnDuty] = useState(MOCK_GUARD_PROFILE.isOnDuty);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const upcomingItem = MOCK_UPCOMING_ARRIVALS[0];

  return (
    <div className="space-y-4 select-none pb-4">
      {/* 1. Guard Greeting & Duty Status Pill */}
      <section className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading leading-tight">
            Good morning, Rahim <br />
            <span className="text-gray-900">Uddin</span>
          </h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B]">
              {MOCK_GUARD_PROFILE.role}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{MOCK_GUARD_PROFILE.location}</span>
          </div>
        </div>

        {/* ON / OFF DUTY Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOnDuty(!isOnDuty)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 [-webkit-tap-highlight-color:transparent] ${
            isOnDuty
              ? "bg-[#E6F4EA] text-[#064E3B] border border-emerald-200 shadow-xs"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isOnDuty ? "bg-[#064E3B] animate-pulse" : "bg-gray-400"
            }`}
          />
          <span>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</span>
        </button>
      </section>

      {/* 2. Primary Action Card: Scan Booking QR */}
      <section>
        <Link
          href="/guard/scan"
          className="group relative flex flex-col items-center justify-center rounded-2xl bg-[#064E3B] p-6 text-center text-white shadow-[0_10px_25px_rgba(6,78,59,0.22)] transition-transform duration-200 active:scale-[0.99] [-webkit-tap-highlight-color:transparent]"
        >
          {/* QR Icon Frame */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xs transition-transform group-hover:scale-105">
            <QrCode className="h-8 w-8 text-white" />
          </div>

          <h2 className="mt-3.5 text-lg font-bold tracking-tight text-white font-heading">
            Scan Booking QR
          </h2>

          <p className="mt-1 text-xs font-normal text-emerald-100/85 max-w-[260px] leading-relaxed">
            Verify a driver’s active booking for secure entry or exit.
          </p>
        </Link>
      </section>

      {/* 3. Secondary Action: Enter Access OTP */}
      <section className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsOtpModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full py-1.5 px-4 text-xs font-bold text-[#064E3B] transition-colors hover:bg-emerald-50 active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <Keyboard className="h-4 w-4" />
          <span>Enter Access OTP</span>
        </button>
      </section>

      {/* 4. Duty Assignment & Shift Details */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Today&apos;s Duty
              </p>
              <p className="text-xs font-bold text-gray-900">
                Shift: {MOCK_GUARD_PROFILE.shift}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Assignment
            </p>
            <p className="text-xs font-bold text-gray-900">
              {MOCK_GUARD_PROFILE.gate}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Three-Column Metric Block */}
      <section className="grid grid-cols-3 gap-2.5">
        {/* Metric 1: Upcoming Today */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-xs">
          <span className="text-2xl font-bold text-gray-900 font-heading">
            {MOCK_GUARD_STATS.upcomingToday}
          </span>
          <span className="mt-0.5 text-[11px] font-medium leading-tight text-gray-500">
            Upcoming Today
          </span>
        </div>

        {/* Metric 2: Checked In (Highlighted) */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-emerald-300 bg-[#eaf8f1] p-3 text-center shadow-xs">
          <span className="text-2xl font-bold text-[#064E3B] font-heading">
            {MOCK_GUARD_STATS.checkedIn}
          </span>
          <span className="mt-0.5 text-[11px] font-bold leading-tight text-[#064E3B]">
            Checked In
          </span>
        </div>

        {/* Metric 3: Completed Today */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-xs">
          <span className="text-2xl font-bold text-gray-900 font-heading">
            {MOCK_GUARD_STATS.completedToday}
          </span>
          <span className="mt-0.5 text-[11px] font-medium leading-tight text-gray-500">
            Completed Today
          </span>
        </div>
      </section>

      {/* 6. Upcoming Arrivals Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-heading">
            Upcoming Arrivals
          </h3>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            {upcomingItem.timeEstimate}
          </span>
        </div>

        {/* Arrival Card with emerald left border accent */}
        <div className="rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#064E3B] bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#064E3B] font-mono">
              {upcomingItem.bookingCode}
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {upcomingItem.slot}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-xl font-extrabold tracking-tight text-gray-900 font-heading">
              {upcomingItem.time}
            </span>
          </div>

          <div className="my-2.5 border-t border-gray-100" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Car className="h-4 w-4 text-gray-500" />
              <span>
                {upcomingItem.vehicleModel} • {upcomingItem.vehicleColor}
              </span>
            </div>

            <Link
              href={`/guard/bookings/${upcomingItem.id}`}
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              View Booking
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Currently Parked Section */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-heading">
          Currently Parked
        </h3>

        <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-extrabold text-[#064E3B]">
              P
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                {MOCK_CURRENTLY_PARKED.length} vehicles currently inside
              </p>
              <p className="text-[11px] text-gray-500">
                Assigned Property: Gulshan Avenue
              </p>
            </div>
          </div>

          <Link
            href="/guard/bookings/PE-BK-2051/active"
            className="text-right text-xs font-bold text-[#064E3B] hover:underline shrink-0 pl-2"
          >
            View Active Sessions
          </Link>
        </div>
      </section>

      {/* 8. Disclaimer / Duty Access Note */}
      <section className="rounded-xl border border-indigo-100 bg-[#f0f4ff] p-3 text-center">
        <p className="text-[11px] font-normal leading-relaxed text-slate-600">
          &ldquo;You can only view bookings and parking activity for your assigned property and duty access point.&rdquo;
        </p>
      </section>

      {/* OTP Entry Modal */}
      <GuardOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
}
