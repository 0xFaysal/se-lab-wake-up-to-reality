"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Timer,
  Clock,
  MapPin,
  Calendar,
  Car,
  ShieldCheck,
  Lock,
  ChevronRight,
  CreditCard,
  Smartphone,
  PlusCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { MOCK_BOOKINGS, MOCK_VEHICLES } from "@/lib/data/mock-driver-data";

interface DriverHoldCheckoutViewProps {
  bookingId?: string;
}

export function DriverHoldCheckoutView({ bookingId = "PKBD-2026-1027-1842" }: DriverHoldCheckoutViewProps) {
  const router = useRouter();

  // 5-minute countdown state (in seconds: 299s = 04:59)
  const [secondsRemaining, setSecondsRemaining] = useState(299);
  const [selectedMethod, setSelectedMethod] = useState<"bkash" | "visa" | "other">("bkash");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0];
  const vehicle = MOCK_VEHICLES[0];

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Navigate to confirmation page
      router.push("/driver/bookings/confirmation");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/driver/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/driver/bookings" className="hover:text-foreground transition-colors">
          My Bookings
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Secure Checkout</span>
      </nav>

      {/* 2. Hold Warning Banner with 5-Minute Monospace Timer */}
      <section
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 shadow-xs transition-colors ${
          secondsRemaining > 60
            ? "border-amber-200 bg-amber-50/90 text-amber-900"
            : "border-rose-200 bg-rose-50 text-rose-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              secondsRemaining > 60
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold font-heading">
              {secondsRemaining > 0 ? "Parking Slot Held Exclusively for You" : "Reservation Hold Expired"}
            </p>
            <p className="text-xs text-amber-800/90">
              {secondsRemaining > 0
                ? "Your slot is held while you complete payment. It will be released if unpaid."
                : "The hold period ended. Please refresh to start a new reservation."}
            </p>
          </div>
        </div>

        {/* Live Monospace Timer Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Time Remaining:
          </span>
          <span
            className={`font-mono text-lg font-black tracking-wider px-3 py-1 rounded-lg border shadow-xs ${
              secondsRemaining > 60
                ? "bg-white text-amber-900 border-amber-300"
                : "bg-white text-rose-600 border-rose-300 animate-pulse"
            }`}
          >
            {formattedTime}
          </span>
        </div>
      </section>

      {/* 3. 2-Column Responsive Layout (Left 2/3 Main, Right 1/3 Sidebar) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card A: Reservation Summary */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs urban-card-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#064E3B] border border-emerald-200">
                  {booking.spotNumber}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  #{booking.id}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Gulshan Parking Network
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground font-heading">
                  {booking.propertyTitle}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{booking.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Booking Schedule
                  </span>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>{booking.date}</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>
                      {booking.startTime} – {booking.endTime} ({booking.durationHours} hrs)
                    </span>
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned Vehicle
                  </span>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-[#064E3B]" />
                    <span>{vehicle.name} ({vehicle.color})</span>
                  </p>
                  <p className="font-mono font-extrabold text-[#064E3B] text-[11px]">
                    {vehicle.registrationNumber}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/80 bg-background p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-0.5">
                  Entrance Instructions:
                </p>
                <p>{booking.entranceInstructions}</p>
              </div>
            </div>
          </section>

          {/* Card B: Payment Method Selector */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs urban-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground font-heading">
                  Select Payment Method
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred payment gateway
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>SSL Encrypted</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Saved bKash Wallet */}
              <label
                onClick={() => setSelectedMethod("bkash")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  selectedMethod === "bkash"
                    ? "border-2 border-[#064E3B] bg-emerald-50/20 shadow-xs"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E2136E]/10 text-[#E2136E] font-bold">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground font-heading">
                        bKash Wallet
                      </p>
                      <span className="rounded bg-[#E2136E]/10 px-2 py-0.5 text-[10px] font-bold text-[#E2136E]">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      +880 1712-***678
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "bkash"}
                    onChange={() => setSelectedMethod("bkash")}
                    className="h-4 w-4 accent-[#064E3B] cursor-pointer"
                  />
                </div>
              </label>

              {/* Option 2: Saved Visa Card */}
              <label
                onClick={() => setSelectedMethod("visa")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  selectedMethod === "visa"
                    ? "border-2 border-[#064E3B] bg-emerald-50/20 shadow-xs"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground font-heading">
                        Visa Debit / Credit
                      </p>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Default
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      •••• •••• •••• 4242 (Exp 08/28)
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "visa"}
                    onChange={() => setSelectedMethod("visa")}
                    className="h-4 w-4 accent-[#064E3B] cursor-pointer"
                  />
                </div>
              </label>

              {/* Option 3: Add New Method / SSLCOMMERZ */}
              <label
                onClick={() => setSelectedMethod("other")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  selectedMethod === "other"
                    ? "border-2 border-[#064E3B] bg-emerald-50/20 shadow-xs"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground font-heading">
                      Nagad, Rocket &amp; Other Cards
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pay via SSLCOMMERZ gateway redirect
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "other"}
                    onChange={() => setSelectedMethod("other")}
                    className="h-4 w-4 accent-[#064E3B] cursor-pointer"
                  />
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Sidebar (Right 1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price Breakdown Card */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs urban-card-shadow space-y-4">
            <h3 className="text-base font-bold text-foreground font-heading border-b border-border/60 pb-3">
              Price Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Base Parking (6 hrs @ ৳ 60/hr)
                </span>
                <span className="font-bold text-foreground">৳ 360</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-bold text-foreground">৳ 20</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Security Deposit</span>
                  <span
                    title="Refunded automatically upon timely exit"
                    className="inline-flex cursor-help text-emerald-700"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <span className="font-bold text-foreground">৳ 100</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700">
                <span>Discount / Promo</span>
                <span className="font-bold">- ৳ 0</span>
              </div>

              <div className="border-t border-border/80 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-foreground font-heading block">
                    Total Initial Payment
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Includes refundable deposit
                  </span>
                </div>
                <span className="text-3xl font-black text-[#064E3B] font-heading">
                  ৳ 480
                </span>
              </div>
            </div>

            {/* Massive Solid Deep Emerald Pay Button */}
            <button
              type="button"
              disabled={isProcessing || secondsRemaining <= 0}
              onClick={handlePayNow}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.99] ${
                secondsRemaining > 0 && !isProcessing
                  ? "bg-[#064E3B] hover:bg-[#053d2e] shadow-[0_4px_16px_rgba(6,78,59,0.35)] cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>{isProcessing ? "Processing Payment..." : "Pay ৳ 480 Now"}</span>
            </button>

            {/* Policy Footnote */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By paying, you agree to the{" "}
              <Link href="/cancellation-policy" className="text-[#064E3B] underline underline-offset-2">
                Cancellation
              </Link>{" "}
              and{" "}
              <Link href="/safety" className="text-[#064E3B] underline underline-offset-2">
                Overtime
              </Link>{" "}
              policies.
            </p>

            {/* Security Guarantee Badge */}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-[#064E3B] shrink-0" />
              <span>256-Bit SSL Encrypted &amp; Bangladesh Bank Certified</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
