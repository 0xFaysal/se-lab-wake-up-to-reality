"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Car,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Phone,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Building2,
  Users,
  Eye,
  SlidersHorizontal,
  X,
  Check,
  Flame,
  Radio,
  ArrowRight,
  Sparkles,
  Calendar,
  CreditCard,
  QrCode,
  Lock,
  ArrowUpRight,
  Maximize2,
  LayoutGrid,
  ListFilter,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import { cn } from "@/lib/utils";

export interface ActiveSession {
  id: string;
  bookingCode: string;
  propertyId: string;
  propertyTitle: string;
  baySlot: string;
  floor: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleModel: string;
  vehicleColor: string;
  licensePlateEng: string;
  licensePlateBng: string;
  checkInTime: string;
  expectedCheckout: string;
  elapsedMinutes: number;
  durationString: string;
  hourlyRate: number;
  baseAmount: number;
  overstaySurcharge: number;
  totalAccrued: number;
  entranceGate: string;
  guardName: string;
  guardPhone: string;
  status: "PARKED" | "OVERSTAY" | "CHECKING_OUT";
  notes?: string;
  isInspected: boolean;
}

export interface FacilityBay {
  id: string;
  bayCode: string;
  floor: string;
  propertyId: string;
  propertyTitle: string;
  status: "OCCUPIED" | "OVERSTAY" | "RESERVED" | "VACANT";
  currentSessionId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  nextReservationIn?: string;
}

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: "SES-4091",
    bookingCode: "#PE-BK-2051",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    baySlot: "Bay B-08",
    floor: "Basement 1",
    driverName: "Farhan Karim",
    driverPhone: "+880 1711-234567",
    driverRating: 4.9,
    vehicleModel: "Honda Vezel",
    vehicleColor: "Pearl White",
    licensePlateEng: "DHAKA METRO-GHA-23-4567",
    licensePlateBng: "ঢাকা মেট্রো-ঘ ২৩-৪৫৬৭",
    checkInTime: "10:02 AM",
    expectedCheckout: "12:30 PM",
    elapsedMinutes: 203,
    durationString: "03h 23m",
    hourlyRate: 60,
    baseAmount: 150,
    overstaySurcharge: 80,
    totalAccrued: 230,
    entranceGate: "Gate 2 (North Ramp)",
    guardName: "Rahim Uddin",
    guardPhone: "+880 1811-998877",
    status: "OVERSTAY",
    notes: "Overstayed expected checkout by 53 minutes. Guard alerted via intercom.",
    isInspected: true,
  },
  {
    id: "SES-4088",
    bookingCode: "#PE-BK-2048",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    baySlot: "Bay B-03",
    floor: "Basement 1",
    driverName: "Sadman Sakib",
    driverPhone: "+880 1622-334455",
    driverRating: 5.0,
    vehicleModel: "Toyota Allion",
    vehicleColor: "Silver Metallic",
    licensePlateEng: "DHAKA METRO-CHA-89-9912",
    licensePlateBng: "ঢাকা মেট্রো-চ ৮৯-৯৯১২",
    checkInTime: "11:15 AM",
    expectedCheckout: "02:15 PM",
    elapsedMinutes: 130,
    durationString: "02h 10m",
    hourlyRate: 60,
    baseAmount: 180,
    overstaySurcharge: 0,
    totalAccrued: 180,
    entranceGate: "Gate 2 (North Ramp)",
    guardName: "Rahim Uddin",
    guardPhone: "+880 1811-998877",
    status: "PARKED",
    notes: "Standard parking reservation. Fast QR verification at check-in.",
    isInspected: true,
  },
  {
    id: "SES-4085",
    bookingCode: "#PE-BK-2059",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    baySlot: "Bay A-04",
    floor: "Ground Floor",
    driverName: "Tanvir Hasan",
    driverPhone: "+880 1833-445566",
    driverRating: 4.8,
    vehicleModel: "Toyota Premio",
    vehicleColor: "Midnight Black",
    licensePlateEng: "DHAKA METRO-GA-45-7890",
    licensePlateBng: "ঢাকা মেট্রো-গ ৪৫-৭৮৯০",
    checkInTime: "12:30 PM",
    expectedCheckout: "04:30 PM",
    elapsedMinutes: 55,
    durationString: "00h 55m",
    hourlyRate: 70,
    baseAmount: 140,
    overstaySurcharge: 0,
    totalAccrued: 140,
    entranceGate: "Main Gate (South Entry)",
    guardName: "Al-Amin Hossain",
    guardPhone: "+880 1733-112233",
    status: "PARKED",
    notes: "Executive visitor space reservation.",
    isInspected: false,
  },
  {
    id: "SES-4081",
    bookingCode: "#PE-BK-2060",
    propertyId: "prop-dhanmondi-3",
    propertyTitle: "Apartment Parking, Dhanmondi",
    baySlot: "Bay C-01",
    floor: "Ground Level",
    driverName: "Nusrat Jahan",
    driverPhone: "+880 1944-556677",
    driverRating: 4.9,
    vehicleModel: "Hyundai Tucson",
    vehicleColor: "Dark Gray",
    licensePlateEng: "DHAKA METRO-DHA-67-1122",
    licensePlateBng: "ঢাকা মেট্রো-ঢ ৬৭-১১২২",
    checkInTime: "01:00 PM",
    expectedCheckout: "03:00 PM",
    elapsedMinutes: 25,
    durationString: "00h 25m",
    hourlyRate: 50,
    baseAmount: 50,
    overstaySurcharge: 0,
    totalAccrued: 50,
    entranceGate: "East Entry Ramp",
    guardName: "Kamal Uddin",
    guardPhone: "+880 1522-334455",
    status: "PARKED",
    notes: "Driver verified via SMS OTP.",
    isInspected: false,
  },
];

