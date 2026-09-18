"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buttonVariants } from "@/components/ui/button";
import type { ParkingSearchParams, ParkingSearchResultDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { parkingDetailsHref } from "./parking-card";

const markerIcon = (price: string, selected: boolean) => L.divIcon({ className: "custom-leaflet-marker", html: `<div style="white-space:nowrap;background:${selected ? "#0f172a" : "#065f46"};color:#fff;border:2px solid #fff;border-radius:6px;padding:5px 8px;font-weight:700;font-size:11px;box-shadow:0 3px 8px #0004">${formatBDTFromPaisa(price)}</div>`, iconSize: [64, 30], iconAnchor: [32, 15] });
const subscribe = () => () => {};
type Center = { latitude: number; longitude: number };

function Movement({ onMove }: { onMove: (center: Center) => void }) {
  useMapEvents({ moveend(event) { const center = event.target.getCenter(); onMove({ latitude: center.lat, longitude: center.lng }); } });
  return null;
}

export default function ParkingMap({ spots, search, selectedSpotId, onSpotSelect, driverMode = false, onSearchArea }: { spots: ParkingSearchResultDto[]; search: ParkingSearchParams; selectedSpotId?: string; onSpotSelect?: (id: string) => void; driverMode?: boolean; onSearchArea?: (center: Center) => void }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [movedCenter, setMovedCenter] = useState<Center>();
  if (!mounted) return <div className="h-full min-h-[420px] rounded-md border bg-muted/40" />;
  const center: [number, number] = spots[0] ? [spots[0].latitude, spots[0].longitude] : [search.latitude, search.longitude];
  return <div className="relative z-0 h-full min-h-[420px] overflow-hidden rounded-md border shadow-sm">
    {movedCenter && onSearchArea && <button type="button" onClick={() => { onSearchArea(movedCenter); setMovedCenter(undefined); }} className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-md bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow-lg">Search this area</button>}
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[420px] w-full"><Movement onMove={setMovedCenter} /><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{spots.map((spot) => <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={markerIcon(spot.minimumPricePaisa, selectedSpotId === spot.id)} eventHandlers={{ click: () => onSpotSelect?.(spot.id) }}><Popup><div className="space-y-2"><strong className="text-xs">{spot.name}</strong><p className="text-[11px]">{spot.publicArea} · {spot.availableUnits} available</p><p className="text-xs font-bold">From {formatBDTFromPaisa(spot.minimumPricePaisa)}/hour</p><Link href={parkingDetailsHref(spot, search, driverMode)} className={cn(buttonVariants({ size: "sm" }), "w-full")}>View offers</Link></div></Popup></Marker>)}</MapContainer>
  </div>;
}
