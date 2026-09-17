"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buttonVariants } from "@/components/ui/button";
import type { ParkingSearchParams, ParkingSearchResultDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { parkingDetailsHref } from "./parking-card";

const icon = (selected: boolean) => L.divIcon({ className: "custom-leaflet-marker", html: `<div style="background:${selected ? "#111827" : "#067647"};color:#fff;border:2px solid #fff;border-radius:9999px;padding:5px 9px;font-weight:700;font-size:11px;box-shadow:0 3px 8px #0004">P</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
const subscribe = () => () => {};
export default function ParkingMap({ spots, search, selectedSpotId, onSpotSelect }: { spots: ParkingSearchResultDto[]; search: ParkingSearchParams; selectedSpotId?: string; onSpotSelect?: (id: string) => void }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false); if (!mounted) return <div className="h-full min-h-[420px] rounded-lg border bg-muted/40" />;
  const center: [number, number] = spots[0] ? [spots[0].latitude, spots[0].longitude] : [search.latitude, search.longitude];
  return <div className="relative z-0 h-full min-h-[420px] overflow-hidden rounded-lg border shadow-sm"><MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[420px] w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{spots.map((spot) => <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={icon(selectedSpotId === spot.id)} eventHandlers={{ click: () => onSpotSelect?.(spot.id) }}><Popup><div className="space-y-2"><strong className="text-xs">{spot.name}</strong><p className="text-[11px]">{spot.publicArea} · {spot.availableUnits} available</p><p className="text-xs font-bold">From {formatBDTFromPaisa(spot.minimumPricePaisa)}/hour</p><Link href={parkingDetailsHref(spot, search)} className={cn(buttonVariants({ size: "sm" }), "w-full")}>View offers</Link></div></Popup></Marker>)}</MapContainer></div>;
}