const FACILITY_BAYS: FacilityBay[] = [
  {
    id: "bay-1",
    bayCode: "Bay A-01",
    floor: "Ground Floor",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "VACANT",
  },
  {
    id: "bay-2",
    bayCode: "Bay A-02",
    floor: "Ground Floor",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "RESERVED",
    nextReservationIn: "Due in 15m",
    vehiclePlate: "DHAKA METRO-GA-11-2345",
  },
  {
    id: "bay-3",
    bayCode: "Bay B-01",
    floor: "Basement 1",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "VACANT",
  },
  {
    id: "bay-4",
    bayCode: "Bay B-02",
    floor: "Basement 1",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "VACANT",
  },
  {
    id: "bay-5",
    bayCode: "Bay B-03",
    floor: "Basement 1",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "OCCUPIED",
    currentSessionId: "SES-4088",
    vehiclePlate: "DHAKA METRO-CHA-89-9912",
    vehicleModel: "Toyota Allion",
  },
  {
    id: "bay-6",
    bayCode: "Bay B-08",
    floor: "Basement 1",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    status: "OVERSTAY",
    currentSessionId: "SES-4091",
    vehiclePlate: "DHAKA METRO-GHA-23-4567",
    vehicleModel: "Honda Vezel",
  },
  {
    id: "bay-7",
    bayCode: "Bay A-04",
    floor: "Ground Floor",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    status: "OCCUPIED",
    currentSessionId: "SES-4085",
    vehiclePlate: "DHAKA METRO-GA-45-7890",
    vehicleModel: "Toyota Premio",
  },
  {
    id: "bay-8",
    bayCode: "Bay C-01",
    floor: "Ground Level",
    propertyId: "prop-dhanmondi-3",
    propertyTitle: "Apartment Parking, Dhanmondi",
    status: "OCCUPIED",
    currentSessionId: "SES-4081",
    vehiclePlate: "DHAKA METRO-DHA-67-1122",
    vehicleModel: "Hyundai Tucson",
  },
];

