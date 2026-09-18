"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, List, Loader2, Map as MapIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchFilters, type FilterState } from "@/components/parking/search-filters";
import { ParkingCard } from "@/components/parking/parking-card";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { toUtcFromBangladeshLocal } from "@/lib/formatters";

const ParkingMap = dynamic(() => import("@/components/parking/parking-map"), { ssr: false, loading: () => <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border bg-muted/40"><Loader2 className="size-6 animate-spin" /></div> });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

export function ParkingSearchView() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    latitude: searchParams.get("latitude") ?? "23.7806", longitude: searchParams.get("longitude") ?? "90.3993",
    date: searchParams.get("date") ?? today(), startTime: searchParams.get("startTime") ?? "09:00",
    endTime: searchParams.get("endTime") ?? "18:00", vehicleType: (searchParams.get("vehicleType") as VehicleType) || "SEDAN",
    radiusKm: searchParams.get("radiusKm") ?? "5", covered: false,
  });
  const [selectedSpotId, setSelectedSpotId] = useState<string>();
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const request = useMemo(() => ({ latitude: Number(filters.latitude), longitude: Number(filters.longitude), radiusKm: Number(filters.radiusKm), startAt: toUtcFromBangladeshLocal(filters.date, filters.startTime), endAt: toUtcFromBangladeshLocal(filters.date, filters.endTime), vehicleType: filters.vehicleType, ...(filters.covered ? { covered: true } : {}) }), [filters]);
  const valid = Number.isFinite(request.latitude) && Number.isFinite(request.longitude) && new Date(request.endAt) > new Date(request.startAt);
  const query = useQuery({ queryKey: queryKeys.parkingSearch.results(request), queryFn: () => parkingSearchApi.search(request), enabled: valid, staleTime: 20_000 });
  const results = query.data ?? [];
  const reset = () => setFilters({ latitude: "23.7806", longitude: "90.3993", date: today(), startTime: "09:00", endTime: "18:00", vehicleType: "SEDAN", radiusKm: "5", covered: false });

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <SearchFilters filters={filters} onFilterChange={(next) => setFilters((current) => ({ ...current, ...next }))} onReset={reset} />
    {!valid && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">End time must be later than start time and coordinates must be valid.</div>}
    <div className="flex items-center justify-between border-b pb-3 lg:hidden"><span className="text-xs font-semibold text-muted-foreground">{results.length} properties found</span><div className="flex gap-1 rounded-lg border bg-muted p-1"><Button size="sm" variant={mobileView === "list" ? "default" : "ghost"} onClick={() => setMobileView("list")}><List className="size-4" />List</Button><Button size="sm" variant={mobileView === "map" ? "default" : "ghost"} onClick={() => setMobileView("map")}><MapIcon className="size-4" />Map</Button></div></div>
    {query.isError && <div className="rounded-lg border bg-white p-10 text-center"><AlertCircle className="mx-auto size-7 text-red-600" /><p className="mt-3 text-sm">{getApiErrorMessage(query.error)}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button></div>}
    {!query.isError && <div className="grid items-start gap-6 lg:grid-cols-12"><div className={cn("space-y-4 lg:col-span-5", mobileView === "map" && "hidden lg:block")}><div className="hidden items-center justify-between lg:flex"><h2 className="text-sm font-bold">Available parking in Dhaka</h2><span className="text-xs text-muted-foreground">{results.length} canonical properties</span></div>{query.isPending ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-lg border bg-slate-100" />) : results.length === 0 ? <div className="rounded-lg border bg-white p-10 text-center text-sm text-muted-foreground">No parking is available for the selected time and vehicle.</div> : results.map((spot) => <ParkingCard key={spot.id} spot={spot} search={request} isSelected={spot.id === selectedSpotId} onSelect={() => setSelectedSpotId(spot.id)} />)}</div><div className={cn("h-[calc(100vh-8rem)] min-h-[480px] lg:sticky lg:top-24 lg:col-span-7", mobileView === "list" && "hidden lg:block")}><ParkingMap spots={results} search={request} selectedSpotId={selectedSpotId} onSpotSelect={setSelectedSpotId} /></div></div>}
  </div>;
}
