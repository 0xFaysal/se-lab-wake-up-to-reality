"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const markerStyles = `
.parkease-location-marker {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.parkease-pin-container {
  position: relative;
  width: 38px;
  height: 52px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: grab;
  user-select: none;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: 19px 48px;
}

.parkease-pin-container:hover {
  transform: translateY(-5px) scale(1.08);
}

.parkease-pin-container:active {
  cursor: grabbing;
  transform: translateY(-7px) scale(1.12);
}

.parkease-pin-pulse {
  position: absolute;
  top: 48px;
  left: 19px;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  margin-top: -11px;
  border-radius: 50%;
  background: rgba(5, 150, 105, 0.38);
  pointer-events: none;
  animation: parkease-marker-pulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
}

@keyframes parkease-marker-pulse {
  0% {
    transform: scale(0.4);
    opacity: 0.9;
  }
  70% {
    transform: scale(2.2);
    opacity: 0;
  }
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}

.parkease-pin-shadow {
  position: absolute;
  top: 46px;
  left: 19px;
  transform: translateX(-50%);
  width: 18px;
  height: 6px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0) 75%);
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.parkease-pin-container:hover .parkease-pin-shadow {
  transform: translateX(-50%) scale(1.25);
  opacity: 0.6;
}

.parkease-pin-container:active .parkease-pin-shadow {
  transform: translateX(-50%) scale(1.4);
  opacity: 0.4;
}

.parkease-pin-svg {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.28));
  transition: filter 0.18s ease;
}

.parkease-pin-container:hover .parkease-pin-svg {
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
}

.parkease-map-tooltip {
  background: #064E3B !important;
  color: #ffffff !important;
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  white-space: nowrap !important;
}

.parkease-map-tooltip::before {
  border-top-color: #064E3B !important;
}
`;

const markerIcon = L.divIcon({
  className: "parkease-location-marker",
  html: `
    <div class="parkease-pin-container">
      <div class="parkease-pin-pulse"></div>
      <div class="parkease-pin-shadow"></div>
      <svg class="parkease-pin-svg" width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pePinGrad" x1="19" y1="0" x2="19" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#064E3B"/>
          </linearGradient>
          <filter id="pePinShadow" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.32"/>
          </filter>
        </defs>
        <path d="M19 0C8.507 0 0 8.507 0 19C0 32.8 16.6 46.4 18.2 47.6C18.7 48 19.3 48 19.8 47.6C21.4 46.4 38 32.8 38 19C38 8.507 29.493 0 19 0Z" fill="url(#pePinGrad)" stroke="#FFFFFF" stroke-width="2.5" filter="url(#pePinShadow)"/>
        <circle cx="19" cy="18" r="8" fill="#FFFFFF"/>
        <circle cx="19" cy="18" r="4.2" fill="#064E3B"/>
      </svg>
    </div>
  `,
  iconSize: [38, 52],
  iconAnchor: [19, 48],
  popupAnchor: [0, -48],
  tooltipAnchor: [0, -48],
});

export function PropertyLocationMap({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const center: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : [23.8103, 90.4125];

  return (
    <div className="relative z-0 h-[360px] overflow-hidden rounded-lg border">
      <style>{markerStyles}</style>
      <MapContainer
        center={center}
        zoom={latitude === null ? 12 : 16}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction latitude={latitude} longitude={longitude} onChange={onChange} />
      </MapContainer>
    </div>
  );
}

function MapInteraction({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 16));
    }
  }, [latitude, longitude, map]);

  if (latitude === null || longitude === null) return null;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const point = (event.target as L.Marker).getLatLng();
          onChange(point.lat, point.lng);
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -48]} opacity={0.95} className="parkease-map-tooltip">
        Drag to adjust location
      </Tooltip>
    </Marker>
  );
}
