"use client";

import dynamic from "next/dynamic";
import { motion, type PanInfo } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, GripHorizontal, Loader2, RefreshCw, SearchX } from "lucide-react";
import { ParkingCard } from "@/components/parking/parking-card";
import { SearchFilters, type FilterState } from "@/components/parking/search-filters";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/hooks/use-vehicles";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import type { ParkingSearchParams } from "@/lib/api/marketplace-types";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { toUtcFromBangladeshLocal } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { defaultSearchWindow, dhakaToday } from "@/lib/search-window";

const ParkingMap = dynamic(() => import("@/components/parking/parking-map"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[420px] items-center justify-center border bg-muted/40"><Loader2 className="size-6 animate-spin" /></div>,
});
function defaultFilters(params: Pick<URLSearchParams, "get">): FilterState {
  const window = defaultSearchWindow();
  const resourceType = params.get("resourceType");
  const sortBy = params.get("sortBy");
  return {
    locationName: params.get("location") ?? "Dhanmondi, Dhaka",
    latitude: params.get("latitude") ?? "23.7465",
    longitude: params.get("longitude") ?? "90.3760",
    date: params.get("date") ?? window.date,
    startTime: params.get("startTime") ?? params.get("time") ?? window.startTime,
    endTime: params.get("endTime") ?? window.endTime,
    vehicleType: (params.get("vehicleType") as VehicleType) || "SEDAN",
    radiusKm: params.get("radiusKm") ?? "5",
    maxPriceTaka: params.get("maxPriceTaka") ?? "",
    sortBy: sortBy === "PRICE" || sortBy === "AVAILABILITY" ? sortBy : "DISTANCE",
    covered: params.get("covered") === "true",
    hasCctv: params.get("hasCctv") === "true",
    hasGuard: params.get("hasGuard") === "true",
    evCharging: params.get("evCharging") === "true",
    wheelchairAccess: params.get("wheelchairAccess") === "true",
    resourceType: resourceType === "FIXED_SPACE" || resourceType === "SHARED_POOL" ? resourceType : "ALL",
    minAvailableUnits: params.get("minAvailableUnits") ?? "1",
  };
}

function filterSearchParams(filters: FilterState) {
  const params = new URLSearchParams({
    location: filters.locationName,
    latitude: filters.latitude,
    longitude: filters.longitude,
    date: filters.date,
    startTime: filters.startTime,
    endTime: filters.endTime,
    vehicleType: filters.vehicleType,
    radiusKm: filters.radiusKm,
    sortBy: filters.sortBy,
    minAvailableUnits: filters.minAvailableUnits,
  });
  if (filters.maxPriceTaka) params.set("maxPriceTaka", filters.maxPriceTaka);
  if (filters.resourceType !== "ALL") params.set("resourceType", filters.resourceType);
  if (filters.covered) params.set("covered", "true");
  if (filters.hasCctv) params.set("hasCctv", "true");
  if (filters.hasGuard) params.set("hasGuard", "true");
  if (filters.evCharging) params.set("evCharging", "true");
  if (filters.wheelchairAccess) params.set("wheelchairAccess", "true");
  return params;
}

function toRequest(filters: FilterState): ParkingSearchParams {
  const facilityCodes = [
    filters.evCharging ? "EV_CHARGING" : null,
    filters.wheelchairAccess ? "WHEELCHAIR_ACCESS" : null,
  ].filter((value): value is string => value !== null);
  return {
    latitude: Number(filters.latitude),
    longitude: Number(filters.longitude),
    radiusKm: Number(filters.radiusKm),
    startAt: toUtcFromBangladeshLocal(filters.date, filters.startTime),
    endAt: toUtcFromBangladeshLocal(filters.date, filters.endTime),
    vehicleType: filters.vehicleType,
    ...(filters.covered ? { covered: true } : {}),
    ...(filters.hasCctv ? { hasCctv: true } : {}),
    ...(filters.hasGuard ? { hasGuard: true } : {}),
    ...(filters.resourceType === "ALL" ? {} : { resourceType: filters.resourceType }),
    ...(facilityCodes.length ? { facilityCodes: facilityCodes.join(",") } : {}),
    ...(Number(filters.minAvailableUnits) > 1 ? { minAvailableUnits: Number(filters.minAvailableUnits) } : {}),
    ...(Number(filters.maxPriceTaka) > 0 ? { maxPricePaisa: String(Math.round(Number(filters.maxPriceTaka) * 100)) } : {}),
  };
}

