"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CarFront, CheckCircle2, Clock3, Loader2, LogOut, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button as CanonicalButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { bookingGraceTimes, overtimePolicyText } from "@/lib/booking-grace";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export function GuardActiveSessionView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitCredential, setExitCredential] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const booking = useQuery({
    queryKey: queryKeys.bookings.guardDetail(bookingId),
    queryFn: () => guardMarketplaceApi.booking(bookingId),
    refetchInterval: 60_000,
  });
  const checkout = useMutation({
    mutationFn: () => guardMarketplaceApi.checkOut(bookingId, exitCredential.trim() || undefined),
    onSuccess: async () => {
      setConfirmOpen(false);
      await client.invalidateQueries({ queryKey: queryKeys.bookings.root });
    },
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (booking.isPending) return <SessionSkeleton />;
  if (booking.isError) return <section className="guard-panel mx-auto max-w-xl p-8 text-center" role="alert"><AlertTriangle className="mx-auto size-9 text-red-700" /><h1 className="mt-4 text-xl font-bold">Session could not be loaded</h1><p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(booking.error)}</p><CanonicalButton type="button" variant="outline" className="mt-5 min-h-11" onClick={() => booking.refetch()}><RefreshCw className="size-4" />Retry</CanonicalButton></section>;

  const item = booking.data;
  const elapsedMinutes = item.checkedInAt ? Math.max(0, Math.floor((now - new Date(item.checkedInAt).getTime()) / 60_000)) : null;
  const elapsed = elapsedMinutes === null ? "—" : `${Math.floor(elapsedMinutes / 60) > 0 ? `${Math.floor(elapsedMinutes / 60)}h ` : ""}${elapsedMinutes % 60}m`;
  const slot = item.parkingSpot.spotCode ?? item.parkingSpot.displayName ?? "Parking area";
  const checkoutRequested = item.status === "CHECKOUT_REQUESTED";

  if (checkout.data) {
    return (
      <section className="guard-panel mx-auto max-w-2xl overflow-hidden text-center" aria-live="polite">
        <div className="bg-emerald-50 px-6 py-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-200 text-emerald-950"><CheckCircle2 className="size-8" /></span><p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-800">Gate action recorded</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-950">Vehicle checked out</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">The vehicle exit time is saved and the parking space is released. Financial settlement continues securely outside the Guard portal.</p></div>
        <div className="grid gap-3 p-6 sm:grid-cols-2"><CanonicalButton type="button" size="lg" className="min-h-12" onClick={() => router.push("/guard/scan")}>Scan next booking <ArrowRight className="size-4" /></CanonicalButton><CanonicalButton render={<Link href="/guard/bookings" />} size="lg" variant="outline" className="min-h-12">Return to bookings</CanonicalButton></div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Live parking session</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{item.driver.fullName}</h1><p className="mt-2 text-sm text-slate-500">Booking {item.bookingCode}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${checkoutRequested ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}><span className={`size-2 rounded-full ${checkoutRequested ? "bg-amber-600" : "bg-emerald-600 motion-safe:animate-pulse"}`} />{checkoutRequested ? "Checkout requested" : "Currently parked"}</span></header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section className="overflow-hidden rounded-3xl bg-[var(--guard-ink)] p-6 text-white shadow-[0_24px_70px_rgba(6,63,50,0.16)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/70">Assigned parking</p><p className="mt-4 text-6xl font-semibold tracking-[-0.07em] text-emerald-200 sm:text-7xl">{slot}</p><p className="mt-4 flex items-center gap-2 text-sm text-white/65"><MapPin className="size-4" />{item.property.name} · {item.property.publicArea}</p>
          <div className="mt-8 grid grid-cols-2 gap-3"><SessionMetric label="Time parked" value={elapsed} icon={Clock3} /><SessionMetric label="Expected exit" value={new Intl.DateTimeFormat("en-BD", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(new Date(item.scheduledEndAt))} icon={LogOut} /></div>
        </section>

        <section className="guard-panel p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-800"><CarFront className="size-5" /></span><div><h2 className="font-bold">Vehicle at the gate</h2><p className="text-xs text-slate-500">Confirm these details before exit</p></div></div>
          <dl className="mt-6 space-y-4"><Detail label="Registration" value={item.vehicle.registrationNumber} prominent /><Detail label="Vehicle" value={[item.vehicle.color, item.vehicle.brand, item.vehicle.model, vehicleLabels[item.vehicle.vehicleType]].filter(Boolean).join(" · ")} /><Detail label="Checked in" value={item.checkedInAt ? formatDateTime(item.checkedInAt) : "Check-in time unavailable"} /><Detail label="Free exit until" value={formatDateTime(bookingGraceTimes(item.startAt, item.scheduledEndAt, item.overtimeGracePeriodMinutes).freeExitUntil)} /></dl><p className="mt-4 text-xs leading-5 text-slate-600">{overtimePolicyText(item.overtimePolicyVersion, item.overtimeGracePeriodMinutes)}</p>
        </section>
      </div>

      <section className={`rounded-2xl border p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6 ${checkoutRequested ? "border-amber-300 bg-amber-50" : "border-[var(--guard-line)] bg-white"}`}>
        <div><h2 className="font-bold">{checkoutRequested ? "Driver is ready to leave" : "Vehicle ready to leave?"}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Confirm checkout only after the registration matches and the vehicle has physically crossed the exit gate.</p></div>
        <CanonicalButton type="button" size="lg" onClick={() => setConfirmOpen(true)} className="mt-4 min-h-12 w-full px-5 sm:mt-0 sm:w-auto"><LogOut className="size-5" />Confirm vehicle exit</CanonicalButton>
      </section>

      <Link href="mailto:support@parkease.bd?subject=Guard%20incident%20for%20booking%20${encodeURIComponent(item.bookingCode)}" className="mx-auto flex w-fit min-h-11 items-center rounded-lg px-3 text-sm font-bold text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800">Report an operational issue</Link>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md p-5">
          <AlertDialogHeader><AlertDialogMedia className="bg-amber-100 text-amber-900"><LogOut className="size-6" /></AlertDialogMedia><AlertDialogTitle>Confirm physical vehicle exit</AlertDialogTitle><AlertDialogDescription>This records the actual checkout time and releases {slot}. This action cannot be undone by the Guard.</AlertDialogDescription></AlertDialogHeader>
          <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold tracking-[0.08em] text-slate-950">{item.vehicle.registrationNumber}</p><p className="mt-1 text-sm text-slate-600">{item.driver.fullName} · {slot}</p></div>
          {checkout.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{getApiErrorMessage(checkout.error)}</p>}
          {checkoutRequested && <label className="grid gap-2 text-sm font-semibold">Driver exit pass<Input value={exitCredential} onChange={(event) => setExitCredential(event.target.value)} autoComplete="off" placeholder="EXIT-…" /></label>}
          <AlertDialogFooter><AlertDialogCancel disabled={checkout.isPending}>Vehicle still inside</AlertDialogCancel><AlertDialogAction disabled={checkout.isPending} onClick={() => checkout.mutate()} className="min-h-10 bg-emerald-900 text-white hover:bg-emerald-800">{checkout.isPending ? <><Loader2 className="size-4 animate-spin" />Finalizing session…</> : <><ShieldCheck className="size-4" />Vehicle has exited</>}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock3 }) { return <div className="rounded-2xl bg-white/8 p-4"><Icon className="size-4 text-emerald-200" /><p className="mt-3 text-[0.68rem] font-bold uppercase tracking-wide text-white/40">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>; }
function Detail({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) { return <div className="border-b border-[var(--guard-line)] pb-4 last:border-0 last:pb-0"><dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className={prominent ? "mt-1 text-lg font-bold tracking-[0.08em] text-slate-950" : "mt-1 text-sm font-semibold text-slate-800"}>{value}</dd></div>; }
function SessionSkeleton() { return <div className="mx-auto max-w-5xl space-y-6" aria-busy="true"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-emerald-950/10" /><div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" /></div></div>; }
