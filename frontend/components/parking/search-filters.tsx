"use client";

import { Car, Clock, Compass, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VehicleType } from "@/lib/api/api-types";
import { vehicleLabels } from "@/lib/formatters";
import type { DriverSavedLocationDto, ParkingResourceType } from "@/lib/api/marketplace-types";
import { cn } from "@/lib/utils";
import { LocationSearchInput } from "./location-search-input";

export interface FilterState { locationName: string; latitude: string; longitude: string; date: string; startTime: string; endTime: string; vehicleType: VehicleType; radiusKm: string; maxPriceTaka: string; sortBy: "DISTANCE" | "PRICE" | "AVAILABILITY"; covered: boolean; hasCctv: boolean; hasGuard: boolean; evCharging: boolean; wheelchairAccess: boolean; resourceType: ParkingResourceType | "ALL"; minAvailableUnits: string }
export function SearchFilters({ filters, onFilterChange, onReset, onSearch, minimumDate, savedLocations = [] }: { filters: FilterState; onFilterChange: (filters: Partial<FilterState>) => void; onReset: () => void; onSearch: () => void; minimumDate: string; savedLocations?: DriverSavedLocationDto[] }) {
  return <section className="space-y-4 border-b bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold"><Compass className="size-4 text-emerald-700" />Find available parking</h2><Button type="button" variant="ghost" size="sm" onClick={onReset}><RotateCcw className="size-3" />Reset</Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(260px,2fr)_repeat(3,minmax(130px,1fr))_auto]">
      <Field className="col-span-2 lg:col-span-1" label="Destination"><LocationSearchInput value={filters.locationName} onSelect={(location) => onFilterChange({ locationName: location.displayName, latitude: String(location.latitude), longitude: String(location.longitude) })} /></Field>
    <Field icon={<Clock className="size-3" />} label="Date"><Input type="date" min={minimumDate} value={filters.date} onChange={(event) => onFilterChange({ date: event.target.value })} /></Field>
    <Field icon={<Clock className="size-3" />} label="Start"><Input type="time" value={filters.startTime} onChange={(event) => onFilterChange({ startTime: event.target.value })} /></Field>
    <Field icon={<Clock className="size-3" />} label="End"><Input type="time" value={filters.endTime} onChange={(event) => onFilterChange({ endTime: event.target.value })} /></Field>
      <Field className="lg:hidden" icon={<Car className="size-3" />} label="Vehicle"><Select value={filters.vehicleType} onValueChange={(value) => value && onFilterChange({ vehicleType: value as VehicleType })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(vehicleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
      <Button type="button" onClick={onSearch} className="col-span-2 mt-auto h-11 bg-emerald-800 hover:bg-emerald-900 lg:col-span-1 lg:h-10"><Search className="size-4" />Search parking</Button>
    </div>
    {savedLocations.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Saved:</span>{savedLocations.map((location) => <button type="button" key={location.id} onClick={() => onFilterChange({ locationName: location.displayName, latitude: String(location.latitude), longitude: String(location.longitude) })} className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-slate-50">{location.label}</button>)}</div>}
    <details><summary className="cursor-pointer text-xs font-semibold text-emerald-800">Filters and distance</summary><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Field className="hidden lg:block" icon={<Car className="size-3" />} label="Vehicle"><Select value={filters.vehicleType} onValueChange={(value) => value && onFilterChange({ vehicleType: value as VehicleType })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(vehicleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
      <Field icon={<Compass className="size-3" />} label="Radius"><Select value={filters.radiusKm} onValueChange={(value) => value && onFilterChange({ radiusKm: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 5, 10, 25].map((value) => <SelectItem key={value} value={String(value)}>{value} km</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Parking type"><Select value={filters.resourceType} onValueChange={(value) => value && onFilterChange({ resourceType: value as FilterState["resourceType"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Any type</SelectItem><SelectItem value="FIXED_SPACE">Fixed space</SelectItem><SelectItem value="SHARED_POOL">Shared pool</SelectItem></SelectContent></Select></Field>
      <Field label="Spaces needed"><Input type="number" min="1" max="100" value={filters.minAvailableUnits} onChange={(event) => onFilterChange({ minAvailableUnits: event.target.value })} /></Field>
      <Field label="Max BDT / hour"><Input type="number" min="0" step="10" value={filters.maxPriceTaka} placeholder="Any" onChange={(event) => onFilterChange({ maxPriceTaka: event.target.value })} /></Field>
      <Field label="Sort by"><Select value={filters.sortBy} onValueChange={(value) => value && onFilterChange({ sortBy: value as FilterState["sortBy"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DISTANCE">Nearest</SelectItem><SelectItem value="PRICE">Lowest price</SelectItem><SelectItem value="AVAILABILITY">Most available</SelectItem></SelectContent></Select></Field>
      <label className="flex items-center gap-2 pt-6 text-xs font-semibold"><Checkbox checked={filters.covered} onCheckedChange={(checked) => onFilterChange({ covered: !!checked })} />Covered</label>
      <label className="flex items-center gap-2 pt-6 text-xs font-semibold"><Checkbox checked={filters.hasCctv} onCheckedChange={(checked) => onFilterChange({ hasCctv: !!checked })} /><ShieldCheck className="size-3" />CCTV</label>
      <label className="flex items-center gap-2 pt-6 text-xs font-semibold"><Checkbox checked={filters.hasGuard} onCheckedChange={(checked) => onFilterChange({ hasGuard: !!checked })} />Guard</label>
      <label className="flex items-center gap-2 pt-6 text-xs font-semibold"><Checkbox checked={filters.evCharging} onCheckedChange={(checked) => onFilterChange({ evCharging: !!checked })} />EV charging</label>
      <label className="flex items-center gap-2 pt-6 text-xs font-semibold"><Checkbox checked={filters.wheelchairAccess} onCheckedChange={(checked) => onFilterChange({ wheelchairAccess: !!checked })} />Accessible</label>
    </div></details>
  </section>;
}
function Field({ label, icon, children, className }: { label: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) { return <label className={cn("space-y-1.5 text-xs font-medium text-muted-foreground", className)}><span className="flex items-center gap-1 text-primary">{icon}<span className="text-muted-foreground">{label}</span></span>{children}</label>; }
