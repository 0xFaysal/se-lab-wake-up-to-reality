"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  CheckCircle2,
  Copy,
  Navigation,
  Download,
  Car,
  MapPin,
  Calendar,
  CreditCard,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import stepAccessQrImg from "@/assets/step-access-qr.jpg";
import dhakaArrivalMapImg from "@/assets/dhaka-arrival-map.jpg";

export default function BookingConfirmationPage() {
  const [copied, setCopied] = useState(false);
  const bookingId = "PKBD-2026-1027-1842";

  function handleCopyId() {
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* 1. Step Progress Header (All 3 steps complete) */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 text-xs sm:text-sm font-heading">
        {/* Step 1: Parking Selected */}
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span>Parking Selected</span>
        </div>

        <div className="w-10 sm:w-16 h-px bg-primary" />

        {/* Step 2: Review & Pay */}
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span>Review & Pay</span>
        </div>

        <div className="w-10 sm:w-16 h-px bg-primary" />

        {/* Step 3: Confirmation */}
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span>Confirmation</span>
        </div>
      </div>

      {/* 2. Success Banner Hero */}
      <div className="flex flex-col items-center text-center space-y-3 pt-2 pb-4">
        {/* Big Green Circle Checkmark */}
        <div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-[#064E3B] text-white shadow-xl ring-8 ring-emerald-100/70 animate-in zoom-in-75 duration-300">
          <Check className="size-8 sm:size-10 stroke-[3]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-heading">
          Your parking is confirmed
        </h1>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold font-heading">
            <Check className="size-3.5 stroke-[3]" />
            Payment Successful
          </span>
        </div>

        {/* Booking ID Capsule with Copy Action */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs sm:text-sm font-mono font-medium shadow-2xs">
          <span className="text-muted-foreground">Booking ID:</span>
          <span className="font-bold text-foreground font-mono">{bookingId}</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="ml-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="Copy Booking ID"
          >
            {copied ? (
              <span className="text-xs font-bold text-primary">Copied!</span>
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Main Grid Layout (Left 2/3 Content + Right 1/3 Digital Pass) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. RESERVATION SUMMARY Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4 urban-card-shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Reservation Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Location</span>
                <span className="font-bold text-foreground font-heading mt-0.5 block">
                  Gulshan Residential Parking
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Vehicle</span>
                <span className="font-bold text-foreground font-mono mt-0.5 block">
                  Sedan (GA 12-3456)
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Date & Time</span>
                <span className="font-bold text-foreground font-heading mt-0.5 block">
                  Oct 27, 10:00 AM - 4:00 PM
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Payment</span>
                <span className="font-bold text-foreground font-mono mt-0.5 block">
                  ৳416 via bKash
                </span>
              </div>
            </div>
          </div>

          {/* B. ENTRY INSTRUCTIONS Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4 urban-card-shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Entry Instructions
            </h3>

            <div className="space-y-3.5">
              {[
                {
                  num: "1",
                  text: "Navigate to property using the map below.",
                },
                {
                  num: "2",
                  text: "Show Digital Access Pass to the guard.",
                },
                {
                  num: "3",
                  text: "Guard scans QR or enters OTP for verification.",
                },
                {
                  num: "4",
                  text: "Park in your assigned space securely.",
                },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold font-mono">
                    {step.num}
                  </span>
                  <p className="text-sm font-medium text-foreground leading-snug pt-0.5">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* C. Location & Arrival Card */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-2xs urban-card-shadow">
            {/* Map Preview Image */}
            <div className="relative w-full sm:w-56 h-36 sm:h-36 rounded-xl overflow-hidden shrink-0 border border-border/70 bg-muted">
              <Image
                src={dhakaArrivalMapImg}
                alt="Dhaka Location Map Preview"
                fill
                className="object-cover"
              />
            </div>

            {/* Description & Button */}
            <div className="flex-1 space-y-2.5">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-heading">
                Location & Arrival
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The entrance is located on the north side of the building on
                Road 44. Look for the ParkEase sign.
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Road+12,+Block+E,+Gulshan+1,+Dhaka"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground px-4 py-2 text-xs font-bold shadow-2xs transition-colors font-heading cursor-pointer"
              >
                <Navigation className="size-3.5 text-primary" />
                Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) - Sticky Digital Access Pass & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24 space-y-4">
            {/* Digital Access Pass Container */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl ring-1 ring-border/50 urban-card-shadow">
              {/* Header Ribbon */}
              <div className="bg-[#064E3B] text-white py-3 text-center text-xs font-bold tracking-widest uppercase font-heading">
                Digital Access Pass
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                {/* QR Code Container */}
                <div className="relative size-36 sm:size-40 rounded-xl bg-white p-2 shadow-inner border border-gray-200 overflow-hidden flex items-center justify-center">
                  <Image
                    src={stepAccessQrImg}
                    alt="Digital Gate Pass QR Code"
                    fill
                    className="object-contain p-1"
                  />
                </div>

                {/* ACCESS OTP Label & Box */}
                <div className="space-y-1 w-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block font-heading">
                    Access OTP
                  </span>
                  <div className="rounded-xl bg-blue-50/80 border border-blue-100 py-2.5 px-4 text-center">
                    <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-[0.2em]">
                      4 8 2 7 3 1
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-0.5">
                    Either QR or OTP is valid for entry verification.
                  </p>
                </div>
              </div>

              {/* Bottom Vehicle Pill Strip */}
              <div className="border-t border-border bg-muted/40 px-6 py-3 flex items-center justify-between text-xs font-mono font-bold text-foreground">
                <span className="font-sans">Sedan</span>
                <span>GA 12-3456</span>
              </div>
            </div>

            {/* Action Buttons Below Pass */}
            <div className="space-y-2.5">
              <Link
                href="/driver/bookings/PKBD-2026-1027-1842"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-sm h-12 shadow-md transition-colors font-heading"
              >
                View My Booking
              </Link>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Road+12,+Block+E,+Gulshan+1,+Dhaka"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-sm h-11 transition-colors font-heading"
              >
                <Navigation className="size-4" />
                Get Directions
              </a>

              <button
                type="button"
                onClick={() => alert("Receipt downloaded successfully (PDF).")}
                className="flex w-full items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground py-2 transition-colors cursor-pointer font-heading"
              >
                <Download className="size-3.5" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
