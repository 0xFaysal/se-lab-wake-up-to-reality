import Link from "next/link";
import { Star, MapPin, Shield, Video, Warehouse, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VEHICLE_TYPE_LABELS, type MockParkingSpot } from "@/lib/data/mock-parking";
import { cn } from "@/lib/utils";

interface ParkingCardProps {
  spot: MockParkingSpot;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ParkingCard({ spot, isSelected, onSelect }: ParkingCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all cursor-pointer shadow-sm hover:shadow-md",
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
          : "border-border hover:border-border/80"
      )}
    >
      <div>
        {/* Header: Area & Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              <span>{spot.area}</span>
              <span>•</span>
              <span className="font-medium text-foreground">{spot.distance}</span>
            </div>
            <h3 className="mt-1 font-bold text-base text-foreground group-hover:text-primary transition-colors">
              {spot.propertyName}
            </h3>
          </div>

          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span>{spot.rating}</span>
            <span className="text-[10px] text-muted-foreground">({spot.reviewCount})</span>
          </div>
        </div>

        {/* Facility Badges */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {spot.facilities.covered && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5">
              <Warehouse className="size-3" />
              Covered
            </Badge>
          )}
          {spot.facilities.cctv && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5">
              <Video className="size-3" />
              CCTV
            </Badge>
          )}
          {spot.facilities.guard && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5">
              <Shield className="size-3" />
              Guard
            </Badge>
          )}
        </div>

        {/* Vehicle Types */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {spot.vehicleTypes.map((v) => (
            <span
              key={v}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {VEHICLE_TYPE_LABELS[v]}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Price & CTA */}
      <div className="mt-5 flex items-center justify-between border-t pt-3.5">
        <div>
          <span className="text-xl font-extrabold text-foreground">৳{spot.hourlyRate}</span>
          <span className="text-xs text-muted-foreground"> / hour</span>
        </div>

        <Link
          href={`/parking/${spot.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-bold")}
        >
          View Details
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
