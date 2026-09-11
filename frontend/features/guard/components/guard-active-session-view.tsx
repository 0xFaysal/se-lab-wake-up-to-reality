"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Car,
  Phone,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface GuardActiveSessionViewProps {
  bookingId: string;
}

export function GuardActiveSessionView({ bookingId }: GuardActiveSessionViewProps) {
  const router = useRouter();
  const displayCode = bookingId.startsWith("PE-") ? `#${bookingId}` : `#PE-BK-2051`;

  const [elapsedMinutes, setElapsedMinutes] = useState(28);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const formattedDuration = `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m`;

  const handleConfirmCheckOut = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/guard");
      }, 1200);
    }, 800);
  };

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Status & Identification */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-gray-900 font-mono tracking-tight">
            {displayCode}
          </span>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 border border-emerald-200">
            Currently Parked
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Checked in today at 10:02 AM • Gate 2
        </p>
      </div>

      {/* 2. Solid Deep Emerald Assigned Space Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#064E3B] p-5 text-white shadow-[0_10px_25px_rgba(6,78,59,0.25)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Assigned Parking Space
            </p>
            <h2 className="mt-1 text-4xl font-black tracking-tight text-white font-heading">
              B-08
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-100/80">
              <MapPin className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
              <span>Basement Level B • Gate 2</span>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xs">
            <Car className="h-6 w-6 text-white" />
          </div>
        </div>
      </section>

      {/* 3. Session Details (4-Grid Metrics) */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading mb-3">
          Session Details
        </h3>

        <div className="grid grid-cols-2 gap-3.5 text-xs">
          <div className="border-b border-gray-100 pb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Booking ID
            </p>
            <p className="mt-0.5 font-mono font-bold text-gray-900">
              {displayCode}
            </p>
          </div>

          <div className="border-b border-gray-100 pb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Entry Time
            </p>
            <p className="mt-0.5 font-bold text-gray-900">
              10:02 AM
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Expected Exit
            </p>
            <p className="mt-0.5 font-bold text-gray-900">
              01:30 PM
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Parking Duration
            </p>
            <div className="mt-0.5 flex items-center gap-1 font-bold text-[#064E3B]">
              <Clock className="h-3.5 w-3.5 text-[#064E3B]" />
              <span>{formattedDuration}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Driver Summary Card */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full border border-gray-200 shadow-xs">
              <Image
                src="/assets/avatar-driver.jpg"
                alt="Farhan Karim"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 font-heading">
                Farhan Karim
              </p>
              <p className="text-xs text-gray-500 font-mono">
                +880 17XX-XXXXXX
              </p>
            </div>
          </div>

          <a
            href="tel:+8801700000000"
            aria-label="Call Driver"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#064E3B] transition-transform active:scale-95 hover:bg-emerald-100"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* 5. Vehicle Card with BD License Plate */}
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-900 font-heading">
              Honda Vezel
            </p>
            <p className="text-xs text-gray-500">
              White • Car
            </p>
          </div>
          <Car className="h-5 w-5 text-gray-400" />
        </div>

        {/* Physical Bangladesh Plate Styled Box */}
        <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-gray-200 border-l-4 border-l-[#064E3B] bg-gray-50 py-2 px-4 shadow-inner">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600">
            DHAKA METRO-GHA
          </span>
          <span className="font-mono text-base font-black tracking-widest text-gray-900">
            XX-XXXX
          </span>
        </div>
      </section>

      {/* 6. Check-Out Action Section */}
      <div className="space-y-2.5 pt-2 text-center">
        <p className="text-xs font-semibold text-gray-600">
          Vehicle ready to leave?
        </p>

        <button
          type="button"
          onClick={() => setIsCheckOutModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] py-3.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(6,78,59,0.35)] transition-all active:scale-[0.99] hover:bg-[#053d2e] [-webkit-tap-highlight-color:transparent]"
        >
          <LogOut className="h-4 w-4" />
          <span>Start Check-Out</span>
        </button>

        <div>
          <button
            type="button"
            onClick={() => alert("Dispatching issue report to control room...")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
            <span>Report an Issue</span>
          </button>
        </div>
      </div>

      {/* Check-Out Confirmation Modal */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-5">
            {isSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#064E3B]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  Check-Out Complete!
                </h3>
                <p className="text-xs text-gray-500">
                  Slot B-08 is now released and ready for next driver. Redirecting to portal...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm font-heading">
                        Confirm Vehicle Exit
                      </h3>
                      <p className="text-gray-500 text-xs">
                        Release slot and complete booking session
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckOutModalOpen(false)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="my-4 space-y-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="font-bold text-gray-900">Honda Vezel (DHAKA METRO-GHA XX-XXXX)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Slot Released</span>
                      <span className="font-bold text-[#064E3B]">B-08</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Duration</span>
                      <span className="font-bold text-gray-900">{formattedDuration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Exit Gate</span>
                      <span className="font-bold text-gray-900">Gate 2</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckOutModalOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isCheckingOut}
                    onClick={handleConfirmCheckOut}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#064E3B] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#053d2e] active:scale-[0.98]"
                  >
                    <span>{isCheckingOut ? "Processing Exit..." : "Complete Check-Out"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
