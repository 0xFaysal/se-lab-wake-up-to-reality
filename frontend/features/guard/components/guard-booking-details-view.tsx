"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Keyboard,
  QrCode,
  User,
  Phone,
  Car,
  Calendar,
  Clock,
  MapPin,
  ListChecks,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { GuardOtpModal } from "./guard-otp-modal";

interface GuardBookingDetailsViewProps {
  bookingId: string;
}

export function GuardBookingDetailsView({ bookingId }: GuardBookingDetailsViewProps) {
  const router = useRouter();
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  // Normalized display booking code
  const displayCode = bookingId.startsWith("PE-") ? `#${bookingId}` : `#PE-BK-2051`;

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Status Banner */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-gray-900 font-mono tracking-tight">
            {displayCode}
          </span>
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-800 border border-amber-200">
            Expected
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Scheduled arrival today at 10:30 AM
        </p>
      </div>

      {/* 2. Action Card: Awaiting Check-In */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-800 mb-3">
          <CalendarCheck className="h-5 w-5 text-[#064E3B]" />
          <h2 className="text-sm font-bold tracking-tight text-[#064E3B] font-heading">
            Awaiting Check-In
          </h2>
        </div>

        {/* 3-Column Key Info */}
        <div className="grid grid-cols-3 gap-2 border-y border-gray-100 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Expected arrival
            </p>
            <p className="mt-0.5 text-xs font-bold text-gray-900">
              10:30 AM
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Assigned slot
            </p>
            <p className="mt-0.5 text-xs font-extrabold text-[#064E3B]">
              B-08
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Entrance
            </p>
            <p className="mt-0.5 text-xs font-bold text-gray-900">
              Gate 2
            </p>
          </div>
        </div>

        {/* Full-width Action Buttons */}
        <div className="mt-3.5 space-y-2">
          {/* Primary Deep Emerald Button: Enter Access OTP */}
          <button
            type="button"
            onClick={() => setIsOtpOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] py-3 text-xs font-bold text-white shadow-xs transition-transform active:scale-[0.99] hover:bg-[#053d2e] [-webkit-tap-highlight-color:transparent]"
          >
            <Keyboard className="h-4 w-4" />
            <span>Enter Access OTP</span>
          </button>

          {/* Outline Button: Scan Booking QR */}
          <Link
            href={`/guard/scan?id=${bookingId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/50 py-3 text-xs font-bold text-[#064E3B] transition-colors hover:bg-emerald-100/60 active:scale-[0.99] [-webkit-tap-highlight-color:transparent]"
          >
            <QrCode className="h-4 w-4 text-[#064E3B]" />
            <span>Scan Booking QR</span>
          </Link>
        </div>
      </section>

      {/* 3. Driver Info Card */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-gray-500 mb-2.5">
          <User className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Driver
          </h3>
        </div>

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

      {/* 4. Vehicle Info Card with Physical BD Plate Format */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-gray-500 mb-2.5">
          <Car className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Vehicle
          </h3>
        </div>

        {/* Model / Color / Type */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Model</p>
            <p className="font-bold text-gray-900">Honda Vezel</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Color</p>
            <p className="font-bold text-gray-900">White</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Type</p>
            <p className="font-bold text-gray-900">Car</p>
          </div>
        </div>

        {/* Physical Bangladesh License Plate Container */}
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">
            License Plate
          </p>
          <div className="relative flex items-center justify-center rounded-lg border-2 border-gray-800 bg-gray-50 px-4 py-2.5 shadow-inner">
            <span className="font-mono text-sm font-extrabold tracking-widest text-gray-900 uppercase">
              DHAKA METRO-GHA-XX-XXXX
            </span>
          </div>
        </div>
      </section>

      {/* 5. Booking Information Card */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-gray-500 mb-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Booking Information
          </h3>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-bold text-gray-900">August 11, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-bold text-gray-900">10:30 AM – 1:30 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-bold text-gray-900">3 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Location</span>
            <span className="font-bold text-gray-900">Gulshan Avenue Parking</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Slot &amp; Gate</span>
            <span className="font-bold text-gray-900">Slot B-08, Gate 2</span>
          </div>
        </div>
      </section>

      {/* 6. Before Check-In (Preview Checklist) */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-gray-500 mb-1">
          <ListChecks className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Before Check-in
          </h3>
        </div>
        <p className="text-[11px] text-gray-500 mb-3 italic">
          Complete verification before check-in.
        </p>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-gray-400">
            <div className="h-4 w-4 rounded-full border border-gray-300" />
            <div className="flex items-center gap-2">
              <span>Booking verified</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-gray-400">
            <div className="h-4 w-4 rounded-full border border-gray-300" />
            <span>Driver identity confirmed</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-400">
            <div className="h-4 w-4 rounded-full border border-gray-300" />
            <span>Vehicle plate matched</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-400">
            <div className="h-4 w-4 rounded-full border border-gray-300" />
            <span>Correct parking slot confirmed</span>
          </div>
        </div>
      </section>

      {/* 7. Notes Card */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-gray-500 mb-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Notes
          </h3>
        </div>

        <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-xs font-medium text-amber-900">
          Driver requested access through Gate 2.
        </div>
      </section>

      {/* 8. Report an Issue */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => alert("Report issue dialog / dispatcher call")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
          <span>Report an Issue</span>
        </button>
      </div>

      {/* OTP Verification Modal */}
      <GuardOtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
      />
    </div>
  );
}
