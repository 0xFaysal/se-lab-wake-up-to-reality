import { Car, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className={cn("flex items-start justify-between gap-4 rounded-md border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:items-center sm:p-5", vehicle.isDefault && "border-emerald-300 bg-emerald-50/40")}>
      {/* Left: Icon & Details */}
      <div className="flex items-start sm:items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
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
      <details className="relative sm:hidden"><summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={`Actions for ${vehicle.name}`}><MoreVertical className="size-5" /></summary><div className="absolute right-0 z-10 mt-1 w-40 rounded-md border bg-white p-1 shadow-lg">{!vehicle.isDefault && <button type="button" onClick={() => onSetDefault(vehicle.id)} className="block w-full rounded px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Set default</button>}<button type="button" onClick={() => onEdit(vehicle)} className="block w-full rounded px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">Edit</button><button type="button" onClick={() => onRemove(vehicle.id)} className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50">Delete</button></div></details>
      <div className="hidden items-center gap-3 self-end border-border/60 pt-2 text-xs font-semibold sm:flex sm:self-center sm:border-t-0 sm:pt-0 sm:text-sm">
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
