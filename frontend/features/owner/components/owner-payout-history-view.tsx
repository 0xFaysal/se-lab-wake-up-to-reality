"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Clock,
  CheckCircle2,
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ArrowUpRight,
  ChevronRight,
  Building2,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Check,
  FileText,
  Copy,
  ExternalLink,
  ChevronDown,
  Info,
  ArrowLeft,
  X,
  Calendar,
  Sparkles,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import { RequestPayoutSheet } from "@/app/owner/payouts/components/RequestPayoutSheet";
import { cn } from "@/lib/utils";

export interface PayoutRecord {
  id: string;
  requestedAt: string;
  property: string;
  amount: number;
  method: string;
  methodType: "bank" | "mfs";
  accountMask: string;
  accountHolder: string;
  status: "UNDER_REVIEW" | "COMPLETED" | "PROCESSING" | "FAILED";
  processedAt?: string;
  settlementPeriod: string;
  estimatedArrival?: string;
  grossRevenue: number;
  platformFee: number;
  refunds: number;
  previousDisbursements: number;
  timeline: {
    title: string;
    description: string;
    timestamp: string;
    status: "completed" | "in_progress" | "upcoming";
  }[];
}

const INITIAL_PAYOUTS: PayoutRecord[] = [
  {
    id: "PR-8902",
    requestedAt: "Sep 10, 2026, 04:30 PM",
    property: "Residential Building, Gulshan",
    amount: 6250,
    method: "BRAC Bank Limited",
    methodType: "bank",
    accountMask: "•••• 4821",
    accountHolder: "Tanvir Chowdhury",
    status: "UNDER_REVIEW",
    settlementPeriod: "Aug 28 – Sep 03, 2026",
    estimatedArrival: "Sep 13, 2026 (via BEFTN)",
    grossRevenue: 36300,
    platformFee: 3630,
    refunds: 1200,
    previousDisbursements: 25220,
    timeline: [
      {
        title: "Request Submitted",
        description: "Initiated by Host via Owner Portal",
        timestamp: "Sep 10, 04:30 PM",
        status: "completed",
      },
      {
        title: "Eligibility & Fraud Verification",
        description: "All automated booking audits passed",
        timestamp: "Sep 10, 04:45 PM",
        status: "completed",
      },
      {
        title: "Admin & Compliance Review",
        description: "Under review by ParkEase Finance Desk",
        timestamp: "In progress",
        status: "in_progress",
      },
      {
        title: "Bank BEFTN Batch Dispatch",
        description: "Scheduled for routing batch clearance",
        timestamp: "Sep 12, 2026",
        status: "upcoming",
      },
      {
        title: "Disbursement Completed",
        description: "Funds credited to recipient account",
        timestamp: "Estimated Sep 13",
        status: "upcoming",
      },
    ],
  },
  {
    id: "PR-8821",
    requestedAt: "Sep 05, 2026, 11:15 AM",
    property: "Residential Building, Gulshan",
    amount: 12000,
    method: "BRAC Bank Limited",
    methodType: "bank",
    accountMask: "•••• 4821",
    accountHolder: "Tanvir Chowdhury",
    status: "COMPLETED",
    processedAt: "Sep 07, 2026, 02:20 PM",
    settlementPeriod: "Aug 21 – Aug 27, 2026",
    estimatedArrival: "Completed",
    grossRevenue: 48000,
    platformFee: 4800,
    refunds: 800,
    previousDisbursements: 30400,
    timeline: [
      {
        title: "Request Submitted",
        description: "Automated weekly auto-settlement",
        timestamp: "Sep 05, 11:15 AM",
        status: "completed",
      },
      {
        title: "Eligibility Audit",
        description: "Cleared with 0 disputes",
        timestamp: "Sep 05, 11:30 AM",
        status: "completed",
      },
      {
        title: "Admin Approval",
        description: "Approved by Finance Desk",
        timestamp: "Sep 06, 09:15 AM",
        status: "completed",
      },
      {
        title: "Bank BEFTN Dispatch",
        description: "Batch #BFT-9041 cleared",
        timestamp: "Sep 07, 10:00 AM",
        status: "completed",
      },
      {
        title: "Disbursement Completed",
        description: "৳12,000 credited to BRAC Bank •••• 4821",
        timestamp: "Sep 07, 02:20 PM",
        status: "completed",
      },
    ],
  },
  {
    id: "PR-8754",
    requestedAt: "Aug 29, 2026, 02:40 PM",
    property: "Office Parking, Banani",
    amount: 9500,
    method: "BRAC Bank Limited",
    methodType: "bank",
    accountMask: "•••• 4821",
    accountHolder: "Tanvir Chowdhury",
    status: "COMPLETED",
    processedAt: "Aug 31, 2026, 04:10 PM",
    settlementPeriod: "Aug 14 – Aug 20, 2026",
    estimatedArrival: "Completed",
    grossRevenue: 38000,
    platformFee: 3800,
    refunds: 500,
    previousDisbursements: 24200,
    timeline: [
      {
        title: "Request Submitted",
        description: "Manual request by Tanvir Chowdhury",
        timestamp: "Aug 29, 02:40 PM",
        status: "completed",
      },
      {
        title: "Eligibility Audit",
        description: "Cleared",
        timestamp: "Aug 29, 03:00 PM",
        status: "completed",
      },
      {
        title: "Admin Approval",
        description: "Approved",
        timestamp: "Aug 30, 11:00 AM",
        status: "completed",
      },
      {
        title: "Bank BEFTN Dispatch",
        description: "Cleared",
        timestamp: "Aug 31, 09:30 AM",
        status: "completed",
      },
      {
        title: "Disbursement Completed",
        description: "৳9,500 credited to BRAC Bank •••• 4821",
        timestamp: "Aug 31, 04:10 PM",
        status: "completed",
      },
    ],
  },
  {
    id: "PR-8649",
    requestedAt: "Aug 22, 2026, 10:00 AM",
    property: "Apartment Parking, Dhanmondi",
    amount: 8250,
    method: "City Bank Limited",
    methodType: "bank",
    accountMask: "•••• 1092",
    accountHolder: "Tanvir Chowdhury",
    status: "COMPLETED",
    processedAt: "Aug 24, 2026, 01:15 PM",
    settlementPeriod: "Aug 07 – Aug 13, 2026",
    estimatedArrival: "Completed",
    grossRevenue: 33000,
    platformFee: 3300,
    refunds: 0,
    previousDisbursements: 21450,
    timeline: [
      {
        title: "Request Submitted",
        description: "Weekly settlement",
        timestamp: "Aug 22, 10:00 AM",
        status: "completed",
      },
      {
        title: "Eligibility Audit",
        description: "Cleared",
        timestamp: "Aug 22, 10:15 AM",
        status: "completed",
      },
      {
        title: "Admin Approval",
        description: "Approved",
        timestamp: "Aug 23, 10:00 AM",
        status: "completed",
      },
      {
        title: "Bank BEFTN Dispatch",
        description: "Cleared",
        timestamp: "Aug 24, 11:00 AM",
        status: "completed",
      },
      {
        title: "Disbursement Completed",
        description: "৳8,250 credited to City Bank •••• 1092",
        timestamp: "Aug 24, 01:15 PM",
        status: "completed",
      },
    ],
  },
  {
    id: "PR-8531",
    requestedAt: "Aug 15, 2026, 03:20 PM",
    property: "Residential Building, Gulshan",
    amount: 6500,
    method: "BRAC Bank Limited",
    methodType: "bank",
    accountMask: "•••• 4821",
    accountHolder: "Tanvir Chowdhury",
    status: "COMPLETED",
    processedAt: "Aug 17, 2026, 03:45 PM",
    settlementPeriod: "Jul 31 – Aug 06, 2026",
    estimatedArrival: "Completed",
    grossRevenue: 26000,
    platformFee: 2600,
    refunds: 400,
    previousDisbursements: 16500,
    timeline: [
      {
        title: "Request Submitted",
        description: "Manual request",
        timestamp: "Aug 15, 03:20 PM",
        status: "completed",
      },
      {
        title: "Eligibility Audit",
        description: "Cleared",
        timestamp: "Aug 15, 03:30 PM",
        status: "completed",
      },
      {
        title: "Admin Approval",
        description: "Approved",
        timestamp: "Aug 16, 09:30 AM",
        status: "completed",
      },
      {
        title: "Bank BEFTN Dispatch",
        description: "Cleared",
        timestamp: "Aug 17, 10:00 AM",
        status: "completed",
      },
      {
        title: "Disbursement Completed",
        description: "৳6,500 credited to BRAC Bank •••• 4821",
        timestamp: "Aug 17, 03:45 PM",
        status: "completed",
      },
    ],
  },
];

