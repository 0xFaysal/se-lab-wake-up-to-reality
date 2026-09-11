"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MoreVertical,
  Building2,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  Users,
  ShieldCheck,
  User,
  Phone,
  Mail,
  QrCode,
  AlertTriangle,
  FileText,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  XCircle,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_ALL_BOOKINGS,
  OwnerBooking,
} from "@/lib/data/mock-owner-data";

interface OwnerBookingDetailsViewProps {
  bookingId: string;
}

export function OwnerBookingDetailsView({
  bookingId,
}: OwnerBookingDetailsViewProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);

  // Normalize ID search (e.g. PE-BK-2048 -> #PE-BK-2048)
  const normalizedId = bookingId.startsWith("#") ? bookingId : `#${bookingId}`;
  const booking: OwnerBooking =
    MOCK_ALL_BOOKINGS.find(
      (b) =>
        b.id.toLowerCase() === normalizedId.toLowerCase() ||
        b.id.replace("#", "").toLowerCase() === bookingId.toLowerCase()
    ) || MOCK_ALL_BOOKINGS.find((b) => b.id === "#PE-BK-2048") || MOCK_ALL_BOOKINGS[0];

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "ACTIVE";

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="Booking Details"
        subtitle="View reservation information and manage this booking."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
              ID: {booking.id}
            </span>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        {/* ==================================================================== */}
        {/* Back Link & Title Header                                             */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <Link
              href="/owner/bookings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#064E3B] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Bookings</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
                Booking Details
              </h1>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="size-2 rounded-full bg-emerald-600" />
                <span>{booking.status}</span>
              </span>

              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer transition"
                title="Copy Booking ID"
              >
                <span>ID: {booking.id}</span>
                {copiedText ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              View reservation information and manage this booking.
            </p>
          </div>

          {/* Top Right Actions Menu */}
          <div className="relative self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveMenuOpen(!activeMenuOpen)}
              className="size-9 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs cursor-pointer"
              aria-label="More booking actions"
            >
              <MoreVertical className="size-4" />
            </button>

            {activeMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-in fade-in-50 zoom-in-95 text-xs font-medium"
                onMouseLeave={() => setActiveMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    alert("Receipt downloaded (PDF).");
                    setActiveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="size-3.5 text-slate-400" />
                  Download Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Audit log generated.");
                    setActiveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  <HelpCircle className="size-3.5 text-slate-400" />
                  View Security Audit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Main Grid: Left Column (2/3) + Right Sidebar (1/3)                   */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* ================================================================== */}
          {/* Left Column (8 cols): Overview, Driver & Vehicle, Session, Timeline*/}
          {/* ================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Booking Overview */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                    P
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Booking Overview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reservation schedule and location details
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-mono">
                  Created: August 11, 2026 • 9:24 PM
                </span>
              </div>

              {/* 2x2 Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Parking Space */}
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block mb-1">
                    Parking Space
                  </span>
                  <p className="font-bold text-sm text-slate-900 font-heading">
                    {booking.propertyTitle}
                  </p>
                </div>

                {/* 2. Booking Date */}
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block mb-1">
                    Booking Date
                  </span>
                  <p className="font-bold text-sm text-slate-900 font-heading">
                    {booking.dateStr}
                  </p>
                </div>

                {/* 3. Time & Duration */}
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block mb-1">
                    Time &amp; Duration
                  </span>
                  <p className="font-bold text-sm text-slate-900 font-heading">
                    {booking.timeStr} ({booking.durationHours || 5} Hours, Hourly)
                  </p>
                </div>

                {/* 4. Vehicle Type */}
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block mb-1">
                    Vehicle Type
                  </span>
                  <p className="font-bold text-sm text-slate-900 font-heading flex items-center gap-1.5">
                    <Car className="size-4 text-emerald-800" />
                    <span>Car</span>
                  </p>
                </div>
              </div>

              {/* Footnote */}
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Users className="size-4 text-slate-400" />
                <span>Managed By: <strong className="text-slate-700">Rahim Uddin</strong> (Property Manager)</span>
              </div>
            </div>

            {/* Card 2: Driver & Vehicle Information */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <User className="size-5 text-[#064E3B]" />
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Driver &amp; Vehicle Information
                    </h3>
                    <p className="text-xs text-slate-500">
                      Renter contact and vehicle credentials
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Viewing driver profile for ${booking.driverName}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer shadow-2xs"
                >
                  <User className="size-3.5 text-slate-500" />
                  <span>View Driver Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Driver Profile */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-slate-100 text-slate-800 font-bold font-heading text-sm flex items-center justify-center border border-slate-200">
                      {booking.driverInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-base text-slate-900">
                          {booking.driverName}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5 text-slate-400" />
                      <span>{booking.driverPhone || "+880 18XX-XXXXXX"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-3.5 text-slate-400" />
                      <span>{booking.driverEmail || "driver@example.com"}</span>
                    </p>
                  </div>
                </div>

                {/* Registered Vehicle Box */}
                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-heading block">
                    Registered Vehicle
                  </span>

                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Model</span>
                    <p className="font-bold text-sm text-slate-900 font-heading">
                      {booking.vehicleModel}
                    </p>
                  </div>

                  {/* Stylized BD License Plate Container */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">License Plate</span>
                    <div className="border border-emerald-300 bg-emerald-50/70 py-2 px-3 rounded-lg text-center shadow-2xs">
                      <span className="font-mono font-extrabold tracking-widest text-emerald-950 text-xs sm:text-sm uppercase block">
                        {booking.licensePlate || "DHAKA METRO - GA - XX - XXXX"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Vehicle Color</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full border border-slate-300 bg-white" />
                      {booking.vehicleColor || "White"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Parking Session Checkpoints */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-5 text-[#064E3B]" />
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Parking Session
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time gate and access checkpoints
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Awaiting Driver Arrival
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Checkpoint 1 */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-heading block">
                    Scheduled Check-In
                  </span>
                  <p className="font-bold text-slate-900 text-sm font-heading">
                    {booking.dateStr} • 10:00 AM
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Status: Not checked in yet
                  </p>
                </div>

                {/* Checkpoint 2 */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-heading block">
                    Entry Verification
                  </span>
                  <p className="font-bold text-slate-900 text-sm font-heading flex items-center gap-1.5 text-emerald-900">
                    <QrCode className="size-4 text-emerald-700" />
                    QR Code Required
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Scanned by Guard at Gate 2
                  </p>
                </div>

                {/* Checkpoint 3 */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-heading block">
                    Scheduled Check-Out
                  </span>
                  <p className="font-bold text-slate-900 text-sm font-heading">
                    {booking.dateStr} • 3:00 PM
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Grace period: 15 mins
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Booking Timeline */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
                <Clock className="size-5 text-[#064E3B]" />
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Booking Timeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lifecycle and event status for this reservation
                  </p>
                </div>
              </div>

              {/* Vertical Steps */}
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 ml-3">
                {/* Step 1 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white font-bold">
                    ✓
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Booking Created
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        August 11, 2026 • 9:24 PM
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white font-bold">
                    ✓
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Payment Completed
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        August 11, 2026 • 9:25 PM
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white font-bold">
                    ✓
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Booking Confirmed
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        August 11, 2026 • 9:25 PM
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white font-bold">
                    ✓
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        Guard Assigned
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        August 12, 2026 • 8:15 AM (Tariqul Islam)
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-slate-200 ring-4 ring-white" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 font-heading">
                        Guest Check-In
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        August 14, 2026 • 10:00 AM
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      Upcoming
                    </span>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 size-4 rounded-full bg-slate-200 ring-4 ring-white" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 font-heading">
                        Guest Check-Out
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        August 14, 2026 • 3:00 PM
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* Right Sidebar (4 cols): Payment Summary, Guard, Owner Actions      */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sidebar Card 1: Payment Summary */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Payment Summary
                </h3>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Paid
                </span>
              </div>

              <span className="text-xs text-slate-400 block -mt-2">Method: bKash</span>

              {/* Line Items */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Parking Fee</span>
                  <span className="font-mono font-bold text-slate-900">৳ 500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Service Fee</span>
                  <span className="font-mono font-bold text-slate-900">৳ 40</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <span className="font-mono font-bold text-slate-900">- ৳ 0</span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900 font-heading">Total Paid</span>
                <span className="font-mono font-extrabold text-xl text-slate-900">
                  ৳ {booking.amountPaid}
                </span>
              </div>

              {/* Highlighted Green Box: Owner Earnings */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-950 font-heading">
                    Owner Earnings:
                  </span>
                  <span className="font-mono font-extrabold text-lg text-emerald-900">
                    ৳ {booking.ownerEarnings || 500}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Service fee is retained by ParkEase BD.
                </p>
              </div>

              <div className="text-[11px] text-slate-400">
                Payment Method: bKash • Ref: TXN-PE-882194
              </div>

              <button
                type="button"
                onClick={() => alert("Showing transaction receipt.")}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                View Transaction
              </button>
            </div>

            {/* Sidebar Card 2: Assigned Guard */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Assigned Guard
              </h3>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
                  <ShieldCheck className="size-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      Tariqul Islam
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      On Duty
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">+880 18XX-XXXXXX</p>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="size-3.5 text-slate-400 shrink-0" />
                <span>Gulshan Avenue • Gate 2</span>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/owner/guards"
                  className="py-2 px-3 text-center rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition"
                >
                  View Guard
                </Link>
                <Link
                  href="/owner/guards"
                  className="py-2 px-3 text-center rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition"
                >
                  Change Assignment
                </Link>
              </div>
            </div>

            {/* Sidebar Card 3: Owner Actions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-3">
              <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
                Owner Actions
              </h3>

              <button
                type="button"
                onClick={() => alert(`Calling or messaging driver: ${booking.driverPhone}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <MessageSquare className="size-4 text-slate-500" />
                <span>Contact Driver</span>
              </button>

              <button
                type="button"
                onClick={() => alert("Report form opened.")}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <AlertTriangle className="size-4 text-amber-600" />
                <span>Report an Issue</span>
              </button>

              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <XCircle className="size-4 text-rose-600" />
                <span>Cancel Booking</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Cancellation is subject to the owner refund policy.
              </p>
            </div>

            {/* Sidebar Card 4: Booking Notes */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 font-heading">
                <FileText className="size-4 text-slate-400" />
                <span>Booking Notes</span>
              </div>
              <blockquote className="text-xs text-slate-600 italic pl-3 border-l-2 border-slate-300">
                &ldquo;Driver requested access through Gate 2.&rdquo;
              </blockquote>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <Link
                href="/owner/support"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                <HelpCircle className="size-3.5" />
                <span>Need help with this booking? Contact Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancelDialogOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-6 max-w-md w-full space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="size-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-heading font-bold text-lg text-slate-900">
                Cancel Reservation {booking.id}?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cancelling this booking will automatically refund the driver according to the cancellation policy and release slot {booking.spotNumber}.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelDialogOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Booking cancelled successfully.");
                  setCancelDialogOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
