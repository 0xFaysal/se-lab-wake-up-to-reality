"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { VehicleCard } from "@/features/vehicles/components/vehicle-card";
import { AddVehicleForm } from "@/features/vehicles/components/add-vehicle-form";
import { DefaultVehicleCard } from "@/features/vehicles/components/default-vehicle-card";
import { Vehicle } from "@/types/driver";
import { useVehicles } from "@/hooks/use-vehicles";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { VehicleEditDialog } from "@/features/vehicles/components/vehicle-edit-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ManageVehiclesPage() {
  const vehiclesApi = useVehicles();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const vehicles: Vehicle[] = (vehiclesApi.query.data ?? []).map((vehicle) => ({ id: vehicle.id, name: `${vehicle.brand} ${vehicle.model}`, brand: vehicle.brand, model: vehicle.model, registrationNumber: vehicle.registrationNumber, type: vehicle.vehicleType, color: vehicle.color, isDefault: vehicle.isDefault }));

  const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];

  function handleSetDefault(id: string) {
    vehiclesApi.setDefault.mutate(id);
  }

  function handleRemove(id: string) {
    vehiclesApi.remove.mutate(id);
  }

  async function handleAddVehicle(newVehicleData: Omit<Vehicle, "id">) {
    await vehiclesApi.create.mutateAsync({ vehicleType: newVehicleData.type, registrationNumber: newVehicleData.registrationNumber, brand: newVehicleData.brand, model: newVehicleData.model, color: newVehicleData.color, isDefault: newVehicleData.isDefault });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          Vehicles
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Keep your vehicles ready for faster and more accurate parking reservations.
        </p>
        <p className="text-xs text-muted-foreground/80">
          Vehicle details are used to confirm compatibility with parking spaces
          and support secure entry verification.
        </p>
      </div>

      {/* Main Grid: Left 2/3 + Right 1/3 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-8 space-y-8">
          {/* YOUR VEHICLES Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-primary uppercase font-heading bg-primary/10 px-3 py-1 rounded-full inline-block">
              Your Vehicles
            </h2>
            {vehiclesApi.query.isPending && <div className="rounded-2xl border bg-card p-8 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /><p className="mt-2 text-sm text-muted-foreground">Loading vehicles…</p></div>}
            {vehiclesApi.query.isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><AlertCircle className="mb-2 size-5" />{getApiErrorMessage(vehiclesApi.query.error)}</div>}
            {!vehiclesApi.query.isPending && !vehiclesApi.query.isError && vehicles.length === 0 && <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No vehicle registered yet. Add your first vehicle below.</div>}
            <div className="space-y-3.5">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onSetDefault={handleSetDefault}
                  onEdit={() => setEditId(v.id)}
                  onRemove={() => setDeleteId(v.id)}
                />
              ))}
            </div>
          </div>

          {/* ADD A VEHICLE Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold tracking-widest text-primary uppercase font-heading bg-primary/10 px-3 py-1 rounded-full inline-block">
              Add a Vehicle
            </h2>
            <AddVehicleForm onAddVehicle={handleAddVehicle} pending={vehiclesApi.create.isPending} />
            {(vehiclesApi.create.isError || vehiclesApi.remove.isError || vehiclesApi.setDefault.isError) && <p role="alert" className="text-sm font-semibold text-red-700">{getApiErrorMessage(vehiclesApi.create.error ?? vehiclesApi.remove.error ?? vehiclesApi.setDefault.error)}</p>}
          </div>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Default Vehicle Card */}
          <DefaultVehicleCard
            defaultVehicle={defaultVehicle}
            onChangeDefaultClick={() => {
              const nonDefault = vehicles.find((v) => !v.isDefault);
              if (nonDefault) handleSetDefault(nonDefault.id);
            }}
          />

          {/* WHY DETAILS MATTER Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-5">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase font-heading">
              Why Details Matter
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Parking Compatibility
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Ensures the allocated parking bay is large enough for your
                    specific vehicle type.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Secure Verification
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Building security uses registration details to grant fast, secure
                    access to the premises.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Faster Booking
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Saves time during checkout by pre-filling necessary compliance
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice Box */}
          <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-5 space-y-3 text-xs text-blue-950">
            <div className="flex items-start gap-2.5">
              <Shield className="size-4 shrink-0 text-blue-700 mt-0.5" />
              <p className="text-blue-900 leading-relaxed">
                Vehicle information is stored securely and used exclusively for
                reservation compliance and property access control.
              </p>
            </div>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 font-bold text-blue-800 hover:underline pt-1"
            >
              View Privacy Policy <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
      <VehicleEditDialog vehicleId={editId} onClose={() => setEditId(null)} />
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open && !vehiclesApi.remove.isPending) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this vehicle?</AlertDialogTitle><AlertDialogDescription>The backend may block deletion when the vehicle is referenced by an active record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={vehiclesApi.remove.isPending} onClick={() => { if (deleteId) { handleRemove(deleteId); setDeleteId(null); } }}>Remove vehicle</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
