"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, ClipboardPaste, Keyboard, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuardCameraScanner } from "./guard-camera-scanner";
import { guardMarketplaceApi } from "@/lib/api/guard-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { GuardCredentialResult } from "@/lib/api/marketplace-types";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export function GuardScanView() {
  const router = useRouter();
  const client = useQueryClient();
  const [credential, setCredential] = useState("");
  const [verified, setVerified] = useState<GuardCredentialResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const verify = useMutation({
    mutationFn: (value: string) => guardMarketplaceApi.verify(value),
    onSuccess: (result) => setVerified(result),
  });
  const checkin = useMutation({
    mutationFn: () => verified?.purpose === "EXIT" ? guardMarketplaceApi.checkOut(verified.booking.id, credential.trim()) : guardMarketplaceApi.checkIn(verified!.booking.id, credential.trim()),
    onSuccess: async (booking) => {
      setConfirmOpen(false);
      await client.invalidateQueries({ queryKey: queryKeys.bookings.root });
      router.push(`/guard/bookings/${booking.id}/active`);
    },
  });

  const verifyCredential = useCallback((value: string) => {
    const normalized = value.trim();
    if (!normalized || verify.isPending) return;
    setCredential(normalized);
    setVerified(null);
    verify.mutate(normalized);
  }, [verify]);

  const reset = () => {
    verify.reset();
    checkin.reset();
    setCredential("");
    setVerified(null);
    setConfirmOpen(false);
  };

  if (verified) {
    const booking = verified.booking;
    const parking = booking.parkingSpot.resourceType === "SHARED_POOL" ? "Shared parking area" : booking.parkingSpot.displayName ?? booking.parkingSpot.spotCode ?? "Fixed space";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="guard-panel overflow-hidden" aria-live="polite">
          <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-8 text-center sm:px-8">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-200 text-emerald-950"><CheckCircle2 className="size-8" aria-hidden="true" /></span>
            <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-800">Server verified</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-950">Booking is valid</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{verified.purpose === "EXIT" ? "Match the registration plate and confirm the vehicle has left before completing checkout." : "Match the driver, registration plate and assigned parking space before allowing entry."}</p>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl bg-[#111a2b] p-6 text-white">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Assigned space</p><p className="mt-3 text-5xl font-semibold tracking-[-0.06em] text-emerald-200">{booking.parkingSpot.spotCode ?? booking.parkingSpot.displayName ?? "AREA"}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide">Expected</span></div>
              <p className="mt-5 text-sm text-white/65">{booking.property.name}</p><p className="mt-1 text-xs text-white/40">{booking.property.publicArea}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Booking" value={booking.bookingCode} />
              <Info label="Arrival" value={formatDateTime(booking.startAt)} />
              <Info label="Driver" value={booking.driver.fullName} />
              <Info label="Parking" value={parking} />
              <div className="rounded-2xl border border-[var(--guard-line)] bg-slate-50 p-4 sm:col-span-2"><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500">Vehicle registration</dt><dd className="mt-2 text-xl font-bold tracking-[0.08em] text-slate-950">{booking.vehicle.registrationNumber}</dd><p className="mt-1 text-xs text-slate-500">{[booking.vehicle.color, booking.vehicle.brand, booking.vehicle.model, vehicleLabels[booking.vehicle.vehicleType]].filter(Boolean).join(" · ")}</p></div>
            </dl>
          </div>

          <div className="border-t border-[var(--guard-line)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
            <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"><RotateCcw className="size-4" aria-hidden="true" />Scan another code</button>
            <Button type="button" size="lg" onClick={() => setConfirmOpen(true)} className="mt-3 min-h-12 w-full px-5 sm:mt-0 sm:w-auto"><ShieldCheck className="size-5" />{verified.purpose === "EXIT" ? "Continue to checkout" : "Continue to check-in"} <ArrowRight className="size-4" /></Button>
          </div>
        </section>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="max-w-md p-5">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-emerald-100 text-emerald-900"><ShieldCheck className="size-6" /></AlertDialogMedia>
              <AlertDialogTitle>{verified.purpose === "EXIT" ? "Confirm vehicle exit" : "Confirm vehicle entry"}</AlertDialogTitle>
              <AlertDialogDescription>{verified.purpose === "EXIT" ? "Confirm only after checking the registration and physical vehicle exit." : `Confirm only after the vehicle and driver are physically present at ${booking.property.name}. This records the server check-in time.`}</AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <CheckItem>Registration plate matches {booking.vehicle.registrationNumber}</CheckItem>
              <CheckItem>Driver identity and booking details match</CheckItem>
              <CheckItem>{verified.purpose === "EXIT" ? "Vehicle has left the parking space" : `Assigned space ${booking.parkingSpot.spotCode ?? parking} is ready`}</CheckItem>
            </ul>
            {checkin.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{getApiErrorMessage(checkin.error)}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={checkin.isPending}>Review again</AlertDialogCancel>
              <AlertDialogAction disabled={checkin.isPending} onClick={() => checkin.mutate()} className="min-h-10 bg-emerald-900 text-white hover:bg-emerald-800">{checkin.isPending ? <><Loader2 className="size-4 animate-spin" />{verified.purpose === "EXIT" ? "Checking out…" : "Checking in…"}</> : <><Check className="size-4" />{verified.purpose === "EXIT" ? "Confirm checkout" : "Confirm check-in"}</>}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const error = verify.error;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Secure entry</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Verify the driver’s booking</h1><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Use the rear camera for the fastest check. ParkEase verifies the credential, property membership and provider assignment on the server.</p></header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <GuardCameraScanner onScan={verifyCredential} disabled={verify.isPending} />
        <div className="space-y-5">
          <section className="guard-panel p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-800"><Keyboard className="size-5" aria-hidden="true" /></span><div><h2 className="font-bold">Enter credential manually</h2><p className="text-xs text-slate-500">Use this when the camera cannot read the code.</p></div></div>
            <form noValidate className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); verifyCredential(credential); }}>
              <label htmlFor="guard-credential" className="block text-sm font-semibold text-slate-800">Booking access credential</label>
              <div className="relative"><Input id="guard-credential" value={credential} onChange={(event) => { setCredential(event.target.value); verify.reset(); }} autoComplete="off" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? "guard-credential-error" : "guard-credential-help"} className="min-h-12 bg-slate-50 pr-11 font-mono text-sm" placeholder="Paste the code from the driver’s pass" /><ClipboardPaste className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></div>
              <p id="guard-credential-help" className="text-xs leading-5 text-slate-500">Enter the complete one-time credential shown in the driver’s active booking.</p>
              {error && <p id="guard-credential-error" role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800">{getApiErrorMessage(error)} <button type="button" onClick={() => verify.reset()} className="font-bold underline underline-offset-2">Try again</button></p>}
              <Button type="submit" size="lg" disabled={credential.trim().length < 32 || verify.isPending} className="min-h-12 w-full">{verify.isPending ? <><Loader2 className="size-4 animate-spin" />Verifying credential…</> : <><ShieldCheck className="size-4" />Verify credential</>}</Button>
            </form>
          </section>
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5"><h2 className="text-sm font-bold text-indigo-950">Before allowing entry</h2><ol className="mt-3 space-y-2 text-xs leading-5 text-indigo-950/70"><li>1. Scan only the credential inside the driver’s ParkEase booking.</li><li>2. Match the registration plate and vehicle details.</li><li>3. Confirm check-in only after the vehicle is physically at the gate.</li></ol></section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[var(--guard-line)] p-4"><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1.5 text-sm font-semibold text-slate-950">{value}</dd></div>;
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{children}</li>;
}
