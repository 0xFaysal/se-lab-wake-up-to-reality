"use client";

import { Car, Clock, Compass, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VehicleType } from "@/lib/api/api-types";
import { vehicleLabels } from "@/lib/formatters";

export interface FilterState { latitude: string; longitude: string; date: string; startTime: string; endTime: string; vehicleType: VehicleType; radiusKm: string; covered: boolean }
export function SearchFilters({ filters, onFilterChange, onReset }: { filters: FilterState; onFilterChange: (filters: Partial<FilterState>) => void; onReset: () => void }) {
  return <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold"><Compass className="size-4 text-primary" />Search parking</h2><Button variant="ghost" size="sm" onClick={onReset}><RotateCcw className="size-3" />Reset</Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
    <Field icon={<MapPin className="size-3" />} label="Latitude"><Input type="number" step="0.000001" value={filters.latitude} onChange={(event) => onFilterChange({ latitude: event.target.value })} /></Field>
    <Field icon={<MapPin className="size-3" />} label="Longitude"><Input type="number" step="0.000001" value={filters.longitude} onChange={(event) => onFilterChange({ longitude: event.target.value })} /></Field>
    <Field icon={<Clock className="size-3" />} label="Date"><Input type="date" value={filters.date} onChange={(event) => onFilterChange({ date: event.target.value })} /></Field>
    <Field icon={<Clock className="size-3" />} label="Start"><Input type="time" value={filters.startTime} onChange={(event) => onFilterChange({ startTime: event.target.value })} /></Field>
    <Field icon={<Clock className="size-3" />} label="End"><Input type="time" value={filters.endTime} onChange={(event) => onFilterChange({ endTime: event.target.value })} /></Field>
    <Field icon={<Car className="size-3" />} label="Vehicle"><Select value={filters.vehicleType} onValueChange={(value) => value && onFilterChange({ vehicleType: value as VehicleType })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(vehicleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
    <Field icon={<Compass className="size-3" />} label="Radius"><Select value={filters.radiusKm} onValueChange={(value) => value && onFilterChange({ radiusKm: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 5, 10, 25].map((value) => <SelectItem key={value} value={String(value)}>{value} km</SelectItem>)}</SelectContent></Select></Field>
    <label className="flex items-end gap-2 pb-2 text-xs font-semibold"><Checkbox checked={filters.covered} onCheckedChange={(checked) => onFilterChange({ covered: !!checked })} />Covered only</label>
  </div></section>;
}
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) { return <label className="space-y-1.5 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1 text-primary">{icon}<span className="text-muted-foreground">{label}</span></span>{children}</label>; }
