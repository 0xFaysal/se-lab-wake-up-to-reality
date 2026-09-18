"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowRight, MapPin, Shield, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ParkingSearchParams, ParkingSearchResultDto } from "@/lib/api/marketplace-types";
import { formatBDTFromPaisa } from "@/lib/formatters";

// Deep Emerald price pin icon generator
const createPricePin = (price: string, selected: boolean) =>
  L.divIcon({
    className: "driver-price-pin",
    html: `
      <div style="
        background: ${selected ? "#042F2E" : "#064E3B"};
        color: #ffffff;
        border: 2px solid ${selected ? "#10B981" : "#ffffff"};
        border-radius: 20px;
        padding: 4px 10px;
        font-family: var(--font-geist-sans, sans-serif);
        font-weight: 700;
        font-size: 11px;
        line-height: 1.2;
        letter-spacing: 0.02em;
        box-shadow: 0 4px 12px rgba(6, 78, 59, 0.35);
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        transition: all 0.2s ease;
      ">
        <span style="font-size: 9px; opacity: 0.85;">৳</span>
        <span>${price}</span>
        <span style="font-size: 8px; opacity: 0.75; margin-left: 1px;">/hr</span>
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });

const subscribe = () => () => {};

interface DriverParkingMapProps {
  spots: ParkingSearchResultDto[];
  search: ParkingSearchParams;
  selectedSpotId?: string;
  onSpotSelect?: (id: string) => void;
}

export default function DriverParkingMap({
  spots,
  search,
  selectedSpotId,
  onSpotSelect,
}: DriverParkingMapProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[460px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#f9f9ff]">
        <div className="text-center text-xs text-muted-foreground">Loading interactive map…</div>
      </div>
    );
  }

  const center: [number, number] = spots[0]
    ? [spots[0].latitude, spots[0].longitude]
    : [search.latitude || 23.7806, search.longitude || 90.3993];

  return (
    <div className="relative z-0 h-full min-h-[460px] overflow-hidden rounded-xl border border-[#E5E7EB] shadow-xs">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full min-h-[460px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot) => {
          const priceDisplay = (Number(spot.minimumPricePaisa) / 100).toFixed(0);
          const isSelected = selectedSpotId === spot.id;

          const bookHref = `/driver/book/${spot.id}?latitude=${search.latitude}&longitude=${search.longitude}&startAt=${encodeURIComponent(
            search.startAt
          )}&endAt=${encodeURIComponent(search.endAt)}&vehicleType=${search.vehicleType}`;

          return (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={createPricePin(priceDisplay, isSelected)}
              eventHandlers={{
                click: () => onSpotSelect?.(spot.id),
              }}
            >
              <Popup className="urban-harmony-popup">
                <div className="w-56 space-y-2.5 p-1 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground font-heading leading-tight">
                      {spot.name}
                    </h4>
                    <span className="rounded bg-[#064E3B]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#064E3B]">
                      {spot.availableUnits} left
                    </span>
                  </div>

                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3 text-[#064E3B] shrink-0" />
                    {spot.publicArea} · {spot.distanceKm} km away
                  </p>

                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2">
                    <div>
                      <span className="text-xs font-bold text-[#064E3B]">
                        {formatBDTFromPaisa(spot.minimumPricePaisa)}
                      </span>
                      <span className="text-[10px] text-muted-foreground"> / hr</span>
                    </div>
                    <Link href={bookHref}>
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-[11px] font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg"
                      >
                        Book Spot
                        <ArrowRight className="size-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