export function OwnerSessionsView() {
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<ActiveSession>(INITIAL_SESSIONS[0]);
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("LIST");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Checkout Confirmation Modal
  const [checkoutModalSession, setCheckoutModalSession] = useState<ActiveSession | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Facility live telemetry feed synchronized.");
    }, 800);
  };

  const handleManualCheckout = () => {
    if (!checkoutModalSession) return;
    const sessionId = checkoutModalSession.id;

    // Remove from active sessions
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (selectedSession.id === sessionId && remaining.length > 0) {
      setSelectedSession(remaining[0]);
    }
    showToast(
      `Session #${sessionId} ended. Bay ${checkoutModalSession.baySlot} marked vacant. Receipt issued.`
    );
    setCheckoutModalSession(null);
  };

  const handleExtendSession = (sessionId: string, additionalMinutes: number) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedSurcharge = Math.max(0, s.overstaySurcharge - 40);
          return {
            ...s,
            status: "PARKED",
            overstaySurcharge: updatedSurcharge,
            totalAccrued: s.baseAmount + updatedSurcharge,
            expectedCheckout: "03:00 PM (Extended)",
          };
        }
        return s;
      })
    );
    if (selectedSession.id === sessionId) {
      setSelectedSession((prev) => ({
        ...prev,
        status: "PARKED",
        overstaySurcharge: Math.max(0, prev.overstaySurcharge - 40),
        expectedCheckout: "03:00 PM (Extended)",
      }));
    }
    showToast(`Session #${sessionId} extended by ${additionalMinutes} minutes.`);
  };

  // Filter logic
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.id.toLowerCase().includes(q) ||
        s.bookingCode.toLowerCase().includes(q) ||
        s.driverName.toLowerCase().includes(q) ||
        s.vehicleModel.toLowerCase().includes(q) ||
        s.licensePlateEng.toLowerCase().includes(q) ||
        s.baySlot.toLowerCase().includes(q);

      const matchesProperty =
        propertyFilter === "ALL" || s.propertyId === propertyFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "OVERSTAY" && s.status === "OVERSTAY") ||
        (statusFilter === "PARKED" && s.status === "PARKED");

      return matchesSearch && matchesProperty && matchesStatus;
    });
  }, [sessions, searchQuery, propertyFilter, statusFilter]);

  const overstayCount = sessions.filter((s) => s.status === "OVERSTAY").length;
  const totalParked = sessions.length;

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#064E3B] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 border border-emerald-700">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <OwnerHeader
        title="Active Sessions Live Monitor"
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Telemetry Active
          </span>
        }
        subtitle="Real-time occupancy tracking, in-facility vehicle telemetry, duration counters, and overtime alerts across all your properties."
      />

      {/* Main Workspace Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto w-full space-y-6 pb-28">
        {/* Breadcrumb row & Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/owner/bookings"
              className="hover:text-[#064E3B] font-medium transition-colors flex items-center gap-1"
            >
              Bookings
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Live Session Monitor</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-0.5 flex items-center shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer",
                  viewMode === "LIST"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ListFilter className="size-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer",
                  viewMode === "GRID"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <LayoutGrid className="size-3.5" />
                <span>Visual Bay Grid</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5 text-slate-500", isRefreshing && "animate-spin")} />
              <span>Sync Feed</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 1. TOP METRICS (4 CARDS)                                             */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Currently Parked Vehicles */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Currently Parked</span>
              <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                <Car className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{totalParked} Vehicles</span>
                <span className="text-[11px] font-bold text-emerald-700 font-mono">66% Cap</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#064E3B] h-full rounded-full transition-all duration-500"
                  style={{ width: "66%" }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Across 3 active properties in Dhaka</p>
            </div>
          </div>

          {/* Card 2: Overstay / At Risk Alerts */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Overstay Alerts</span>
              <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span className={overstayCount > 0 ? "text-amber-600" : "text-slate-900"}>
                  {overstayCount} Vehicle
                </span>
                {overstayCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {overstayCount > 0
                  ? "Bay B-08 exceeded checkout by +53m"
                  : "All current sessions are on schedule"}
              </p>
            </div>
          </div>

          {/* Card 3: Expected Arrivals Next 60m */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Expected Incoming</span>
              <div className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                2 Arrivals
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Next: Honda Civic at Gulshan (Due in 15 min)
              </p>
            </div>
          </div>

          {/* Card 4: Daily Flow & Guard Status */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Daily Guard Coverage</span>
              <div className="size-9 rounded-xl bg-slate-100 text-[#064E3B] flex items-center justify-center">
                <ShieldCheck className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>3 / 3 Gates</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  On Duty
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">14 check-ins today • 0 open security issues</p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. OVERSTAY URGENT CALLOUT BANNER (IF ANY)                            */}
        {/* ==================================================================== */}
        {overstayCount > 0 && (
          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 font-heading">
                  1 Active Session Has Exceeded Expected Checkout Time
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Vehicle <span className="font-bold">Honda Vezel (DHAKA METRO-GHA-23-4567)</span> in{" "}
                  <span className="font-bold">Bay B-08</span> has overstayed by 53 minutes. An
                  overstay surcharge of ৳80 is currently accruing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = sessions.find((s) => s.status === "OVERSTAY");
                  if (target) setSelectedSession(target);
                  showToast("Automated SMS departure reminder sent to driver Farhan Karim.");
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                Send SMS Reminder
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Intercom call placed to Duty Guard Rahim Uddin at Gate 2.");
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold transition cursor-pointer"
              >
                Page Guard
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. FILTER & SEARCH CONTROL BAR                                       */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Plate, Driver, or Bay..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#064E3B] focus:border-[#064E3B] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Property Filter */}
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
            >
              <option value="ALL">All Properties</option>
              <option value="prop-gulshan-1">Residential Building, Gulshan</option>
              <option value="prop-banani-2">Office Parking, Banani</option>
              <option value="prop-dhanmondi-3">Apartment Parking, Dhanmondi</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
            >
              <option value="ALL">All Active Sessions ({sessions.length})</option>
              <option value="OVERSTAY">Overstay Only ({overstayCount})</option>
              <option value="PARKED">Normal Active ({sessions.length - overstayCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-end md:self-auto">
            <span>Auto-refreshing every 30 seconds</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. MAIN DISPLAY: LIST VIEW OR VISUAL BAY GRID + SIDEBAR               */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: SESSIONS LIST OR BAY GRID */}
          <div className="lg:col-span-8 space-y-6">
            {viewMode === "LIST" ? (
              /* ============================================================ */
              /* LIST TABLE VIEW                                              */
              /* ============================================================ */
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-heading text-slate-900">
                      Live Occupancy Sessions
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a row to inspect full driver profile, vehicle telemetry, and gate logs
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {filteredSessions.length} active
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-[#E5E7EB] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Bay & Slot</th>
                        <th className="py-3 px-4">Vehicle & Plate</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Elapsed</th>
                        <th className="py-3 px-4">Expected Exit</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <Car className="size-6 mx-auto mb-2 text-slate-400" />
                            <p className="font-semibold text-slate-700">No active sessions match filter</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Check different filter parameters or clear your search.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredSessions.map((s) => {
                          const isSelected = selectedSession.id === s.id;
                          const isOverstay = s.status === "OVERSTAY";

                          return (
                            <tr
                              key={s.id}
                              onClick={() => setSelectedSession(s)}
                              className={cn(
                                "cursor-pointer transition-colors group",
                                isSelected
                                  ? "bg-emerald-50/60 font-medium"
                                  : "hover:bg-slate-50/80"
                              )}
                            >
                              {/* Bay & Slot */}
                              <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <span className="size-1.5 rounded-full bg-[#064E3B]" />
                                  )}
                                  <div>
                                    <div className="font-mono text-slate-900">{s.baySlot}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      {s.floor}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Vehicle & Plate */}
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{s.vehicleModel}</div>
                                <div className="text-[11px] font-mono text-slate-500">
                                  {s.licensePlateEng}
                                </div>
                              </td>

                              {/* Driver */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-medium text-slate-800">{s.driverName}</div>
                                <div className="text-[11px] text-slate-400">{s.driverPhone}</div>
                              </td>

                              {/* Elapsed */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-mono font-bold text-slate-900">
                                  {s.durationString}
                                </div>
                                <div className="text-[10px] text-slate-400">Since {s.checkInTime}</div>
                              </td>

                              {/* Expected Exit */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div
                                  className={cn(
                                    "font-medium",
                                    isOverstay ? "text-amber-700 font-bold" : "text-slate-700"
                                  )}
                                >
                                  {s.expectedCheckout}
                                </div>
                                {isOverstay && (
                                  <span className="text-[10px] text-amber-600 font-bold">
                                    +53 min overdue
                                  </span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {isOverstay ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Overstay
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <span className="size-1.5 rounded-full bg-emerald-600" />
                                    Parked
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSession(s);
                                  }}
                                  className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer",
                                    isSelected
                                      ? "bg-[#064E3B] text-white border-[#064E3B]"
                                      : "bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-100"
                                  )}
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 border-t border-[#E5E7EB] bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {filteredSessions.length} active sessions ({sessions.length} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <span className="size-2 rounded-full bg-emerald-500" /> Normal Parked
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                      <span className="size-2 rounded-full bg-amber-500" /> Overstay Warning
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* VISUAL BAY GRID MAP                                          */
              /* ============================================================ */
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h3 className="text-sm font-bold font-heading text-slate-900">
                      Facility Visual Bay Grid — Residential Building, Gulshan
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live schematic floor map of parking bays and real-time occupied slots
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="size-2.5 rounded-full bg-[#064E3B]" /> Occupied
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                      <span className="size-2.5 rounded-full bg-amber-500" /> Overstay
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-blue-700">
                      <span className="size-2.5 rounded-full bg-blue-500" /> Reserved
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <span className="size-2.5 rounded-full bg-slate-200 border border-slate-300" /> Vacant
                    </span>
                  </div>
                </div>

                {/* Bay Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {FACILITY_BAYS.map((bay) => {
                    const isOccupied = bay.status === "OCCUPIED";
                    const isOverstay = bay.status === "OVERSTAY";
                    const isReserved = bay.status === "RESERVED";
                    const isVacant = bay.status === "VACANT";

                    const matchedSession = sessions.find((s) => s.id === bay.currentSessionId);
                    const isSelected = selectedSession?.id === bay.currentSessionId;

                    return (
                      <div
                        key={bay.id}
                        onClick={() => {
                          if (matchedSession) {
                            setSelectedSession(matchedSession);
                          }
                        }}
                        className={cn(
                          "relative rounded-xl border p-4 flex flex-col justify-between min-h-[140px] transition-all cursor-pointer",
                          isOccupied &&
                            "bg-emerald-50/40 border-[#064E3B]/30 hover:border-[#064E3B] shadow-2xs",
                          isOverstay &&
                            "bg-amber-50/70 border-amber-300 hover:border-amber-500 shadow-2xs ring-1 ring-amber-400/50",
                          isReserved &&
                            "bg-blue-50/40 border-blue-200 hover:border-blue-400 shadow-2xs",
                          isVacant &&
                            "bg-slate-50/50 border-dashed border-slate-300 hover:bg-slate-100/50",
                          isSelected && "ring-2 ring-[#064E3B] shadow-md"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {bay.bayCode}
                          </span>
                          <span className="text-[10px] text-slate-400">{bay.floor}</span>
                        </div>

                        {/* Center Visual */}
                        <div className="my-2">
                          {(isOccupied || isOverstay) && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Car
                                  className={cn(
                                    "size-4 shrink-0",
                                    isOverstay ? "text-amber-600" : "text-[#064E3B]"
                                  )}
                                />
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {bay.vehicleModel}
                                </span>
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 truncate">
                                {bay.vehiclePlate}
                              </div>
                            </div>
                          )}

                          {isReserved && (
                            <div className="space-y-1 text-blue-900">
                              <div className="flex items-center gap-1 text-xs font-bold">
                                <Clock className="size-3.5 text-blue-600" />
                                <span>{bay.nextReservationIn}</span>
                              </div>
                              <div className="font-mono text-[10px] text-blue-700 truncate">
                                {bay.vehiclePlate}
                              </div>
                            </div>
                          )}

                          {isVacant && (
                            <div className="text-center py-2 text-slate-400 text-xs font-medium">
                              Vacant Bay
                            </div>
                          )}
                        </div>

                        {/* Status Badge Bottom */}
                        <div className="pt-1 flex items-center justify-between border-t border-black/5">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isOccupied && "text-emerald-800",
                              isOverstay && "text-amber-800 font-black",
                              isReserved && "text-blue-800",
                              isVacant && "text-slate-400 font-semibold"
                            )}
                          >
                            {bay.status}
                          </span>

                          {(isOccupied || isOverstay) && (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Inspect →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions & Facility Protocol Guidelines Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-[#064E3B]" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Live Operational Protocols & Guard Assistance
                  </h3>
                </div>
                <span className="text-xs text-slate-400">ParkEase Host Safety Guidelines</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">1. Overstay Enforcement</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Vehicles overstaying past grace period (15m) accrue an automated penalty of ৳80/hr
                    billed directly to driver’s verified wallet.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">2. Guard Dispatch</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Contact assigned security guards immediately via intercom if vehicle positioning
                    obstructs adjoining driveways or emergency exits.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">3. Emergency Checkout</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If driver leaves facility without scanning exit QR, owners can perform a manual
                    checkout to immediately release the space for new reservations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: SELECTED SESSION TELEMETRY & LIVE ACTIONS */}
          <div className="lg:col-span-4 space-y-6">
            {/* Main Telemetry Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold block">
                    SESSION TELEMETRY
                  </span>
                  <h3 className="text-base font-bold font-heading text-slate-900 mt-0.5">
                    #{selectedSession.id}
                  </h3>
                </div>

                {selectedSession.status === "OVERSTAY" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    Overstay Warning
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                    Parked Normal
                  </span>
                )}
              </div>

              {/* Real-time Elapsed Duration Box */}
              <div
                className={cn(
                  "p-4 rounded-xl text-center border",
                  selectedSession.status === "OVERSTAY"
                    ? "bg-amber-50/80 border-amber-200"
                    : "bg-emerald-50/60 border-emerald-200"
                )}
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Elapsed Time
                </span>
                <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mt-1">
                  {selectedSession.durationString}
                </div>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Check-in recorded at {selectedSession.checkInTime}
                </span>
              </div>

              {/* License Plate Graphic Display (Bangladesh Style) */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 border-2 border-slate-800 text-center shadow-inner">
                <div className="text-xs font-bold text-emerald-400 tracking-widest font-mono">
                  BANGLADESH
                </div>
                <div className="text-base font-extrabold tracking-wider font-heading mt-0.5">
                  {selectedSession.licensePlateBng}
                </div>
                <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                  {selectedSession.licensePlateEng}
                </div>
              </div>

              {/* Vehicle & Slot Info List */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Vehicle Model</span>
                  <span className="font-bold text-slate-900">
                    {selectedSession.vehicleModel} ({selectedSession.vehicleColor})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Assigned Bay</span>
                  <span className="font-mono font-bold text-[#064E3B]">
                    {selectedSession.baySlot} ({selectedSession.floor})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {selectedSession.propertyTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Entrance Gate</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSession.entranceGate}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Expected Checkout</span>
                  <span
                    className={cn(
                      "font-bold",
                      selectedSession.status === "OVERSTAY" ? "text-amber-700" : "text-slate-800"
                    )}
                  >
                    {selectedSession.expectedCheckout}
                  </span>
                </div>
              </div>

              {/* Live Billing Capsule */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Standard Base Fee</span>
                  <span className="font-bold text-slate-800">৳{selectedSession.baseAmount}</span>
                </div>
                {selectedSession.overstaySurcharge > 0 && (
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="font-medium">Overstay Penalty Fee</span>
                    <span className="font-bold">+৳{selectedSession.overstaySurcharge}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-900">Accrued Owner Total</span>
                  <span className="text-base text-[#064E3B] font-heading font-black">
                    ৳{selectedSession.totalAccrued}
                  </span>
                </div>
              </div>

              {/* Driver & Contact Actions */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {selectedSession.driverName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {selectedSession.driverName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {selectedSession.driverPhone} • {selectedSession.driverRating} ★
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Driver
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      showToast(`Calling driver ${selectedSession.driverName} at ${selectedSession.driverPhone}...`)
                    }
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-98 cursor-pointer"
                  >
                    <Phone className="size-3.5 text-slate-500" />
                    <span>Call Driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(`SMS reminder dispatched to ${selectedSession.driverPhone}.`)
                    }
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-98 cursor-pointer"
                  >
                    <MessageSquare className="size-3.5 text-slate-500" />
                    <span>Send SMS</span>
                  </button>
                </div>
              </div>

              {/* Guard on Duty Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    ON-DUTY GATE ATTENDANT
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedSession.guardName}
                  </span>
                  <span className="text-[11px] text-slate-500">{selectedSession.entranceGate}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showToast(`Alert sent to security guard ${selectedSession.guardName}.`)
                  }
                  className="px-2.5 py-1 rounded bg-white border border-[#E5E7EB] hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                >
                  Page Guard
                </button>
              </div>

              {/* Quick Actions (Extend Session & Manual Checkout) */}
              <div className="space-y-2 pt-1">
                {selectedSession.status === "OVERSTAY" && (
                  <button
                    type="button"
                    onClick={() => handleExtendSession(selectedSession.id, 60)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
                  >
                    <Clock className="size-3.5" />
                    <span>Extend Session Grace Period (+60m)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCheckoutModalSession(selectedSession)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold transition active:scale-98 cursor-pointer"
                >
                  <X className="size-3.5" />
                  <span>Manual Checkout / Release Bay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MANUAL CHECKOUT CONFIRMATION MODAL                                 */}
      {/* ==================================================================== */}
      {checkoutModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Car className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Confirm Manual Checkout
                  </h3>
                  <p className="text-xs text-slate-500">Session #{checkoutModalSession.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalSession(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are about to force-checkout vehicle{" "}
                <span className="font-bold text-slate-900">
                  {checkoutModalSession.vehicleModel} ({checkoutModalSession.licensePlateEng})
                </span>{" "}
                from <span className="font-bold text-slate-900">{checkoutModalSession.baySlot}</span>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Elapsed Parking Duration</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {checkoutModalSession.durationString}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Final Settlement Charge</span>
                  <span className="font-bold text-[#064E3B] font-heading text-sm">
                    ৳{checkoutModalSession.totalAccrued}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Space Status</span>
                  <span className="font-bold text-emerald-700">Immediate Vacant Release</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutModalSession(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualCheckout}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
                >
                  Complete Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
