"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  ShieldCheck,
  Zap,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { VehicleCard } from "@/features/vehicles/components/vehicle-card";
import { AddVehicleForm } from "@/features/vehicles/components/add-vehicle-form";
import { DefaultVehicleCard } from "@/features/vehicles/components/default-vehicle-card";
import { MOCK_VEHICLES } from "@/lib/data/mock-driver-data";
import { Vehicle } from "@/types/driver";

export default function ManageVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];

  function handleSetDefault(id: string) {
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isDefault: v.id === id,
      }))
    );
  }

  function handleRemove(id: string) {
    if (vehicles.length <= 1) {
      alert("You must keep at least one registered vehicle.");
      return;
    }
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  function handleAddVehicle(newVehicleData: Omit<Vehicle, "id">) {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: `v-${Date.now()}`,
    };

    setVehicles((prev) => {
      if (newVehicle.isDefault) {
        return [...prev.map((v) => ({ ...v, isDefault: false })), newVehicle];
      }
      return [...prev, newVehicle];
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Manage Vehicles
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
            <div className="space-y-3.5">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onSetDefault={handleSetDefault}
                  onEdit={(veh) => {
                    setEditingVehicle(veh);
                    alert(`Editing ${veh.name}. You can update or re-register below.`);
                  }}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>

          {/* ADD A VEHICLE Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold tracking-widest text-primary uppercase font-heading bg-primary/10 px-3 py-1 rounded-full inline-block">
              Add a Vehicle
            </h2>
            <AddVehicleForm onAddVehicle={handleAddVehicle} />
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
    </div>
  );
}
