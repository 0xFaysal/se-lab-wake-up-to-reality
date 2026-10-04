"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ActualLocationMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  return <div className="h-56 overflow-hidden rounded-lg border" aria-label={`Actual parking location for ${name}`}>
    <MapContainer key={`${latitude}:${longitude}`} center={[latitude, longitude]} zoom={17} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#064E3B", fillOpacity: 1 }}><Tooltip>{name} · Actual parking location</Tooltip></CircleMarker>
    </MapContainer>
  </div>;
}
