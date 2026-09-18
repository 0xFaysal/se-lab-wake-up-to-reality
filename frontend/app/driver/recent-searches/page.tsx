"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Clock3, LocateFixed, MapPin, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import type { DriverSearchHistoryDto } from "@/lib/api/marketplace-types";
import { formatDateTime, vehicleLabels } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function searchHref(item: DriverSearchHistoryDto) {
  const params = new URLSearchParams({ location: item.displayName, latitude: String(item.latitude), longitude: String(item.longitude), radiusKm: String(item.radiusKm), vehicleType: item.vehicleType });
  return `/driver/parking?${params}`;
}

function SearchHistorySkeleton() {
  return <div className="space-y-3" aria-label="Loading recent searches">{Array.from({ length: 3 }, (_, index) => <div key={index} className="animate-pulse rounded-md border bg-white p-4"><div className="h-5 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /><div className="mt-5 h-10 rounded bg-slate-100" /></div>)}</div>;
}

export default function RecentSearchesPage() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.driverDiscovery.recentSearches, queryFn: driverDiscoveryApi.recentSearches });
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.recentSearches });
  const clear = useMutation({ mutationFn: driverDiscoveryApi.clearRecentSearches, onSuccess: refresh });
  const remove = useMutation({ mutationFn: driverDiscoveryApi.deleteRecentSearch, onSuccess: refresh });

  function useCurrentLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const params = new URLSearchParams({ location: "Current location", latitude: String(coords.latitude), longitude: String(coords.longitude) });
      router.push(`/driver/parking?${params}`);
    });
  }

  return <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-950">Recent searches</h1><p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Repeat a previous parking search with the same location, time and vehicle.</p></div>{(query.data?.length ?? 0) > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => clear.mutate()} disabled={clear.isPending}><Trash2 className="size-4" /><span className="hidden sm:inline">Clear all</span></Button>}</header>

    {query.isPending ? <SearchHistorySkeleton /> : query.isError ? <div className="rounded-md border border-rose-200 bg-white p-6 text-center"><p className="text-sm font-semibold text-rose-700">{getApiErrorMessage(query.error)}</p><Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}><RefreshCw className="size-4" />Try again</Button></div> : query.data.length === 0 ? <MobileEmptyState icon={Clock3} title="No recent searches yet" description="Your previous parking searches will appear here so you can quickly repeat them." primaryAction={{ label: "Search parking", href: "/driver/parking", icon: Search }} secondaryAction={{ label: "Use current location", onClick: useCurrentLocation, icon: LocateFixed }} /> : <div className="space-y-3">
      {query.data.map((item) => <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"><MapPin className="size-5" /></div><div className="min-w-0"><h2 className="truncate text-base font-extrabold text-slate-950">{item.displayName}</h2><p className="mt-1 text-xs text-slate-500">Searched {formatDateTime(item.searchedAt)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600"><span className="flex items-center gap-1.5"><Car className="size-3.5 text-emerald-700" />{vehicleLabels[item.vehicleType]}</span><span className="flex items-center gap-1.5"><LocateFixed className="size-3.5 text-emerald-700" />Within {item.radiusKm} km</span></div><div className="mt-4 flex items-center gap-2"><Link href={searchHref(item)} className={cn(buttonVariants({ size: "sm" }), "flex-1 bg-emerald-800 hover:bg-emerald-900")}><Search className="size-4" />Search again</Link><Link href={searchHref(item)} aria-label={`Edit search for ${item.displayName}`} className={buttonVariants({ variant: "outline", size: "icon-sm" })}><Pencil className="size-4" /></Link><button type="button" aria-label={`Remove ${item.displayName} from recent searches`} disabled={remove.isPending && remove.variables === item.id} onClick={() => remove.mutate(item.id)} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "text-rose-700 hover:bg-rose-50")}><Trash2 className="size-4" /></button></div></article>)}
    </div>}
  </div>;
}
