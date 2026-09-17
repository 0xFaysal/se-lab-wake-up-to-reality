"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  Calendar,
  DollarSign,
  ParkingSquare,
  Shield,
  ShieldCheck,
  Clock,
  Zap,
  Camera,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Edit,
  Sliders,
  Users,
  UserCheck,
  QrCode,
  KeyRound,
  Eye,
  TrendingUp,
  AlertCircle,
  Pause,
  Trash2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Layers,
  Plus,
} from "lucide-react";
import {
  MOCK_OWNER_PROFILE,
  MOCK_OWNER_PROPERTIES,
  MOCK_OWNER_MANAGERS,
} from "@/lib/data/mock-owner-data";

interface SpaceBay {
  id: string;
  name: string;
  type: "Standard" | "SUV" | "EV" | "Moto" | "Accessible";
  status: "Available" | "Occupied";
}

const SPACES_INVENTORY: SpaceBay[] = [
  { id: "B-01", name: "B-01", type: "Standard", status: "Available" },
  { id: "B-02", name: "B-02", type: "SUV", status: "Available" },
  { id: "B-03", name: "B-03", type: "Standard", status: "Occupied" },
  { id: "B-04", name: "B-04", type: "EV", status: "Available" },
  { id: "B-05", name: "B-05", type: "Moto", status: "Available" },
  { id: "B-06", name: "B-06", type: "Accessible", status: "Available" },
];