export function OwnerPayoutHistoryView() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUTS);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord>(INITIAL_PAYOUTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "AMOUNT_HIGH" | "AMOUNT_LOW">("NEWEST");

  // Balances
  const [availableBalance, setAvailableBalance] = useState(18600);
  const [pendingPayout, setPendingPayout] = useState(6250);
  const [totalPaidOut, setTotalPaidOut] = useState(42500);

  // Request Payout Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("18600");
  const [selectedAccount, setSelectedAccount] = useState("brac-4821");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    showToast(`Copied Payout ID #${id} to clipboard.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportCSV = () => {
    showToast("Generating payout statement CSV for Sep 1 – Sep 11, 2026...");
  };

  const handleSubmitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(requestAmount);
    if (isNaN(amt) || amt < 1000) {
      alert("Minimum payout withdrawal amount is ৳1,000.");
      return;
    }
    if (amt > availableBalance) {
      alert("Requested amount exceeds current available balance.");
      return;
    }

    const newId = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: PayoutRecord = {
      id: newId,
      requestedAt: "Just now",
      property: "Residential Building, Gulshan",
      amount: amt,
      method: selectedAccount === "brac-4821" ? "BRAC Bank Limited" : "City Bank Limited",
      methodType: "bank",
      accountMask: selectedAccount === "brac-4821" ? "•••• 4821" : "•••• 1092",
      accountHolder: "Tanvir Chowdhury",
      status: "UNDER_REVIEW",
      settlementPeriod: "Sep 04 – Sep 10, 2026",
      estimatedArrival: "Within 2 business days (via BEFTN)",
      grossRevenue: amt * 1.15,
      platformFee: amt * 0.1,
      refunds: 0,
      previousDisbursements: 0,
      timeline: [
        {
          title: "Request Submitted",
          description: "Initiated via Owner Portal",
          timestamp: "Just now",
          status: "completed",
        },
        {
          title: "Eligibility & Fraud Verification",
          description: "Automated scan queued",
          timestamp: "In progress",
          status: "in_progress",
        },
        {
          title: "Admin & Compliance Review",
          description: "Awaiting Finance Desk authorization",
          timestamp: "Upcoming",
          status: "upcoming",
        },
        {
          title: "Bank BEFTN Batch Dispatch",
          description: "Scheduled next cycle",
          timestamp: "Upcoming",
          status: "upcoming",
        },
        {
          title: "Disbursement Completed",
          description: "Credited to selected account",
          timestamp: "Upcoming",
          status: "upcoming",
        },
      ],
    };

    setPayouts([newRecord, ...payouts]);
    setSelectedPayout(newRecord);
    setAvailableBalance((prev) => prev - amt);
    setPendingPayout((prev) => prev + amt);
    setIsRequestModalOpen(false);
    showToast(`Payout request of ৳${amt.toLocaleString()} (#${newId}) submitted successfully.`);
  };

  // Filter & Sort Logic
  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.method.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "UNDER_REVIEW" && p.status === "UNDER_REVIEW") ||
      (statusFilter === "COMPLETED" && p.status === "COMPLETED") ||
      (statusFilter === "PROCESSING" && p.status === "PROCESSING");

    const matchesProperty =
      propertyFilter === "ALL" || p.property.toLowerCase().includes(propertyFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesProperty;
  });

  const sortedPayouts = [...filteredPayouts].sort((a, b) => {
    if (sortBy === "NEWEST") return b.id.localeCompare(a.id);
    if (sortBy === "OLDEST") return a.id.localeCompare(b.id);
    if (sortBy === "AMOUNT_HIGH") return b.amount - a.amount;
    if (sortBy === "AMOUNT_LOW") return a.amount - b.amount;
    return 0;
  });

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
        title="Payout History"
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Auto-Settlement Active
          </span>
        }
        subtitle="Review historical disbursements, pending transfers, and weekly settlement statements for all your listings."
      />

      {/* Main Workspace Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto w-full space-y-6 pb-28">
        {/* Breadcrumb row & Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/owner/earnings"
              className="hover:text-[#064E3B] font-medium transition-colors flex items-center gap-1"
            >
              Earnings
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Payout History</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ArrowUpRight className="size-4" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 1. TOP METRICS (4 CARDS)                                             */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Available Balance */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Available Balance</span>
              <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                <Wallet className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                ৳{availableBalance.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-500">Ready for withdrawal</span>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="font-bold text-[#064E3B] hover:underline cursor-pointer"
                >
                  Withdraw Now →
                </button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-[#064E3B] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Pending Payout */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Payout</span>
              <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>৳{pendingPayout.toLocaleString()}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  1 Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Batch #PR-8902 • Under Review</p>
            </div>
          </div>

          {/* Card 3: Total Paid Out */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Paid Out</span>
              <div className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                ৳{totalPaidOut.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {payouts.filter((p) => p.status === "COMPLETED").length} payouts processed to date
              </p>
            </div>
          </div>

          {/* Card 4: Last Payout */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Last Payout</span>
              <div className="size-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <CreditCard className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>৳12,000</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Completed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Sep 05, 2026 • BRAC Bank</p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. FILTER & SEARCH CONTROL BAR                                       */}
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
                placeholder="Search by Payout ID, Bank, or Property..."
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
              </select>

              {/* Property Filter */}
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
              >
                <option value="ALL">All Properties</option>
                <option value="Gulshan">Residential Building, Gulshan</option>
                <option value="Banani">Office Parking, Banani</option>
                <option value="Dhanmondi">Apartment Parking, Dhanmondi</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 justify-between sm:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            {/* Date Range Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Calendar className="size-3.5 text-slate-400" />
              <span>Sep 1 – Sep 11, 2026</span>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#064E3B] cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="AMOUNT_HIGH">Amount: High to Low</option>
                <option value="AMOUNT_LOW">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. MAIN WORKSPACE: TABLE (LEFT) + DETAILS SIDEBAR (RIGHT)            */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: TRANSACTIONS TABLE + SETTLEMENT BREAKDOWN */}
          <div className="lg:col-span-8 space-y-6">
            {/* Payout Transactions Table Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Payout Transactions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any transaction row to inspect audit timeline and settlement records
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {sortedPayouts.length} records
                </span>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-[#E5E7EB] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Payout ID</th>
                      <th className="py-3 px-4">Requested</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sortedPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <AlertCircle className="size-6 mx-auto mb-2 text-slate-400" />
                          <p className="font-semibold text-slate-700">No payout records found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Try adjusting your search terms or status filters.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sortedPayouts.map((p) => {
                        const isSelected = selectedPayout.id === p.id;
                        const isUnderReview = p.status === "UNDER_REVIEW";
                        const isCompleted = p.status === "COMPLETED";

                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedPayout(p)}
                            className={cn(
                              "cursor-pointer transition-colors group",
                              isSelected
                                ? "bg-emerald-50/60 font-medium"
                                : "hover:bg-slate-50/80"
                            )}
                          >
                            {/* Payout ID */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                {isSelected && (
                                  <span className="size-1.5 rounded-full bg-[#064E3B]" />
                                )}
                                <span>#{p.id}</span>
                              </div>
                            </td>

                            {/* Requested Date */}
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {p.requestedAt}
                            </td>

                            {/* Property */}
                            <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[180px] truncate">
                              {p.property}
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4 font-heading font-extrabold text-slate-900 whitespace-nowrap">
                              ৳{p.amount.toLocaleString()}
                            </td>

                            {/* Method */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Landmark className="size-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{p.accountMask}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isUnderReview && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Under Review
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                                  Completed
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPayout(p);
                                }}
                                className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer",
                                  isSelected
                                    ? "bg-[#064E3B] text-white border-[#064E3B]"
                                    : "bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-100"
                                )}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3.5 border-t border-[#E5E7EB] bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {sortedPayouts.length} of {payouts.length} total payouts
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-400 opacity-50 cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-400 opacity-50 cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* RECENT SETTLEMENT BREAKDOWN CARD                                 */}
            {/* ================================================================ */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-heading text-slate-900">
                      Settlement Statement Breakdown
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#064E3B] border border-emerald-200">
                      #{selectedPayout.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Itemized financial audit for settlement cycle: {selectedPayout.settlementPeriod}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast(`Downloading settlement PDF for #${selectedPayout.id}...`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                >
                  <FileText className="size-3.5" />
                  <span>Download Statement PDF</span>
                </button>
              </div>

              {/* Itemized Calculation List */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-medium">Gross Parking Revenue</span>
                    <span className="text-[10px] text-slate-400">({selectedPayout.property})</span>
                  </div>
                  <span className="font-heading font-bold text-slate-900">
                    ৳{selectedPayout.grossRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-medium">ParkEase Platform Service Fee</span>
                    <span className="text-[10px] text-slate-400 font-mono">(10%)</span>
                  </div>
                  <span className="font-heading font-bold text-rose-600">
                    —৳{selectedPayout.platformFee.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-medium">Refunds & Disputed Adjustments</span>
                    <span className="text-[10px] text-slate-400">(0 disputes active)</span>
                  </div>
                  <span className="font-heading font-bold text-rose-600">
                    —৳{selectedPayout.refunds.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-medium">Previously Paid Out in Batch</span>
                  </div>
                  <span className="font-heading font-bold text-slate-500">
                    —৳{selectedPayout.previousDisbursements.toLocaleString()}
                  </span>
                </div>

                {/* Net Payable Row */}
                <div className="flex items-center justify-between pt-2 text-sm font-extrabold bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-900">Net Settled Payout</span>
                  <span className="text-base text-[#064E3B] font-heading font-black">
                    ৳{selectedPayout.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Policy Callout Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-950">
                <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <span className="font-bold block">Settlement & Disbursement Policy</span>
                  <p className="text-emerald-900 text-[11px]">
                    Settlements are executed every Sunday at 11:59 PM. Standard Bangladesh BEFTN /
                    NPSB interbank routing requires 24 to 48 business hours for clearance. Minimum
                    withdrawal threshold is ৳1,000.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: PAYOUT DETAILS, PROGRESS TIMELINE, ACCOUNT INFO */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Selected Payout Details */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Request #{selectedPayout.id}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopyId(selectedPayout.id)}
                    className="text-slate-400 hover:text-slate-700 transition"
                    title="Copy Payout ID"
                  >
                    {copiedId === selectedPayout.id ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                {selectedPayout.status === "UNDER_REVIEW" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Under Review
                  </span>
                )}
                {selectedPayout.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="size-3 text-emerald-600 stroke-[3]" />
                    Completed
                  </span>
                )}
              </div>

              {/* Amount Display */}
              <div className="bg-[#f9f9ff] border border-[#E5E7EB] rounded-xl p-4 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Disbursement Amount
                </span>
                <div className="text-3xl font-black font-heading text-slate-900 mt-1">
                  ৳{selectedPayout.amount.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Via {selectedPayout.method} ({selectedPayout.accountMask})
                </span>
              </div>

              {/* Metadata Key-Value List */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Requested At</span>
                  <span className="font-semibold text-slate-800">{selectedPayout.requestedAt}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Settlement Period</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPayout.settlementPeriod}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transfer Method</span>
                  <span className="font-semibold text-slate-800">{selectedPayout.method}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Account Mask</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedPayout.accountMask}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {selectedPayout.property}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Estimated Clearance</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedPayout.estimatedArrival || "Completed"}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => showToast(`Statement for #${selectedPayout.id} prepared for print.`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
              >
                <FileText className="size-3.5 text-slate-500" />
                <span>Download Payout Receipt</span>
              </button>
            </div>

            {/* Card 2: Payout Progress Timeline */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Disbursement Timeline
              </h3>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedPayout.timeline.map((step, idx) => {
                  const isDone = step.status === "completed";
                  const isInProgress = step.status === "in_progress";
                  const isUpcoming = step.status === "upcoming";

                  return (
                    <div key={idx} className="relative">
                      {/* Node circle */}
                      <span
                        className={cn(
                          "absolute -left-6 top-0.5 size-3.5 rounded-full ring-4 ring-white flex items-center justify-center",
                          isDone && "bg-emerald-600 text-white",
                          isInProgress && "bg-amber-500 animate-pulse",
                          isUpcoming && "bg-slate-200"
                        )}
                      />

                      <div>
                        <div className="flex items-baseline justify-between gap-1">
                          <h4
                            className={cn(
                              "text-xs font-bold",
                              isDone && "text-slate-900",
                              isInProgress && "text-amber-800",
                              isUpcoming && "text-slate-400"
                            )}
                          >
                            {step.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {step.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Payout Account Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-[#064E3B]" />
                  <h3 className="text-sm font-bold font-heading text-slate-900">
                    Receiving Bank Account
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  Verified Host
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-bold text-slate-900">BRAC Bank Limited</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-mono font-bold text-slate-900">•••• •••• 4821</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Name</span>
                  <span className="font-semibold text-slate-800">Tanvir Chowdhury</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Auto Payout</span>
                  <span className="font-semibold text-[#064E3B]">Weekly (Sundays 11:59 PM)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Account management modal opened.")}
                  className="py-2 px-3 text-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
                >
                  Manage Account
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Payout schedule options updated.")}
                  className="py-2 px-3 text-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
                >
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. STICKY BOTTOM ACTION BAR                                          */}
      {/* ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-6 py-3.5 shadow-lg flex items-center justify-between">
        <Link
          href="/owner/earnings"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#064E3B] transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Earnings</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-500">Available to withdraw:</span>
            <span className="font-heading font-extrabold text-slate-900 text-sm">
              ৳{availableBalance.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
          >
            <ArrowUpRight className="size-4 stroke-[2.5]" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. REQUEST PAYOUT SLIDE-OVER SHEET                                   */}
      {/* ==================================================================== */}
      <RequestPayoutSheet
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        availableBalance={availableBalance}
        onSuccess={(payout) => {
          const newRecord: PayoutRecord = {
            id: payout.id,
            requestedAt: "Just now",
            property: "Residential Building, Gulshan",
            amount: payout.amount,
            method: payout.method,
            methodType: "bank",
            accountMask: payout.accountMask,
            accountHolder: "Tanvir Chowdhury",
            status: "UNDER_REVIEW",
            settlementPeriod: "Sep 04 – Sep 10, 2026",
            estimatedArrival: "Within 2 business days (via BEFTN)",
            grossRevenue: payout.amount * 1.15,
            platformFee: payout.amount * 0.1,
            refunds: 0,
            previousDisbursements: 0,
            timeline: [
              {
                title: "Request Submitted",
                description: "Initiated via Owner Portal",
                timestamp: "Just now",
                status: "completed",
              },
              {
                title: "Eligibility & Fraud Verification",
                description: "Automated scan queued",
                timestamp: "In progress",
                status: "in_progress",
              },
              {
                title: "Admin & Compliance Review",
                description: "Awaiting Finance Desk authorization",
                timestamp: "Upcoming",
                status: "upcoming",
              },
              {
                title: "Bank BEFTN Batch Dispatch",
                description: "Scheduled next cycle",
                timestamp: "Upcoming",
                status: "upcoming",
              },
              {
                title: "Disbursement Completed",
                description: "Credited to selected account",
                timestamp: "Upcoming",
                status: "upcoming",
              },
            ],
          };

          setPayouts((prev) => [newRecord, ...prev]);
          setSelectedPayout(newRecord);
          setAvailableBalance((prev) => prev - payout.amount);
          setPendingPayout((prev) => prev + payout.amount);
          showToast(`Payout request of ৳${payout.amount.toLocaleString()} (#${payout.id}) submitted.`);
        }}
      />
    </div>
  );
}
