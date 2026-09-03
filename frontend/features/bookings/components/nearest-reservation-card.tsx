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

          {/* Date & Time (Vertical on left) + Access OTP Box (on right) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
            {/* Left: Date & Time vertically stacked */}
            <div className="sm:col-span-6 lg:col-span-6 flex flex-col justify-between rounded-xl bg-muted/40 p-3.5 border border-border/60">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-heading">
                  Date
                </span>
                <p className="text-sm font-bold text-foreground font-heading mt-0.5">
                  {booking.date}
                </p>
              </div>
              <div className="border-t border-border/50 pt-2 mt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-heading">
                  Time
                </span>
                <p className="text-sm font-bold text-foreground font-heading mt-0.5">
                  {booking.startTime} – {booking.endTime}
                </p>
              </div>
            </div>

            {/* Right: Access OTP Box */}
            <div className="sm:col-span-6 lg:col-span-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3.5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-heading">
                    Access OTP
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-widest text-primary font-mono leading-none mt-1 block">
                    {booking.accessOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenQr}
                  title="View Digital QR Pass"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 shadow-xs transition-colors cursor-pointer"
                >
                  <QrCode className="size-5" />
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block">
                For this booking only
              </span>
            </div>
          </div>

          {/* Action Buttons: Full dedicated row, clean 2-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Link
              href={`/driver/bookings/${booking.id}`}
              className={cn(
                buttonVariants({ size: "default" }),
                "w-full bg-primary text-white hover:bg-primary/90 font-bold text-sm rounded-lg shadow-xs py-2.5 px-4 flex items-center justify-center font-heading"
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
                "w-full border-border text-foreground hover:bg-muted font-bold text-sm rounded-lg py-2.5 px-3 flex items-center justify-center gap-1.5 font-heading"
              )}
            >
              <Navigation className="size-3.5" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
