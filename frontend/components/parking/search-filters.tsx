"use client";

import { MapPin, Clock, Car, Compass, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_TYPE_LABELS, type VehicleType } from "@/lib/data/mock-parking";

export interface FilterState {
  location: string;
  startTime: string;
  endTime: string;
  vehicleType: VehicleType | "ALL";
  radiusKm: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

export function SearchFilters({
  filters,
  onFilterChange,
  onReset,
}: SearchFiltersProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          Filter Parking Slots
        </h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3 text-primary" /> Location / Area
          </label>
          <Input
            placeholder="e.g. Dhanmondi, Gulshan"
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="h-9 text-xs"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-primary" /> Start Time
          </label>
          <Input
            type="time"
            value={filters.startTime}
            onChange={(e) => onFilterChange({ startTime: e.target.value })}
            className="h-9 text-xs"
          />
        </div>

        {/* End Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-primary" /> End Time
          </label>
          <Input
            type="time"
            value={filters.endTime}
            onChange={(e) => onFilterChange({ endTime: e.target.value })}
            className="h-9 text-xs"
          />
        </div>

        {/* Vehicle Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Car className="size-3 text-primary" /> Vehicle Type
          </label>
          <Select
            value={filters.vehicleType}
            onValueChange={(val) => {
              if (val) onFilterChange({ vehicleType: val as VehicleType | "ALL" });
            }}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Vehicle Types</SelectItem>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Radius */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Compass className="size-3 text-primary" /> Radius
          </label>
          <Select
            value={filters.radiusKm}
            onValueChange={(val) => {
              if (val) onFilterChange({ radiusKm: val });
            }}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Search Radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Within 1 km</SelectItem>
              <SelectItem value="3">Within 3 km</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
