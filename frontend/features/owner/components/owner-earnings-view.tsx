"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Check,
  AlertCircle,
  Download,
  Receipt,
  Wallet,
  Lock,
  Info,
  ChevronRight,
  X,
  ExternalLink,
  DollarSign,
  Landmark,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_DAILY_EARNINGS,
  MOCK_PROPERTY_EARNINGS,
  MOCK_EARNINGS_TRANSACTIONS,
  MOCK_PAYOUT_TIMELINE,
  EarningsTransaction,
} from "@/lib/data/mock-owner-data";

export function OwnerEarningsView() {
  const [timeRange, setTimeRange] = useState<"30D" | "MONTH" | "YTD">("30D");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("18600");
  const [availableBalance, setAvailableBalance] = useState(18600);
  const [pendingPayout, setPendingPayout] = useState(6250);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<EarningsTransaction | null>(null);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0 || amt > availableBalance) {
      alert("Please enter a valid payout amount within your available balance.");
      return;
    }

    setAvailableBalance((prev) => prev - amt);
    setPendingPayout((prev) => prev + amt);
    setIsPayoutModalOpen(false);
    setPayoutSuccessMsg(`Payout request of ৳${amt.toLocaleString()} submitted to BRAC Bank •••• 4821.`);
    setTimeout(() => setPayoutSuccessMsg(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Top Header */}
      <OwnerHeader
        title="Earnings"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Settlement
          </span>
        }
        subtitle="Track parking revenue, owner earnings, payouts, and recent transactions."
      />

      {/* Payout Success Toast */}
      {payoutSuccessMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#064E3B] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-emerald-300" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* ==================================================================== */}
        {/* TOP NOTICE BANNERS (2 COLUMNS)                                       */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
            <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              <span className="font-bold">Owner earnings</span> are calculated after platform fees, eligible refunds, and approved adjustments.
            </p>
          </div>

          <div className="bg-slate-50 border border-[#E5E7EB] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
            <Lock className="size-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              Only the Property Owner can access payout accounts and request payouts. Property Managers view with permission.
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MAIN LAYOUT (2/3 LEFT COLUMN & 1/3 RIGHT SIDEBAR)                    */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================== */}
          {/* LEFT 2/3 COLUMN (8 COLS)                                           */}
          {/* ================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. METRICS ROW (4 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: TOTAL EARNINGS */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    TOTAL EARNINGS
                  </span>
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                    <Receipt className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    ৳128,450
                  </div>
                  <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                    <TrendingUp className="size-3" />
                    <span>+14.2%</span>
                    <span className="text-slate-500 font-normal">all-time cumulative</span>
                  </p>
                </div>
              </div>

              {/* Card 2: THIS MONTH */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    THIS MONTH
                  </span>
                  <div className="size-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Calendar className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    ৳24,850
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">Sep 1–10</span> • 164 total bookings
                  </p>
                </div>
              </div>

              {/* Card 3: AVAILABLE FOR PAYOUT */}
              <div className="bg-white rounded-xl border border-emerald-300 p-4.5 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 font-heading block">
                    AVAILABLE FOR PAYOUT
                  </span>
                  <div className="size-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-heading tracking-tight">
                    ৳{availableBalance.toLocaleString()}
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    <span>Ready for withdrawal</span>
                  </p>
                </div>
              </div>

              {/* Card 4: PENDING PAYOUT */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 font-heading block">
                    PENDING PAYOUT
                  </span>
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <Clock className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-heading tracking-tight">
                    ৳{pendingPayout.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">
                      In Review (1 req)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. EARNINGS OVERVIEW CHART */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                    Earnings Overview
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily net earnings and booking activity across properties
                  </p>
                </div>

                {/* Range Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTimeRange("30D")}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      timeRange === "30D"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange("MONTH")}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      timeRange === "MONTH"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange("YTD")}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      timeRange === "YTD"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Year to Date
                  </button>
                </div>
              </div>

              {/* Top Stats Highlight Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center font-bold">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Average Daily Earnings
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-slate-900 font-heading">
                        ৳828
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        +8.4%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="size-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold font-heading">
                    P
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Bookings This Month
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-extrabold text-slate-900 font-heading">
                        164
                      </span>
                      <span className="text-xs text-slate-500">completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MOCK_DAILY_EARNINGS}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-xl p-2.5 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-slate-300">{data.dayLabel}</p>
                              <p className="text-emerald-400 font-bold">
                                Earnings: ৳{data.earnings}
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                Bookings: {data.bookings}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="baseline" fill="#E2E8F0" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="earnings" fill="#064E3B" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {MOCK_DAILY_EARNINGS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index >= 6 ? "#064E3B" : "#cbd5e1"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-[#064E3B]" />
                  <span>Daily earnings (BDT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-slate-300" />
                  <span>Previous period baseline</span>
                </div>
              </div>
            </div>

            {/* 3. EARNINGS BY PROPERTY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                    Earnings by Property
                  </h3>
                  <p className="text-xs text-slate-500">
                    Breakdown of gross revenue, 10% platform fee, and net owner payout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Viewing complete property breakdown analytics.")}
                  className="text-xs font-semibold text-[#064E3B] hover:text-[#064E3B]/80 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Property Breakdown</span>
                  <span className="text-sm">→</span>
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_PROPERTY_EARNINGS.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#fcfcfd] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-10 rounded-xl ${prop.badgeBg} ${prop.badgeText} font-bold text-xs flex items-center justify-center font-heading shrink-0`}
                        >
                          {prop.code}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                            {prop.propertyTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {prop.location} • {prop.totalBookings} Bookings
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-lg font-extrabold text-[#064E3B] font-heading">
                          ৳{prop.netOwnerEarnings.toLocaleString()}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Owner Net Earnings
                        </span>
                      </div>
                    </div>

                    {/* Math breakdown bar */}
                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                      <div className="flex items-center gap-2">
                        <span>Gross Revenue: <strong className="text-slate-900">৳{prop.grossRevenue.toLocaleString()}</strong></span>
                        <span className="text-slate-400">–</span>
                        <span>Platform Fee (10%): <strong className="text-rose-600">-৳{prop.platformFeeAmount.toLocaleString()}</strong></span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                        Payout Rate: {prop.payoutRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. RECENT EARNINGS TRANSACTIONS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                    Recent Earnings Transactions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Itemized booking deductions and net revenue settlement
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing latest 4 transactions
                  </span>
                  <button
                    type="button"
                    onClick={() => alert("Downloading transactions CSV...")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Booking</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4 text-right">Parking Fee</th>
                      <th className="py-3 px-4 text-right">Platform Fee</th>
                      <th className="py-3 px-4 text-right">Owner Earnings</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_EARNINGS_TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {tx.dateStr}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#064E3B] whitespace-nowrap">
                          {tx.bookingCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {tx.propertyTitle}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          ৳{tx.parkingFee}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                          -৳{tx.platformFee}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          ৳{tx.ownerEarnings}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {tx.status === "Settled" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="text-xs font-semibold text-slate-700 hover:text-[#064E3B] transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* RIGHT 1/3 SIDEBAR (4 COLS)                                         */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. PAYOUT SUMMARY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Payout Summary
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Weekly Cycle
                </span>
              </div>

              {/* Available Balance Big Block */}
              <div className="p-4 rounded-xl bg-[#fcfcfd] border border-[#E5E7EB] space-y-2">
                <span className="text-xs font-medium text-slate-500 block">
                  Available Balance
                </span>
                <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  ৳{availableBalance.toLocaleString()}
                </div>
                <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  <span>Disbursed automatically on Sunday</span>
                </p>
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Pending Payout</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    ৳{pendingPayout.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Last Payout</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    ৳12,000
                  </span>
                  <span className="text-[10px] text-slate-400">Sep 5, 2026</span>
                </div>
              </div>

              {/* Disbursement Account */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  DISBURSEMENT ACCOUNT
                </span>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-900 text-white font-bold text-xs flex items-center justify-center font-heading">
                      BRAC
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        BRAC Bank Ltd.
                      </h4>
                      <p className="text-[11px] text-slate-500">•••• 4821</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="size-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Request Payout Button */}
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Wallet className="size-4" />
                <span>Request Payout</span>
              </button>

              <button
                type="button"
                onClick={() => alert("Bank disbursement settings: BRAC Bank Ltd. Account #4821 is currently active.")}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Manage Payout Account
              </button>
            </div>

            {/* 2. REVENUE BREAKDOWN */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3.5">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Revenue Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">
                  Net reconciliation for current accounting period
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    Gross Parking Revenue
                  </span>
                  <span className="font-bold text-slate-900">৳35,300</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Platform Fees (10%)
                  </span>
                  <span className="font-bold text-rose-600">-৳3,530</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Refunds / Adjustments
                  </span>
                  <span className="font-bold text-amber-600">-৳1,200</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-heading">
                    Owner Net Earnings
                  </span>
                  <span className="text-base font-extrabold text-[#064E3B] font-heading">
                    ৳31,470
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RECENT PAYOUT ACTIVITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Recent Payout Activity
                </h3>
                <Link
                  href="/owner/payouts"
                  className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                >
                  View Payout History
                </Link>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {MOCK_PAYOUT_TIMELINE.map((item) => {
                  const isUnderReview = item.status === "UNDER_REVIEW";
                  const isRequested = item.status === "REQUESTED";
                  const isCompleted = item.status === "COMPLETED";

                  return (
                    <div key={item.id} className="relative">
                      {/* Timeline node */}
                      <span
                        className={`absolute -left-5 top-1 size-2.5 rounded-full ring-4 ring-white ${
                          isUnderReview
                            ? "bg-amber-500"
                            : isRequested
                            ? "bg-emerald-600"
                            : "bg-emerald-700"
                        }`}
                      />
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.subtext}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 font-heading">
                          ৳{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: REQUEST PAYOUT                                                */}
      {/* ==================================================================== */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Request Payout
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer settled earnings to your verified bank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700">Withdrawal Amount (BDT)</label>
                  <span className="text-emerald-700 font-medium">Max: ৳{availableBalance.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    ৳
                  </span>
                  <input
                    type="number"
                    max={availableBalance}
                    min={500}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="w-full h-11 pl-8 pr-4 rounded-xl border border-[#E5E7EB] text-sm font-bold text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              {/* Destination Bank Card */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">Destination Account</span>
                  <strong className="text-slate-900">BRAC Bank Ltd. •••• 4821</strong>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                  Verified
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Transfer Fee:</span>
                  <span className="font-bold text-emerald-700">Free (Standard)</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span className="font-medium text-slate-700">Next Business Day</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TRANSACTION DETAILS                                           */}
      {/* ==================================================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Transaction {selectedTx.bookingCode}
                </h3>
                <p className="text-xs text-slate-500">{selectedTx.dateStr}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-semibold text-slate-900">{selectedTx.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-900">{selectedTx.propertyTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="font-semibold text-slate-900">{selectedTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-emerald-700">{selectedTx.status}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Parking Fee:</span>
                  <span className="font-medium text-slate-900">৳{selectedTx.parkingFee}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Platform Fee (10%):</span>
                  <span className="font-medium">-৳{selectedTx.platformFee}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200">
                  <span>Owner Net Earnings:</span>
                  <span className="text-[#064E3B] text-sm">৳{selectedTx.ownerEarnings}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
