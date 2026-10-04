"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ArrowRight, LocateFixed, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./parking-map.css";
import { buttonVariants } from "@/components/ui/button";
import type { ParkingSearchParams, ParkingSearchResultDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { parkingDetailsHref } from "./parking-card";

const markerIcon = (price: string, selected: boolean) =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="white-space:nowrap;background:${selected ? "#0f172a" : "#065f46"};color:#fff;border:2px solid ${selected ? "#38bdf8" : "#fff"};border-radius:6px;padding:5px 8px;font-weight:700;font-size:11px;box-shadow:${selected ? "0 0 0 3px rgba(56, 189, 248, 0.4), 0 4px 12px rgba(0,0,0,0.3)" : "0 3px 8px #0004"};transform:${selected ? "scale(1.15)" : "scale(1)"};transition:transform 0.2s ease;">${formatBDTFromPaisa(price)} · area</div>`,
    iconSize: [90, 30],
    iconAnchor: [45, 15],
  });

const subscribe = () => () => {};
type Center = { latitude: number; longitude: number };

function Movement({ onMove }: { onMove: (center: Center) => void }) {
  useMapEvents({
    moveend(event) {
      const center = event.target.getCenter();
      onMove({ latitude: center.lat, longitude: center.lng });
    },
  });
  return null;
}

function UserLocation({ requestId, onLocation }: { requestId: number; onLocation: (center: Center) => void }) {
  const map = useMap();
  const [position, setPosition] = useState<Center>();
  useEffect(() => {
    if (requestId === 0 || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (cancelled) return;
        const center = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        setPosition(center);
        onLocation(center);
        map.whenReady(() => {
          window.requestAnimationFrame(() => {
            if (cancelled || !map.getContainer().isConnected) return;
            map.invalidateSize();
            map.setView([center.latitude, center.longitude], Math.max(map.getZoom(), 15), { animate: false });
          });
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
    return () => {
      cancelled = true;
    };
  }, [map, onLocation, requestId]);
  return position ? (
    <CircleMarker center={[position.latitude, position.longitude]} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}>
      <Tooltip direction="top" offset={[0, -8]}>
        Your current location
      </Tooltip>
    </CircleMarker>
  ) : null;
}

function SelectedSpotSync({
  selectedSpot,
  selectionTrigger,
  markerRefs,
}: {
  selectedSpot?: ParkingSearchResultDto;
  selectionTrigger: number;
  markerRefs: React.RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedSpot) return;

    const lat = Number(selectedSpot.latitude);
    const lng = Number(selectedSpot.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Guard against hidden map container (e.g. 0x0 size in hidden responsive views)
    const container = map.getContainer();
    if (!container || !container.isConnected || container.clientWidth === 0 || container.clientHeight === 0) {
      return;
    }

    // Refresh dimensions before calculating projection or movement
    map.invalidateSize();

    const openMarkerPopup = () => {
      const marker = markerRefs.current?.get(selectedSpot.id);
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      } else {
        marker?.getPopup()?.update();
      }
    };

    const handleMoveEnd = () => {
      openMarkerPopup();
    };

    const targetZoom = Math.max(map.getZoom() || 13, 15);

    try {
      const currentCenter = map.getCenter();
      if (!currentCenter || !Number.isFinite(currentCenter.lat) || !Number.isFinite(currentCenter.lng)) {
        map.setView([lat, lng], targetZoom);
        openMarkerPopup();
        return;
      }

      map.flyTo([lat, lng], targetZoom, {
        duration: 0.5,
      });
      map.once("moveend", handleMoveEnd);
    } catch {
      map.setView([lat, lng], targetZoom);
      openMarkerPopup();
    }

    // Fallback timer in case moveend doesn't fire (e.g. already at center)
    const timer = setTimeout(openMarkerPopup, 550);

    return () => {
      clearTimeout(timer);
      map.off("moveend", handleMoveEnd);
    };
  }, [map, selectedSpot, selectionTrigger, markerRefs]);

  return null;
}

