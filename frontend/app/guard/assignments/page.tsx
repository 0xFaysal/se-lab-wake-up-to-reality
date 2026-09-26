"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Check, Clock3, Info, Loader2, MapPin, RefreshCw, ShieldCheck, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { guardApi } from "@/lib/api/guard-api";
import type { GuardAssignmentDto, PropertyGuardMembershipDto } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatTime, guardStatus } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function GuardAssignmentsPage() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<GuardAssignmentDto | null>(null);
  const [declineTarget, setDeclineTarget] = useState<PropertyGuardMembershipDto | null>(null);
  const memberships = useQuery({ queryKey: queryKeys.guardMemberships.all({ limit: 100 }), queryFn: () => guardApi.listMemberships({ limit: 100 }) });
  const assignments = useQuery({ queryKey: queryKeys.guardAssignments.all({ limit: 100 }), queryFn: () => guardApi.listForGuard({ limit: 100 }) });
  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => accept ? guardApi.accept(id) : guardApi.reject(id),
    onSuccess: async (_result, variables) => {
      setDeclineTarget(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.guardMemberships.root }),
        client.invalidateQueries({ queryKey: queryKeys.guardAssignments.root }),
      ]);
      toast.success(variables.accept ? "Property invitation accepted. The Provider can now assign your shift." : "Property invitation declined.");
    },
  });

  if (memberships.isPending || assignments.isPending) return <AssignmentsSkeleton />;
  if (memberships.isError || assignments.isError) return <section className="guard-panel mx-auto max-w-xl p-8 text-center" role="alert"><h1 className="text-xl font-bold">Assignments could not be loaded</h1><p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(memberships.error ?? assignments.error)}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void Promise.all([memberships.refetch(), assignments.refetch()])}><RefreshCw className="size-4" />Retry</Button></section>;

  const pending = memberships.data.memberships.filter((item) => item.status === "PENDING_ACCEPTANCE");
  const acceptedWithoutShift = memberships.data.memberships.filter((membership) => membership.status === "ACTIVE" && !assignments.data.assignments.some((assignment) => assignment.status === "ACTIVE" && assignment.property.id === membership.property.id));
  const active = assignments.data.assignments.filter((item) => item.status === "ACTIVE");
  const inactive = assignments.data.assignments.filter((item) => item.status !== "ACTIVE");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Authorized scope</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Property assignments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Property membership and a provider assignment are both required before you can operate a booking.</p></header>

      {pending.length > 0 && <section aria-labelledby="pending-heading"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500 motion-safe:animate-pulse" /><h2 id="pending-heading" className="text-lg font-bold">Pending invitations</h2></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{pending.map((item) => <article key={item.id} className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-800 shadow-sm"><Building2 className="size-5" /></span><div><h3 className="font-bold text-slate-950">{item.property.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="size-3.5" />{item.property.publicArea}</p><p className="mt-2 text-xs text-slate-500">Invited {formatDateTime(item.invitedAt)}</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><Button type="button" size="lg" disabled={respond.isPending} onClick={() => respond.mutate({ id: item.id, accept: true })} className="min-h-11">{respond.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Accept</Button><Button type="button" size="lg" variant="outline" disabled={respond.isPending} onClick={() => setDeclineTarget(item)} className="min-h-11"><X className="size-4" />Decline</Button></div></article>)}</div></section>}

      {acceptedWithoutShift.length > 0 && <section aria-labelledby="accepted-heading"><div><h2 id="accepted-heading" className="text-lg font-bold">Accepted Properties</h2><p className="mt-1 text-sm text-slate-500">Your membership is ready. The Provider still needs to activate your working shift.</p></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{acceptedWithoutShift.map((item) => <article key={item.id} className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-800 shadow-sm"><Building2 className="size-5" /></span><span className="rounded-full bg-sky-100 px-2.5 py-1 text-[0.65rem] font-bold text-sky-900">WAITING FOR SHIFT</span></div><h3 className="mt-5 font-bold text-slate-950">{item.property.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="size-3.5" />{item.property.publicArea}</p><p className="mt-4 text-sm leading-6 text-sky-950/75">No action is needed from you. Ask the Provider to assign an active shift.</p></article>)}</div></section>}

      <section aria-labelledby="active-heading"><div><h2 id="active-heading" className="text-lg font-bold">Active provider shifts</h2><p className="mt-1 text-sm text-slate-500">These assignments define which provider bookings you can operate at each property.</p></div>{active.length === 0 ? <div className="guard-panel mt-4 px-6 py-12 text-center"><ShieldCheck className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-bold">No active shifts</h3><p className="mt-1 text-sm text-slate-500">A provider must assign you after the property invitation is accepted.</p></div> : <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.map((item) => <AssignmentCard key={item.id} item={item} onOpen={() => setSelected(item)} />)}</div>}</section>

      {inactive.length > 0 && <section aria-labelledby="history-heading"><h2 id="history-heading" className="text-lg font-bold">Assignment history</h2><div className="guard-panel mt-4 divide-y divide-[var(--guard-line)]">{inactive.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item)} className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-800"><span><strong className="text-sm">{item.property.name}</strong><span className="mt-1 block text-xs text-slate-500">{item.provider?.fullName ?? "Property provider"}</span></span><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${guardStatus[item.status].className}`}>{guardStatus[item.status].label}</span></button>)}</div></section>}

      {respond.isError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(respond.error)}</p>}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md p-5"><DialogHeader><DialogTitle>Assignment details</DialogTitle><DialogDescription>Server-authorized property and provider operating scope.</DialogDescription></DialogHeader>{selected && <dl className="space-y-4 rounded-xl bg-slate-50 p-4"><Detail label="Property" value={selected.property.name} /><Detail label="Provider" value={selected.provider?.fullName ?? "Property provider"} /><Detail label="Shift" value={selected.shiftStart && selected.shiftEnd ? `${formatTime(selected.shiftStart)} to ${formatTime(selected.shiftEnd)}` : "No shift window configured"} /><Detail label="Status" value={guardStatus[selected.status].label} /></dl>}<DialogFooter><Button type="button" variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(declineTarget)} onOpenChange={(open) => !open && setDeclineTarget(null)}>
        <AlertDialogContent className="max-w-sm p-5"><AlertDialogHeader><AlertDialogMedia className="bg-amber-100 text-amber-900"><Info className="size-6" /></AlertDialogMedia><AlertDialogTitle>Decline property invitation?</AlertDialogTitle><AlertDialogDescription>You will not be able to operate bookings at {declineTarget?.property.name}. The provider can invite you again later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={respond.isPending}>Keep invitation</AlertDialogCancel><AlertDialogAction disabled={respond.isPending} onClick={() => declineTarget && respond.mutate({ id: declineTarget.id, accept: false })} className="bg-amber-600 text-white hover:bg-amber-700">{respond.isPending ? <><Loader2 className="size-4 animate-spin" />Declining…</> : "Decline invitation"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AssignmentCard({ item, onOpen }: { item: GuardAssignmentDto; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="guard-panel block min-h-52 w-full p-5 text-left transition-colors hover:border-emerald-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><Building2 className="size-5" /></span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-900">ACTIVE</span></div><h3 className="mt-5 font-bold text-slate-950">{item.property.name}</h3><p className="mt-1 text-xs text-slate-500">Provider: {item.provider?.fullName ?? "Property provider"}</p><p className="mt-5 flex items-center gap-2 border-t border-[var(--guard-line)] pt-4 text-sm font-semibold text-slate-700"><Clock3 className="size-4 text-emerald-700" />{item.shiftStart && item.shiftEnd ? `${formatTime(item.shiftStart)} – ${formatTime(item.shiftEnd)}` : "No shift window configured"}</p></button>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd></div>; }
function AssignmentsSkeleton() { return <div className="mx-auto max-w-6xl space-y-6" aria-busy="true"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />)}</div></div>; }
