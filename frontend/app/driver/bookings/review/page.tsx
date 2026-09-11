"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Star,
  MapPin,
  Shield,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import parkingHeroImg from "@/assets/parking-hero-bay.jpg";

type PaymentMethodType = "bKash" | "Nagad" | "Card";

export default function ReviewAndPayPage() {
  const router = useRouter();

  // State management
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>("bKash");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [termsError, setTermsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable reservation states
  const [checkIn, setCheckIn] = useState("Oct 27, 10:00 AM");
  const [checkOut, setCheckOut] = useState("Oct 27, 4:00 PM");
  const [vehicle, setVehicle] = useState("Sedan (Dhaka Metro GA 12-3456)");
  const [editingField, setEditingField] = useState<string | null>(null);

  // Pricing
  const durationHours = 6;
  const baseRate = 360;
  const serviceFee = 20;
  const vatAmount = 36;
  const totalPayable = baseRate + serviceFee + vatAmount;

  function handleConfirmPayment() {
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    setIsProcessing(true);

    // Simulate secure payment gateway interaction
    setTimeout(() => {
      router.push("/driver/bookings/confirmation?bookingId=PKBD-2026-1027-1842");
    }, 900);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* 1. Step Progress Header */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 text-xs sm:text-sm font-heading">
        {/* Step 1: Parking Selected */}
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span>Parking Selected</span>
        </div>

        {/* Divider line */}
        <div className="w-10 sm:w-16 h-px bg-border" />

        {/* Step 2: Review & Pay (Active) */}
        <div className="flex items-center gap-1.5 text-foreground font-bold">
          <span className="text-primary font-extrabold">•</span>
          <span>Review & Pay</span>
        </div>

        {/* Divider line */}
        <div className="w-10 sm:w-16 h-px bg-border" />

        {/* Step 3: Confirmation (Pending) */}
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <span>Confirmation</span>
        </div>
      </div>

      {/* 2. Page Header Title */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Review your reservation
        </h1>
        <p className="text-sm text-muted-foreground">
          Check your parking details before confirming your booking.
        </p>
      </div>

      {/* 3. Main Grid Layout (Left 2/3 Content + Right 1/3 Sticky Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Property Card Summary */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs urban-card-shadow">
            <div className="relative size-20 sm:size-24 rounded-xl overflow-hidden shrink-0 border border-border/70 bg-muted/40">
              <Image
                src={parkingHeroImg}
                alt="Gulshan Residential Parking"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground font-heading">
                  Gulshan Residential Parking
                </h3>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-bold text-foreground font-heading">
                  <Star className="size-3 fill-amber-500 text-amber-500" />
                  4.9
                </span>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>Gulshan 2, Dhaka</span>
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["VERIFIED", "GUARD", "CCTV", "COVERED"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-md bg-muted/60 border border-border/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground tracking-wider font-heading uppercase"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* B. Reservation Details Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4 urban-card-shadow">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Reservation Details
            </h3>

            <div className="space-y-3 divide-y divide-border/60 text-sm">
              {/* Check-in */}
              <div className="flex items-center justify-between pt-2 first:pt-0">
                <div>
                  <span className="text-xs text-muted-foreground block">Check-in</span>
                  <span className="font-semibold text-foreground font-heading">
                    {checkIn}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingField(editingField === "checkIn" ? null : "checkIn")
                  }
                  className="text-xs font-bold text-primary hover:underline cursor-pointer font-heading"
                >
                  Edit
                </button>
              </div>

              {/* Check-out */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Check-out</span>
                  <span className="font-semibold text-foreground font-heading">
                    {checkOut}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingField(editingField === "checkOut" ? null : "checkOut")
                  }
                  className="text-xs font-bold text-primary hover:underline cursor-pointer font-heading"
                >
                  Edit
                </button>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Duration</span>
                  <span className="font-semibold text-foreground font-heading">
                    {durationHours} hours
                  </span>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Vehicle</span>
                  <span className="font-semibold text-foreground font-mono">
                    {vehicle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingField(editingField === "vehicle" ? null : "vehicle")
                  }
                  className="text-xs font-bold text-primary hover:underline cursor-pointer font-heading"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* In-place Quick Edit dialog if clicked */}
            {editingField && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-2 mt-3 animate-in fade-in">
                <span className="font-bold text-primary block font-heading">
                  Quick Edit: {editingField.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={
                      editingField === "checkIn"
                        ? checkIn
                        : editingField === "checkOut"
                        ? checkOut
                        : vehicle
                    }
                    onChange={(e) => {
                      if (editingField === "checkIn") setCheckIn(e.target.value);
                      if (editingField === "checkOut") setCheckOut(e.target.value);
                      if (editingField === "vehicle") setVehicle(e.target.value);
                    }}
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground font-medium"
                  />
                  <Button
                    size="sm"
                    onClick={() => setEditingField(null)}
                    className="rounded-lg text-xs font-bold px-3"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* C. Payment Method Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4 urban-card-shadow">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* bKash */}
              <button
                type="button"
                onClick={() => setSelectedPayment("bKash")}
                className={cn(
                  "rounded-2xl border p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5",
                  selectedPayment === "bKash"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold shadow-xs"
                    : "border-border bg-card hover:bg-muted/40 text-foreground font-medium"
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-pink-100 text-pink-700 font-extrabold text-xs">
                  bK
                </div>
                <span className="text-sm font-heading">bKash</span>
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => setSelectedPayment("Nagad")}
                className={cn(
                  "rounded-2xl border p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5",
                  selectedPayment === "Nagad"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold shadow-xs"
                    : "border-border bg-card hover:bg-muted/40 text-foreground font-medium"
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-extrabold text-xs">
                  NG
                </div>
                <span className="text-sm font-heading">Nagad</span>
              </button>

              {/* Credit / Debit Card */}
              <button
                type="button"
                onClick={() => setSelectedPayment("Card")}
                className={cn(
                  "rounded-2xl border p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5",
                  selectedPayment === "Card"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold shadow-xs"
                    : "border-border bg-card hover:bg-muted/40 text-foreground font-medium"
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs">
                  CC
                </div>
                <span className="text-sm font-heading">Credit / Debit Card</span>
              </button>
            </div>
          </div>

          {/* D. Safety & Privacy Maintained Banner */}
          <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-5 flex items-start gap-3.5 text-xs sm:text-sm text-blue-950">
            <Shield className="size-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-blue-900 block font-heading">
                Safety & Privacy Maintained
              </strong>
              <p className="text-blue-800 leading-relaxed text-xs">
                For the security of our hosts, the exact residential address and
                access QR codes are revealed only after your booking is confirmed
                and paid.
              </p>
            </div>
          </div>

          {/* E. Terms & Policies Checkbox */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(c) => {
                  setAgreedToTerms(Boolean(c));
                  if (c) setTermsError(false);
                }}
                className="mt-0.5"
              />
              <label
                htmlFor="agree-terms"
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="/cancellation-policy"
                  target="_blank"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  cancellation policy
                </Link>
                ,{" "}
                <Link
                  href="/safety"
                  target="_blank"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  parking rules
                </Link>
                , and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Terms of Service
                </Link>
                .
              </label>
            </div>

            {termsError && (
              <p className="text-xs font-semibold text-destructive pl-7">
                Please agree to the terms and policies to proceed with payment.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) - Sticky Price Breakdown */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-xl ring-1 ring-border/50 urban-card-shadow space-y-5">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Price Breakdown
            </h3>

            {/* Calculation */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Base rate ({durationHours} hours)</span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{baseRate}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Service fee <Info className="size-3.5 text-muted-foreground/80" />
                </span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{serviceFee}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>VAT (10%)</span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{vatAmount}
                </span>
              </div>

              <div className="border-t border-border pt-3.5 flex items-center justify-between">
                <span className="text-base font-bold text-foreground font-heading">
                  Total payable
                </span>
                <span className="text-3xl font-black text-primary font-mono">
                  ৳{totalPayable}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer font-heading"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing Payment…
                  </>
                ) : (
                  `Pay ৳${totalPayable} & Confirm Booking`
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center leading-tight">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span>
                  Secure checkout • Your booking is not confirmed until payment
                  succeeds.
                </span>
              </p>

              <div className="border-t border-border/80 pt-3 text-center">
                <Link
                  href="/parking/gulshan-residential-parking"
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors font-heading"
                >
                  <ArrowLeft className="size-3" />
                  Back to Parking Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
