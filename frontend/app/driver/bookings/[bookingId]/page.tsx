"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Navigation,
  Building2,
  Download,
  HelpCircle,
  Car,
  ChevronRight,
  Info,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

import { DigitalAccessPass } from "@/features/bookings/components/digital-access-pass";
import { BookingStatusTimeline } from "@/features/bookings/components/booking-status-timeline";
import { PaymentSummaryCard } from "@/features/bookings/components/payment-summary-card";
import { CancelBookingModal } from "@/features/bookings/components/cancel-booking-modal";
import { MOCK_BOOKINGS } from "@/lib/data/mock-driver-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import safetyGarageImg from "@/assets/safety-garage.jpg";

interface BookingDetailsPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

const ARRIVAL_STEPS = [
  {
    num: "1",
    title: "Navigate to location",
    desc: "Use your preferred navigation app to arrive at the designated address.",
  },
  {
    num: "2",
    title: "Follow entrance instructions",
    desc: "Proceed to the specific gate mentioned above.",
  },
  {
    num: "3",
    title: "Present credentials",
    desc: "Show your Digital Access Pass (QR Code or OTP) to the guard.",
  },
  {
    num: "4",
    title: "Guard verification",
    desc: "The guard will verify your booking on their device.",
  },
  {
    num: "5",
    title: "Enter and park",
    desc: "Proceed to your assigned or permitted parking area according to your reservation.",
  },
];

export default function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;

  // Locate booking or fallback to first mock booking
  const [booking, setBooking] = useState(
    () => MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0]
  );
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelled, setIsCancelled] = useState(booking.status === "CANCELLED");

  function handleConfirmCancel() {
    setIsCancelled(true);
    setBooking((prev) => ({
      ...prev,
      status: "CANCELLED",
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/driver/bookings" className="hover:text-primary transition-colors">
            My Bookings
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-semibold text-foreground">Booking Details</span>
        </nav>

        {/* Title & Status Capsule Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
              Booking Details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need for your reservation, arrival, access, and payment.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold font-heading",
                isCancelled
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {isCancelled ? "Cancelled" : "Confirmed"}
            </span>
            <span className="rounded-xl border border-border bg-card px-3 py-1 text-xs font-mono font-bold text-foreground shadow-2xs">
              ID: {booking.id}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2/3 + Right 1/3 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Digital Access Pass Hero Card */}
          <DigitalAccessPass
            accessOtp={booking.accessOtp}
            propertyTitle={booking.propertyTitle}
          />

          {/* 2. Reservation Overview Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-5">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Reservation Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted/40 sm:col-span-4 border border-border">
                <Image
                  src={safetyGarageImg}
                  alt={booking.propertyTitle}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="sm:col-span-8 space-y-3">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-foreground font-heading">
                    {booking.propertyTitle}
                  </h4>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>{booking.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Date & Time
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground font-heading mt-0.5">
                      {booking.date}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.startTime} - {booking.endTime} ({booking.durationHours} hours)
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Vehicle
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground font-mono mt-1 border border-border/80">
                      <Car className="size-3 text-primary" />
                      {booking.vehicle.type} • {booking.vehicle.registrationNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Arrival & Access Step-by-Step Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-5">
            <div className="flex items-center gap-2">
              <Car className="size-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground font-heading">
                Arrival & Access
              </h3>
            </div>

            {/* Custom Entrance Instructions Banner */}
            <div className="flex items-start gap-3 rounded-xl bg-blue-50/70 border border-blue-100 p-4 text-xs sm:text-sm text-blue-950">
              <Info className="size-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-blue-900 block font-heading">
                  Entrance Instructions
                </strong>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  {booking.entranceInstructions}
                </p>
              </div>
            </div>

            {/* Numbered Arrival Timeline (1 to 5) */}
            <div className="space-y-4 pt-2">
              {ARRIVAL_STEPS.map((step) => (
                <div key={step.num} className="flex items-start gap-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs font-mono">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground font-heading">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-4">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Quick Actions
            </h3>

            <div className="space-y-2.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  booking.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-sm h-12 shadow-xs transition-colors"
              >
                <Navigation className="size-4" />
                Get Directions
              </a>

              <Link
                href="/parking"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-primary hover:bg-emerald-100 border border-primary/20 font-bold text-sm h-12 transition-colors"
              >
                <Building2 className="size-4" />
                View Property Details
              </Link>

              <button
                type="button"
                onClick={() => alert("Receipt downloaded successfully (PDF).")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-sm h-11 transition-colors cursor-pointer"
              >
                <Download className="size-4" />
                Download Receipt
              </button>

              <Link
                href="/safety"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-sm h-11 transition-colors"
              >
                <HelpCircle className="size-4" />
                Contact Support
              </Link>
            </div>
          </div>

          {/* Booking Status Step Tracker */}
          <BookingStatusTimeline steps={booking.timeline} />

          {/* Payment Summary Breakdown */}
          <PaymentSummaryCard payment={booking.payment} />

          {/* Need to cancel block */}
          {!isCancelled && (
            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-2xs space-y-2">
              <h4 className="text-sm font-bold text-foreground font-heading">
                Need to cancel?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Free cancellation up to 2 hours before your reservation starts.
              </p>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs font-bold text-destructive hover:underline pt-1 cursor-pointer block w-full text-center"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Dialog Modal */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        bookingId={booking.id}
      />
    </div>
  );
}
