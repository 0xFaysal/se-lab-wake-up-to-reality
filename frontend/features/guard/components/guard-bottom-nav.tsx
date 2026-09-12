"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, QrCode, User } from "lucide-react";

export function GuardBottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/guard";
  const isBookings = pathname.startsWith("/guard/bookings");
  const isScan = pathname === "/guard/scan";
  const isProfile = pathname.startsWith("/guard/profile");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-[#E5E7EB] bg-white px-3 py-1.5 select-none shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="relative flex items-center justify-around">
        {/* Home */}
        <Link
          href="/guard"
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-center transition-transform active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <div
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              isHome
                ? "bg-[#a7f3d0] text-[#064E3B] px-3.5 py-1 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Home className="h-5 w-5" />
          </div>
          <span
            className={`text-[11px] font-medium tracking-tight ${
              isHome ? "font-bold text-[#064E3B]" : "text-gray-500"
            }`}
          >
            Home
          </span>
        </Link>

        {/* Bookings */}
        <Link
          href="/guard/assignments"
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-center transition-transform active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <div
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              isBookings
                ? "bg-[#a7f3d0] text-[#064E3B] px-3.5 py-1 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <CalendarDays className="h-5 w-5" />
          </div>
          <span
            className={`text-[11px] font-medium tracking-tight ${
              isBookings ? "font-bold text-[#064E3B]" : "text-gray-500"
            }`}
          >
            Bookings
          </span>
        </Link>

        {/* Center Floating Action Button (FAB) for QR Scan */}
        <div className="relative -top-5 flex flex-col items-center justify-center">
          <Link
            href="/guard/scan"
            aria-label="Scan Booking QR Code"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#064E3B] text-white shadow-[0_8px_20px_rgba(6,78,59,0.35)] ring-4 ring-white transition-all duration-300 hover:bg-[#053d2e] hover:scale-105 active:scale-95 [-webkit-tap-highlight-color:transparent]"
          >
            <QrCode className="h-7 w-7 transition-transform group-hover:scale-110" />
            <span className="sr-only">Scan QR Code</span>
          </Link>
          <span
            className={`mt-1 text-[11px] font-medium tracking-tight ${
              isScan ? "font-bold text-[#064E3B]" : "text-gray-500"
            }`}
          >
            Scan
          </span>
        </div>

        {/* Profile */}
        <Link
          href="/guard/profile"
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-center transition-transform active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <div
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              isProfile
                ? "bg-[#a7f3d0] text-[#064E3B] px-3.5 py-1 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <User className="h-5 w-5" />
          </div>
          <span
            className={`text-[11px] font-medium tracking-tight ${
              isProfile ? "font-bold text-[#064E3B]" : "text-gray-500"
            }`}
          >
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
