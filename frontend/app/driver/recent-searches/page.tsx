"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function RecentSearchesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.driverDiscovery.recentSearches, queryFn: driverDiscoveryApi.recentSearches });
  const clear = useMutation({ mutationFn: driverDiscoveryApi.clearRecentSearches, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.recentSearches }) });
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6"><header className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-extrabold">Recent searches</h1><p className="mt-1 text-sm text-muted-foreground">Repeat a previous search with its vehicle and distance.</p></div>{(query.data?.length ?? 0) > 0 && <Button type="button" variant="outline" onClick={() => clear.mutate()} disabled={clear.isPending}><Trash2 className="size-4" />Clear</Button>}</header><div className="divide-y border bg-white">{query.isPending ? <p className="p-6 text-sm text-muted-foreground">Loading search history...</p> : query.data?.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm text-muted-foreground">No searches recorded yet.</p></div> : query.data?.map((item) => <Link key={item.id} href={`/driver/parking?location=${encodeURIComponent(item.displayName)}&latitude=${item.latitude}&longitude=${item.longitude}&radiusKm=${item.radiusKm}&vehicleType=${item.vehicleType}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"><div className="min-w-0"><p className="truncate font-semibold"><MapPin className="mr-1 inline size-4 text-emerald-700" />{item.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{item.radiusKm} km · {vehicleLabels[item.vehicleType]} · {formatDateTime(item.searchedAt)}</p></div><span className="text-xs font-bold text-emerald-800">Search again</span></Link>)}</div></div>;
}
