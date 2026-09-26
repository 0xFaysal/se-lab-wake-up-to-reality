"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PropertyLocationMap = dynamic(() => import("./property-location-map").then((module) => module.PropertyLocationMap), { ssr: false, loading: () => <div className="flex h-[360px] items-center justify-center rounded-lg border bg-slate-50"><Loader2 className="size-6 animate-spin text-emerald-700" /></div> });

type LocationSuggestion = { latitude: number; longitude: number; approximateAddress?: string; publicArea?: string };
type NominatimResult = { lat: string; lon: string; display_name: string; address?: { suburb?: string; city_district?: string; city?: string; town?: string; state?: string } };

export function PropertyLocationPicker({ latitude, longitude, onChange }: { latitude: number | null; longitude: number | null; onChange: (location: LocationSuggestion) => void }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"search" | "location" | "reverse" | null>(null);
  const [error, setError] = useState("");

  function areaFrom(result: NominatimResult) {
    return result.address?.suburb ?? result.address?.city_district ?? result.address?.city ?? result.address?.town ?? result.address?.state;
  }

  async function searchLocation() {
    if (query.trim().length < 3 || busy) return;
    setBusy("search"); setError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bd&addressdetails=1&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("search failed");
      const results = await response.json() as NominatimResult[];
      if (!results[0]) { setError("No matching Bangladesh location was found. Try a nearby landmark or area."); return; }
      const result = results[0];
      onChange({ latitude: Number(result.lat), longitude: Number(result.lon), approximateAddress: result.display_name, publicArea: areaFrom(result) });
    } catch { setError("Location search is temporarily unavailable. You can still select a point directly on the map."); }
    finally { setBusy(null); }
  }

  async function reverse(latitudeValue: number, longitudeValue: number) {
    onChange({ latitude: latitudeValue, longitude: longitudeValue });
    setBusy("reverse"); setError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitudeValue}&lon=${longitudeValue}`, { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const result = await response.json() as NominatimResult;
      onChange({ latitude: latitudeValue, longitude: longitudeValue, approximateAddress: result.display_name, publicArea: areaFrom(result) });
    } catch { setError("The point is selected, but its address could not be loaded. Enter the public address manually."); }
    finally { setBusy(null); }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setError("This browser does not support location access."); return; }
    setBusy("location"); setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => { void reverse(position.coords.latitude, position.coords.longitude); },
      (failure) => { setBusy(null); setError(failure.code === failure.PERMISSION_DENIED ? "Location permission was denied. Search or choose the point on the map instead." : failure.code === failure.TIMEOUT ? "Location request timed out. Please try again or use the map." : "Your current location is unavailable. Search or choose the point on the map instead."); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return <div className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search address or landmark" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchLocation(); } }} placeholder="Search area, road or landmark" className="pl-9" /></div><Button type="button" variant="outline" disabled={busy !== null || query.trim().length < 3} onClick={() => void searchLocation()}>{busy === "search" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Search</Button><Button type="button" variant="outline" disabled={busy !== null} onClick={useCurrentLocation}>{busy === "location" ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}Use current location</Button></div><PropertyLocationMap latitude={latitude} longitude={longitude} onChange={(lat, lng) => void reverse(lat, lng)} /><div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" /><span>{latitude === null || longitude === null ? "Search or click the map to choose the Property location. The marker can be dragged for precision." : `Selected location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${busy === "reverse" ? " · Finding address..." : ""}`}</span></div>{error && <p role="alert" className="text-sm text-amber-700">{error}</p>}</div>;
}
