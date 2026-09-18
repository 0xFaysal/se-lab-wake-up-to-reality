"use client";

import { type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, CalendarDays, RefreshCw, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const granularity = params.get("granularity") ?? "day";
  const filters = { from, to, granularity };
  const query = useQuery({ queryKey: queryKeys.admin.analytics.overview(filters), queryFn: () => adminOperationsApi.analyticsOverview(filters) });

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fromDate = String(form.get("from") ?? "");
    const toDate = String(form.get("to") ?? "");
    const next = new URLSearchParams();
    if (fromDate) next.set("from", new Date(`${fromDate}T00:00:00+06:00`).toISOString());
    if (toDate) next.set("to", new Date(`${toDate}T23:59:59+06:00`).toISOString());
    next.set("granularity", String(form.get("granularity") ?? "day"));
    router.replace(`${pathname}?${next}`);
  }

  if (query.isPending) return <div className="space-y-4"><div className="h-20 animate-pulse bg-slate-200" /><div className="grid gap-4 lg:grid-cols-2"><div className="h-72 animate-pulse bg-slate-200" /><div className="h-72 animate-pulse bg-slate-200" /></div></div>;
  if (query.isError) return <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Unable to load analytics</strong><span>{getApiErrorMessage(query.error)}</span><Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div>;
  const data = query.data;
  const growth = data.users.growth.map((row) => ({ date: dateLabel(row.bucket), users: row.count, providers: data.users.providerGrowth.find((item) => item.bucket === row.bucket)?.count ?? 0, properties: data.users.propertyGrowth.find((item) => item.bucket === row.bucket)?.count ?? 0 }));
  const occupancy = data.occupancy.trend.map((row) => ({ date: dateLabel(row.bucket), checkIns: row.checkIns, completed: row.completed }));
  const peakHours = [...data.occupancy.peakTimeHeatmap].sort((a, b) => b.checkIns - a.checkIns).slice(0, 8);

  return <div className="space-y-7">
    <AdminPageHeader eyebrow="Platform" title="Operational analytics" description="Backend-aggregated booking, finance, growth and parking activity. No client-side raw-table aggregation." action={<Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>} />
    <form onSubmit={applyRange} className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto]">
      <label className="text-xs font-semibold text-slate-600">From<Input name="from" type="date" defaultValue={dateInputValue(from ?? null)} className="mt-1" /></label>
      <label className="text-xs font-semibold text-slate-600">To<Input name="to" type="date" defaultValue={dateInputValue(to ?? null)} className="mt-1" /></label>
      <label className="text-xs font-semibold text-slate-600">Granularity<select name="granularity" defaultValue={granularity} className="mt-1 h-10 w-full border bg-white px-3 text-sm"><option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select></label>
      <Button type="submit" className="self-end"><CalendarDays className="size-4" />Apply range</Button>
    </form>

    <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Payment volume" value={formatBDTFromPaisa(data.finance.totals.paymentVolumePaisa)} icon={Activity} />
      <Metric label="Net volume" value={formatBDTFromPaisa(data.finance.totals.netVolumePaisa)} icon={Activity} />
      <Metric label="Refund rate" value={`${data.finance.totals.refundPercent}%`} icon={RefreshCw} />
      <Metric label="Cancellation" value={`${data.bookings.rates.cancellationPercent}%`} icon={CalendarDays} />
      <Metric label="No-show" value={`${data.bookings.rates.noShowPercent}%`} icon={Users} />
      <Metric label="Dispute rate" value={`${data.bookings.rates.disputePercent}%`} icon={Building2} />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Chart title="Booking activity"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.bookings.trend.map((row) => ({ date: dateLabel(row.bucket), bookings: row.count }))}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="bookings" stroke="#047857" strokeWidth={2} /></LineChart></ResponsiveContainer></Chart>
      <Chart title="Payment and refund volume"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.finance.paymentTrend.map((row) => ({ date: dateLabel(row.bucket), payments: row.amountPaisa, refunds: data.finance.refundTrend.find((item) => item.bucket === row.bucket)?.amountPaisa ?? 0 }))}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => formatBDTFromPaisa(Number(value ?? 0))} /><Legend /><Bar dataKey="payments" fill="#047857" /><Bar dataKey="refunds" fill="#dc2626" /></BarChart></ResponsiveContainer></Chart>
      <Chart title="Account and Property growth"><ResponsiveContainer width="100%" height="100%"><LineChart data={growth}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Legend /><Line type="monotone" dataKey="users" stroke="#0f766e" /><Line type="monotone" dataKey="providers" stroke="#b45309" /><Line type="monotone" dataKey="properties" stroke="#7c3aed" /></LineChart></ResponsiveContainer></Chart>
      <Chart title="Parking session activity"><ResponsiveContainer width="100%" height="100%"><BarChart data={occupancy}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Legend /><Bar dataKey="checkIns" fill="#0369a1" /><Bar dataKey="completed" fill="#16a34a" /></BarChart></ResponsiveContainer></Chart>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Peak check-in windows</h2>{peakHours.length ? <div className="divide-y divide-slate-100">{peakHours.map((row) => <div key={`${row.dayOfWeek}-${row.hour}`} className="flex justify-between px-4 py-3 text-xs"><span>{DAY_NAMES[row.dayOfWeek]} · {String(row.hour).padStart(2, "0")}:00</span><strong>{row.checkIns.toLocaleString("en-BD")} check-ins</strong></div>)}</div> : <p className="p-4 text-sm text-slate-500">No check-in activity in this range.</p>}</div>
      <div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Resource-type activity</h2><div className="divide-y divide-slate-100">{data.occupancy.byResourceType.map((row) => <div key={row.resourceType} className="grid grid-cols-3 px-4 py-3 text-xs"><strong>{row.resourceType.replaceAll("_", " ")}</strong><span>{row.checkIns.toLocaleString("en-BD")} check-ins</span><span>{row.distinctResources.toLocaleString("en-BD")} resources</span></div>)}</div></div>
    </section>
  </div>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return <article className="bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div><Icon className="size-4 text-emerald-700" /></div></article>;
}

function Chart({ title, children }: { title: string; children: ReactNode }) {
  return <div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">{title}</h2><div className="h-72 p-3">{children}</div></div>;
}
