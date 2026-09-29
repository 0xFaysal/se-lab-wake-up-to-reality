"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vehicle, VehicleCategory } from "@/types/driver";

interface AddVehicleFormProps {
  onAddVehicle: (newVehicle: Omit<Vehicle, "id">) => Promise<void>;
  pending?: boolean;
}

export function AddVehicleForm({ onAddVehicle, pending = false }: AddVehicleFormProps) {
  const [type, setType] = useState<VehicleCategory>("SEDAN");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !model || !registrationNumber || !color) {
      setError("Please fill in all required vehicle details.");
      return;
    }

    setError("");
    try {
      await onAddVehicle({ name: `${brand} ${model}`.trim(), brand, model, registrationNumber, type, color, isDefault });
    } catch {
      return;
    }

    // Reset form
    setBrand("");
    setModel("");
    setRegistrationNumber("");
    setColor("");
    setIsDefault(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 urban-card-shadow"
    >
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive font-semibold">
          {error}
        </div>
      )}

      {/* 2-Column Responsive Input Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Vehicle Type Select */}
        <div className="space-y-2">
          <label
            htmlFor="vehicle-type"
            className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            Vehicle Type
          </label>
          <Select
            value={type}
            onValueChange={(val) => setType(val as VehicleCategory)}
          >
            <SelectTrigger
              id="vehicle-type"
              className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs text-foreground"
            >
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-card">
              <SelectItem value="SEDAN" className="py-2.5">Sedan (Car / Saloon)</SelectItem>
              <SelectItem value="SUV" className="py-2.5">SUV / Crossover</SelectItem>
              <SelectItem value="MOTORCYCLE" className="py-2.5">Motorcycle / Scooter</SelectItem>
              <SelectItem value="MICROBUS" className="py-2.5">Microbus / Van</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brand Input */}
        <div className="space-y-2">
          <label
            htmlFor="vehicle-brand"
            className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            Brand
          </label>
          <Input
            id="vehicle-brand"
            type="text"
            placeholder="e.g. Toyota"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

        {/* Model Input */}
        <div className="space-y-2">
          <label
            htmlFor="vehicle-model"
            className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            Model
          </label>
          <Input
            id="vehicle-model"
            type="text"
            placeholder="e.g. Corolla"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

        {/* Registration Number Input */}
        <div className="space-y-2">
          <label
            htmlFor="vehicle-reg"
            className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            Registration Number
          </label>
          <Input
            id="vehicle-reg"
            type="text"
            placeholder="e.g. Dhaka Metro GA 12-3456"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs font-mono"
          />
        </div>

        {/* Color Input */}
        <div className="space-y-2">
          <label
            htmlFor="vehicle-color"
            className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
          >
            Color
          </label>
          <Input
            id="vehicle-color"
            type="text"
            placeholder="e.g. White"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-12 w-full px-4 text-sm font-medium rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 shadow-2xs"
          />
        </div>

      </div>

      {/* Default Checkbox */}
      <div className="flex items-center gap-2.5 pt-1">
        <Checkbox
          id="set-default"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(Boolean(checked))}
        />
        <label
          htmlFor="set-default"
          className="text-xs sm:text-sm font-medium text-foreground cursor-pointer"
        >
          Set as my default vehicle
        </label>
      </div>

      {/* Submit Button & Validation Helper */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t border-border/80">
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          size="lg"
          className="bg-primary text-white hover:bg-primary/90 font-bold text-sm h-12 px-8 rounded-xl shadow-xs gap-2 cursor-pointer"
        >
          <PlusCircle className="size-4" />
          {pending ? "Adding…" : "Add Vehicle"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Make sure the registration number matches the vehicle you will use for
          parking.
        </span>
      </div>
    </form>
  );
}
