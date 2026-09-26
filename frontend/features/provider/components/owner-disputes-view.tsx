"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Receipt,
  Search,
  ChevronRight,
  CheckCircle2,
  FileText,
  Info,
  HelpCircle,
  X,
  Check,
  Camera,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import { cn } from "@/lib/utils";

export interface OwnerDispute {
  id: string;
  bookingCode: string;
  propertyId: string;
  propertyTitle: string;
  baySlot: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  category: "OVERCHARGED" | "SLOT_OCCUPIED" | "HOST_MISCONDUCT" | "DAMAGE_SAFETY" | "CANCELLED_NO_REFUND";
  categoryLabel: string;
  claimedAmount: number;
  requestedOutcome: string;
  filedAt: string;
  deadlineHoursLeft?: number;
  deadlineString?: string;
  status: "ACTION_REQUIRED" | "UNDER_REVIEW" | "RESOLVED" | "REFUNDED";
  driverStatement: string;
  ownerStatement?: string;
  evidenceCount: number;
  resolutionNote?: string;
}

const INITIAL_DISPUTES: OwnerDispute[] = [
  {
    id: "DISP-2041",
    bookingCode: "#BK-7892",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    baySlot: "Bay B-08",
    driverName: "Kamal Hossain",
    driverPhone: "+880 1711-889900",
    driverRating: 4.8,
    category: "SLOT_OCCUPIED",
    categoryLabel: "Slot Occupied / Barred Entry",
    claimedAmount: 250,
    requestedOutcome: "Full Refund (৳250)",
    filedAt: "Sep 11, 2026, 09:15 AM",
    deadlineHoursLeft: 4,
    deadlineString: "Today at 05:00 PM (4h left)",
    status: "ACTION_REQUIRED",
    driverStatement:
      "Arrived at 9:15 AM with active QR code, but another unidentified vehicle was parked in Bay B-08. Security guard was away from the gate, forcing me to park on the street and incur a city parking ticket.",
    evidenceCount: 2,
  },
  {
    id: "DISP-2038",
    bookingCode: "#BK-7864",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    baySlot: "Bay B-03",
    driverName: "Sadia Rahman",
    driverPhone: "+880 1722-112233",
    driverRating: 4.9,
    category: "OVERCHARGED",
    categoryLabel: "Overcharged / Fare Discrepancy",
    claimedAmount: 120,
    requestedOutcome: "Partial Refund (৳120)",
    filedAt: "Sep 09, 2026, 02:40 PM",
    deadlineString: "Evidence Submitted",
    status: "UNDER_REVIEW",
    driverStatement:
      "I was billed for 45 minutes of overtime because the exit barrier took too long to scan my exit QR code. I actually vacated the bay on time.",
    ownerStatement:
      "Reviewed CCTV timestamp at Gate 2. Driver exited bay at 02:35 PM, 25 minutes after reservation cutoff.",
    evidenceCount: 3,
    resolutionNote: "Under ParkEase Mediation Officer review.",
  },
  {
    id: "DISP-2029",
    bookingCode: "#BK-7850",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    baySlot: "Bay A-04",
    driverName: "Shakil Hasan",
    driverPhone: "+880 1912-334455",
    driverRating: 5.0,
    category: "HOST_MISCONDUCT",
    categoryLabel: "Guard Refused Entry",
    claimedAmount: 350,
    requestedOutcome: "Platform Credit",
    filedAt: "Sep 04, 2026",
    status: "RESOLVED",
    driverStatement:
      "Duty guard initially denied entrance claiming the lot was reserved for office staff only.",
    ownerStatement:
      "Addressed confusion immediately with the security supervisor. Host offered ৳100 courtesy coupon.",
    evidenceCount: 1,
    resolutionNote: "Amicably resolved. Driver accepted ৳100 courtesy credit. Host rating protected.",
  },
  {
    id: "DISP-2015",
    bookingCode: "#BK-7842",
    propertyId: "prop-dhanmondi-3",
    propertyTitle: "Apartment Parking, Dhanmondi",
    baySlot: "Bay C-01",
    driverName: "Mehedi Zaman",
    driverPhone: "+880 1711-223344",
    driverRating: 4.7,
    category: "CANCELLED_NO_REFUND",
    categoryLabel: "Facility Access Leak / Cancelled",
    claimedAmount: 200,
    requestedOutcome: "Full Refund (৳200)",
    filedAt: "Aug 28, 2026",
    status: "REFUNDED",
    driverStatement:
      "Facility basement was undergoing plumbing repair during my reserved slot time.",
    ownerStatement:
      "Confirmed unplanned maintenance. Approved immediate 100% refund for the inconvenience.",
    evidenceCount: 2,
    resolutionNote: "100% refund credited back to driver bKash account.",
  },
];

