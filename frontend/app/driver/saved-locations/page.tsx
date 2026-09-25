"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Trash2 } from "lucide-react";
import { LocationSearchInput } from "@/components/parking/location-search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import { queryKeys } from "@/lib/query-keys";

export default function SavedLocationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.driverDiscovery.savedLocations, queryFn: driverDiscoveryApi.savedLocations });
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState<{ displayName: string; latitude: number; longitude: number }>();
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.savedLocations });
  const create = useMutation({ mutationFn: driverDiscoveryApi.createSavedLocation, onSuccess: async () => { setLabel(""); setPlace(undefined); await refresh(); } });
  const remove = useMutation({ mutationFn: driverDiscoveryApi.deleteSavedLocation, onSuccess: refresh });
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6"><header><h1 className="text-2xl font-extrabold">Saved places</h1><p className="mt-1 text-sm text-muted-foreground">Save common destinations without exposing them in public parking results.</p></header><section className="border bg-white p-5"><h2 className="font-bold">Add a place</h2><div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]"><Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Home or Office" maxLength={60} /><LocationSearchInput key={place?.displayName ?? "empty"} value={place?.displayName ?? ""} onSelect={setPlace} /><Button type="button" disabled={!label.trim() || !place || create.isPending} onClick={() => place && create.mutate({ label: label.trim(), ...place })}>Save</Button></div>{create.isError && <p className="mt-2 text-xs text-rose-700">This label may already exist. Choose a different label and try again.</p>}</section><section className="divide-y border bg-white">{query.isPending ? <p className="p-5 text-sm text-muted-foreground">Loading saved places...</p> : query.data?.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No saved places yet.</p> : query.data?.map((location) => <div key={location.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="font-semibold">{location.label}</p><p className="mt-1 truncate text-xs text-muted-foreground"><MapPin className="mr-1 inline size-3" />{location.displayName}</p></div><Button type="button" size="icon" variant="ghost" onClick={() => remove.mutate(location.id)} aria-label={`Delete ${location.label}`}><Trash2 className="size-4" /></Button></div>)}</section></div>;
}
