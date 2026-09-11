"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchFilters, type FilterState } from "@/components/parking/search-filters";
import { ParkingCard } from "@/components/parking/parking-card";
import { MOCK_PARKING_SPOTS, type VehicleType } from "@/lib/data/mock-parking";
import { cn } from "@/lib/utils";

// Dynamically import map with ssr: false
const ParkingMap = dynamic(
  () => import("@/components/parking/parking-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-2xl border bg-muted/40 text-sm text-muted-foreground">
        Loading Dhaka Map…
      </div>
    ),
  }
);

export function ParkingSearchView() {
  const searchParams = useSearchParams();

  const initialLocation = searchParams.get("location") || "";
  const initialVehicleType =
    (searchParams.get("vehicleType") as VehicleType) || "ALL";

  const [filters, setFilters] = useState<FilterState>({
    location: initialLocation,
    startTime: "09:00",
    endTime: "18:00",
    vehicleType: initialVehicleType,
    radiusKm: "5",
  });

  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>(
    undefined
  );
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  function handleFilterChange(updated: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...updated }));
  }

  function handleReset() {
    setFilters({
      location: "",
      startTime: "09:00",
      endTime: "18:00",
      vehicleType: "ALL",
      radiusKm: "5",
    });
    setSelectedSpotId(undefined);
  }

  // Filter spots based on search criteria
  const filteredSpots = useMemo(() => {
    return MOCK_PARKING_SPOTS.filter((spot) => {
      // Filter by location query
      if (filters.location.trim()) {
        const query = filters.location.toLowerCase();
        const matchesArea = spot.area.toLowerCase().includes(query);
        const matchesName = spot.propertyName.toLowerCase().includes(query);
        if (!matchesArea && !matchesName) return false;
      }

      // Filter by vehicle type
      if (filters.vehicleType !== "ALL") {
        if (!spot.vehicleTypes.includes(filters.vehicleType)) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Filter Bar */}
      <SearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Mobile Toggle View Switch */}
      <div className="flex items-center justify-between lg:hidden border-b pb-3">
        <span className="text-xs font-semibold text-muted-foreground">
          {filteredSpots.length} parking spots found
        </span>
        <div className="flex gap-1 rounded-lg bg-muted p-1 border">
          <button
            onClick={() => setMobileView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
              mobileView === "list"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground"
            )}
          >
            <List className="size-3.5" />
            List
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
              mobileView === "map"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground"
            )}
          >
            <MapIcon className="size-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Desktop Split Screen / Mobile Conditional */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left List Section */}
        <div
          className={cn(
            "lg:col-span-6 xl:col-span-5 space-y-4",
            mobileView === "map" ? "hidden lg:block" : "block"
          )}
        >
          <div className="hidden lg:flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-foreground">
              Available Spaces in Dhaka
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredSpots.length} results
            </span>
          </div>

          {filteredSpots.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                No parking spaces found matching your filters.
              </p>
              <p className="text-xs text-muted-foreground">
                Try widening your location search or switching the vehicle type.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="mt-2 text-xs"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            filteredSpots.map((spot) => (
              <ParkingCard
                key={spot.id}
                spot={spot}
                isSelected={selectedSpotId === spot.id}
                onSelect={() => setSelectedSpotId(spot.id)}
              />
            ))
          )}
        </div>

        {/* Right Sticky Map Section */}
        <div
          className={cn(
            "lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24 h-[calc(100vh-8rem)] min-h-[480px]",
            mobileView === "list" ? "hidden lg:block" : "block"
          )}
        >
          <ParkingMap
            spots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={(id) => setSelectedSpotId(id)}
          />
        </div>
      </div>
    </div>
  );
}
