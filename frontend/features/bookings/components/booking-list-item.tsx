import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Booking } from "@/types/driver";

interface BookingListItemProps {
  booking: Booking;
  iconType?: "parking" | "building";
}

export function BookingListItem({
  booking,
  iconType = "parking",
}: BookingListItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all urban-card-shadow">
      <div className="flex items-center gap-4">
        {/* Left Icon Badge */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 border border-blue-100 font-bold font-mono">
          {iconType === "parking" ? "P" : <Building2 className="size-5" />}
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <h4 className="text-base font-bold text-foreground font-heading">
            {booking.propertyTitle}
          </h4>
          <p className="text-xs text-muted-foreground">
            {booking.date} • {booking.startTime} – {booking.endTime}
          </p>
        </div>
      </div>

      {/* Right: Price & Details Link */}
      <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <div className="text-left sm:text-right">
          <span className="text-xs text-muted-foreground block">Total</span>
          <span className="text-base font-bold text-foreground font-mono">
            ৳ {booking.payment.totalPaid}
          </span>
        </div>

        <Link
          href={`/driver/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline font-heading"
        >
          Details <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
