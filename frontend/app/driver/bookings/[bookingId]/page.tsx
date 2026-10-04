"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, CheckCircle2, CircleDollarSign, Flag, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DigitalAccessPass } from "@/features/bookings/components/digital-access-pass";
import { BookingLocation } from "@/features/bookings/components/booking-location";
import { bookingsApi } from "@/lib/api/bookings-api";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { bookingGraceTimes, overtimePolicyText } from "@/lib/booking-grace";
import type { BookingDto, BookingSettlementDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa, formatDateTime, vehicleLabels } from "@/lib/formatters";
import { bookingStatus, paymentStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function BookingDetailsPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const client = useQueryClient();
  const cancellationKey = useRef(crypto.randomUUID());
  const settlementPaymentKey = useRef(crypto.randomUUID());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const query = useQuery({ queryKey: queryKeys.bookings.detail(bookingId), queryFn: () => bookingsApi.driverDetail(bookingId), refetchInterval: 30_000 });
  const preview = useQuery({ queryKey: ["booking-cancellation-preview", bookingId], queryFn: () => bookingsApi.cancellationPreview(bookingId), enabled: confirmCancel });
  const settlement = useQuery({ queryKey: ["booking-settlement", bookingId], queryFn: () => bookingsApi.settlement(bookingId), enabled: query.data?.status === "COMPLETED" || query.data?.status === "PAYMENT_DUE" || query.data?.status === "NO_SHOW" });

  const refresh = async () => {
    await Promise.all([
      query.refetch(),
      client.invalidateQueries({ queryKey: queryKeys.bookings.root }),
      client.invalidateQueries({ queryKey: queryKeys.wallet.current }),
      client.invalidateQueries({ queryKey: queryKeys.wallet.transactions() }),
    ]);
  };
  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId, { reason: cancelReason.trim() || undefined, idempotencyKey: cancellationKey.current }),
    onSuccess: async (data) => {
      toast.success("Booking cancelled and balance updated");
      cancellationKey.current = crypto.randomUUID();
      setCancelReason("");
      setConfirmCancel(false);
      if (data?.booking) {
        client.setQueryData(queryKeys.bookings.detail(bookingId), (old: BookingDto | undefined) => ({
          ...(old ?? {}),
          ...data.booking,
          status: "CANCELLED",
          canCancel: false,
          canPay: false,
        }));
      }
      await refresh();
      router.refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const checkout = useMutation({
    mutationFn: () => bookingsApi.requestCheckout(bookingId),
    onSuccess: async () => { toast.success("Checkout requested"); await refresh(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const paySettlement = useMutation({
    mutationFn: () => bookingsApi.createSettlementPaymentSession(bookingId, settlementPaymentKey.current),
    onSuccess: (session) => {
      if (session.checkoutUrl) window.location.assign(session.checkoutUrl);
      else { toast.success("Settlement completed from Refund Balance"); void refresh(); }
    },
    onError: (error) => { settlementPaymentKey.current = crypto.randomUUID(); toast.error(getApiErrorMessage(error)); },
  });
  const report = useMutation({
    mutationFn: () => parkingSearchApi.reportListing(booking.listingId, { reason: reportReason.trim(), details: reportDetails.trim() || undefined }),
    onSuccess: () => {
      toast.success("Report submitted to moderation team. Thank you.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (query.isPending) return <State text="Loading booking" loading />;
  if (query.isError) return <State text={getApiErrorMessage(query.error)} />;

  const booking = query.data;
  const status = bookingStatus[booking.status];
  const payment = booking.payments?.[0];

  const isSettlementEligible = ["COMPLETED", "PAYMENT_DUE", "NO_SHOW"].includes(booking.status);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
      <Link href="/driver/bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="size-4" />My bookings</Link>
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-700">Parking reservation</p>
          <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl font-extrabold sm:text-3xl">{booking.bookingCode}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div>
          <p className="mt-2 text-sm text-slate-500">Created {formatDateTime(booking.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {booking.canPay && <Button nativeButton={false} render={<Link href={`/driver/bookings/${booking.id}/payment`} />}>Complete payment</Button>}
          {booking.canCancel && <Button variant="destructive" onClick={() => setConfirmCancel(true)}>Cancel booking</Button>}
          {["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(booking.status) && <Button disabled={checkout.isPending} onClick={() => checkout.mutate()}>{checkout.isPending && <Loader2 className="size-4 animate-spin" />}{booking.status === "CHECKOUT_REQUESTED" ? "Refresh exit pass" : "Request checkout"}</Button>}
          {booking.status === "COMPLETED" && <><Button variant="outline" nativeButton={false} render={<Link href={`/driver/bookings/${booking.id}/review`} />}>Write review</Button><Button variant="outline" nativeButton={false} render={<Link href={`/driver/bookings/${booking.id}/dispute`} />}>Open dispute</Button></>}
          {booking.listingId && <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}><Flag className="size-4" />Report listing</Button>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="border bg-white p-6">
            <div className="mb-5 flex items-center gap-3"><CalendarClock className="size-5 text-emerald-700" /><h2 className="font-bold">Reservation details</h2></div>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Info label="Property" value={booking.property?.name ?? "Property"} />
              <Info label="Public address" value={booking.property?.approximateAddress ?? "Not available"} />
              {booking.property?.exactAddress && (
                <Info label="Exact address" value={booking.property.exactAddress} />
              )}
              {booking.property?.accessInstructions && (
                <Info label="Access instructions" value={booking.property.accessInstructions} />
              )}
              <Info label="Parking" value={parkingLabel(booking)} />
              <Info label="Vehicle" value={`${booking.vehicle?.registrationNumber ?? ""} · ${booking.vehicle ? vehicleLabels[booking.vehicle.vehicleType] : ""}`} />
              <Info label="Starts" value={formatDateTime(booking.startAt)} />
              <Info label="Scheduled end" value={formatDateTime(booking.scheduledEndAt)} />
              <Info label="Entry opens" value={formatDateTime(bookingGraceTimes(booking.startAt, booking.scheduledEndAt, booking.overtimeGracePeriodMinutes).entryOpensAt)} />
              <Info label="Free exit until" value={formatDateTime(bookingGraceTimes(booking.startAt, booking.scheduledEndAt, booking.overtimeGracePeriodMinutes).freeExitUntil)} />
              <Info label="Overtime policy" value={overtimePolicyText(booking.overtimePolicyVersion, booking.overtimeGracePeriodMinutes)} />
              {booking.checkedInAt && <Info label="Checked in" value={formatDateTime(booking.checkedInAt)} />}
              {booking.checkedOutAt && <Info label="Checked out" value={formatDateTime(booking.checkedOutAt)} />}
            </dl>
          </section>
          <BookingLocation booking={booking} />
          {booking.accessCredential && <DigitalAccessPass accessCredential={booking.accessCredential} propertyTitle={booking.property?.name} />}
          {booking.status === "CHECKOUT_REQUESTED" && checkout.data && <section className="border bg-white p-6"><h2 className="font-bold">Exit pass</h2><p className="mt-2 text-sm text-slate-600">Valid until {formatDateTime(checkout.data.exitCredentialExpiresAt)}</p><div className="mt-4 flex flex-col items-center gap-4"><QRCode value={checkout.data.exitCredential} size={180} /><code className="max-w-full break-all text-sm">{checkout.data.exitCredential}</code></div></section>}
          {isSettlementEligible && (settlement.isLoading || settlement.data) && (
            <SettlementSummary
              settlement={settlement.data}
              loading={settlement.isLoading}
              paying={paySettlement.isPending}
              noShow={booking.status === "NO_SHOW"}
              onPay={() => paySettlement.mutate()}
            />
          )}
        </div>

        <aside className="h-fit border bg-white p-6 lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3"><CircleDollarSign className="size-5 text-emerald-700" /><h2 className="font-bold">Payment summary</h2></div>
          <div className="space-y-3"><Price label="Parking" value={booking.baseAmountPaisa} /><Price label="Platform fee" value={booking.platformFeePaisa} /><Price label="Refundable deposit" value={booking.depositPaisa} /><Price label="Total" value={booking.totalAmountPaisa} strong /></div>
          <div className="mt-5 space-y-3 border-t pt-5">
            {payment?.status === "SUCCEEDED" || payment?.status === "CAPTURED" || ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED", "COMPLETED", "NO_SHOW"].includes(booking.status) ? (
              <>
                <Price label="Paid via Wallet Balance" value={booking.driverWalletAppliedPaisa} />
                <Price label="Paid via SSLCOMMERZ" value={booking.gatewayAmountPaisa} strong />
              </>
            ) : (
              <>
                <Price label="Wallet Balance auto-applied" value={booking.driverWalletAppliedPaisa} negative />
                <Price label="Amount due via SSLCOMMERZ" value={booking.gatewayAmountPaisa} strong />
              </>
            )}
          </div>
          {payment && <span className={`mt-5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${paymentStatus[payment.status].className}`}>{paymentStatus[payment.status].label}</span>}
          {payment && ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status) && <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">The previous gateway attempt did not complete. Your Refund Balance was released and will be applied automatically again when you retry. Only the remaining amount will be sent to SSLCOMMERZ.</p>}
          <div className="mt-5 flex gap-3 bg-emerald-50 p-4 text-sm text-emerald-950"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>{settlement.data?.status === "COMPLETED" ? "Settlement is complete. Any returned deposit or refund is recorded in your Refund Balance." : booking.status === "CANCELLED" ? "This reservation is cancelled. Check your Refund Balance for any credit due under the cancellation policy." : booking.status === "PAYMENT_PENDING" || booking.status === "EXPIRED" ? "Only a successfully confirmed payment funds this reservation." : "Your payment remains protected by ParkEase until the parking session is settled."}</p></div>
        </aside>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={(open) => !cancel.isPending && setConfirmCancel(open)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel {booking.bookingCode}?</AlertDialogTitle><AlertDialogDescription>The parking space will be released immediately. The cancellation policy is calculated from the booking start time.</AlertDialogDescription></AlertDialogHeader>
          {preview.isPending ? <div className="flex min-h-36 items-center justify-center"><Loader2 className="size-6 animate-spin text-emerald-700" /></div> : preview.isError ? <div role="alert" className="bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(preview.error)}</div> : preview.data ? <div className="space-y-4">
            {booking.status === "PAYMENT_PENDING" || !preview.data.paid ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Unpaid reservation</p>
                <p className="mt-1 text-xs text-amber-900/80">
                  No payment was collected for this reservation. Cancelling will immediately release the held parking space without any fees or charges.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 border bg-slate-50 p-4">
                  <Price label="Parking refund" value={preview.data.bookingRefundPaisa} />
                  <Price label="Deposit returned" value={preview.data.depositReturnPaisa} />
                  <Price label="Platform fee (non-refundable)" value={preview.data.platformFeePaisa} />
                  <Price label="Added to Refund Balance" value={preview.data.driverWalletCreditPaisa} strong />
                </div>
                <p className="flex gap-2 text-xs leading-5 text-slate-600"><Wallet className="mt-0.5 size-4 shrink-0 text-emerald-700" />The refundable amount is credited to your ParkEase Refund Balance and can be used for another booking or withdrawn.</p>
              </>
            )}
            <label className="block space-y-2 text-sm font-semibold"><span>Reason <span className="font-normal text-slate-500">(optional)</span></span><Input value={cancelReason} maxLength={500} onChange={(event) => setCancelReason(event.target.value)} placeholder="Tell us why you are cancelling" /></label>
          </div> : null}
          <AlertDialogFooter><AlertDialogCancel disabled={cancel.isPending}>Keep booking</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={cancel.isPending || preview.isPending || preview.isError} onClick={() => cancel.mutate()}>{cancel.isPending && <Loader2 className="size-4 animate-spin" />}Confirm cancellation</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reportOpen} onOpenChange={(open) => !report.isPending && setReportOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report listing</DialogTitle>
            <DialogDescription>
              Help keep ParkEase BD safe and reliable. Submit any inaccuracies, safety hazards, or policy violations to the administration team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Reason * <span className="text-xs font-normal text-slate-500">(10–500 characters)</span></span>
              <Input
                value={reportReason}
                maxLength={500}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g. Inaccurate location, gate access blocked, or misleading photos"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Additional details <span className="text-xs font-normal text-slate-500">(optional)</span></span>
              <Textarea
                value={reportDetails}
                maxLength={2000}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context or timestamps to help our investigation..."
                className="min-h-24"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={report.isPending} onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              disabled={report.isPending || reportReason.trim().length < 10}
              onClick={() => report.mutate()}
            >
              {report.isPending && <Loader2 className="size-4 animate-spin" />}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettlementSummary({ settlement, loading, paying, noShow, onPay }: { settlement?: BookingSettlementDto; loading: boolean; paying: boolean; noShow: boolean; onPay: () => void }) {
  if (loading) return <section className="border bg-white p-6"><Loader2 className="size-5 animate-spin text-emerald-700" /></section>;
  if (!settlement) return null;
  const paymentDue = BigInt(settlement.outstandingPaisa) > BigInt(0);
  const totalServiceCharge = (BigInt(settlement.baseChargePaisa) + BigInt(settlement.overtimeChargePaisa) + BigInt(settlement.platformFeePaisa)).toString();
  return <section className="border bg-white p-6">
    <div className="flex flex-col justify-between gap-3 border-b pb-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3">{paymentDue ? <CircleDollarSign className="size-5 text-amber-700" /> : <CheckCircle2 className="size-5 text-emerald-700" />}<div><h2 className="font-bold">Final settlement</h2><p className="mt-1 text-sm text-slate-500">{noShow ? "The booking ended without check-in. Your refundable deposit was returned automatically." : "Calculated from your actual checkout time."}</p></div></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${paymentDue ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{paymentDue ? "Payment due" : "Settled"}</span></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="space-y-3"><Price label="Parking charge" value={settlement.baseChargePaisa} /><Price label={`Overtime (${settlement.overtimeMinutes} min)`} value={settlement.overtimeChargePaisa} /><Price label="Platform fee" value={settlement.platformFeePaisa} /><Price label="Total service charge" value={totalServiceCharge} strong /></div><div className="space-y-3 border-t pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><Price label="Deposit used" value={settlement.depositUsedPaisa} /><Price label="Refund Balance used" value={settlement.driverWalletChargedPaisa} /><Price label="Returned to Refund Balance" value={settlement.driverRefundCreditPaisa} />{paymentDue && <><Price label="Still due" value={settlement.outstandingPaisa} strong /><Button className="mt-4 w-full" disabled={paying} onClick={onPay}>{paying && <Loader2 className="size-4 animate-spin" />}Pay outstanding amount</Button></>}</div></div>
  </section>;
}

function parkingLabel(booking: BookingDto) {
  if (booking.parkingSpot?.resourceType === "SHARED_POOL") return "Shared Parking Area";
  if (booking.assignedUnitCode) return `${booking.parkingSpot?.displayName ?? "Fixed parking"} · Unit ${booking.assignedUnitCode}`;
  return booking.parkingSpot?.displayName ?? booking.parkingSpot?.spotCode ?? "Fixed space";
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm leading-6">{value}</dd></div>; }
function Price({ label, value, strong, negative = false }: { label: string; value: string; strong?: boolean; negative?: boolean }) { return <div className={`flex justify-between gap-4 text-sm ${strong ? "mt-2 border-t pt-3 font-bold" : ""}`}><span>{label}</span><span className={`shrink-0 ${negative && value !== "0" ? "font-semibold text-emerald-700" : ""}`}>{negative && value !== "0" ? "-" : ""}{formatBDTFromPaisa(value)}</span></div>; }
function State({ text, loading }: { text: string; loading?: boolean }) { return <div className="py-24 text-center">{loading && <Loader2 className="mx-auto mb-3 size-6 animate-spin" />}<p>{text}</p></div>; }