function subscribeMediaQuery(callback: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getDesktopSnapshot(): boolean {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function getDesktopServerSnapshot(): boolean | null {
  return null;
}

export function ParkingSearchView({ driverMode = false }: { driverMode?: boolean }) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const vehicles = useVehicles(driverMode);
  const initial = useMemo(() => defaultFilters(new URLSearchParams(searchParamsKey)), [searchParamsKey]);
  const [filters, setFilters] = useState<FilterState>(initial);
  const [request, setRequest] = useState<ParkingSearchParams>(() => toRequest(initial));
  const [hasSearched, setHasSearched] = useState(searchParams.has("date") || searchParams.has("startTime"));
  const [selectedSpotId, setSelectedSpotId] = useState<string>();
  const [selectionTrigger, setSelectionTrigger] = useState(0);

  const handleSelectSpot = useCallback((id: string) => {
    setSelectedSpotId(id);
    setSelectionTrigger((prev) => prev + 1);
  }, []);
  const [filterError, setFilterError] = useState<string>();
  const [mobileSheet, setMobileSheet] = useState<"collapsed" | "half" | "expanded">("half");
  const isDesktop = useSyncExternalStore(subscribeMediaQuery, getDesktopSnapshot, getDesktopServerSnapshot);

  const minimumDate = dhakaToday();
  const valid = Number.isFinite(request.latitude) && Number.isFinite(request.longitude) && new Date(request.endAt) > new Date(request.startAt) && new Date(request.startAt) > new Date();

  const query = useQuery({
    queryKey: queryKeys.parkingSearch.results({ mode: hasSearched ? "search" : "browse", ...request }),
    queryFn: () => hasSearched
      ? parkingSearchApi.search(request)
      : parkingSearchApi.browse({ latitude: request.latitude, longitude: request.longitude }),
    enabled: valid,
    staleTime: 20_000,
  });
  const favorites = useQuery({ queryKey: queryKeys.driverDiscovery.favorites, queryFn: driverDiscoveryApi.favorites, enabled: driverMode });
  const savedLocations = useQuery({ queryKey: queryKeys.driverDiscovery.savedLocations, queryFn: driverDiscoveryApi.savedLocations, enabled: driverMode });
  const recent = useMutation({ mutationFn: driverDiscoveryApi.addRecentSearch, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.recentSearches }) });
  const favorite = useMutation<void, Error, { propertyId: string; remove: boolean }>({
    mutationFn: async ({ propertyId, remove }) => {
      if (remove) await driverDiscoveryApi.removeFavorite(propertyId);
      else await driverDiscoveryApi.addFavorite(propertyId);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.favorites }),
  });
  const favoriteIds = useMemo(() => new Set(favorites.data?.map((item) => item.property.id) ?? []), [favorites.data]);
  const results = useMemo(() => [...(query.data ?? [])].sort((a, b) => {
    if (filters.sortBy === "PRICE") return Number(a.minimumPricePaisa) - Number(b.minimumPricePaisa);
    if (filters.sortBy === "AVAILABILITY") return b.availableUnits - a.availableUnits;
    return a.distanceKm - b.distanceKm;
  }), [filters.sortBy, query.data]);
  const detailsRequest = hasSearched ? request : toRequest(filters);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const nextFilters = defaultFilters(params);
    const nextHasSearched = params.has("date") || params.has("startTime");
    // Browser back/forward changes the URL outside this component, so reset its search draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(nextFilters);
    setRequest(toRequest(nextFilters));
    setHasSearched(nextHasSearched);
    setSelectedSpotId(undefined);
    setFilterError(undefined);
  }, [searchParamsKey]);

  useEffect(() => {
    if (!driverMode || new URLSearchParams(searchParamsKey).has("vehicleType")) return;
    const defaultVehicle = vehicles.query.data?.find((vehicle) => vehicle.isDefault) ?? vehicles.query.data?.[0];
    // Vehicle data arrives asynchronously and supplies the first useful Driver default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (defaultVehicle) setFilters((current) => ({ ...current, vehicleType: defaultVehicle.vehicleType }));
  }, [driverMode, searchParamsKey, vehicles.query.data]);

  useEffect(() => {
    if (!selectedSpotId) return;
    const cardElement = document.getElementById(`parking-card-${selectedSpotId}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedSpotId]);

  function rememberSearch(nextFilters: FilterState, nextRequest: ParkingSearchParams) {
    if (!driverMode || !Number.isFinite(nextRequest.latitude) || !Number.isFinite(nextRequest.longitude) || new Date(nextRequest.endAt) <= new Date(nextRequest.startAt)) return;
    recent.mutate({ displayName: nextFilters.locationName, latitude: nextRequest.latitude, longitude: nextRequest.longitude, radiusKm: nextRequest.radiusKm, vehicleType: nextRequest.vehicleType });
  }
  function submit(nextFilters = filters) {
    const nextRequest = toRequest(nextFilters);
    if (!Number.isFinite(nextRequest.latitude) || !Number.isFinite(nextRequest.longitude)) {
      setFilterError("Choose a valid destination before searching.");
      return;
    }
    if (new Date(nextRequest.startAt) <= new Date()) {
      setFilterError("Choose a future arrival date and time. Past times cannot be booked.");
      return;
    }
    if (new Date(nextRequest.endAt) <= new Date(nextRequest.startAt)) {
      setFilterError("Departure must be later than arrival.");
      return;
    }
    setFilterError(undefined);
    setFilters(nextFilters);
    setRequest(nextRequest);
    setHasSearched(true);
    setSelectedSpotId(undefined);
    router.replace(`${pathname}?${filterSearchParams(nextFilters).toString()}`, { scroll: false });
    rememberSearch(nextFilters, nextRequest);
  }
  function reset() {
    const nextFilters = defaultFilters(new URLSearchParams());
    setFilters(nextFilters);
    setRequest(toRequest(nextFilters));
    setHasSearched(false);
    setSelectedSpotId(undefined);
    setFilterError(undefined);
    router.replace(pathname, { scroll: false });
  }
  function searchMapArea(center: { latitude: number; longitude: number }) {
    submit({ ...filters, locationName: "Selected map area", latitude: String(center.latitude), longitude: String(center.longitude) });
  }
  function settleMobileSheet(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.y > 90 || info.velocity.y > 700) setMobileSheet("collapsed");
    else if (info.offset.y < -90 || info.velocity.y < -700) setMobileSheet("expanded");
    else setMobileSheet("half");
  }
  const mobileSheetHeight = mobileSheet === "collapsed" ? "6rem" : mobileSheet === "expanded" ? "78dvh" : "48dvh";

  return <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
    <SearchFilters filters={filters} onFilterChange={(next) => { setFilterError(undefined); setFilters((current) => ({ ...current, ...next })); }} onReset={reset} onSearch={() => submit()} minimumDate={minimumDate} savedLocations={savedLocations.data ?? []} />
    {filterError && <div role="alert" className="m-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">{filterError}</div>}
    {query.isError && <div className="m-6 border bg-white p-10 text-center"><AlertCircle className="mx-auto size-7 text-red-600" /><p className="mt-3 text-sm">{getApiErrorMessage(query.error)}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button></div>}
    {!query.isError && <div className="relative h-[calc(100dvh-5.25rem)] min-h-[560px] overflow-hidden lg:hidden">
      <div className="absolute inset-0">
        {isDesktop === false ? (
          <ParkingMap
            spots={results}
            search={detailsRequest}
            driverMode={driverMode}
            selectedSpotId={selectedSpotId}
            selectionTrigger={selectionTrigger}
            onSpotSelect={handleSelectSpot}
            onSearchArea={searchMapArea}
          />
        ) : isDesktop === null ? (
          <div className="flex h-full min-h-[420px] items-center justify-center border bg-muted/40">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>
      <motion.section drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.08} onDragEnd={settleMobileSheet} animate={{ height: mobileSheetHeight }} transition={{ type: "spring", stiffness: 360, damping: 34 }} className="absolute inset-x-0 bottom-0 z-10 overflow-hidden rounded-t-2xl border-t bg-white shadow-[0_-12px_30px_rgba(15,23,42,0.16)]">
        <button type="button" onClick={() => setMobileSheet((current) => current === "collapsed" ? "half" : current === "half" ? "expanded" : "half")} className="flex h-12 w-full items-center justify-center" aria-label={`Parking results sheet is ${mobileSheet}`}><GripHorizontal className="size-7 text-slate-400" /></button>
        <div className="flex items-center justify-between border-b px-4 pb-3"><div><h2 className="text-sm font-extrabold">{hasSearched ? `Parking near ${filters.locationName.split(",")[0]}` : "All available parking"}</h2><p className="mt-0.5 text-xs text-slate-500">{results.length} verified properties</p></div></div>
        <div className="h-[calc(100%-5.5rem)] space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
          {query.isPending ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-md border bg-slate-100" />) : results.length === 0 ? <div className="bg-white py-8 text-center"><SearchX className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm font-semibold">{hasSearched ? "No parking matches this search" : "No published parking is available"}</p><p className="mt-1 text-xs text-muted-foreground">{hasSearched ? "Try a larger radius or fewer filters." : "Active listings from verified properties will appear here."}</p>{hasSearched && <Button type="button" variant="outline" className="mt-4" onClick={reset}>Show all parking</Button>}</div> : results.map((spot) => <ParkingCard key={spot.id} spot={spot} search={detailsRequest} driverMode={driverMode} favorite={favoriteIds.has(spot.id)} onFavorite={() => favorite.mutate({ propertyId: spot.id, remove: favoriteIds.has(spot.id) })} isSelected={spot.id === selectedSpotId} onSelect={() => { handleSelectSpot(spot.id); setMobileSheet("half"); }} />)}
        </div>
      </motion.section>
    </div>}
    {!query.isError && <div className="hidden items-start lg:grid lg:grid-cols-12">
      <div className="space-y-4 p-4 lg:col-span-5 lg:h-[calc(100vh-13rem)] lg:overflow-y-auto lg:p-5">
        <div className="hidden items-center justify-between lg:flex"><h2 className="text-sm font-bold">{hasSearched ? `Parking near ${filters.locationName.split(",")[0]}` : "All available parking"}</h2><span className="text-xs text-muted-foreground">{results.length} verified properties</span></div>
        {query.isPending ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-52 animate-pulse border bg-slate-100" />) : results.length === 0 ? <div className="border bg-white p-10 text-center"><SearchX className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm font-semibold">{hasSearched ? "No parking matches this search" : "No published parking is available"}</p><p className="mt-1 text-xs text-muted-foreground">{hasSearched ? "Try a larger radius, a different time, or fewer filters." : "Active listings from verified properties will appear here."}</p>{hasSearched && <Button type="button" variant="outline" className="mt-4" onClick={reset}>Show all parking</Button>}</div> : results.map((spot) => <ParkingCard key={spot.id} spot={spot} search={detailsRequest} driverMode={driverMode} favorite={favoriteIds.has(spot.id)} onFavorite={() => favorite.mutate({ propertyId: spot.id, remove: favoriteIds.has(spot.id) })} isSelected={spot.id === selectedSpotId} onSelect={() => handleSelectSpot(spot.id)} />)}
      </div>
      <div className="h-[calc(100vh-13rem)] min-h-[480px] lg:sticky lg:top-16 lg:col-span-7">
        {isDesktop === true ? (
          <ParkingMap
            spots={results}
            search={detailsRequest}
            driverMode={driverMode}
            selectedSpotId={selectedSpotId}
            selectionTrigger={selectionTrigger}
            onSpotSelect={handleSelectSpot}
            onSearchArea={searchMapArea}
          />
        ) : isDesktop === null ? (
          <div className="flex h-full min-h-[420px] items-center justify-center border bg-muted/40">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>
    </div>}
  </div>;
}
