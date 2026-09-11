"use client";

import React from "react";
import Link from "next/link";
import { Check, AlertTriangle, ArrowRight, Home } from "lucide-react";

interface GuardCheckoutSuccessViewProps {
  bookingId: string;
}

export function GuardCheckoutSuccessView({ bookingId }: GuardCheckoutSuccessViewProps) {
  const displayCode = bookingId.startsWith("PE-") ? `#${bookingId}` : `#PE-BK-2051`;

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Hero Section */}
      <div className="flex flex-col items-center justify-center text-center pt-3">
        {/* Large Circular Green Success Checkmark */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399]/20 ring-8 ring-[#34D399]/10 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#059669]">
            <Check className="h-6 w-6 stroke-[3]" />
          </div>
        </div>

        <h1 className="mt-3.5 text-2xl font-extrabold tracking-tight text-gray-900 font-heading">
          Check-Out Successful
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Vehicle has been successfully checked out.
        </p>

        {/* Light blue pill badge for Booking ID */}
        <div className="mt-3 rounded-full border border-indigo-100 bg-[#eef2ff] px-3.5 py-1 text-xs font-semibold text-indigo-700">
          <span># Booking ID: {displayCode}</span>
        </div>
      </div>

      {/* 2. Slot Card */}
      <section className="rounded-2xl border border-[#E5E7EB] border-t-4 border-t-[#064E3B] bg-white p-5 text-center shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Parking Slot
        </p>
        <h2 className="mt-1 text-4xl font-black tracking-tight text-[#064E3B] font-heading">
          B-08
        </h2>

        {/* Available Pill */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>AVAILABLE</span>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Basement Level B • Gate 2
        </p>
      </section>

      {/* 3. Session Summary Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading">
            Session Summary
          </h3>
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
            Completed
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Driver</span>
            <span className="font-bold text-gray-900">Farhan Karim</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Vehicle</span>
            <span className="font-bold text-gray-900">Honda Vezel • White</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500">License Plate</span>
            <div className="rounded-md bg-[#eef2ff] px-2.5 py-1 font-mono text-xs font-black tracking-wider text-gray-900">
              DHAKA METRO-GHA XX-XXXX
            </div>
          </div>

          <div className="my-2 border-t border-gray-100" />

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Check-In</span>
            <span className="font-bold text-gray-900">10:42 AM</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Check-Out</span>
            <span className="font-bold text-gray-900">11:10 AM</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500 font-medium">Total Duration</span>
            <span className="text-sm font-extrabold text-[#064E3B] font-mono">
              00h 28m
            </span>
          </div>
        </div>
      </section>

      {/* 4. Actions */}
      <div className="space-y-2.5 pt-2 text-center">
        {/* Primary Deep Emerald Button */}
        <Link
          href="/guard"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] py-3.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(6,78,59,0.35)] transition-all active:scale-[0.99] hover:bg-[#053d2e] [-webkit-tap-highlight-color:transparent]"
        >
          <span>Done — Return Home</span>
        </Link>

        {/* Outline Button */}
        <Link
          href={`/guard/bookings/${bookingId}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.99] [-webkit-tap-highlight-color:transparent]"
        >
          <span>View Booking Details</span>
        </Link>

        {/* Text Link */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => alert("Report issue for booking " + displayCode)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <span>Report an Issue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
