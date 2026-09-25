"use client";

import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Place = { place_id: number; display_name: string; lat: string; lon: string };

export function LocationSearchInput({ value, onSelect }: { value: string; onSelect: (location: { displayName: string; latitude: number; longitude: number }) => void }) {
  const [text, setText] = useState(value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>();

  useEffect(() => {
    const query = text.trim();
    if (query.length < 3 || query === value) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: `${query}, Bangladesh`, format: "jsonv2", addressdetails: "1", limit: "5", countrycodes: "bd" });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: controller.signal, headers: { "Accept-Language": "en" } });
        if (!response.ok) throw new Error("Location search is temporarily unavailable");
        setPlaces(await response.json() as Place[]);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setLocationError((error as Error).message);
      } finally { setLoading(false); }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [text, value]);

  const visiblePlaces = text.trim().length >= 3 && text !== value ? places : [];

  function useCurrentLocation() {
    setLocationError(undefined);
    if (!navigator.geolocation) { setLocationError("Location access is not supported by this browser."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      let displayName = "Current location";
      try {
        const params = new URLSearchParams({ lat: String(coords.latitude), lon: String(coords.longitude), format: "jsonv2" });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { "Accept-Language": "en" } });
        if (response.ok) displayName = ((await response.json()) as { display_name?: string }).display_name ?? displayName;
      } catch { /* Coordinates remain usable if reverse geocoding fails. */ }
      setText(displayName); setPlaces([]); setLoading(false); onSelect({ displayName, latitude: coords.latitude, longitude: coords.longitude });
    }, () => { setLoading(false); setLocationError("Allow location access or search for an area instead."); }, { enableHighAccuracy: true, timeout: 10_000 });
  }

  return <div className="relative">
    <MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-emerald-700" />
    <Input value={text} onChange={(event) => { setText(event.target.value); setLocationError(undefined); }} placeholder="Search an area, landmark, or address" className="h-10 pl-9 pr-12" aria-label="Parking search location" />
    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 size-8" onClick={useCurrentLocation} aria-label="Use my current location">{loading ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}</Button>
    {visiblePlaces.length > 0 && <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white p-1 shadow-xl">{visiblePlaces.map((place) => <button type="button" key={place.place_id} onClick={() => { const selected = { displayName: place.display_name, latitude: Number(place.lat), longitude: Number(place.lon) }; setText(selected.displayName); setPlaces([]); onSelect(selected); }} className="flex w-full items-start gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-100"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" /><span className="line-clamp-2">{place.display_name}</span></button>)}</div>}
    {locationError && <p className="mt-1 text-xs text-rose-700">{locationError}</p>}
  </div>;
}
