"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Shield,
  Warehouse,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchFilters, type FilterState } from "@/components/parking/search-filters";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { formatBDTFromPaisa, toUtcFromBangladeshLocal } from "@/lib/formatters";

const DriverParkingMap = dynamic(
  () => import("@/components/driver/driver-parking-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[460px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#f9f9ff]">
        <Loader2 className="size-6 animate-spin text-[#064E3B]" />
      </div>
    ),
  }
);

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

export function DriverSearchView() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    latitude: searchParams.get("latitude") ?? "23.7806",
    longitude: searchParams.get("longitude") ?? "90.3993",
    date: searchParams.get("date") ?? today(),
    startTime: searchParams.get("startTime") ?? "09:00",
    endTime: searchParams.get("endTime") ?? "18:00",
    vehicleType: (searchParams.get("vehicleType") as VehicleType) || "SEDAN",
    radiusKm: searchParams.get("radiusKm") ?? "5",
    covered: false,
  });

  const [selectedSpotId, setSelectedSpotId] = useState<string>();
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(true);

  const request = useMemo(
    () => ({
      latitude: Number(filters.latitude),
      longitude: Number(filters.longitude),
      radiusKm: Number(filters.radiusKm),
      startAt: toUtcFromBangladeshLocal(filters.date, filters.startTime),
      endAt: toUtcFromBangladeshLocal(filters.date, filters.endTime),
      vehicleType: filters.vehicleType,
      ...(filters.covered ? { covered: true } : {}),
    }),
    [filters]
  );

  const isValidTime =
    Number.isFinite(request.latitude) &&
    Number.isFinite(request.longitude) &&
    new Date(request.endAt) > new Date(request.startAt);

  const query = useQuery({
    queryKey: queryKeys.parkingSearch.results(request),
    queryFn: () => parkingSearchApi.search(request),
    enabled: isValidTime,
    staleTime: 20_000,
  });

  const results = query.data ?? [];

  const resetFilters = () =>
    setFilters({
      latitude: "23.7806",
      longitude: "90.3993",
      date: today(),
      startTime: "09:00",
      endTime: "18:00",
      vehicleType: "SEDAN",
      radiusKm: "5",
      covered: false,
    });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#064E3B]/20 bg-[#064E3B]/8 px-3 py-1 text-xs font-semibold text-[#064E3B] mb-2">
            <Sparkles className="size-3.5" />
            <span>Driver Live Search & Map</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Find Parking in Dhaka
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Discover verified daytime parking spots near your destination with real-time pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="rounded-lg text-xs font-medium"
          >
            <SlidersHorizontal className="size-3.5 mr-1.5" />
            {showFilters ? "Hide Filters" : "Adjust Filters"}
          </Button>

          {/* Mobile toggle button */}
          <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1 lg:hidden">
            <Button
              size="sm"
              variant={mobileView === "list" ? "default" : "ghost"}
              onClick={() => setMobileView("list")}
              className={cn(
                "h-8 text-xs font-semibold rounded-md",
                mobileView === "list" && "bg-[#064E3B] text-white hover:bg-[#003527]"
              )}
            >
              <List className="size-3.5 mr-1" />
              List ({results.length})
            </Button>
            <Button
              size="sm"
              variant={mobileView === "map" ? "default" : "ghost"}
              onClick={() => setMobileView("map")}
              className={cn(
                "h-8 text-xs font-semibold rounded-md",
                mobileView === "map" && "bg-[#064E3B] text-white hover:bg-[#003527]"
              )}
            >
              <MapIcon className="size-3.5 mr-1" />
              Map
            </Button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all">
          <SearchFilters
            filters={filters}
            onFilterChange={(next) => setFilters((curr) => ({ ...curr, ...next }))}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Time Validation Warning */}
      {!isValidTime && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-800 font-medium"
        >
          Expected check-out time must be later than check-in time. Please adjust your search hours.
        </div>
      )}

      {/* Error state */}
      {query.isError && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center shadow-xs">
          <AlertCircle className="mx-auto size-8 text-red-600" />
          <h3 className="mt-3 text-base font-bold text-foreground font-heading">
            Unable to fetch parking spots
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{getApiErrorMessage(query.error)}</p>
          <Button
            className="mt-4 rounded-lg bg-[#064E3B] text-white hover:bg-[#003527]"
            size="sm"
            onClick={() => query.refetch()}
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Retry Search
          </Button>
        </div>
      )}

      {/* Responsive Split Screen: Left List, Right Map */}
      {!query.isError && (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Spots List */}
          <div
            className={cn(
              "space-y-4 lg:col-span-5",
              mobileView === "map" && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-foreground font-heading">
                Available Spaces ({results.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                Sorted by distance
              </span>
            </div>

            {query.isPending ? (
              Array.from({ length: 3 }, (_, idx) => (
                <div
                  key={idx}
                  className="h-44 animate-pulse rounded-xl border border-[#E5E7EB] bg-white p-5"
                />
              ))
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-12 text-center shadow-xs">
                <Warehouse className="mx-auto size-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-bold text-foreground font-heading">
                  No parking spots available
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try expanding your search radius or choosing different arrival and departure hours.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg text-xs"
                >
                  Reset Search Criteria
                </Button>
              </div>
            ) : (
              results.map((spot) => {
                const isSelected = spot.id === selectedSpotId;
                const bookUrl = `/driver/book/${spot.id}?latitude=${request.latitude}&longitude=${request.longitude}&startAt=${encodeURIComponent(
                  request.startAt
                )}&endAt=${encodeURIComponent(request.endAt)}&vehicleType=${request.vehicleType}`;

                return (
                  <article
                    key={spot.id}
                    onClick={() => setSelectedSpotId(spot.id)}
                    className={cn(
                      "cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:border-[#064E3B]/40 hover:shadow-md",
                      isSelected && "border-[#064E3B] ring-2 ring-[#064E3B]/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 text-[#064E3B] shrink-0" />
                          <span className="font-semibold text-foreground">
                            {spot.publicArea}
                          </span>
                          <span>•</span>
                          <span>{spot.distanceKm} km away</span>
                        </div>
                        <h3 className="text-base font-bold text-foreground font-heading">
                          {spot.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {spot.approximateAddress}
                        </p>
                      </div>

                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-[#064E3B]/10 text-[#064E3B] hover:bg-[#064E3B]/15 text-[11px] font-bold"
                      >
                        {spot.availableUnits} available
                      </Badge>
                    </div>

                    {/* Amenity Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {spot.offers.some((o) => o.isCovered) && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-[#E5E7EB]">
                          <Warehouse className="size-3 text-[#064E3B]" />
                          Covered
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] gap-1 border-[#E5E7EB]">
                        <Shield className="size-3 text-[#064E3B]" />
                        Guard on Duty
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-[#E5E7EB]">
                        {spot.offers.length} Offer{spot.offers.length > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3">
                      <div>
                        <span className="text-lg font-extrabold text-[#064E3B] font-heading">
                          {formatBDTFromPaisa(spot.minimumPricePaisa)}
                        </span>
                        <span className="text-xs text-muted-foreground"> / hour</span>
                      </div>

                      <Link
                        href={bookUrl}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="h-9 px-3 text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs"
                        >
                          Book Spot
                          <ArrowRight className="size-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Right Column: Interactive Map */}
          <div
            className={cn(
              "h-[calc(100vh-12rem)] min-h-[480px] lg:sticky lg:top-20 lg:col-span-7",
              mobileView === "list" && "hidden lg:block"
            )}
          >
            <DriverParkingMap
              spots={results}
              search={request}
              selectedSpotId={selectedSpotId}
              onSpotSelect={setSelectedSpotId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
