"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Phone,
  Car,
  Info,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface GuardConfirmCheckinViewProps {
  bookingId: string;
}

export function GuardConfirmCheckinView({ bookingId }: GuardConfirmCheckinViewProps) {
  const router = useRouter();

  // Normalized display code
  const displayCode = bookingId.startsWith("PE-") ? `#${bookingId}` : `#PE-BK-2051`;

  // Checklist states
  const [driverIdentityChecked, setDriverIdentityChecked] = useState(true);
  const [vehiclePlateChecked, setVehiclePlateChecked] = useState(true);
  const [slotConfirmedChecked, setSlotConfirmedChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = driverIdentityChecked && vehiclePlateChecked && slotConfirmedChecked;

  const handleConfirmCheckin = () => {
    if (!allChecked) return;
    setIsSubmitting(true);
    setTimeout(() => {
      // Navigate to Step 5: Active Session
      router.push(`/guard/bookings/${bookingId}/active`);
    }, 600);
  };

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. Status Card: Booking Verified via QR */}
      <section className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-xs">
        {/* Verified Circular Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34D399]/20 text-[#064E3B] ring-8 ring-[#34D399]/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#059669] text-white">
            <Check className="h-5 w-5 stroke-[3]" />
          </div>
        </div>

        {/* Valid Booking Pill */}
        <span className="mt-3.5 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#064E3B] border border-emerald-200">
          Valid Booking
        </span>

        {/* Title & Description */}
        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#064E3B] font-heading">
          Booking Verified
        </h1>
        <p className="mt-1 text-xs text-gray-500 max-w-[260px] leading-relaxed">
          The booking is valid and ready for guard check-in confirmation.
        </p>

        {/* Verified via QR Badge */}
        <span className="mt-3 inline-block rounded bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
          Verified via QR
        </span>
      </section>

      {/* 2. Direction / Assignment Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Booking ID
            </p>
            <p className="font-mono text-xs font-bold text-gray-900">
              {displayCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Status
            </p>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
              Expected
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Scheduled Arrival
            </p>
            <p className="text-xs font-bold text-gray-900">
              10:30 AM
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Entrance
            </p>
            <p className="text-xs font-bold text-gray-900">
              Gate 2
            </p>
          </div>
        </div>

        {/* Assigned Space Highlight Box */}
        <div className="rounded-xl border border-indigo-100 bg-[#f0f4ff] p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Assigned Slot
          </p>
          <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-[#064E3B] font-heading">
            B-08
          </p>
        </div>
      </section>

      {/* 3. Driver Summary Card */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full border border-gray-200 shadow-xs">
              <Image
                src="/assets/avatar-driver.jpg"
                alt="Farhan Karim"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 font-heading">
                Farhan Karim
              </p>
              <p className="text-xs text-gray-500 font-mono">
                +880 17XX-XXXXXX
              </p>
            </div>
          </div>

          <a
            href="tel:+8801700000000"
            aria-label="Call Driver"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#064E3B] transition-transform active:scale-95 hover:bg-emerald-100"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* 4. Vehicle Summary Card with Authentic BD License Plate */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-900 font-heading">
              Honda Vezel
            </p>
            <p className="text-xs text-gray-500">
              White • Car
            </p>
          </div>
          <Car className="h-5 w-5 text-gray-400" />
        </div>

        {/* Physical Bangladesh Plate Styled Box */}
        <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-gray-200 border-l-4 border-l-[#064E3B] bg-gray-50 py-2 px-4 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600">
            DHAKA METRO-GHA
          </span>
          <span className="font-mono text-base font-black tracking-widest text-gray-900">
            XX-XXXX
          </span>
        </div>
      </section>

      {/* 5. Verification Checklist */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading mb-3">
          Verification Checklist
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          {/* Item 1: Booking valid (Auto-checked via QR) */}
          <div className="flex items-center gap-3 py-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-white">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span className="font-medium text-gray-800">
              Booking valid
            </span>
          </div>

          {/* Item 2: Driver identity matched */}
          <label className="flex items-center gap-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={driverIdentityChecked}
              onChange={(e) => setDriverIdentityChecked(e.target.checked)}
              className="h-5 w-5 rounded-full border-gray-300 text-[#064E3B] focus:ring-[#064E3B] accent-[#064E3B] cursor-pointer"
            />
            <span className={`font-medium transition-colors ${driverIdentityChecked ? "text-gray-800" : "text-gray-400"}`}>
              Driver identity matched
            </span>
          </label>

          {/* Item 3: Vehicle plate matched */}
          <label className="flex items-center gap-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={vehiclePlateChecked}
              onChange={(e) => setVehiclePlateChecked(e.target.checked)}
              className="h-5 w-5 rounded-full border-gray-300 text-[#064E3B] focus:ring-[#064E3B] accent-[#064E3B] cursor-pointer"
            />
            <span className={`font-medium transition-colors ${vehiclePlateChecked ? "text-gray-800" : "text-gray-400"}`}>
              Vehicle plate matched
            </span>
          </label>

          {/* Item 4: Assigned parking slot confirmed */}
          <label className="flex items-center gap-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={slotConfirmedChecked}
              onChange={(e) => setSlotConfirmedChecked(e.target.checked)}
              className="h-5 w-5 rounded-full border-gray-300 text-[#064E3B] focus:ring-[#064E3B] accent-[#064E3B] cursor-pointer"
            />
            <span className={`font-medium transition-colors ${slotConfirmedChecked ? "text-gray-800" : "text-gray-400"}`}>
              Assigned parking slot confirmed
            </span>
          </label>
        </div>
      </section>

      {/* 6. Information Notice Box */}
      <section className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-[#f0f4ff] p-3 text-xs leading-relaxed text-slate-600">
        <Info className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
        <p className="text-[11px]">
          Booking verification confirms the reservation only. Check-in is completed after the guard confirms the arriving vehicle and entry details.
        </p>
      </section>

      {/* 7. Action Button & Link */}
      <div className="space-y-2.5 pt-2 text-center">
        <p className="text-xs font-semibold text-gray-600">
          Confirm the vehicle before allowing entry.
        </p>

        <button
          type="button"
          disabled={!allChecked || isSubmitting}
          onClick={handleConfirmCheckin}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-md transition-all active:scale-[0.99] [-webkit-tap-highlight-color:transparent] ${
            allChecked
              ? "bg-[#064E3B] hover:bg-[#053d2e] shadow-[0_4px_14px_rgba(6,78,59,0.35)]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>{isSubmitting ? "Checking In Vehicle..." : "Continue to Check-In"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <div>
          <Link
            href={`/guard/bookings/${bookingId}`}
            className="inline-block text-xs font-bold text-[#064E3B] hover:underline"
          >
            Back to Booking Details
          </Link>
        </div>
      </div>
    </div>
  );
}
