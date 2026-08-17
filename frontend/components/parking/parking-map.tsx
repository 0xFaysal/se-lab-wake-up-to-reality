"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { type MockParkingSpot } from "@/lib/data/mock-parking";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Custom Leaflet icon for ParkEase BD
const createCustomIcon = (isSelected: boolean) =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${isSelected ? "#000000" : "#eb4925"};
        color: #ffffff;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        border-radius: 9999px;
        padding: 4px 8px;
        font-weight: 700;
        font-size: 11px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span>🅿️</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

interface ParkingMapProps {
  spots: MockParkingSpot[];
  selectedSpotId?: string;
  onSpotSelect?: (spotId: string) => void;
}

export default function ParkingMap({
  spots,
  selectedSpotId,
  onSpotSelect,
}: ParkingMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-2xl border bg-muted/40 text-sm text-muted-foreground">
        Loading Dhaka Parking Map…
      </div>
    );
  }

  // Centered at Dhaka (approx Gulshan/Dhanmondi center: 23.78, 90.39)
  const defaultCenter: [number, number] = [23.7806, 90.3993];

  return (
    <div className="h-full min-h-[420px] w-full overflow-hidden rounded-2xl border shadow-sm relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full min-h-[420px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={createCustomIcon(selectedSpotId === spot.id)}
            eventHandlers={{
              click: () => onSpotSelect?.(spot.id),
            }}
          >
            <Popup>
              <div className="p-1 space-y-2 text-foreground font-sans">
                <h4 className="text-xs font-bold">{spot.propertyName}</h4>
                <p className="text-[11px] text-muted-foreground">{spot.area}</p>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-primary">৳{spot.hourlyRate}/hr</span>
                  <span className="text-[10px] text-muted-foreground">{spot.distance}</span>
                </div>
                <div className="pt-2 border-t">
                  <Link
                    href={`/register?role=driver&spotId=${spot.id}`}
                    className={cn(
                      buttonVariants({ size: "xs" }),
                      "w-full text-[10px] justify-center"
                    )}
                  >
                    Reserve Now
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
