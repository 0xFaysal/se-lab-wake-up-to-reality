"use client";

import { X, Lock, ShieldCheck, ArrowRight, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ParkingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotName: string;
  spotId: string;
  totalPayable: number;
}

export function ParkingAuthModal({
  isOpen,
  onClose,
  spotName,
  spotId,
  totalPayable,
}: ParkingAuthModalProps) {
  if (!isOpen) return null;

  const loginRedirect = encodeURIComponent(`/driver/bookings/review?spotId=${spotId}`);
  const registerRedirect = encodeURIComponent(`/driver/bookings/review?spotId=${spotId}`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 urban-card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Lock className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground font-heading">
              Sign In to Reserve
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To book a spot at <span className="font-semibold text-foreground">{spotName}</span> and receive your Digital Access Pass, please sign in or create an account.
            </p>
          </div>
        </div>

        {/* Value Prop Highlights */}
        <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Guaranteed reserved bay (Total: ৳{totalPayable})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shrink-0 ml-1" />
            <span>Encrypted QR Code and Access OTP for automated gate entry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shrink-0 ml-1" />
            <span>Full refund if cancelled up to 2 hours before check-in</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <Link
            href={`/login?redirect=${loginRedirect}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-sm h-12 shadow-xs transition-colors"
          >
            <LogIn className="size-4" />
            Sign In to Complete Booking
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href={`/register?role=driver&redirect=${registerRedirect}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-bold text-sm h-12 transition-colors"
          >
            <UserPlus className="size-4" />
            Create Free Driver Account
          </Link>

          <Link
            href={`/driver/bookings/review?spotId=${spotId}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-primary hover:bg-emerald-100 border border-primary/20 font-bold text-xs h-10 transition-colors"
          >
            <span>Continue as Anisa (Signed-in Demo)</span>
            <ArrowRight className="size-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors pt-1 cursor-pointer"
          >
            Continue browsing spaces
          </button>
        </div>
      </div>
    </div>
  );
}
