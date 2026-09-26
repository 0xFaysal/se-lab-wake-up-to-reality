"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type Scope = "driver" | "provider";

export function DisputeHistory({ scope }: { scope: Scope }) {
  const query = useQuery({
    queryKey: scope === "driver" ? queryKeys.disputes.driver() : queryKeys.disputes.provider(),
    queryFn: () => scope === "driver" ? bookingsApi.driverDisputes() : bookingsApi.providerDisputes(),
  });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getApiErrorMessage(query.error)}</p>;
  const base = scope === "driver" ? "/driver/disputes" : "/provider/disputes";
  return <div className="max-w-3xl space-y-5"><div><h1 className="text-3xl font-extrabold">Disputes</h1><p className="mt-1 text-sm text-slate-500">Booking disputes visible within your account scope.</p></div><div className="divide-y overflow-hidden rounded-lg border bg-white">{query.data.disputes.map((dispute) => <Link href={`${base}/${dispute.id}`} key={dispute.id} className="block p-4 hover:bg-slate-50"><div className="flex justify-between gap-4"><div><strong>{dispute.booking?.bookingCode ?? dispute.bookingId}</strong><p className="mt-1 text-xs text-slate-500">{dispute.booking?.property?.name} · {dispute.category.replaceAll("_", " ")} · {formatDateTime(dispute.createdAt)}</p></div><span className="text-xs font-bold">{dispute.status.replaceAll("_", " ")}</span></div></Link>)}{query.data.disputes.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No disputes yet.</p>}</div></div>;
}

export function DisputeDetail({ scope, disputeId }: { scope: Scope; disputeId: string }) {
  const query = useQuery({
    queryKey: queryKeys.disputes.detail(scope, disputeId),
    queryFn: () => scope === "driver" ? bookingsApi.driverDispute(disputeId) : bookingsApi.providerDispute(disputeId),
  });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{getApiErrorMessage(query.error)}</p>;
  const dispute = query.data;
  const back = scope === "driver" ? "/driver/disputes" : "/provider/disputes";
  return <div className="max-w-3xl space-y-5"><Link href={back} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Disputes</Link><div><h1 className="text-3xl font-extrabold">Dispute detail</h1><p className="mt-1 font-mono text-xs text-slate-500">{dispute.id}</p></div><section className="grid gap-4 rounded-lg border bg-white p-6 sm:grid-cols-2"><Info label="Status" value={dispute.status.replaceAll("_", " ")} /><Info label="Category" value={dispute.category.replaceAll("_", " ")} /><Info label="Booking" value={dispute.booking?.bookingCode ?? dispute.bookingId} /><Info label="Property" value={dispute.booking?.property?.name ?? "Unavailable"} /><Info label="Opened by" value={dispute.openedBy?.fullName ?? "Account user"} /><Info label="Opened" value={formatDateTime(dispute.createdAt)} /><div className="sm:col-span-2"><Info label="Description" value={dispute.description} /></div>{dispute.resolution && <div className="sm:col-span-2"><Info label="Resolution" value={dispute.resolution} /></div>}</section>{dispute.evidence && dispute.evidence.length > 0 && <section><h2 className="mb-3 font-bold">Evidence</h2><div className="space-y-2">{dispute.evidence.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-lg border bg-white p-3 text-sm font-semibold text-emerald-800 hover:bg-slate-50">{item.type}</a>)}</div></section>}</div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</p></div>; }
