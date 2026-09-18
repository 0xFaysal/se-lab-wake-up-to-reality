import { ShieldCheck, Car } from "lucide-react";
import { Vehicle } from "@/types/driver";
import { Button } from "@/components/ui/button";

interface DefaultVehicleCardProps {
  defaultVehicle?: Vehicle;
  onChangeDefaultClick?: () => void;
}

export function DefaultVehicleCard({
  defaultVehicle,
  onChangeDefaultClick,
}: DefaultVehicleCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground font-heading">
          Default Vehicle
        </h3>
        <ShieldCheck className="size-5 text-primary" />
      </div>

      {defaultVehicle ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Car className="size-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground font-heading">
              {defaultVehicle.name}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground font-mono pl-6">
            {defaultVehicle.registrationNumber}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No default vehicle set
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        This vehicle is automatically selected for new parking reservations to
        speed up your booking process.
      </p>

      <Button
        variant="outline"
        onClick={onChangeDefaultClick}
        className="w-full font-bold text-xs rounded-xl border-border hover:bg-muted py-2.5 cursor-pointer"
      >
        Change Default
      </Button>
    </div>
  );
}
