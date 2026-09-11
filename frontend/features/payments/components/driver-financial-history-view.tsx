"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  RotateCcw,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import {
  MOCK_PAYMENT_TRANSACTIONS,
  MOCK_REFUND_TRANSACTIONS,
  PaymentTransaction,
  RefundTransaction,
} from "@/lib/data/mock-driver-data";

interface DriverFinancialHistoryViewProps {
  initialTab?: "payments" | "refunds";
}

export function DriverFinancialHistoryView({
  initialTab = "payments",
}: DriverFinancialHistoryViewProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "refunds">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = MOCK_PAYMENT_TRANSACTIONS.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.bookingId.toLowerCase().includes(q) ||
      p.propertyTitle.toLowerCase().includes(q) ||
      p.gateway.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q)
    );
  });

  const filteredRefunds = MOCK_REFUND_TRANSACTIONS.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.bookingId.toLowerCase().includes(q) ||
      r.propertyTitle.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.transactionRef.toLowerCase().includes(q)
    );
  });

  const totalPaid = MOCK_PAYMENT_TRANSACTIONS.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRefunded = MOCK_REFUND_TRANSACTIONS.filter((r) => r.status === "Refunded").reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const pendingRefunds = MOCK_REFUND_TRANSACTIONS.filter((r) => r.status === "Processing").reduce(
    (acc, curr) => acc + curr.amount,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Page Header */}
      <section className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#064E3B] border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-[#064E3B]" />
              Official Statements
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-heading sm:text-4xl">
            Financial History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your parking payments, extensions, and automated refund receipts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "payments"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4 text-[#064E3B]" />
            <span>Payments</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
              {MOCK_PAYMENT_TRANSACTIONS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("refunds")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "refunds"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <RotateCcw className="h-4 w-4 text-[#064E3B]" />
            <span>Refunds</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
              {MOCK_REFUND_TRANSACTIONS.length}
            </span>
          </button>
        </div>
      </section>

      {/* 2. Top Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs urban-card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Paid to Date
          </span>
          <p className="mt-1 text-2xl font-black text-foreground font-heading">
            ৳ {totalPaid.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            5 transactions across 3 properties
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs urban-card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#064E3B]">
            Total Refunds Processed
          </span>
          <p className="mt-1 text-2xl font-black text-[#064E3B] font-heading">
            ৳ {totalRefunded.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-emerald-800">
            Security deposits &amp; adjustments returned
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs urban-card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Pending / In Transit
          </span>
          <p className="mt-1 text-2xl font-black text-amber-600 font-heading">
            ৳ {pendingRefunds.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Processing via bKash mobile gateway
          </p>
        </div>
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "payments"
                ? "Search booking ID, property, or gateway..."
                : "Search refund reason, booking ID, or ref..."
            }
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-[#064E3B] focus:bg-card focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          Showing {activeTab === "payments" ? filteredPayments.length : filteredRefunds.length} entries
        </div>
      </section>

      {/* 4. Table / List Card */}
      <section className="rounded-xl border border-border bg-card shadow-xs overflow-hidden urban-card-shadow">
        {activeTab === "payments" ? (
          /* PAYMENTS TAB */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPayments.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                      {item.date}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          item.purpose === "Initial Booking"
                            ? "bg-indigo-50 text-indigo-700"
                            : item.purpose === "Session Extension"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.purpose}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/driver/bookings/${item.bookingId}`}
                        className="font-mono font-bold text-[#064E3B] hover:underline"
                      >
                        #{item.bookingId}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-foreground font-medium max-w-[180px] truncate">
                      {item.propertyTitle}
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {item.gateway}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-foreground whitespace-nowrap">
                      ৳ {item.amount}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Validated"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : item.status === "Pending"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {item.status === "Validated" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "Pending" && <Clock className="h-3 w-3" />}
                        {item.status === "Failed" && <AlertCircle className="h-3 w-3" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => alert(`Downloading official receipt #${item.receiptNumber}...`)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064E3B] hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* REFUNDS TAB */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Refund Reason</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRefunds.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                      {item.date}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        {item.reason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/driver/bookings/${item.bookingId}`}
                        className="font-mono font-bold text-[#064E3B] hover:underline"
                      >
                        #{item.bookingId}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {item.originalPayment}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-[#064E3B] whitespace-nowrap">
                      ৳ {item.amount}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Refunded"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : item.status === "Processing"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        }`}
                      >
                        {item.status === "Refunded" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "Processing" && <Clock className="h-3 w-3" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-muted-foreground whitespace-nowrap">
                      {item.transactionRef}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
