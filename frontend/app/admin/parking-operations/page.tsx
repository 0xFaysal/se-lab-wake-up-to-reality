"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CarFront, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";

export default function AdminParkingOperationsPage() {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const overview = useQuery({ queryKey: ["admin", "parking-operations"], queryFn: adminOperationsApi.parkingOperations, refetchInterval: 60_000 });
  const vehicles = useQuery({ queryKey: ["admin", "parking-operations", "vehicle-search", vehicleSearch], queryFn: () => adminOperationsApi.vehicleSearch(vehicleSearch), enabled: vehicleSearch.length >= 2 });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setVehicleSearch(String(form.get("registration") ?? "").trim());
  }

  if (overview.isPending) return <div className="space-y-4"><div className="h-20 animate-pulse bg-slate-200" /><div className="h-72 animate-pulse bg-slate-200" /></div>;
  if (overview.isError) return <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Unable to load parking operations</strong><span>{getApiErrorMessage(overview.error)}</span><Button variant="outline" size="sm" className="mt-3" onClick={() => overview.refetch()}>Retry</Button></div>;
  const data = overview.data;

  return <div className="space-y-7">
    <AdminPageHeader eyebrow="Operations" title="Live parking operations" description={`Read-only operational snapshot generated ${formatDateTime(data.generatedAt)}. Refreshes every minute.`} action={<Button variant="outline" size="sm" onClick={() => overview.refetch()} disabled={overview.isFetching}><RefreshCw className={`size-4 ${overview.isFetching ? "animate-spin" : ""}`} />Refresh</Button>} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Properties monitored" value={data.properties.length} icon={CarFront} />
      <Metric label="Active vehicles" value={data.activeVehicles.length} icon={CarFront} />
      <Metric label="Overstay alerts" value={data.overstays.length} icon={AlertTriangle} danger={data.overstays.length > 0} />
      <Metric label="Coverage gaps" value={data.properties.filter((property) => property.guardCoverageGap).length} icon={ShieldCheck} danger={data.properties.some((property) => property.guardCoverageGap)} />
    </section>

    <section><h2 className="mb-3 text-sm font-bold">Property occupancy</h2>{data.properties.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.properties.map((property) => <article key={property.id} className="border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/admin/properties/${property.id}`} className="font-bold text-emerald-800 hover:underline">{property.name}</Link><p className="text-xs text-slate-500">{property.publicArea}</p></div><AdminStatus value={property.status} /></div><div className="mt-4 grid grid-cols-4 gap-2 text-center"><SmallMetric label="Capacity" value={property.capacity} /><SmallMetric label="Occupied" value={property.occupied} /><SmallMetric label="Reserved" value={property.reserved} /><SmallMetric label="Available" value={property.available} /></div><div className="mt-4 h-2 bg-slate-100"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, property.utilizationPercent)}%` }} /></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{property.utilizationPercent}% occupied</span><span className={property.guardCoverageGap ? "font-bold text-red-700" : "text-emerald-700"}>{property.guardCoverageGap ? "Guard coverage gap" : `${property.activeGuards} active Guard members`}</span></div>{property.temporaryClosureReason && <p className="mt-3 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">{property.temporaryClosureReason}{property.temporaryClosedUntil ? ` · until ${formatDateTime(property.temporaryClosedUntil)}` : ""}</p>}</article>)}</div> : <AdminEmptyState title="No Properties to monitor" description="Active parking Properties will appear here." />}</section>

    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Active vehicles</h2>{data.activeVehicles.length ? <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">{data.activeVehicles.map((booking) => <div key={booking.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1fr_1fr_auto]"><div><strong>{booking.vehicle.registrationNumber}</strong><p className="text-slate-500">{booking.vehicle.vehicleType} · {booking.driver.fullName}</p></div><div><Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-emerald-800 hover:underline">{booking.bookingCode}</Link><p className="text-slate-500">{booking.property.name}</p></div><div className="text-right"><AdminStatus value={booking.status} />{booking.overdue && <p className="mt-1 font-bold text-red-700">{booking.overtimeMinutes} min overdue</p>}</div></div>)}</div> : <p className="p-5 text-sm text-slate-500">No confirmed or active vehicles right now.</p>}</div>
      <div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Entry / exit activity</h2>{data.entryExitLog.length ? <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">{data.entryExitLog.map((event) => <div key={event.id} className="px-4 py-3 text-xs"><div className="flex justify-between gap-3"><strong>{event.eventType.replaceAll("_", " ")}</strong><time className="text-slate-400">{formatDateTime(event.createdAt)}</time></div><p className="mt-1 text-slate-500">{event.property?.name ?? "Unknown Property"} · {event.actor?.fullName ?? "System"}</p></div>)}</div> : <p className="p-5 text-sm text-slate-500">No recent check-in or checkout events.</p>}</div>
    </section>

    <section className="border border-slate-200 bg-white p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-sm font-bold">Vehicle lookup</h2><p className="text-xs text-slate-500">Search only current confirmed or active parking activity.</p></div><form onSubmit={search} className="flex gap-2 sm:w-[420px]"><Input name="registration" minLength={2} maxLength={50} placeholder="Registration number" /><Button type="submit"><Search className="size-4" />Search</Button></form></div>{vehicles.isFetching && <p className="mt-4 text-xs text-slate-500">Searching current vehicles…</p>}{vehicles.isError && <p role="alert" className="mt-4 text-xs text-red-700">{getApiErrorMessage(vehicles.error)}</p>}{vehicles.data && <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{vehicles.data.length ? vehicles.data.map((vehicle) => <div key={String(vehicle.id)} className="py-3 text-xs"><strong>{String(vehicle.registrationNumber)}</strong><span className="ml-2 text-slate-500">{String((vehicle.owner as Record<string, unknown>)?.fullName ?? "Unknown driver")}</span></div>) : <p className="py-4 text-slate-500">No current parking activity matches that registration.</p>}</div>}</section>

    <section><h2 className="mb-3 text-sm font-bold">Shared-pool capacity</h2>{data.sharedPools.length ? <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Pool</th><th className="px-4 py-3">Property</th><th className="px-4 py-3">Physical</th><th className="px-4 py-3">Entitlement</th><th className="px-4 py-3">Held</th><th className="px-4 py-3">Booked</th><th className="px-4 py-3">Checked in</th><th className="px-4 py-3">Remaining</th></tr></thead><tbody className="divide-y divide-slate-100">{data.sharedPools.map((pool) => <tr key={pool.id}><td className="px-4 py-3 font-bold">{pool.displayName ?? pool.id}</td><td className="px-4 py-3">{pool.property.name}</td><td className="px-4 py-3">{pool.capacity}</td><td className="px-4 py-3">{pool.verifiedEntitlement}</td><td className="px-4 py-3">{pool.held}</td><td className="px-4 py-3">{pool.booked}</td><td className="px-4 py-3">{pool.checkedIn}</td><td className="px-4 py-3 font-bold">{pool.remaining}</td></tr>)}</tbody></table></div> : <AdminEmptyState title="No shared pools configured" description="Shared-pool entitlement and allocation pressure will appear here." />}</section>
  </div>;
}

function Metric({ label, value, icon: Icon, danger = false }: { label: string; value: number; icon: typeof CarFront; danger?: boolean }) {
  return <article className="border border-slate-200 bg-white p-4"><div className="flex justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><strong className={`mt-2 block text-3xl ${danger ? "text-red-700" : ""}`}>{value.toLocaleString("en-BD")}</strong></div><Icon className={`size-5 ${danger ? "text-red-600" : "text-emerald-700"}`} /></div></article>;
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return <div><strong className="block text-lg">{value}</strong><span className="text-[10px] text-slate-500">{label}</span></div>;
}