export function OwnerDisputesView() {
  const [disputes, setDisputes] = useState<OwnerDispute[]>(INITIAL_DISPUTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const propertyFilter = "ALL";
  const [sortBy, setSortBy] = useState<"URGENCY" | "NEWEST" | "AMOUNT_HIGH">("URGENCY");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Action Modal State (e.g. Accept Claim / Issue Refund)
  const [acceptModalDispute, setAcceptModalDispute] = useState<OwnerDispute | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmRefund = () => {
    if (!acceptModalDispute) return;
    const dispId = acceptModalDispute.id;

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === dispId) {
          return {
            ...d,
            status: "REFUNDED",
            deadlineString: "Resolved & Refunded",
            resolutionNote: `Host accepted claim and issued ৳${d.claimedAmount} refund. Host rating protected.`,
          };
        }
        return d;
      })
    );

    showToast(
      `Dispute #${dispId} accepted. ৳${acceptModalDispute.claimedAmount} refunded to driver. Rating protected!`
    );
    setAcceptModalDispute(null);
  };

  // Filter & Sort
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        d.id.toLowerCase().includes(q) ||
        d.bookingCode.toLowerCase().includes(q) ||
        d.driverName.toLowerCase().includes(q) ||
        d.propertyTitle.toLowerCase().includes(q) ||
        d.categoryLabel.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTION_REQUIRED" && d.status === "ACTION_REQUIRED") ||
        (statusFilter === "UNDER_REVIEW" && d.status === "UNDER_REVIEW") ||
        (statusFilter === "RESOLVED" && (d.status === "RESOLVED" || d.status === "REFUNDED"));

      const matchesCategory =
        categoryFilter === "ALL" || d.category === categoryFilter;

      const matchesProperty =
        propertyFilter === "ALL" || d.propertyId === propertyFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesProperty;
    }).sort((a, b) => {
      if (sortBy === "URGENCY") {
        if (a.status === "ACTION_REQUIRED" && b.status !== "ACTION_REQUIRED") return -1;
        if (b.status === "ACTION_REQUIRED" && a.status !== "ACTION_REQUIRED") return 1;
      }
      if (sortBy === "AMOUNT_HIGH") {
        return b.claimedAmount - a.claimedAmount;
      }
      return b.id.localeCompare(a.id);
    });
  }, [disputes, searchQuery, statusFilter, categoryFilter, propertyFilter, sortBy]);

  const activeClaimsCount = disputes.filter(
    (d) => d.status === "ACTION_REQUIRED" || d.status === "UNDER_REVIEW"
  ).length;

  const urgentCount = disputes.filter((d) => d.status === "ACTION_REQUIRED").length;

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
        title="Disputes & Claims Manager"
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            {activeClaimsCount} Active Claims Under Mediation
          </span>
        }
        subtitle="Mediate customer grievances, review driver claims, submit facility CCTV evidence, and respond to refund requests."
      />

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto w-full space-y-6 pb-28">
        {/* Breadcrumb row & Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/provider/support"
              className="hover:text-[#064E3B] font-medium transition-colors flex items-center gap-1"
            >
              Help & Support
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Dispute Resolution Center</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => showToast("Dispute & Mediation Guidelines PDF opened.")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <FileText className="size-3.5 text-slate-500" />
              <span>Evidence Guidelines</span>
            </button>
            <Link
              href="/provider/support"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              <span>Contact Support Desk</span>
            </Link>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 1. TOP METRICS ROW (4 CARDS)                                         */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Dispute Claims */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Claims</span>
              <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Scale className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{activeClaimsCount} Claims</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Mediation Open
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">৳370 disputed in active cycle</p>
            </div>
          </div>

          {/* Card 2: Response Due Soon (< 24h) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Response Due Soon</span>
              <div className="size-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-rose-600 tracking-tight flex items-baseline gap-2">
                <span>{urgentCount} Urgent</span>
                {urgentCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">#DISP-2041 deadline in 4 hours</p>
            </div>
          </div>

          {/* Card 3: Resolution Success Rate */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Resolution Rate</span>
              <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                <ShieldCheck className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                94.2%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">16 of 17 claims resolved amicably</p>
            </div>
          </div>

          {/* Card 4: Total Reimbursed */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Reimbursed</span>
              <div className="size-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Receipt className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                ৳1,200
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Deducted across previous payout cycles</p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. URGENT HOST SLA ACTION CALLOUT BANNER                              */}
        {/* ==================================================================== */}
        {urgentCount > 0 && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 font-heading">
                  Action Required: Driver Filed Space Unavailable Claim (#DISP-2041)
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Driver <span className="font-bold">Kamal Hossain</span> claims{" "}
                  <span className="font-bold">Bay B-08</span> was occupied by another car. Host
                  evidence submission window closes at 05:00 PM today. Unanswered claims are
                  automatically resolved in favor of the driver.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/provider/disputes/DISP-2041"
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
              >
                Enter Evidence Room →
              </Link>
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
                placeholder="Search by Dispute ID, Driver, or Bay..."
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
            >
              <option value="ALL">All Statuses ({disputes.length})</option>
              <option value="ACTION_REQUIRED">Action Required ({urgentCount})</option>
              <option value="UNDER_REVIEW">Under Review (1)</option>
              <option value="RESOLVED">Resolved / Refunded (2)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
            >
              <option value="ALL">All Dispute Categories</option>
              <option value="SLOT_OCCUPIED">Slot Occupied / Barred Entry</option>
              <option value="OVERCHARGED">Overcharged / Fare Issue</option>
              <option value="HOST_MISCONDUCT">Guard / Host Misconduct</option>
              <option value="CANCELLED_NO_REFUND">Cancelled / Facility Issue</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 justify-between sm:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
              >
                <option value="URGENCY">Urgency / Action First</option>
                <option value="NEWEST">Newest Claims First</option>
                <option value="AMOUNT_HIGH">Claim Amount: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. DISPUTES TABLE CARD                                               */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Dispute Cases & Mediation Claims
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review driver evidence submissions, respond to mediation, and upload guard/CCTV
                verification logs
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredDisputes.length} records
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#E5E7EB] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Dispute ID</th>
                  <th className="py-3 px-4">Booking & Bay</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Disputed Amt</th>
                  <th className="py-3 px-4">Mediation Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Scale className="size-6 mx-auto mb-2 text-slate-400" />
                      <p className="font-semibold text-slate-700">No disputes found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        There are currently no claims matching your filter parameters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((d) => {
                    const isUrgent = d.status === "ACTION_REQUIRED";
                    const isUnderReview = d.status === "UNDER_REVIEW";
                    const isResolved = d.status === "RESOLVED" || d.status === "REFUNDED";

                    return (
                      <tr
                        key={d.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/80 group",
                          isUrgent && "bg-rose-50/30"
                        )}
                      >
                        {/* Dispute ID */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <Link
                            href={`/provider/disputes/${d.id}`}
                            className="hover:text-[#064E3B] hover:underline flex items-center gap-1.5"
                          >
                            <span>#{d.id}</span>
                            <ChevronRight className="size-3 text-slate-400" />
                          </Link>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {d.filedAt}
                          </div>
                        </td>

                        {/* Booking & Bay */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{d.baySlot}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {d.bookingCode} • {d.propertyTitle.split(",")[0]}
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{d.driverName}</div>
                          <div className="text-[10px] text-slate-400">
                            {d.driverPhone} • {d.driverRating} ★
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
                            {d.categoryLabel}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 max-w-[200px]">
                            {d.driverStatement}
                          </p>
                        </td>

                        {/* Disputed Amount */}
                        <td className="py-4 px-4 font-heading font-extrabold text-slate-900 whitespace-nowrap">
                          ৳{d.claimedAmount}
                          <div className="text-[10px] text-slate-400 font-normal font-sans">
                            {d.requestedOutcome}
                          </div>
                        </td>

                        {/* Status / Deadline */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isUrgent && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="size-1.5 rounded-full bg-rose-600 animate-pulse" />
                                Action Required
                              </span>
                              <div className="text-[10px] font-semibold text-rose-700">
                                {d.deadlineString}
                              </div>
                            </div>
                          )}

                          {isUnderReview && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Admin Review
                              </span>
                              <div className="text-[10px] text-slate-500">Evidence under review</div>
                            </div>
                          )}

                          {isResolved && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="size-3 text-emerald-600" />
                                {d.status === "REFUNDED" ? "Refund Issued" : "Resolved Amicably"}
                              </span>
                              <div className="text-[10px] text-slate-500">Case closed</div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isUrgent && (
                              <button
                                type="button"
                                onClick={() => setAcceptModalDispute(d)}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 transition cursor-pointer"
                              >
                                Accept & Refund
                              </button>
                            )}
                            <Link
                              href={`/provider/disputes/${d.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-[#064E3B] hover:bg-[#064E3B]/90 text-white transition shadow-2xs"
                            >
                              <span>Evidence Room</span>
                              <ChevronRight className="size-3" />
                            </Link>
                          </div>
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
              Showing {filteredDisputes.length} of {disputes.length} total dispute cases
            </span>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>SLA Standard: 48h host evidence response window</span>
              <span>Arbitration Desk: ParkEase Compliance BD</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. MEDIATION & HOST SAFEGUARDS POLICY CARD                            */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-[#064E3B]" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                ParkEase BD Host Protection & Dispute Safeguards
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Host Rating Protection Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Camera className="size-4 text-[#064E3B]" />
                <span>1. Photographic & CCTV Evidence</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hosts can upload facility CCTV recordings or guard gate logbook photos to contest
                unauthorized parking or driver overstay claims.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock className="size-4 text-[#064E3B]" />
                <span>2. 48-Hour Fair Mediation Window</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Funds are held safely in escrow during an open claim. No penalties are assessed to
                hosts while evidence is being compiled within the SLA window.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="size-4 text-[#064E3B]" />
                <span>3. Rating Exemption Safeguard</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Unjustified driver negative ratings are automatically scrubbed by compliance officers
                when disputes are settled with verified host evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. ACCEPT CLAIM / ISSUE REFUND MODAL                                 */}
      {/* ==================================================================== */}
      {acceptModalDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Accept Claim & Issue Refund
                  </h3>
                  <p className="text-xs text-slate-500">Case #{acceptModalDispute.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAcceptModalDispute(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are agreeing to refund driver{" "}
                <span className="font-bold text-slate-900">
                  {acceptModalDispute.driverName} ({acceptModalDispute.driverPhone})
                </span>{" "}
                for claim: <span className="font-bold text-slate-900">{acceptModalDispute.categoryLabel}</span>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Refund Amount</span>
                  <span className="font-bold text-[#064E3B] font-heading text-base">
                    ৳{acceptModalDispute.claimedAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Source Deduction</span>
                  <span className="font-medium text-slate-700">Next Weekly Payout Cycle</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Host Rating Impact</span>
                  <span className="font-bold text-emerald-700">Protected (0 penalty)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex items-start gap-2">
                <Info className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Accepting the claim closes this dispute immediately as amicably resolved. No strike
                  or penalty will be added to your host account.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAcceptModalDispute(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
                >
                  Confirm Refund (৳{acceptModalDispute.claimedAmount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
