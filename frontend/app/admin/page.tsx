"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, BookOpenCheck, Building2, ListChecks, Scale, ShieldCheck, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa } from "@/lib/formatters";

export default function AdminOverviewPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminOperationsApi.dashboard,
  });

  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError) {
    return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  }

  const data = query.data;
  const queues = [
    { label: "Property reviews", value: data.queues.pendingProperties, href: "/admin/properties/pending", icon: Building2, tone: "text-amber-700" },
    { label: "Parking rights", value: data.queues.pendingRights, href: "/admin/marketplace/rights", icon: ShieldCheck, tone: "text-blue-700" },
    { label: "Open disputes", value: data.queues.openDisputes, href: "/admin/marketplace/disputes", icon: Scale, tone: "text-red-700" },
    { label: "Pending payouts", value: data.queues.pendingPayouts, href: "/admin/marketplace/payouts", icon: Banknote, tone: "text-violet-700" },
    { label: "Suspended listings", value: data.queues.suspendedListings, href: "/admin/marketplace/listings", icon: ListChecks, tone: "text-orange-700" },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Overview"
        title="Platform operations"
        description="Live operational, financial and trust signals across ParkEase BD."
      />
      <section aria-labelledby="platform-summary">
        <h2 id="platform-summary" className="mb-3 text-sm font-bold">Platform summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Total users" value={data.users.total} detail={`${data.users.drivers} Drivers · ${data.users.providers} Providers`} icon={Users} />
          <Kpi label="Verified properties" value={data.properties.verified} detail={`${data.properties.pending} awaiting review`} icon={Building2} />
          <Kpi label="Active listings" value={data.marketplace.activeListings} detail={`${data.marketplace.activeResources} resources online`} icon={ListChecks} />
          <Kpi label="Live sessions" value={data.marketplace.activeSessions} detail={`${data.marketplace.checkoutRequested} checkout requests`} icon={BookOpenCheck} />
        </div>
      </section>
      <FinanceSummary data={data.finance} />
      <OperationalTrends trends={data.trends} />
      <CriticalAlerts alerts={data.alerts} />
      <section aria-labelledby="queues">
        <h2 id="queues" className="mb-3 text-sm font-bold">Needs attention</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {queues.map(({ label, value, href, icon: Icon, tone }) => (
            <Link key={label} href={href} className="group flex items-center gap-4 border border-slate-200 bg-white p-4 transition hover:border-emerald-300">
              <span className={`flex size-10 items-center justify-center bg-slate-50 ${tone}`}><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><strong className="block text-2xl leading-none">{value}</strong><span className="mt-1 block text-xs font-semibold text-slate-600">{label}</span></span>
              <span className="text-xs font-bold text-emerald-800 opacity-0 group-hover:opacity-100">Open</span>
            </Link>
          ))}
        </div>
      </section>
      <RecentActivity events={data.recentActivity} />
    </div>
  );
}

function Kpi({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Users }) {
  return <article className="border border-slate-200 bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-3xl tracking-tight">{value.toLocaleString("en-BD")}</strong></div><span className="flex size-9 items-center justify-center bg-emerald-50 text-emerald-800"><Icon className="size-4" /></span></div><p className="mt-3 text-[11px] text-slate-500">{detail}</p></article>;
}

function FinanceSummary({ data }: { data: { paymentVolumePaisa: number; successfulPayments: number; platformRevenuePaisa: number; refundedPaisa: number; pendingProviderEarningsPaisa: number; providerLiabilityPaisa: number; pendingPayoutPaisa: number; completedPayoutPaisa: number } }) {
  const items = [
    ["Payment volume", data.paymentVolumePaisa, `${data.successfulPayments} successful`],
    ["Refunded", data.refundedPaisa, "Succeeded refunds"],
    ["Platform revenue", data.platformRevenuePaisa, "Ledger-derived revenue"],
    ["Provider liability", data.providerLiabilityPaisa, `${formatBDTFromPaisa(data.pendingProviderEarningsPaisa)} pending`],
    ["Pending payouts", data.pendingPayoutPaisa, "Awaiting review"],
    ["Completed payouts", data.completedPayoutPaisa, "Marked paid"],
  ] as const;
  return <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Financial oversight</h2><span className="text-[11px] font-semibold text-slate-500">BDT · simulated gateway</span></div><div className="grid border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-6">{items.map(([label, value, detail]) => <article key={label} className="border-b border-slate-100 p-4 sm:border-r xl:border-b-0"><p className="text-xs font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-lg">{formatBDTFromPaisa(value)}</strong><p className="mt-1 text-[11px] text-slate-500">{detail}</p></article>)}</div></section>;
}

function OperationalTrends({ trends }: { trends: { bookings: Array<{ bucket: string; count: number }>; revenue: Array<{ bucket: string; count: number; amountPaisa: number }>; users: Array<{ bucket: string; count: number }> } }) {
  const rows = trends.bookings.map((item) => ({ date: new Date(item.bucket).toLocaleDateString("en-BD", { month: "short", day: "numeric" }), bookings: item.count, users: trends.users.find((user) => user.bucket === item.bucket)?.count ?? 0 }));
  return <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">30-day activity</h2><span className="text-[11px] text-slate-500">Backend aggregated</span></div><div className="h-64 border border-slate-200 bg-white p-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="bookings" stroke="#047857" fill="#d1fae5" strokeWidth={2} /><Area type="monotone" dataKey="users" stroke="#b45309" fill="#fef3c7" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section>;
}

function CriticalAlerts({ alerts }: { alerts: { failedPayments: number; overdueDisputes: number; payoutHolds: number; expiringRights: number; guardCoverageIssues: number } }) {
  const rows = [["Failed payments", alerts.failedPayments], ["Overdue disputes", alerts.overdueDisputes], ["Payout holds", alerts.payoutHolds], ["Rights expiring in 30 days", alerts.expiringRights], ["Guard coverage gaps", alerts.guardCoverageIssues]] as const;
  const critical = rows.filter(([, value]) => value > 0);
  return <section><h2 className="mb-3 text-sm font-bold">Critical alerts</h2><div className="grid gap-2 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">{critical.length ? critical.map(([label, value]) => <div key={label} className="border-l-2 border-red-500 pl-3"><strong className="block text-xl text-red-800">{value}</strong><span className="text-xs text-slate-600">{label}</span></div>) : <p className="text-sm text-slate-500">No critical operational alerts right now.</p>}</div></section>;
}

function RecentActivity({ events }: { events: Array<{ id: string; eventType: string; entityType: string; createdAt: string; actor: { fullName: string } | null; property: { name: string } | null }> }) {
  return <section><h2 className="mb-3 text-sm font-bold">Recent platform activity</h2>{events.length === 0 ? <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Audited platform actions will appear here.</div> : <div className="divide-y divide-slate-100 border border-slate-200 bg-white">{events.map((event) => <article key={event.id} className="grid gap-1 p-4 sm:grid-cols-[1fr_auto]"><strong className="text-xs">{event.eventType.replaceAll("_", " ")}</strong><time className="text-[11px] text-slate-400">{new Date(event.createdAt).toLocaleString("en-BD")}</time><span className="text-xs text-slate-500">{event.actor?.fullName ?? "System"} · {event.property?.name ?? event.entityType}</span></article>)}</div>}</section>;
}

function DashboardSkeleton() {
  return <div className="space-y-5" aria-label="Loading Admin dashboard"><div className="h-20 animate-pulse bg-slate-200" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse bg-slate-200" />)}</div></div>;
}