export default function ParkingMap({
  spots,
  search,
  selectedSpotId,
  selectionTrigger = 0,
  onSpotSelect,
  driverMode = false,
  onSearchArea,
}: {
  spots: ParkingSearchResultDto[];
  search: ParkingSearchParams;
  selectedSpotId?: string;
  selectionTrigger?: number;
  onSpotSelect?: (id: string) => void;
  driverMode?: boolean;
  onSearchArea?: (center: Center) => void;
}) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [movedCenter, setMovedCenter] = useState<Center>();
  const [locationRequest, setLocationRequest] = useState(1);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const selectedSpot = useMemo(() => spots.find((s) => s.id === selectedSpotId), [spots, selectedSpotId]);

  const handleMove = useCallback((next: Center) => {
    setMovedCenter((current) => (current && Math.abs(current.latitude - next.latitude) < 0.000001 && Math.abs(current.longitude - next.longitude) < 0.000001 ? current : next));
  }, []);

  if (!mounted) return <div className="h-full min-h-[420px] rounded-md border bg-muted/40" />;

  const center: [number, number] = spots[0] ? [spots[0].latitude, spots[0].longitude] : [search.latitude, search.longitude];

  return (
    <div className="relative z-0 h-full min-h-[420px] overflow-hidden rounded-md border shadow-sm">
      {movedCenter && onSearchArea && (
        <button
          type="button"
          onClick={() => {
            onSearchArea(movedCenter);
            setMovedCenter(undefined);
          }}
          className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-md bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow-lg"
        >
          Search this area
        </button>
      )}
      <button
        type="button"
        onClick={() => setLocationRequest((value) => value + 1)}
        className="absolute bottom-4 right-4 z-[500] inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-slate-800 shadow-lg hover:bg-slate-50"
      >
        <LocateFixed className="size-4 text-blue-600" />
        My location
      </button>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[420px] w-full">
        <Movement onMove={handleMove} />
        <UserLocation requestId={locationRequest} onLocation={handleMove} />
        <SelectedSpotSync selectedSpot={selectedSpot} selectionTrigger={selectionTrigger} markerRefs={markerRefs} />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {spots.map((spot) => <Circle key={`area-${spot.id}`} center={[spot.latitude, spot.longitude]} radius={40} pathOptions={{ color: selectedSpotId === spot.id ? "#2563eb" : "#064E3B", weight: 1, dashArray: "5 5", fillOpacity: 0.08 }}><Tooltip>{spot.name} · Approximate area within 40 m, not the entrance</Tooltip></Circle>)}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            ref={(ref) => {
              if (ref) {
                markerRefs.current.set(spot.id, ref);
              } else {
                markerRefs.current.delete(spot.id);
              }
            }}
            position={[spot.latitude, spot.longitude]}
            zIndexOffset={selectedSpotId === spot.id ? 1000 : 0}
            icon={markerIcon(spot.minimumPricePaisa, selectedSpotId === spot.id)}
            eventHandlers={{ click: () => onSpotSelect?.(spot.id) }}
          >
            <Popup autoPan autoPanPaddingTopLeft={[16, 64]} autoPanPaddingBottomRight={[16, 16]} className="parking-result-popup" minWidth={240} maxWidth={312}>
              <div className="space-y-4 text-slate-800">
                <div className="space-y-2 pr-5">
                  <h3 className="text-base font-semibold leading-snug break-words">{spot.name}</h3>
                  <div className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                    <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    <span className="break-words">{spot.publicArea}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
                    {spot.availableUnits} {spot.availableUnits === 1 ? "space" : "spaces"} available
                  </span>
                </div>
                <div className="border-y border-slate-100 py-3">
                  <div className="mb-1 text-xs font-medium text-slate-600">Nearby area · within 40 m</div>
                  <p className="text-xs leading-relaxed text-slate-500">This pin shows the area, not the entrance. View offers for location details.</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="shrink-0">
                    <span className="text-[11px] text-slate-500">From</span>
                    <div className="text-lg font-semibold tabular-nums leading-tight">{formatBDTFromPaisa(spot.minimumPricePaisa)}<span className="text-xs font-normal text-slate-500">/hour</span></div>
                  </div>
                  <Link href={parkingDetailsHref(spot, search, driverMode)} className={cn(buttonVariants({ size: "sm" }), "parking-popup-action min-h-10 shrink-0 gap-2 rounded-md px-3 text-xs")}>
                    View offers <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
