"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CircleDollarSign,
  Scale,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Users,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Fallback high-level metrics when backend is disconnected
const FALLBACK_METRICS = {
  totalRevenuePaisa: 148520000, // ৳1,485,200
  activeDisputes: 14,
  pendingPayoutsPaisa: 24850000, // ৳248,500
  pendingPayoutCount: 18,
  pendingKycCount: 27,
  trends: [
    { date: "Sep 12", revenue: 42000, bookings: 38 },
    { date: "Sep 13", revenue: 58000, bookings: 49 },
    { date: "Sep 14", revenue: 51000, bookings: 44 },
    { date: "Sep 15", revenue: 72000, bookings: 61 },
    { date: "Sep 16", revenue: 84000, bookings: 73 },
    { date: "Sep 17", revenue: 95000, bookings: 82 },
    { date: "Sep 18", revenue: 112000, bookings: 94 },
  ],
};

export default function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminOperationsApi.dashboard,
    retry: 1,
  });

  const liveData = query.data;

  const totalRevenue = liveData?.finance?.platformRevenuePaisa
    ? formatBDTFromPaisa(liveData.finance.platformRevenuePaisa)
    : formatBDTFromPaisa(FALLBACK_METRICS.totalRevenuePaisa);

  const activeDisputes = liveData?.queues?.openDisputes ?? FALLBACK_METRICS.activeDisputes;

  const pendingPayouts = liveData?.finance?.pendingPayoutPaisa
    ? formatBDTFromPaisa(liveData.finance.pendingPayoutPaisa)
    : formatBDTFromPaisa(FALLBACK_METRICS.pendingPayoutsPaisa);

  const pendingKyc = liveData?.properties?.pending ?? FALLBACK_METRICS.pendingKycCount;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#064E3B]/20 bg-[#064E3B]/8 px-3.5 py-1 text-xs font-semibold text-[#064E3B] mb-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Overview & Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Key financial volume, dispute arbitration queues, and compliance onboarding signals across Dhaka.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/disputes">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs font-bold border-[#E5E7EB]"
            >
              <Scale className="size-3.5 mr-1.5 text-amber-600" />
              Arbitration Queue ({activeDisputes})
            </Button>
          </Link>
          <Link href="/admin/kyc-approvals">
            <Button
              size="sm"
              className="rounded-lg text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] shadow-xs"
            >
              <FileText className="size-3.5 mr-1.5" />
              KYC Approvals ({pendingKyc})
            </Button>
          </Link>
        </div>
      </div>

      {/* CORE 4 PLATFORM METRICS */}
      <section aria-labelledby="core-metrics">
        <h2 id="core-metrics" className="sr-only">
          Core Platform Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Revenue */}
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Total Platform Revenue
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-heading">
                  {totalRevenue}
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-[#064E3B] border border-emerald-100">
                <CircleDollarSign className="size-6" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
              <span className="flex items-center text-emerald-700 font-bold">
                <TrendingUp className="size-3.5 mr-1" />
                +14.2% vs last month
              </span>
              <span className="text-[11px] text-muted-foreground">Ledger Net GMV</span>
            </div>
          </article>

          {/* 2. Active Disputes */}
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Active Disputes
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-amber-700 font-heading">
                  {activeDisputes}
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Scale className="size-6" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
              <span className="text-amber-800 font-semibold">
                3 cases near SLA target
              </span>
              <Link href="/admin/disputes" className="font-bold text-[#064E3B] hover:underline">
                Arbitrate →
              </Link>
            </div>
          </article>

          {/* 3. Pending Payouts */}
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Pending Payouts
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-heading">
                  {pendingPayouts}
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <Banknote className="size-6" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
              <span className="text-muted-foreground font-medium">
                18 host disbursement requests
              </span>
              <Link href="/admin/marketplace/payouts" className="font-bold text-[#064E3B] hover:underline">
                Review →
              </Link>
            </div>
          </article>

          {/* 4. KYC Requests */}
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
                  Pending KYC Requests
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-[#064E3B] font-heading">
                  {pendingKyc}
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/20">
                <FileText className="size-6" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
              <span className="text-emerald-800 font-semibold">
                Withdrawals held
              </span>
              <Link href="/admin/kyc-approvals" className="font-bold text-[#064E3B] hover:underline">
                Verify Now →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* REVENUE & BOOKINGS ACTIVITY CHART */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground font-heading">
              Financial Gross Volume & Booking Demand
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time daily transaction progression across Dhaka urban centers.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#064E3B]">
              <span className="size-2.5 rounded-full bg-[#064E3B]" />
              Platform Revenue (BDT)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="size-2.5 rounded-full bg-amber-500" />
              Booking Count
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FALLBACK_METRICS.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `৳${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#064E3B",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "12px",
                  border: "none",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue (৳)"
                stroke="#064E3B"
                fill="#064E3B"
                fillOpacity={0.12}
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#d97706"
                fill="#d97706"
                fillOpacity={0.08}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ACTIONABLE QUEUES SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Dispute Cases */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-amber-700" />
              <h3 className="text-sm font-bold text-foreground font-heading">
                High Priority Disputes
              </h3>
            </div>
            <Link
              href="/admin/disputes"
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              View all ({activeDisputes})
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "DSP-8821",
                booking: "BK-90214",
                driver: "Tanvir Hasan",
                reason: "Spot occupied by unauthorized vehicle upon arrival",
                amount: "৳240",
                sla: "4 hours remaining",
              },
              {
                id: "DSP-8819",
                booking: "BK-89402",
                driver: "Ayesha Siddiqua",
                reason: "Guard refused entry despite valid OTP credential",
                amount: "৳320",
                sla: "7 hours remaining",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-3.5 hover:bg-[#f9f9ff] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {item.id}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-800">
                      Booking {item.booking}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.reason}
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <Clock className="size-3" />
                    {item.sla}
                  </p>
                </div>
                <Link href="/admin/disputes">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-lg">
                    Arbitrate
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Host KYC Verification */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#064E3B]" />
              <h3 className="text-sm font-bold text-foreground font-heading">
                Pending Host KYC Applications
              </h3>
            </div>
            <Link
              href="/admin/kyc-approvals"
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              View all ({pendingKyc})
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "KYC-3019",
                owner: "Mohammad Rahim Uddin",
                property: "Dhanmondi Lakeview Residential Garage",
                nid: "NID 1985123456789",
                date: "Today, 11:20 AM",
              },
              {
                id: "KYC-3018",
                owner: "Farzana Chowdhury",
                property: "Gulshan 2 Commercial Parking Tower",
                nid: "Smart NID 9928174621",
                date: "Yesterday, 04:15 PM",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-3.5 hover:bg-[#f9f9ff] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {item.owner}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {item.property}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Submitted: {item.date}
                  </p>
                </div>
                <Link href="/admin/kyc-approvals">
                  <Button size="sm" className="h-8 text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg">
                    Review Docs
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
