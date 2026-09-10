"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  QrCode,
  Zap,
  ZapOff,
  CheckCircle2,
  Lightbulb,
  Keyboard,
  Camera,
  ScanLine,
} from "lucide-react";
import { GuardOtpModal } from "./guard-otp-modal";

export function GuardScanView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingParam = searchParams.get("id") || "PE-BK-2051";

  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Function to simulate a successful QR code detection
  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      router.push(`/guard/bookings/${bookingParam}/confirm`);
    }, 700);
  };

  return (
    <div className="space-y-4 select-none pb-6">
      {/* 1. Page Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading">
          Scan Booking QR
        </h1>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          Scan the driver’s ParkEase BD booking QR code to verify access.
        </p>
      </div>

      {/* 2. Simulated Native Camera Viewport Container */}
      <div className="relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#1a2332] shadow-xl aspect-4/5 sm:aspect-square">
        {/* Flashlight Beam effect if Flash is enabled */}
        {isFlashOn && (
          <div className="pointer-events-none absolute inset-0 bg-white/20 backdrop-brightness-125 transition-opacity" />
        )}

        {/* Top Status Pill: Ready to Scan */}
        <div className="absolute top-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ready to Scan</span>
        </div>

        {/* Camera Targeting Frame with Green Brackets */}
        <div
          onClick={handleSimulateScan}
          title="Tap to simulate scanning QR"
          className="group relative z-10 flex h-60 w-60 cursor-pointer items-center justify-center rounded-2xl border-2 border-emerald-400/80 bg-black/10 backdrop-blur-[1px] transition-transform active:scale-98"
        >
          {/* Corner Targeting Accents */}
          <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

          {/* Animated Scanning Laser Line */}
          <div className="pointer-events-none absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-[scanLaser_2.5s_ease-in-out_infinite]" />

          {/* Faint Center QR watermark */}
          <QrCode className="h-20 w-20 text-white/25 transition-transform group-hover:scale-105" />

          {/* Quick Simulation Badge overlay */}
          <div className="absolute bottom-2 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 opacity-80 backdrop-blur-xs">
            {isSimulatingScan ? "Verifying QR..." : "Tap frame to scan"}
          </div>
        </div>

        {/* Bottom Right Flashlight Toggle Button */}
        <div className="absolute bottom-3.5 right-3.5 z-20">
          <button
            type="button"
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-md ${
              isFlashOn
                ? "bg-amber-400 text-gray-900 ring-2 ring-amber-300"
                : "bg-black/70 text-white hover:bg-black/80 backdrop-blur-md"
            }`}
          >
            {isFlashOn ? (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Flash On</span>
              </>
            ) : (
              <>
                <ZapOff className="h-3.5 w-3.5" />
                <span>Flash</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Instructions & Assistance */}
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-gray-900 font-heading">
          Place the booking QR code inside the frame.
        </p>
        <p className="text-xs text-gray-500">
          The code will be detected automatically.
        </p>
        <p className="text-[11px] font-medium text-[#064E3B] pt-1">
          Only scan QR codes presented by drivers for bookings assigned to your property and access point.
        </p>
      </div>

      {/* 4. Fallback: Can't scan the QR? */}
      <div className="border-t border-gray-200 pt-3 text-center">
        <button
          type="button"
          onClick={() => setIsOtpOpen(true)}
          className="text-xs font-bold text-gray-800 hover:text-[#064E3B] underline underline-offset-4 transition-colors"
        >
          Can&apos;t scan the QR?
        </button>
      </div>

      {/* 5. Scanning Tips Card */}
      <section className="rounded-2xl border border-indigo-100 bg-[#f0f4ff] p-4 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2.5 font-heading">
          <Lightbulb className="h-4 w-4 text-indigo-600" />
          <span>Scanning Tips</span>
        </div>

        <ul className="space-y-2 text-slate-700">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Ensure the entire code is fully visible</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Ask the guest to increase screen brightness</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Use the manual booking code if scanning fails</span>
          </li>
        </ul>
      </section>

      {/* 6. Footer Disclaimer */}
      <div className="pt-1 text-center">
        <p className="text-[11px] text-gray-400">
          Only ParkEase BD booking QR codes can be verified for Check-In.
        </p>
      </div>

      {/* Access Code / OTP Modal */}
      <GuardOtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
      />
    </div>
  );
}
