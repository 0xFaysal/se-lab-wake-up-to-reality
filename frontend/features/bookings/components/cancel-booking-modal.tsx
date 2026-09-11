"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingId: string;
}

export function CancelBookingModal({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
}: CancelBookingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-heading">
              Cancel Reservation?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Reservation ID: <span className="font-mono">{bookingId}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-2 border border-border">
          <p>
            • Cancellations made at least <strong>2 hours</strong> before the
            scheduled start time receive a <strong>100% full refund</strong>.
          </p>
          <p>
            • Refund of <strong>৳ 416</strong> will be credited back to your original
            bKash account within 24 hours.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg font-bold text-sm"
          >
            Keep Reservation
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg font-bold text-sm bg-destructive text-white hover:bg-destructive/90"
          >
            Yes, Cancel Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
