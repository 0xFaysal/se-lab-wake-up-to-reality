import Image from "next/image";
import Link from "next/link";
import { MapPin, QrCode, Navigation, ArrowRight } from "lucide-react";
import { Booking } from "@/types/driver";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import safetyGarageImg from "@/assets/safety-garage.jpg";

interface NearestReservationCardProps {
  booking: Booking;
  onOpenQr?: () => void;
}

export function NearestReservationCard({
  booking,
  onOpenQr,
}: NearestReservationCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
        {/* Left: Property Preview Image */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted/40 md:col-span-5">
          <Image
            src={safetyGarageImg}
            alt={booking.propertyTitle}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right: Content & Access Details */}
        <div className="space-y-4 md:col-span-7">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-foreground font-heading">
                {booking.propertyTitle}
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-bold font-heading">
                {booking.status === "CONFIRMED" ? "Confirmed" : booking.status}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span>{booking.address}</span>
            </p>
          </div>

          {/* Date & Time Container Box */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3.5 border border-border/60">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </span>
              <p className="text-sm font-bold text-foreground font-heading mt-0.5">
                {booking.date}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Time
              </span>
              <p className="text-sm font-bold text-foreground font-heading mt-0.5">
                {booking.startTime} – {booking.endTime}
              </p>
            </div>
          </div>

          {/* Action Buttons & Access OTP Container */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-7 flex flex-col sm:flex-row gap-2.5">
              <Link
                href={`/driver/bookings/${booking.id}`}
                className={cn(
                  buttonVariants({ size: "default" }),
                  "w-full bg-primary text-white hover:bg-primary/90 font-bold text-sm rounded-lg shadow-xs py-2.5 px-4"
                )}
              >
                View Booking
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  booking.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "w-full border-border text-foreground hover:bg-muted font-bold text-sm rounded-lg py-2.5 px-3 gap-1.5"
                )}
              >
                <Navigation className="size-3.5" />
                Get Directions
              </a>
            </div>

            {/* Access OTP Box */}
            <div className="sm:col-span-5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Access OTP
                </span>
                <span className="text-lg font-black tracking-widest text-primary font-mono leading-none">
                  {booking.accessOtp}
                </span>
                <span className="text-[9px] text-muted-foreground block mt-0.5">
                  For this booking only
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenQr}
                title="View Digital QR Pass"
                className="flex size-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 shadow-xs transition-colors cursor-pointer"
              >
                <QrCode className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
