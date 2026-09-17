"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "parkease-location-marker",
  html: '<div style="width:28px;height:28px;border-radius:9999px;background:#064E3B;border:3px solid white;box-shadow:0 4px 12px #0005"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function PropertyLocationMap({ latitude, longitude, onChange }: { latitude: number | null; longitude: number | null; onChange: (latitude: number, longitude: number) => void }) {
  const center: [number, number] = latitude !== null && longitude !== null ? [latitude, longitude] : [23.8103, 90.4125];
  return <div className="relative z-0 h-[360px] overflow-hidden rounded-lg border"><MapContainer center={center} zoom={latitude === null ? 12 : 16} className="h-full w-full" scrollWheelZoom><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapInteraction latitude={latitude} longitude={longitude} onChange={onChange} /></MapContainer></div>;
}

function MapInteraction({ latitude, longitude, onChange }: { latitude: number | null; longitude: number | null; onChange: (latitude: number, longitude: number) => void }) {
  const map = useMap();
  useMapEvents({ click(event) { onChange(event.latlng.lat, event.latlng.lng); } });
  useEffect(() => { if (latitude !== null && longitude !== null) map.flyTo([latitude, longitude], Math.max(map.getZoom(), 16)); }, [latitude, longitude, map]);
  if (latitude === null || longitude === null) return null;
  return <Marker position={[latitude, longitude]} icon={markerIcon} draggable eventHandlers={{ dragend(event) { const point = (event.target as L.Marker).getLatLng(); onChange(point.lat, point.lng); } }} />;
}