export function OwnerPropertyDetailsView({ propertyId }: { propertyId?: string }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Locate current property details
  const currentProperty =
    MOCK_OWNER_PROPERTIES.find((p) => p.id === propertyId) ||
    MOCK_OWNER_PROPERTIES[0];

  // Resolve assigned manager (Strict 1-manager rule)
  const assignedManager = currentProperty?.managerName
    ? MOCK_OWNER_MANAGERS.find(
        (m) =>
          m.name.toLowerCase() === currentProperty.managerName?.toLowerCase() ||
          m.assignedPropertyIds.includes(currentProperty.id)
      ) || {
        id: "mgr-temp",
        name: currentProperty.managerName,
        initials: currentProperty.managerName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        phone: "+880 17XX-XXXXXX",
        email: "manager@parkease.bd",
        role: "Property Manager",
        assignedPropertyIds: [currentProperty.id],
        assignedPropertyTitles: [currentProperty.title],
        permissions: {
          canViewProperty: true,
          canEditProperty: true,
          canManageParkingSpaces: true,
          canManageAvailability: true,
          canManagePricing: false,
          canViewBookings: true,
          canManageBookings: true,
          canManageActiveSessions: true,
          canManageGuards: true,
          canRespondReviews: true,
        },
        status: "ACTIVE" as const,
        joinedDate: "Aug 12, 2026",
      }
    : null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
    showToast("Listing public URL copied to clipboard!");
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    showToast(isPaused ? "Listing resumed and now accepting reservations." : "Listing temporarily paused.");
  };

  const handleArchive = () => {
    showToast("Property archived. You can restore it anytime from settings.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP BREADCRUMBS & HEADER                                          */}
      {/* ==================================================================== */}
      <div>
        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link href="/owner/properties" className="hover:text-slate-900 hover:underline">
            My Listings
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-semibold truncate">
            Residential Building, Gulshan
          </span>
        </div>

        {/* Title row with pills and action buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
                Residential Building, Gulshan
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 font-heading ${
                  isPaused
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <span className={`size-1.5 rounded-full ${isPaused ? "bg-amber-600" : "bg-emerald-600 animate-pulse"}`} />
                {isPaused ? "Paused" : "Active"}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600">
                #PL-2048
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage listing information, availability, pricing, spaces, and operations.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs font-heading cursor-pointer"
            >
              <Eye className="size-3.5" />
              <span>Preview Listing</span>
            </button>

            <Link
              href="/owner/properties/new/step-1"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 transition shadow-2xs font-heading"
            >
              <Edit className="size-3.5" />
              <span>Edit Listing</span>
            </Link>

            {/* Owner Capsule */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="size-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-heading">
                {MOCK_OWNER_PROFILE.initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {MOCK_OWNER_PROFILE.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-medium">
                  {MOCK_OWNER_PROFILE.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TOP METRICS ROW (4 CARDS)                                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Bookings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today&apos;s Bookings</span>
            <div className="size-7 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
              <Smartphone className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-heading font-extrabold text-2xl text-slate-900">3</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
              +1 vs yesterday
            </span>
          </div>
        </div>

        {/* Metric 2: Currently Parked */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Currently Parked</span>
            <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-heading font-extrabold text-2xl text-slate-900">1</span>
            <span className="text-xs text-slate-500 font-medium">Bay B-03 in session</span>
          </div>
        </div>

        {/* Metric 3: Available Spaces */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Spaces</span>
            <div className="size-7 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
              <ParkingSquare className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-heading font-extrabold text-2xl text-slate-900">5</span>
            <span className="text-xs text-slate-500 font-medium">of 6 reservable bays</span>
          </div>
        </div>

        {/* Metric 4: Today's Earnings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today&apos;s Earnings</span>
            <div className="size-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-heading font-extrabold text-2xl text-[#064E3B]">৳ 450</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
              Settled
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: 2-COLUMN GRID (LEFT 2/3, RIGHT 1/3)              */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT 2/3: SUMMARY, INVENTORY, PRICING, SECURITY, STAFF             */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-6">
          {/* SECTION A: LISTING SUMMARY CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Photo Thumbnail */}
              <div className="relative w-full sm:w-48 h-36 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                <Image
                  src="/assets/parking-hero-bay.jpg"
                  alt="Property Cover"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs font-heading">
                  <Camera className="size-3" />
                  <span>6 Photos</span>
                </div>
              </div>

              {/* Details & Tags */}
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-heading font-extrabold text-base text-slate-900">
                        Residential Building, Gulshan
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="size-3 text-slate-400" />
                        Road 12, Block C, Gulshan-2, Dhaka · Near Circle 2
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-heading font-extrabold text-base text-[#064E3B] block">
                        ৳ 50 / hour
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Published Sep 11, 2026
                      </span>
                    </div>
                  </div>

                  {/* Feature Pill Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      Covered
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      CCTV
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      Guard
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      EV Support
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ★ New Listing
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                      ID: #PL-2048
                    </span>
                  </div>
                </div>

                {/* Footer link row */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer font-heading"
                    >
                      <ExternalLink className="size-3" />
                      View Public Listing
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-heading"
                    >
                      <Copy className="size-3" />
                      Copy Listing Link
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    6 Reservable Spaces · 2 Owner Reserved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: PARKING SPACES INVENTORY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between pb-3.5 mb-4 border-b border-[#E5E7EB] gap-3">
              <div className="flex items-center gap-2.5">
                <ParkingSquare className="size-4.5 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Parking Spaces Inventory
                </h3>
              </div>

              {/* Middle stats & Right Badge */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="hidden sm:flex items-center gap-3 text-slate-500">
                  <span>Total: <strong className="text-slate-800">8</strong></span>
                  <span>·</span>
                  <span>Reservable: <strong className="text-[#064E3B]">6</strong></span>
                  <span>·</span>
                  <span>Property Use: <strong className="text-slate-800">2</strong></span>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
                  5 Available · 1 Occupied
                </span>

                <Link
                  href="/owner/properties/new/step-3"
                  className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5 font-heading"
                >
                  Manage Spaces →
                </Link>
              </div>
            </div>

            {/* 6 Space Bays Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {SPACES_INVENTORY.map((bay) => {
                const isOccupied = bay.status === "Occupied";
                return (
                  <div
                    key={bay.id}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      isOccupied
                        ? "border-blue-300 bg-blue-50/50 shadow-2xs"
                        : "border-[#E5E7EB] bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          {bay.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {bay.type}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 font-heading ${
                          isOccupied ? "text-blue-700" : "text-emerald-700"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${isOccupied ? "bg-blue-600" : "bg-emerald-600"}`} />
                        {bay.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION C: 2-COLUMN ROW (AVAILABILITY & PRICING + ACCESS & SECURITY) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. AVAILABILITY & PRICING */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Availability & Pricing
                    </h3>
                  </div>
                  <Link
                    href="/owner/properties/new/step-4"
                    className="text-xs font-bold text-[#064E3B] hover:underline font-heading"
                  >
                    Edit Pricing
                  </Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Base Hourly Rate</span>
                    <span className="font-bold text-[#064E3B] font-heading">৳ 50 / hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Daily Maximum</span>
                    <span className="font-bold text-slate-900 font-heading">৳ 400</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Security Deposit</span>
                    <span className="font-medium text-slate-800">৳ 200 (Refundable)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Peak Surge Pricing</span>
                    <span className="font-bold text-emerald-700 font-heading">Enabled (+20%)</span>
                  </div>
                  <div className="flex justify-between items-start pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Operating Schedule</span>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-700 block">Mon–Thu: 8A–10P · Fri: 8A–11P</span>
                      <span className="text-[11px] font-bold text-emerald-700 block font-heading">
                        Sat–Sun: 24 Hours Access
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  Payment: bKash / Cards auto-split
                </span>
                <Link
                  href="/owner/properties/new/step-4"
                  className="text-xs font-bold text-[#064E3B] hover:underline font-heading"
                >
                  Edit Availability →
                </Link>
              </div>
            </div>

            {/* 2. ACCESS & SECURITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Access & Security
                    </h3>
                  </div>
                  <Link
                    href="/owner/properties/new/step-5"
                    className="text-xs font-bold text-[#064E3B] hover:underline font-heading"
                  >
                    Manage Settings
                  </Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Entrance Location</span>
                    <span className="font-medium text-slate-800">Gate 2 · Basement B (Ramp)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Primary Entry Method</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 font-heading">
                      <QrCode className="size-3.5 text-[#064E3B]" />
                      QR Code Scan
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Fallback Verification</span>
                    <span className="font-medium text-slate-800">SMS / OTP Access Code</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Guard Verification</span>
                    <span className="font-bold text-emerald-800 font-heading">Enforced at Gate</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Plate & CCTV Check</span>
                    <span className="text-[11px] font-medium text-slate-800">Plate Match: Required · CCTV Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Security Level:</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      High
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex justify-end text-xs">
                <Link
                  href="/owner/properties/new/step-5"
                  className="text-xs font-bold text-[#064E3B] hover:underline font-heading"
                >
                  Access Settings →
                </Link>
              </div>
            </div>
          </div>

          {/* SECTION D: PROPERTY OPERATIONS & STAFF */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Property Operations & Staff
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-heading font-bold">
                <Link
                  href="/owner/managers"
                  className="text-[#064E3B] hover:underline"
                >
                  All Managers →
                </Link>
                <Link
                  href="/owner/guards"
                  className="text-[#064E3B] hover:underline"
                >
                  All Guards →
                </Link>
              </div>
            </div>

            {/* Staff Cards Row: Single Manager Slot + Multi-Guard Slot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Staff Slot 1: Strictly Single Property Manager */}
              {assignedManager ? (
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-slate-50/50 flex flex-col justify-between gap-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-heading shrink-0 shadow-2xs">
                        {assignedManager.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-slate-900">
                            {assignedManager.name}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Assigned Property Manager
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      Property Manager
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-500">
                      Capacity: 1 Manager / Property
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/owner/managers?action=edit&manager=${encodeURIComponent(assignedManager.name)}`}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs font-heading"
                      >
                        Edit Permissions
                      </Link>
                      <Link
                        href={`/owner/managers?action=replace&property=${encodeURIComponent(currentProperty.id)}`}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs font-heading"
                      >
                        Replace Manager
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Manager Slot (Dashed Border Card) */
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="size-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-xs text-slate-800">
                        No Manager Assigned
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Strict architectural limit: Only 1 delegated manager per property.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-dashed border-slate-200">
                    <span className="text-[10px] text-slate-400">
                      Operations unmanaged
                    </span>
                    <Link
                      href={`/owner/managers?action=assign&property=${encodeURIComponent(currentProperty.id)}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#064E3B] hover:bg-emerald-50 border border-emerald-300/80 bg-white transition shadow-2xs font-heading inline-flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      <span>+ Assign Manager to Property</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Staff Slot 2: Multi-Guard Operations */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-slate-50/50 flex flex-col justify-between gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading shrink-0 shadow-2xs border border-emerald-200">
                      TI
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-heading font-bold text-sm text-slate-900">
                          Tariqul Islam
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="size-1 rounded-full bg-emerald-600" />
                          On Duty (Gate 2)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Next Shift: Mahmud Hasan · 2:00 PM
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    Gate Security
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                  <span className="text-[11px] text-slate-500">
                    Capacity: N Guards / Property
                  </span>
                  <Link
                    href="/owner/guards"
                    className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs font-heading"
                  >
                    Manage Guards (3)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT 1/3 SIDEBAR: HEALTH, LIVE ACTIVITY, ACTIONS                  */}
        {/* ------------------------------------------------------------------ */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING HEALTH */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Listing Health
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-heading">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Healthy
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Listing Visibility</span>
                <span className="font-bold text-slate-900 font-heading">Public & Searchable</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Availability Mode</span>
                <span className="font-medium text-slate-800">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pricing Schedule</span>
                <span className="font-medium text-slate-800 font-heading">Configured (৳ 50/hr)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Setup</span>
                <span className="font-bold text-emerald-700 font-heading">Ready (bKash/Bank)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Guard Coverage</span>
                <span className="font-bold text-emerald-700 font-heading">Active Shift</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Photos</span>
                <span className="font-medium text-slate-800">6 uploaded (High Res)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Access Verification</span>
                <span className="font-medium text-slate-800">QR + OTP Validated</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-[11px] font-bold text-emerald-800 font-heading flex items-center justify-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* CARD 2: RECENT ACTIVITY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Recent Activity
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Live Log</span>
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-3 text-xs pt-1">
              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 leading-tight">Booking Confirmed</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">#PE-BK-2092 · 20 mins ago</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Car className="size-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 leading-tight">Vehicle Checked In</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Slot B-03 · 45 mins ago</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign className="size-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 leading-tight">Payment Completed</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">৳ 150 · 1 hour ago</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="size-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 leading-tight">Guard Shift Started</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tariqul Islam · 2 hours ago</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                href="/owner/bookings"
                className="text-xs font-bold text-[#064E3B] hover:underline font-heading"
              >
                View All Activity →
              </Link>
            </div>
          </div>

          {/* CARD 3: QUICK ACTIONS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Zap className="size-4 text-[#064E3B]" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Quick Actions
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/owner/bookings"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <Calendar className="size-3.5 text-slate-500" />
                <span>View Bookings</span>
              </Link>
              <Link
                href="/owner/properties/new/step-3"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <ParkingSquare className="size-3.5 text-slate-500" />
                <span>Manage Spaces</span>
              </Link>
              <Link
                href="/owner/properties/new/step-4"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <DollarSign className="size-3.5 text-slate-500" />
                <span>Edit Pricing</span>
              </Link>
              <Link
                href="/owner/properties/new/step-4"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <Clock className="size-3.5 text-slate-500" />
                <span>Edit Schedule</span>
              </Link>
              <Link
                href="/owner/guards"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <Shield className="size-3.5 text-slate-500" />
                <span>Manage Guards</span>
              </Link>
              <Link
                href="/owner/earnings"
                className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700"
              >
                <TrendingUp className="size-3.5 text-slate-500" />
                <span>View Earnings</span>
              </Link>
            </div>
          </div>

          {/* CARD 4: LISTING ACTIONS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2">
            <button
              type="button"
              onClick={() => showToast("Duplicate listing draft created.")}
              className="w-full py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
            >
              <Copy className="size-3.5" />
              <span>Duplicate Listing</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePause}
              className="w-full py-2 rounded-lg border border-amber-200 bg-amber-50/50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
            >
              <Pause className="size-3.5" />
              <span>{isPaused ? "Resume Listing" : "Temporarily Pause Listing"}</span>
            </button>

            <button
              type="button"
              onClick={handleArchive}
              className="w-full py-2 rounded-lg border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition flex items-center justify-center gap-1.5 font-heading cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Archive Listing</span>
            </button>
          </div>
        </aside>
      </div>

      {/* DRIVER MARKETPLACE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Driver Public Listing View
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100">
              <Image
                src="/assets/parking-hero-bay.jpg"
                alt="Marketplace Listing"
                fill
                className="object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 text-white font-bold text-xs px-2.5 py-1 rounded-md font-heading">
                ৳ 50 / hr
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-slate-900">
                  Residential Building, Gulshan
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Road 12, Block C, Gulshan-2, Dhaka · Near Circle 2
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Slots:</span>
                <span className="font-bold text-slate-900">5 Spaces Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gate Verification:</span>
                <span className="font-bold text-slate-900">QR Code Scan at Gate 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Hours:</span>
                <span className="font-bold text-slate-900">24/7 Weekend Access</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
