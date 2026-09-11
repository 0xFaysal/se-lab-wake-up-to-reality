"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  User,
  CheckCircle2,
  Car,
  Binary,
  DoorOpen,
  QrCode,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

interface GuardUpcomingBookingViewProps {
  bookingId: string;
}

export function GuardUpcomingBookingView({ bookingId }: GuardUpcomingBookingViewProps) {
  const router = useRouter();

  // Normalized display booking code
  const displayCode = bookingId.startsWith("PE-") ? `#${bookingId}` : `#PE-BK-2058`;

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Header Section (Centered) */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        {/* Centered light-purple UPCOMING pill with clock icon */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-[#eef2ff] px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-indigo-600" />
          <span className="uppercase tracking-wider">Upcoming</span>
        </div>

        {/* Huge Typography for Booking ID */}
        <h1 className="mt-3 font-mono text-3xl font-black tracking-tight text-gray-900 font-heading">
          {displayCode}
        </h1>

        {/* Expected Arrival time */}
        <p className="mt-1 text-sm font-semibold text-gray-600">
          Expected Arrival: <span className="font-bold text-gray-900">11:45 AM</span>
        </p>
      </div>

      {/* 2. Driver Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Driver
        </p>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <User className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 font-heading">
              Nusrat Jahan
            </h2>
            <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" />
              <span>Verified User</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vehicle Details Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Vehicle Details
        </p>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Car className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Toyota Axio • Silver
            </h3>
          </div>
        </div>

        {/* Large Dark-Grey Container for the License Plate with '123' / Keypad icon */}
        <div className="flex items-center gap-3.5 rounded-xl bg-[#232a3b] p-3.5 text-white shadow-inner">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/90 ring-1 ring-white/20">
            <span className="font-mono text-xs font-bold tracking-tighter">123</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
              DHAKA METRO-
            </span>
            <span className="font-mono text-lg font-black tracking-widest text-white uppercase">
              GA 18-4582
            </span>
          </div>
        </div>
      </section>

      {/* 4. Assignment Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
          Assignment
        </p>

        <div className="flex items-center gap-3.5">
          {/* Deep Emerald Square for Slot */}
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#064E3B] text-white shadow-xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
              Slot
            </span>
            <span className="text-xl font-black font-heading leading-tight">
              B-11
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Basement Level B
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
              <span>Gate 2 Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Actions */}
      <div className="space-y-3 pt-2 text-center">
        {/* Massive Solid Deep Emerald Button */}
        <Link
          href={`/guard/scan?id=${bookingId}`}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#064E3B] py-4 text-sm font-bold text-white shadow-[0_4px_16px_rgba(6,78,59,0.35)] transition-all active:scale-[0.99] hover:bg-[#053d2e] [-webkit-tap-highlight-color:transparent]"
        >
          <QrCode className="h-5 w-5" />
          <span>Scan QR to Check In</span>
        </Link>

        {/* Red Text Button */}
        <div>
          <button
            type="button"
            onClick={() => alert("Reporting issue for booking " + displayCode)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors py-1"
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Report an Issue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
