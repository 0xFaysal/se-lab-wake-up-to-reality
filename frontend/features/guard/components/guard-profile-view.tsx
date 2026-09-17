"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, Loader2, Lock, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { guardApi } from "@/lib/api/guard-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export function GuardProfileView() {
  const user = useCurrentUser();
  const assignments = useQuery({
    queryKey: queryKeys.guardAssignments.all(),
    queryFn: () => guardApi.listForGuard({ limit: 100 }),
  });

  if (user.isPending || assignments.isPending) {
    return <div className="py-24 text-center"><Loader2 className="mx-auto size-7 animate-spin" /><p className="mt-3 text-sm text-slate-500">Loading Guard profile</p></div>;
  }

  if (user.isError || assignments.isError) {
    return <div className="rounded-lg border bg-white p-8 text-center"><p className="text-sm text-red-700">{getApiErrorMessage(user.error ?? assignments.error)}</p><Button className="mt-4" variant="outline" onClick={() => void Promise.all([user.refetch(), assignments.refetch()])}>Retry</Button></div>;
  }

  const currentUser = user.data!;
  const activeAssignments = assignments.data.assignments.filter((item) => item.status === "ACTIVE");
  const initials = currentUser.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <div className="space-y-4 pb-28">
    <header><h1 className="text-2xl font-extrabold text-gray-900">Profile</h1><p className="mt-1 text-xs text-gray-500">Guard account and server-authorized assignments</p></header>
    <section className="rounded-xl border bg-white p-5"><div className="flex items-center gap-4"><div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-extrabold text-emerald-900">{initials}</div><div><h2 className="text-lg font-extrabold">{currentUser.fullName}</h2><div className="mt-1 flex flex-wrap gap-2"><span className="rounded bg-emerald-900 px-2 py-1 text-[10px] font-bold text-white">SECURITY GUARD</span><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold">{currentUser.status}</span></div></div></div><dl className="mt-5 space-y-3 border-t pt-4 text-xs"><Info label="Email" value={currentUser.email} /><Info label="Phone" value={currentUser.phone} /><Info label="Email verification" value={currentUser.emailVerified ? "Verified" : "Pending"} /></dl></section>
    <section className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-800" /><h2 className="font-bold">Active assignments</h2></div>{activeAssignments.length === 0 ? <p className="mt-4 text-sm text-slate-500">No active Provider assignment is currently available.</p> : <div className="mt-4 space-y-3">{activeAssignments.map((item) => <article key={item.id} className="rounded-lg bg-slate-50 p-4"><p className="flex items-center gap-2 font-semibold"><MapPin className="size-4" />{item.property.name}</p><p className="mt-1 text-xs text-slate-500">{item.property.publicArea ?? "Public area unavailable"}</p><p className="mt-3 flex items-center gap-2 text-xs"><Clock className="size-4" />{item.shiftStart && item.shiftEnd ? `${formatDateTime(item.shiftStart)} to ${formatDateTime(item.shiftEnd)}` : "No shift window configured"}</p>{item.provider && <p className="mt-2 text-xs text-slate-500">Assigned by {item.provider.fullName}</p>}</article>)}</div>}</section>
    <section className="rounded-xl border bg-white p-5"><h2 className="text-xs font-bold uppercase text-slate-500">Security</h2><div className="mt-2 divide-y text-sm"><Link href="/account/security" className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Lock className="size-4" />Change password</span><ChevronRight className="size-4" /></Link><Link href="/account/sessions" className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Smartphone className="size-4" />Active sessions</span><ChevronRight className="size-4" /></Link></div></section>
    <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">Guard access is enforced by active Property membership and Provider assignment on every operational request.</p>
    <LogoutButton className="w-full rounded-xl bg-red-100 py-3 text-xs font-bold text-red-700 hover:bg-red-200" />
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="break-all text-right font-semibold text-slate-900">{value}</dd></div>;
}
