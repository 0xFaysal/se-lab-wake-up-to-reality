import { Car } from "lucide-react";
import { Vehicle } from "@/types/driver";

interface VehicleCardProps {
  vehicle: Vehicle;
  onSetDefault: (id: string) => void;
  onEdit: (vehicle: Vehicle) => void;
  onRemove: (id: string) => void;
}

export function VehicleCard({
  vehicle,
  onSetDefault,
  onEdit,
  onRemove,
}: VehicleCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all urban-card-shadow">
      {/* Left: Icon & Details */}
      <div className="flex items-start sm:items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Car className="size-6" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground font-heading">
              {vehicle.name}
            </h3>
            {vehicle.isDefault && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase font-heading">
                Default Vehicle
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            {vehicle.registrationNumber} • <span className="font-sans">{vehicle.type}</span> • <span className="font-sans">{vehicle.color}</span>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 text-xs sm:text-sm font-semibold">
        {!vehicle.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(vehicle.id)}
            className="text-primary hover:underline cursor-pointer"
          >
            Set as Default
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(vehicle)}
          className="text-foreground/80 hover:text-primary transition-colors cursor-pointer"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove(vehicle.id)}
          className="text-destructive hover:underline cursor-pointer"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
